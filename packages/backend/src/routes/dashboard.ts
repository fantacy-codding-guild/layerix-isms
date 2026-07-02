import express from 'express';
import Device from '../models/Device';
import SpeedTest from '../models/SpeedTest';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

router.get('/summary', authenticateUser, async (req, res) => {
    try {
        const userId = (req as any).userId;

        // Get only this user’s devices
        const userDevices = await Device.find({ userId });
        const totalDevices = userDevices.length;
        const onlineDevices = userDevices.filter(d => d.status === 'online').length;

        // Get IDs of the user’s devices
        const deviceIds = userDevices.map(d => d.deviceId);

        // Last hour averages for this user’s devices
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentTests = await SpeedTest.find({
            deviceId: { $in: deviceIds },
            timestamp: { $gte: oneHourAgo },
        }).lean();

        let avgDownload = 0, avgUpload = 0;
        if (recentTests.length > 0) {
            const sumDownload = recentTests.reduce((sum, t) => sum + (t.download || 0), 0);
            const sumUpload = recentTests.reduce((sum, t) => sum + (t.upload || 0), 0);
            avgDownload = sumDownload / recentTests.length;
            avgUpload = sumUpload / recentTests.length;
        }

        res.json({
            totalDevices,
            onlineDevices,
            avgDownload: Math.round(avgDownload * 100) / 100,
            avgUpload: Math.round(avgUpload * 100) / 100,
            recentTestCount: recentTests.length,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load summary' });
    }
});

export default router;