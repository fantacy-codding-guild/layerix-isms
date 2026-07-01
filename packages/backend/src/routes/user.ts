import express from 'express';
import User from '../models/User';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

router.post('/generate-registration-token', authenticateUser, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const token = Math.random().toString(36).substring(2, 10);
        const expiry = new Date(Date.now() + 60 * 60 * 1000);
        await User.findByIdAndUpdate(userId, {
            registrationToken: token,
            registrationTokenExpiry: expiry,
        });
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

export default router;