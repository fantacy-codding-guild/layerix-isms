import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Search, X } from 'lucide-react';

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
    const [logs, setLogs] = useState<SpeedTest[]>([]);
    const [filterDevice, setFilterDevice] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/speedtests/all?limit=200`);
            setLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = filterDevice
        ? logs.filter(l => l.deviceId.toLowerCase().includes(filterDevice.toLowerCase()))
        : logs;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-800 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow hover:shadow-md transition"
                    >
                        <ArrowLeft size={16} /> Dashboard
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Speed Test Logs</h1>
                </div>
                <Button onClick={fetchLogs} variant="outline" className="gap-2">
                    <RefreshCw size={16} /> Refresh
                </Button>
            </div>

            {/* Filter Card */}
            <Card className="shadow-md">
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Filter by Device ID"
                                value={filterDevice}
                                onChange={e => setFilterDevice(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        {filterDevice && (
                            <Button variant="ghost" size="sm" onClick={() => setFilterDevice('')} className="text-red-500 gap-1">
                                <X size={14} /> Clear
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table Card */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                        {filterDevice ? `Results for "${filterDevice}"` : 'All Recent Tests'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading logs…</div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {filterDevice ? 'No logs match this filter.' : 'No speed test data yet.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Device</TableHead>
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
                                    {filteredLogs.map(log => (
                                        <TableRow key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                            <TableCell className="font-mono text-xs">{log.deviceId}</TableCell>
                                            <TableCell className="text-sm whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">{log.download?.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-medium">{log.upload?.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">{log.ping?.toFixed(1)}</TableCell>
                                            <TableCell className="text-right">{log.jitter?.toFixed(1)}</TableCell>
                                            <TableCell className="text-right">{log.packetLoss?.toFixed(2)}</TableCell>
                                            <TableCell className="text-sm">{log.isp || '—'}</TableCell>
                                            <TableCell className="font-mono text-xs">{log.publicIp || '—'}</TableCell>
                                            <TableCell className="text-xs max-w-[150px] truncate" title={log.server}>
                                                {log.server || '—'}
                                            </TableCell>
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
        </div>
    );
}