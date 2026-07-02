import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { ISpeedTestResult } from '@ism/shared';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const DEVICE_ID = process.env.DEVICE_ID || 'agent-001';

const TOKEN_FILE = path.join(process.cwd(), 'token.json');
const QUEUE_FILE = path.join(process.cwd(), 'offline-queue.json');
const CONFIG_CACHE_FILE = path.join(process.cwd(), 'config-cache.json');

let TOKEN: string | null = null;
let offlineQueue: ISpeedTestResult[] = [];
let testTimer: NodeJS.Timeout | null = null;
let cachedConfig: any = null;              // last known good config

// ── Logging helpers ──────────────────────────────────
const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);
const errLog = (msg: string) => console.error(`[${new Date().toISOString()}] ERROR: ${msg}`);

// ── Global safety nets ───────────────────────────────
process.on('uncaughtException', (error) => {
    errLog(`Uncaught exception: ${error.message}`);
    // keep process alive for a graceful shutdown attempt
});
process.on('unhandledRejection', (reason) => {
    errLog(`Unhandled rejection: ${reason}`);
});

// ── File helpers ─────────────────────────────────────
function loadJSON(file: string, fallback: any) {
    try { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : fallback; }
    catch { return fallback; }
}
function saveJSON(file: string, data: any) {
    try { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8'); } catch { }
}

// ── Token ────────────────────────────────────────────
function loadToken(): string | null { return loadJSON(TOKEN_FILE, {})?.token || null; }
function saveToken(t: string) { saveJSON(TOKEN_FILE, { token: t }); }

// ── Offline queue ────────────────────────────────────
function loadQueue(): ISpeedTestResult[] { return loadJSON(QUEUE_FILE, []); }
function saveQueue(q: ISpeedTestResult[]) { saveJSON(QUEUE_FILE, q); }

// ── Config cache ─────────────────────────────────────
function loadCachedConfig(): any { return loadJSON(CONFIG_CACHE_FILE, null); }
function saveCachedConfig(cfg: any) { saveJSON(CONFIG_CACHE_FILE, cfg); }

// ── Retry wrapper with exponential backoff ───────────
async function withRetry<T>(fn: () => Promise<T>, retries = 3, baseDelayMs = 1000): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            if (attempt === retries) throw error;
            const delay = baseDelayMs * Math.pow(2, attempt - 1);
            errLog(`Attempt ${attempt} failed, retrying in ${delay}ms: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Retry logic exhausted'); // never reached
}

// ── Registration ────────────────────────────────────
async function register(): Promise<string> {
    const payload: any = {
        deviceId: DEVICE_ID,
        computerName: process.env.COMPUTER_NAME || 'UnknownPC',
        os: process.env.OS || 'Unknown',
        macAddress: process.env.MAC_ADDRESS || '00:00:00:00:00:00',
        version: process.env.VERSION || '1.0.0',
    };
    if (process.env.REGISTRATION_TOKEN) payload.registrationToken = process.env.REGISTRATION_TOKEN;

    const { data } = await withRetry(() => axios.post(`${BACKEND_URL}/api/agent/register`, payload));
    return data.token;
}

// ── Upload ───────────────────────────────────────────
async function upload(results: ISpeedTestResult[]): Promise<void> {
    await withRetry(() => axios.post(`${BACKEND_URL}/api/agent/results`, { results }, {
        headers: { Authorization: `Bearer ${TOKEN}` },
    }));
}

// ── Config fetch (with fallback to cache) ────────────
async function fetchConfig(): Promise<any> {
    try {
        const { data } = await axios.get(`${BACKEND_URL}/api/agent/config`, {
            headers: { Authorization: `Bearer ${TOKEN}` },
        });
        // cache it
        saveCachedConfig(data);
        return data;
    } catch (error: any) {
        errLog(`Config fetch failed, using cached: ${error.message}`);
        if (cachedConfig) return cachedConfig;
        throw error;
    }
}

// ── Mock test ────────────────────────────────────────
function mockTest(): ISpeedTestResult {
    return {
        deviceId: DEVICE_ID,
        timestamp: new Date(),
        download: 50 + Math.random() * 100,
        upload: 10 + Math.random() * 50,
        ping: 5 + Math.random() * 30,
        jitter: Math.random() * 5,
        packetLoss: Math.random() * 0.1,
        isp: 'Mock ISP',
        publicIp: '192.0.2.1',
        server: 'Mock Server',
        status: 'success',
    };
}

// ── Core test loop ───────────────────────────────────
async function runTest(): Promise<void> {
    const result = mockTest();
    log(`Test: ↓${result.download.toFixed(1)} Mbps ↑${result.upload.toFixed(1)} Mbps`);
    try {
        await upload([result]);
    } catch (error: any) {
        errLog(`Upload failed, queuing: ${error.message}`);
        offlineQueue.push(result);
        saveQueue(offlineQueue);
    }
}

async function flushQueue(): Promise<void> {
    if (offlineQueue.length === 0) return;
    try {
        await upload(offlineQueue);
        log(`Flushed ${offlineQueue.length} offline results`);
        offlineQueue = [];
        saveQueue(offlineQueue);
    } catch (error: any) {
        errLog(`Queue flush failed: ${error.message}`);
    }
}

// ── Schedule management ──────────────────────────────
function applySchedule(settings: any) {
    if (testTimer) clearInterval(testTimer);
    if (!settings?.enabled) return;

    const intervalMin = settings.frequencyMinutes || 1;
    testTimer = setInterval(runTest, intervalMin * 60_000);
    log(`Schedule set: every ${intervalMin} minute(s)`);
}

// ── Startup ──────────────────────────────────────────
async function start(): Promise<void> {
    // load local state
    TOKEN = loadToken();
    if (!TOKEN) {
        TOKEN = await register();
        saveToken(TOKEN);
        log('Registered successfully.');
    } else {
        log('Using existing token.');
    }

    offlineQueue = loadQueue();
    cachedConfig = loadCachedConfig();

    // initial config
    try {
        const config = await fetchConfig();
        applySchedule(config.settings);
    } catch (error: any) {
        errLog(`Initial config fetch failed: ${error.message}`);
        if (cachedConfig) {
            applySchedule(cachedConfig.settings);
        } else {
            // safe default: every 10 minutes
            applySchedule({ enabled: true, frequencyMinutes: 10 });
        }
    }

    // immediate test + queue flush
    await flushQueue();
    await runTest();

    // periodic config refresh (5 min) and queue flush (every minute)
    setInterval(async () => {
        try {
            const config = await fetchConfig();
            applySchedule(config.settings);
        } catch (error: any) {
            errLog(`Config refresh failed: ${error.message}`);
        }
    }, 5 * 60_000);

    // flush queue more often
    setInterval(flushQueue, 60_000);

    log('Agent running in production mode.');
}

// graceful shutdown
function shutdown() {
    log('Shutting down agent...');
    if (testTimer) clearInterval(testTimer);
    process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();