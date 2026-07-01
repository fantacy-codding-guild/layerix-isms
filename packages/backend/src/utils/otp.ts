//packages\backend\src\utils\otp.ts
import crypto from 'crypto';

export function generateOtp(length = 6): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

export function isOtpExpired(expiry: Date): boolean {
    return new Date() > expiry;
}