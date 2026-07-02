import express from 'express';
import Device from '../models/Device';
import SpeedTest from '../models/SpeedTest';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// GET /api/devices – only the logged‑in user’s devices
router.get('/', authenticateUser, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const devices = await Device.find({ userId }, { token: 0 });
        res.json(devices);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});

// DELETE /api/devices/:deviceId
router.delete('/:deviceId', authenticateUser, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const device = await Device.findOne({ deviceId: req.params.deviceId, userId });
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        await Device.deleteOne({ _id: device._id });
        await SpeedTest.deleteMany({ deviceId: device.deviceId });
        res.json({ message: 'Device deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete device' });
    }
});

export default router;