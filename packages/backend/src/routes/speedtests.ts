import express from 'express';
import SpeedTest from '../models/SpeedTest';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { deviceId, limit } = req.query;
        if (!deviceId) return res.status(400).json({ error: 'deviceId required' });
        const tests = await SpeedTest.find({ deviceId })
            .sort({ timestamp: -1 })
            .limit(Number(limit) || 20)
            .lean();
        res.json(tests);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch speed tests' });
    }
});
// GET /api/speedtests/all – all tests (latest first)
router.get('/all', async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 200;
        const tests = await SpeedTest.find()
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
        res.json(tests);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch speed tests' });
    }
});

export default router;