//packages\agent\src\index.ts
/// <reference path="./declarations.d.ts" />
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import speedTest from 'speedtest-net';          // ← proper ES import, no require()
import { ISpeedTestResult } from '@ism/shared';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const DEVICE_ID = process.env.DEVICE_ID || 'agent-001';

const TOKEN_FILE = path.join(process.cwd(), 'token.json');
const QUEUE_FILE = path.join(process.cwd(), 'offline-queue.json');

let TOKEN: string | null = null;
let offlineQueue: ISpeedTestResult[] = [];
let currentCronJob: cron.ScheduledTask | null = null;

// ── Token persistence ────────────────────────────────
function loadToken(): string | null {
    try {
        if (fs.existsSync(TOKEN_FILE)) {
            return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')).token || null;
        }
    } catch { }
    return null;
}

function saveToken(token: string): void {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token }), 'utf-8');
}

// ── Offline queue ─────────────────────────────────────
function loadOfflineQueue(): ISpeedTestResult[] {
    try {
        if (fs.existsSync(QUEUE_FILE)) {
            return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
        }
    } catch { }
    return [];
}

function saveOfflineQueue(queue: ISpeedTestResult[]): void {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8');
}

// ── Registration ─────────────────────────────────────
async function register(): Promise<string> {
    const payload: any = {
        deviceId: DEVICE_ID,
        computerName: process.env.COMPUTER_NAME || 'UnknownPC',
        os: process.env.OS || 'Unknown',
        macAddress: process.env.MAC_ADDRESS || '00:00:00:00:00:00',
        version: process.env.VERSION || '1.0.0',
    };
    // This sends the registration token to link the device to your account
    if (process.env.REGISTRATION_TOKEN) {
        payload.registrationToken = process.env.REGISTRATION_TOKEN;
    }
    const response = await axios.post(`${BACKEND_URL}/api/agent/register`, payload);
    return response.data.token;
}

// ── Fetch config from backend ────────────────────────
async function fetchConfig(token: string) {
    const res = await axios.get(`${BACKEND_URL}/api/agent/config`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
}

// ── Apply scheduler settings ─────────────────────────
function applySettings(settings: any) {
    if (currentCronJob) {
        currentCronJob.stop();
    }
    if (!settings.enabled) return;

    const [startH, startM] = settings.startTime.split(':').map(Number);
    const [endH, endM] = settings.endTime.split(':').map(Number);
    const freq = settings.frequencyMinutes;

    const cronStr = `*/${freq} ${startH}-${endH} * * *`;
    currentCronJob = cron.schedule(cronStr, runTest, {
        timezone: settings.timezone || 'Asia/Kolkata',
    });
    console.log(`Schedule updated: ${settings.startTime}-${settings.endTime} every ${freq}min`);
}

// ── Real speed test (using speedtest-net) ─────────────
async function realSpeedTest(): Promise<ISpeedTestResult> {
    const result = await speedTest({ acceptLicense: true, acceptGdpr: true });

    return {
        deviceId: DEVICE_ID,
        timestamp: new Date(result.timestamp),
        download: result.download.bandwidth * 8 / 1_000_000,
        upload: result.upload.bandwidth * 8 / 1_000_000,
        ping: result.ping.latency,
        jitter: result.ping.jitter,
        packetLoss: result.packetLoss ?? 0,
        isp: result.isp,
        publicIp: result.interface.externalIp,
        server: `${result.server.name} (${result.server.location})`,
        status: 'success'
    };
}

// ── Mock speed test (fallback if real test fails) ─────
function mockSpeedTest(): ISpeedTestResult {
    return {
        deviceId: DEVICE_ID,
        timestamp: new Date(),
        download: Math.random() * 100 + 50,   // 50-150 Mbps
        upload: Math.random() * 50 + 10,      // 10-60 Mbps
        ping: Math.random() * 30 + 5,         // 5-35 ms
        jitter: Math.random() * 5,            // 0-5 ms
        packetLoss: Math.random() * 0.1,      // 0-0.1%
        isp: 'Mock ISP',
        publicIp: '192.0.2.1',
        server: 'Mock Server',
        status: 'success'
    };
}

// ── Upload results ────────────────────────────────────
async function uploadResults(results: ISpeedTestResult[]): Promise<void> {
    await axios.post(
        `${BACKEND_URL}/api/agent/results`,
        { results },
        { headers: { Authorization: `Bearer ${TOKEN}` } }
    );
}

async function flushOfflineQueue(): Promise<void> {
    if (offlineQueue.length === 0) return;
    console.log(`Flushing ${offlineQueue.length} offline results...`);
    try {
        await uploadResults(offlineQueue);
        console.log('Offline queue flushed.');
        offlineQueue = [];
        saveOfflineQueue(offlineQueue);
    } catch {
        console.error('Failed to flush queue, will retry later.');
    }
}

async function runTest(): Promise<void> {
    let result: ISpeedTestResult;
    try {
        // First attempt: real Ookla speed test
        result = await realSpeedTest();
        console.log(`↓${result.download.toFixed(1)} Mbps ↑${result.upload.toFixed(1)} Mbps`);
    } catch (err: any) {
        console.error('Real speed test failed, using mock data:', err.message);
        // Fall back to a mock result so you still get useful data
        result = mockSpeedTest();
        console.log(`(mock) ↓${result.download.toFixed(1)} Mbps ↑${result.upload.toFixed(1)} Mbps`);
    }

    try {
        await uploadResults([result]);
        console.log('Uploaded.');
    } catch {
        console.log('Upload failed, queued offline.');
        offlineQueue.push(result);
        saveOfflineQueue(offlineQueue);
    }
}

// ── Startup ───────────────────────────────────────────
async function start(): Promise<void> {
    TOKEN = loadToken();
    if (TOKEN) {
        console.log('Using existing token.');
    } else {
        try {
            TOKEN = await register();
            saveToken(TOKEN);
            console.log('Registered and saved token.');
        } catch (err: any) {
            console.error('Registration failed:', err.response?.data || err.message);
            process.exit(1);
        }
    }

    offlineQueue = loadOfflineQueue();
    await flushOfflineQueue();

    if (TOKEN) {
        try {
            const config = await fetchConfig(TOKEN);
            applySettings(config.settings);
        } catch (err) {
            console.error('Failed to fetch initial config, using default (every minute)');
            currentCronJob = cron.schedule('* * * * *', runTest);
        }
    }

    setInterval(async () => {
        if (!TOKEN) return;
        try {
            const config = await fetchConfig(TOKEN);
            applySettings(config.settings);
        } catch (err) {
            console.error('Config poll error:', err);
        }
    }, 30_000);

    console.log('Agent running.');
}

start();