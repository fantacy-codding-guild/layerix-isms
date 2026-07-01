import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { SHARED_VERSION } from '@ism/shared';
import agentRoutes from './routes/agent';  // <--- add this import
import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import speedtestRoutes from './routes/speedtests';
import deviceSettingsRoutes from './routes/deviceSettings';
import dashboardRoutes from './routes/dashboard';
import userRoutes from './routes/user';
import { authenticateUser } from './middleware/auth';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/agent', agentRoutes);        // <--- add this line after express.json()
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/speedtests', speedtestRoutes);
app.use('/api/device-settings', deviceSettingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/user', authenticateUser, userRoutes);


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI!)
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        sharedVersion: SHARED_VERSION,
        dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});