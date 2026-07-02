import express from 'express';
import Device from '../models/Device';
import SpeedTest from '../models/SpeedTest';

const router = express.Router();

// GET /api/devices – returns all devices (no authentication)
router.get('/', async (_req, res) => {
    try {
        const devices = await Device.find({}, { token: 0 });
        res.json(devices);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
});

// DELETE /api/devices/:deviceId (still requires auth – optional, you can remove if you want)
router.delete('/:deviceId', async (req, res) => {
    try {
        const device = await Device.findOne({ deviceId: req.params.deviceId });
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