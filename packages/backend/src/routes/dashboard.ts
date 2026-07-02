import express from 'express';
import Device from '../models/Device';
import SpeedTest from '../models/SpeedTest';

const router = express.Router();

router.get('/summary', async (_req, res) => {
    try {
        const totalDevices = await Device.countDocuments();
        const onlineDevices = await Device.countDocuments({ status: 'online' });

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentTests = await SpeedTest.find({ timestamp: { $gte: oneHourAgo } }).lean();

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