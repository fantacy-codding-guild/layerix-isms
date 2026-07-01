import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Activity,
    Monitor,
    TrendingUp,
    Wifi,
    LogOut,
    Settings,
    FileText,
    Server,
    Cpu,
    Gauge,
} from 'lucide-react';

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

export default function Dashboard() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [tests, setTests] = useState<SpeedTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState<Summary | null>(null);
    const { logout } = useAuth();

    // Fetch devices
    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_API_URL}/api/devices`)
            .then(res => setDevices(res.data))
            .catch(err => {
                console.error(err);
                setError('Could not load devices.');
            })
            .finally(() => setLoading(false));
    }, []);

    // Fetch summary
    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_API_URL}/api/dashboard/summary`)
            .then(res => setSummary(res.data))
            .catch(err => console.error('Summary fetch failed', err));
    }, []);

    // Fetch speed tests for selected device (auto-refresh every 5s)
    useEffect(() => {
        if (!selectedDevice) return;
        const fetchTests = () => {
            axios
                .get(`${import.meta.env.VITE_API_URL}/api/speedtests?deviceId=${selectedDevice.deviceId}&limit=20`)
                .then(res => setTests(res.data.reverse()))
                .catch(err => console.error(err));
        };
        fetchTests();
        const interval = setInterval(fetchTests, 5000);
        return () => clearInterval(interval);
    }, [selectedDevice]);

    if (loading) return <div className="p-6 text-center text-gray-500">Loading dashboard…</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6 space-y-6 font-sans">
            {/* ---------- Header ---------- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                        Network Performance Dashboard
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Real‑time monitoring of your internet links
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <Link
                        to="/logs"
                        className="inline-flex items-center gap-2 text-sm text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-md shadow-sm hover:bg-gray-100 transition"
                    >
                        <FileText size={16} /> Logs
                    </Link>
                    <button
                        onClick={logout}
                        className="inline-flex items-center gap-2 text-sm text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-md shadow-sm hover:bg-gray-100 transition"
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            {/* ---------- KPI Cards ---------- */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Total Devices
                        </CardTitle>
                        <Monitor className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                        <div className="text-2xl font-semibold text-gray-800">
                            {summary?.totalDevices ?? devices.length}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Online Now
                        </CardTitle>
                        <Wifi className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                        <div className="text-2xl font-semibold text-gray-800">
                            {summary?.onlineDevices ?? devices.filter(d => d.status === 'online').length}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Avg Download (1h)
                        </CardTitle>
                        <TrendingUp className="h-5 w-5 text-indigo-500" />
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                        <div className="text-2xl font-semibold text-gray-800">
                            {summary?.avgDownload?.toFixed(1) ?? '--'}
                            <span className="text-sm font-normal text-gray-400 ml-1">Mbps</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-5">
                        <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Avg Upload (1h)
                        </CardTitle>
                        <Activity className="h-5 w-5 text-purple-500" />
                    </CardHeader>
                    <CardContent className="px-5 pb-4">
                        <div className="text-2xl font-semibold text-gray-800">
                            {summary?.avgUpload?.toFixed(1) ?? '--'}
                            <span className="text-sm font-normal text-gray-400 ml-1">Mbps</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ---------- Devices Table (Corporate style) ---------- */}
            <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-3 border-b border-gray-100 px-6 pt-5">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Server className="h-5 w-5 text-gray-600" />
                        Registered Devices
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {error && <p className="text-red-500 p-6">{error}</p>}
                    {devices.length === 0 && !error ? (
                        <div className="text-center py-12 text-gray-500">
                            <Cpu className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                            <p className="font-medium">No devices registered yet</p>
                            <p className="text-sm text-gray-400">Deploy the monitoring agent on a machine to get started.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                                        <TableHead className="font-semibold text-gray-700">Device ID</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Computer</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Last Seen</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {devices.map(device => (
                                        <TableRow
                                            key={device._id}
                                            className="hover:bg-blue-50/50 transition-colors"
                                        >
                                            <TableCell className="font-mono text-sm text-gray-700">
                                                {device.deviceId}
                                            </TableCell>
                                            <TableCell className="font-medium text-gray-800">
                                                {device.computerName}
                                            </TableCell>
                                            <TableCell>
                                                {device.status === 'online' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                        Online
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                        Offline
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {new Date(device.lastSeen).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-3">
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

            {/* ---------- Speed Test Chart (collapsible / conditional) ---------- */}
            {selectedDevice && (
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3 border-b border-gray-100 px-6 pt-5">
                        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Gauge className="h-5 w-5 text-gray-600" />
                            Speed History – {selectedDevice.computerName}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {tests.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Activity className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                                <p>No speed test data yet for this device.</p>
                            </div>
                        ) : (
                            <div className="w-full">
                                <ResponsiveContainer width="100%" height={350}>
                                    <LineChart data={tests}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="timestamp"
                                            tickFormatter={t =>
                                                new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            }
                                            stroke="#9ca3af"
                                            fontSize={12}
                                        />
                                        <YAxis stroke="#9ca3af" fontSize={12} />
                                        <Tooltip
                                            labelFormatter={t => new Date(t).toLocaleString()}
                                            formatter={(value: any) => [`${Number(value).toFixed(2)} Mbps`]}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="download"
                                            stroke="#2563eb"  // corporate blue
                                            strokeWidth={2.5}
                                            dot={false}
                                            name="Download"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="upload"
                                            stroke="#059669"  // corporate green
                                            strokeWidth={2.5}
                                            dot={false}
                                            name="Upload"
                                        />
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