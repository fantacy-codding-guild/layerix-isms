import mongoose from 'mongoose';

const speedTestSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    download: Number,
    upload: Number,
    ping: Number,
    jitter: Number,
    packetLoss: Number,
    isp: String,
    publicIp: String,
    server: String,
    status: { type: String, enum: ['success', 'failed'], default: 'success' }
});

// Auto-delete after 90 days
speedTestSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('SpeedTest', speedTestSchema);