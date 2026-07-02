import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Activity, Monitor, TrendingUp, Wifi, LogOut, Settings, FileText,
    Server, Cpu, Gauge, PlusCircle, Trash2, AlertTriangle
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────
interface Device {
    _id: string;
    deviceId: string;
    computerName: string;
    status: 'online' | 'offline';
    lastSeen: string;
}

interface SpeedTest {
    _id: string;
    timestamp: string;
    download: number;
    upload: number;
    ping: number;
}

interface Summary {
    totalDevices: number;
    onlineDevices: number;
    avgDownload: number;
    avgUpload: number;
    recentTestCount: number;
}

// ─── Reusable Components ─────────────────────────────
function KpiCard({ title, value, unit = '', icon: Icon, color }: {
    title: string; value: string | number; unit?: string; icon: any; color: string;
}) {
    return (
        <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:shadow-lg transition-shadow rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
                <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</CardTitle>
                <Icon className={`h-5 w-5 text-${color}-500`} />
            </CardHeader>
            <CardContent className="px-5 pb-4">
                <div className="text-2xl font-semibold text-slate-800">
                    {value}
                    {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status }: { status: 'online' | 'offline' }) {
    return status === 'online' ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Online
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Offline
        </span>
    );
}

// ─── Main Component ──────────────────────────────────
export default function Dashboard() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [tests, setTests] = useState<SpeedTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState<Summary | null>(null);
    const [addDeviceToken, setAddDeviceToken] = useState('');
    const { logout } = useAuth();

    const onlineCount = useMemo(
        () => summary?.onlineDevices ?? devices.filter(d => d.status === 'online').length,
        [summary, devices]
    );

    // ── Data fetching ──────────────────────────────────
    const fetchDevices = useCallback(async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/devices`);
            setDevices(res.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Could not load devices. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSummary = useCallback(async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/summary`);
            setSummary(res.data);
        } catch (err) {
            console.error('Summary fetch failed', err);
        }
    }, []);

    const fetchTests = useCallback(async (deviceId: string) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/speedtests?deviceId=${deviceId}&limit=20`);
            setTests(res.data.reverse());
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchDevices();
        fetchSummary();
    }, [fetchDevices, fetchSummary]);

    useEffect(() => {
        if (!selectedDevice) return;
        fetchTests(selectedDevice.deviceId);
        const interval = setInterval(() => fetchTests(selectedDevice.deviceId), 5000);
        return () => clearInterval(interval);
    }, [selectedDevice, fetchTests]);

    // ── Actions ────────────────────────────────────────
    const generateRegToken = useCallback(async () => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/user/generate-registration-token`);
            setAddDeviceToken(res.data.token);
        } catch (err) {
            console.error('Failed to generate registration token', err);
        }
    }, []);

    const toggleDevice = useCallback(async (device: Device) => {
        const newEnabled = !(device.status === 'online');
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/api/device-settings/${device.deviceId}`, {
                settings: { enabled: newEnabled }
            });
            setDevices(prev =>
                prev.map(d =>
                    d.deviceId === device.deviceId
                        ? { ...d, status: newEnabled ? 'online' : 'offline' }
                        : d
                )
            );
        } catch (err) {
            console.error('Failed to toggle device', err);
        }
    }, []);

    const handleDeleteDevice = useCallback(async (device: Device) => {
        if (!window.confirm(`Permanently delete "${device.deviceId}" and all its history?`)) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/devices/${device.deviceId}`);
            setDevices(prev => prev.filter(d => d.deviceId !== device.deviceId));
            if (selectedDevice?.deviceId === device.deviceId) setSelectedDevice(null);
        } catch (err) {
            console.error('Delete failed', err);
            alert('Could not delete device.');
        }
    }, [selectedDevice]);

    // ── Render ─────────────────────────────────────────
    if (loading) return <div className="p-6 text-center text-gray-500">Loading dashboard…</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Network Overview</h1>
                    <p className="text-slate-500 text-sm mt-1">Real‑time internet performance monitoring</p>
                </div>
                <div className="flex gap-3 items-center">
                    <Link
                        to="/logs"
                        className="inline-flex items-center gap-2 text-sm text-slate-600 bg-white/80 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:bg-white transition"
                    >
                        <FileText size={16} /> Logs
                    </Link>
                    <button
                        onClick={logout}
                        className="inline-flex items-center gap-2 text-sm text-slate-600 bg-white/80 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:bg-white transition"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard title="Total Devices" value={summary?.totalDevices ?? devices.length} icon={Monitor} color="blue" />
                <KpiCard title="Online Now" value={onlineCount} icon={Wifi} color="green" />
                <KpiCard title="Avg Download (1h)" value={summary?.avgDownload?.toFixed(1) ?? '--'} unit="Mbps" icon={TrendingUp} color="indigo" />
                <KpiCard title="Avg Upload (1h)" value={summary?.avgUpload?.toFixed(1) ?? '--'} unit="Mbps" icon={Activity} color="purple" />
            </div>

            {/* Add Device */}
            <div className="flex items-center gap-2">
                <button
                    onClick={generateRegToken}
                    className="inline-flex items-center gap-2 text-sm bg-white/80 backdrop-blur-sm border border-blue-200 text-blue-700 px-4 py-2 rounded-xl shadow-sm hover:bg-blue-50 transition"
                >
                    <PlusCircle size={16} /> Add New Device
                </button>
            </div>

            {addDeviceToken && (
                <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-2xl p-5 text-sm space-y-2">
                    <p className="font-semibold text-blue-800">New device registration token (valid for 1 hour):</p>
                    <code className="text-lg font-bold text-blue-900 bg-blue-100 px-3 py-1 rounded-lg">{addDeviceToken}</code>
                    <p className="text-slate-600">
                        Copy this token and add it to the agent’s <code>.env</code> file:<br />
                        <code className="block bg-white mt-2 p-2 rounded-lg text-sm">REGISTRATION_TOKEN={addDeviceToken}</code>
                    </p>
                </div>
            )}

            {/* Devices Table */}
            <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm rounded-2xl">
                <CardHeader className="pb-3 border-b border-slate-100 px-6 pt-5">
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Server className="h-5 w-5 text-slate-500" /> Your Devices
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {error && (
                        <div className="p-6 text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" /> {error}
                        </div>
                    )}
                    {!error && devices.length === 0 && (
                        <div className="text-center py-16 text-slate-400">
                            <Cpu className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                            <p className="font-medium text-lg text-slate-500">No devices registered yet</p>
                            <p className="text-sm mt-1">Click “Add New Device” and follow the instructions to link your first agent.</p>
                        </div>
                    )}
                    {devices.length > 0 && (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                        <TableHead className="font-semibold text-slate-700">Device ID</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Computer</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Last Seen</TableHead>
                                        <TableHead className="font-semibold text-slate-700">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {devices.map(device => (
                                        <TableRow key={device._id} className="hover:bg-blue-50/30 transition-colors">
                                            <TableCell className="font-mono text-sm text-slate-700">{device.deviceId}</TableCell>
                                            <TableCell className="font-medium text-slate-800">{device.computerName}</TableCell>
                                            <TableCell><StatusBadge status={device.status} /></TableCell>
                                            <TableCell className="text-sm text-slate-500">{new Date(device.lastSeen).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${device.status === 'online'
                                                                ? 'border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                                                                : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                                                            }`}
                                                        onClick={() => toggleDevice(device)}
                                                    >
                                                        {device.status === 'online' ? 'Stop' : 'Start'}
                                                    </button>
                                                    <button
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium underline underline-offset-2"
                                                        onClick={() => setSelectedDevice(device)}
                                                    >
                                                        View Chart
                                                    </button>
                                                    <Link
                                                        to={`/settings/${device.deviceId}`}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium underline underline-offset-2 flex items-center gap-1"
                                                    >
                                                        <Settings size={14} /> Settings
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteDevice(device)}
                                                        className="text-slate-300 hover:text-red-500 transition ml-1"
                                                        title="Delete device"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Speed Test Chart */}
            {selectedDevice && (
                <Card className="bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm rounded-2xl">
                    <CardHeader className="pb-3 border-b border-slate-100 px-6 pt-5">
                        <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Gauge className="h-5 w-5 text-slate-500" />
                            Speed History – {selectedDevice.computerName}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {tests.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Activity className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                                <p>No speed test data yet for this device.</p>
                            </div>
                        ) : (
                            <div className="w-full">
                                <ResponsiveContainer width="100%" height={350}>
                                    <LineChart data={tests}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis
                                            dataKey="timestamp"
                                            tickFormatter={t => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            stroke="#94a3b8"
                                            fontSize={12}
                                        />
                                        <YAxis stroke="#94a3b8" fontSize={12} />
                                        <Tooltip
                                            labelFormatter={t => new Date(t).toLocaleString()}
                                            formatter={(value: any) => [`${Number(value).toFixed(2)} Mbps`]}
                                        />
                                        <Line type="monotone" dataKey="download" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="Download" />
                                        <Line type="monotone" dataKey="upload" stroke="#10b981" strokeWidth={2.5} dot={false} name="Upload" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}