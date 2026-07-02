import express from 'express';
import Device from '../models/Device';
import SpeedTest from '../models/SpeedTest';
import cache from '../utils/cache';

const router = express.Router();

// GET /api/devices – cached for 10 seconds
router.get('/', async (_req, res) => {
    try {
        const cached = cache.get('all_devices');
        if (cached) return res.json(cached);

        const devices = await Device.find({}, { token: 0 }).lean();
        cache.set('all_devices', devices);
        res.json(devices);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});

// DELETE /api/devices/:deviceId – also clears cache
router.delete('/:deviceId', async (req, res) => {
    try {
        const device = await Device.findOne({ deviceId: req.params.deviceId });
        if (!device) return res.status(404).json({ error: 'Device not found' });

        await Device.deleteOne({ _id: device._id });
        await SpeedTest.deleteMany({ deviceId: device.deviceId });

        cache.del('all_devices');
        cache.del('dashboard_summary');
        res.json({ message: 'Device deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete device' });
    }
});

export default router;