import express from 'express';
import Device from '../models/Device';

const router = express.Router();

router.get('/:deviceId', async (req, res) => {
    try {
        const device = await Device.findOne({ deviceId: req.params.deviceId });
        if (!device) return res.status(404).json({ error: 'Device not found' });
        res.json({ deviceId: device.deviceId, settings: device.settings });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

router.put('/:deviceId', async (req, res) => {
    try {
        const { settings } = req.body;
        const device = await Device.findOneAndUpdate(
            { deviceId: req.params.deviceId },
            { $set: { settings } },
            { new: true }
        );
        if (!device) return res.status(404).json({ error: 'Device not found' });
        res.json({ deviceId: device.deviceId, settings: device.settings });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;