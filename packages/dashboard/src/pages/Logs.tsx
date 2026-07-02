import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

interface Device {
    _id: string;
    deviceId: string;
    computerName: string;
}

interface SpeedTest {
    _id: string;
    deviceId: string;
    timestamp: string;
    download: number;
    upload: number;
    ping: number;
    jitter: number;
    packetLoss: number;
    isp: string;
    publicIp: string;
    server: string;
    status: string;
}

export default function Logs() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [logs, setLogs] = useState<SpeedTest[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [devicesLoading, setDevicesLoading] = useState(true);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_API_URL}/api/devices`)
            .then(res => setDevices(res.data))
            .catch(err => console.error('Failed to fetch devices', err))
            .finally(() => setDevicesLoading(false));
    }, []);

    const fetchLogs = async () => {
        if (!selectedDeviceId) return;
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/speedtests?deviceId=${selectedDeviceId}&limit=200`
            );
            setLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch logs', err);
            setError('Could not load logs for this device.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 bg-white px-3 py-2 rounded-lg shadow hover:shadow-md transition"
                >
                    <ArrowLeft size={16} /> Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Speed Test Logs</h1>
            </div>

            <Card className="shadow-md">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex-1 min-w-[250px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Device</label>
                            {devicesLoading ? (
                                <p className="text-sm text-gray-400">Loading devices…</p>
                            ) : devices.length === 0 ? (
                                <p className="text-sm text-red-500">No devices available. Register an agent first.</p>
                            ) : (
                                <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="-- Choose a device --" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {devices.map(device => (
                                            <SelectItem key={device._id} value={device.deviceId}>
                                                {device.deviceId} ({device.computerName})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <Button onClick={fetchLogs} disabled={!selectedDeviceId} className="gap-2">
                            <RefreshCw size={16} /> Load Logs
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {selectedDeviceId && (
                <Card className="shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold">Logs for {selectedDeviceId}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-12 text-gray-500">Loading logs…</div>
                        ) : error ? (
                            <div className="text-center py-12 text-red-500 flex items-center justify-center gap-2">
                                <AlertTriangle className="h-5 w-5" /> {error}
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">No speed tests found for this device.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date & Time</TableHead>
                                            <TableHead className="text-right">Download (Mbps)</TableHead>
                                            <TableHead className="text-right">Upload (Mbps)</TableHead>
                                            <TableHead className="text-right">Ping (ms)</TableHead>
                                            <TableHead className="text-right">Jitter (ms)</TableHead>
                                            <TableHead className="text-right">Packet Loss (%)</TableHead>
                                            <TableHead>ISP</TableHead>
                                            <TableHead>Public IP</TableHead>
                                            <TableHead>Server</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.map(log => (
                                            <TableRow key={log._id} className="hover:bg-gray-50 transition">
                                                <TableCell className="text-sm whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</TableCell>
                                                <TableCell className="text-right font-medium">{log.download?.toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-medium">{log.upload?.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">{log.ping?.toFixed(1)}</TableCell>
                                                <TableCell className="text-right">{log.jitter?.toFixed(1)}</TableCell>
                                                <TableCell className="text-right">{log.packetLoss?.toFixed(2)}</TableCell>
                                                <TableCell className="text-sm">{log.isp || '—'}</TableCell>
                                                <TableCell className="font-mono text-xs">{log.publicIp || '—'}</TableCell>
                                                <TableCell className="text-xs max-w-[150px] truncate" title={log.server}>{log.server || '—'}</TableCell>
                                                <TableCell>
                                                    {log.status === 'success' ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Success
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Failed
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}