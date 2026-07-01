import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { generateOtp, hashOtp, isOtpExpired } from '../utils/otp';
import { getOtpEmailTemplate } from '../utils/emailTemplates';

// Initialize Resend only if API key is present
let resend: any = null;
if (process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
}

const router = express.Router();

// ── Send OTP ──────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email required' });

        // Generate and hash OTP
        const otp = generateOtp();
        const hashedOtp = hashOtp(otp);
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Upsert user with new OTP
        await User.findOneAndUpdate(
            { email },
            { otpHash: hashedOtp, otpExpiry: expiry },
            { upsert: true, new: true }
        );

        // Send OTP via email if Resend is configured, otherwise fallback to console
        if (resend) {
            await resend.emails.send({
                from: process.env.FROM_EMAIL || 'Internet Speed Monitor <onboarding@resend.dev>',
                to: email,
                subject: 'Your OTP for Internet Speed Monitor',
                html: getOtpEmailTemplate(otp, email),
            });
            console.log(`OTP sent to ${email}`);
        } else {
            console.log(`\n⚠️  OTP for ${email}: ${otp}\n`);
        }

        res.json({ message: 'OTP sent' });
    } catch (err) {
        console.error('Send OTP error:', err);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// ── Verify OTP & issue JWT ────────────────────────────
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

        const user = await User.findOne({ email });
        if (!user || !user.otpHash || !user.otpExpiry) {
            return res.status(401).json({ error: 'No OTP requested' });
        }

        if (isOtpExpired(user.otpExpiry)) {
            return res.status(401).json({ error: 'OTP expired' });
        }

        if (hashOtp(otp) !== user.otpHash) {
            return res.status(401).json({ error: 'Invalid OTP' });
        }

        // Clear OTP fields and issue token
        user.otpHash = undefined;
        user.otpExpiry = undefined;
        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { id: user._id, email: user.email, name: user.name },
        });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ error: 'OTP verification failed' });
    }
});

export default router;