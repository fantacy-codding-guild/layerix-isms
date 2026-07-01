import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    computerName: String,
    os: String,
    macAddress: String,
    version: String,
    token: { type: String, required: true, unique: true }, // agent auth token
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    lastSeen: Date,
    settings: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '21:00' },
        frequencyMinutes: { type: Number, default: 10 },
        timezone: { type: String, default: 'Asia/Kolkata' }
    }
}, { timestamps: true });

export default mongoose.model('Device', deviceSchema);