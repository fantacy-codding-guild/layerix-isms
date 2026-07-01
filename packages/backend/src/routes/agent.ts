import express from 'express';
import { v4 as uuid } from 'uuid';
import Device from '../models/Device';
import SpeedTest from '../models/SpeedTest';

const router = express.Router();

// ── Middleware: verify agent token ────────────────────
async function authenticateAgent(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed token' });
    }
    const token = authHeader.split(' ')[1];
    const device = await Device.findOne({ token });
    if (!device) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    // Attach device to request for later use
    (req as any).device = device;
    next();
}

// ── Routes ────────────────────────────────────────────
// POST /api/agent/register
router.post('/register', async (req, res) => {
    try {
        const { deviceId, computerName, os, macAddress, version } = req.body;
        const existing = await Device.findOne({ deviceId });
        if (existing) {
            return res.status(400).json({ error: 'Device already registered' });
        }
        const token = uuid();
        const device = new Device({
            deviceId,
            computerName,
            os,
            macAddress,
            version,
            token,
            status: 'online',
            lastSeen: new Date()
        });
        await device.save();
        res.status(201).json({ token, deviceId: device.deviceId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/agent/results
router.post('/results', authenticateAgent, async (req, res) => {
    try {
        const device = (req as any).device;
        const { results } = req.body;
        if (!Array.isArray(results) || results.length === 0) {
            return res.status(400).json({ error: 'results must be a non-empty array' });
        }

        const docs = results.map((r: any) => ({ ...r, deviceId: device.deviceId }));
        await SpeedTest.insertMany(docs);

        device.lastSeen = new Date();
        await device.save();

        res.json({ success: true, stored: docs.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// GET /api/agent/config
router.get('/config', authenticateAgent, async (req, res) => {
    const device = (req as any).device;
    res.json({
        settings: device.settings,
        googleSheetId: process.env.GOOGLE_SHEET_ID || null,
    });
});

export default router;