// Device registration
export interface DeviceRegisterPayload {
    deviceId: string;
    computerName: string;
    os: string;
    macAddress: string;
    version: string;
}

export const SHARED_VERSION = '0.1.0';
// Device as stored in DB
export interface IDevice {
    _id: string;
    userId: string;
    deviceId: string;
    computerName: string;
    os: string;
    macAddress: string;
    version: string;
    token: string;          // agent secret
    status: 'online' | 'offline';
    lastSeen: Date;
    settings: IDeviceSettings;
}

// Device-specific monitoring settings
export interface IDeviceSettings {
    enabled: boolean;
    startTime: string;       // "09:00"
    endTime: string;         // "21:00"
    frequencyMinutes: number; // 10, 15, 30...
    timezone: string;        // "Asia/Kolkata"
}

// Speed test result
export interface ISpeedTestResult {
    deviceId: string;
    timestamp: Date;
    download: number;
    upload: number;
    ping: number;
    jitter: number;
    packetLoss: number;
    isp: string;
    publicIp: string;
    server: string;
    status: 'success' | 'failed';
}

// Agent config response
export interface AgentConfigResponse {
    settings: IDeviceSettings;
    googleSheetId?: string;  // if Sheets sync is on
}

// Agent upload payload
export interface SpeedTestUploadPayload {
    results: ISpeedTestResult[];   // can be multiple if offline queue flushed
}