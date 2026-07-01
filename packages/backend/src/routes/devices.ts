import express from 'express';
import Device from '../models/Device';

const router = express.Router();

router.get('/', async (_req, res) => {
    try {
        const devices = await Device.find({}, { token: 0 });
        res.json(devices);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});

export default router;