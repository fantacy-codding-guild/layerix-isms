import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save, Monitor } from 'lucide-react';

export default function Settings() {
    const { deviceId } = useParams<{ deviceId: string }>();
    const [settings, setSettings] = useState({
        enabled: true,
        startTime: '09:00',
        endTime: '21:00',
        frequencyMinutes: 10,
        timezone: 'Asia/Kolkata',
    });
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get(`${import.meta.env.VITE_API_URL}/api/device-settings/${deviceId}`)
            .then(res => setSettings(res.data.settings))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [deviceId]);

    const handleSave = async () => {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/device-settings/${deviceId}`, { settings });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
                <p className="text-gray-500">Loading settings…</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900 dark:to-slate-800 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow hover:shadow-md transition"
                >
                    <ArrowLeft size={16} /> Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Device Settings</h1>
            </div>

            <Card className="max-w-2xl mx-auto shadow-md">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Monitor className="h-5 w-5 text-blue-500" />
                        {deviceId}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Enabled Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-200">Monitoring Enabled</p>
                            <p className="text-sm text-gray-500">Turn on/off automatic speed tests</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enabled ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Start Time
                            </label>
                            <Input
                                type="time"
                                value={settings.startTime}
                                onChange={e => setSettings({ ...settings, startTime: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Time
                            </label>
                            <Input
                                type="time"
                                value={settings.endTime}
                                onChange={e => setSettings({ ...settings, endTime: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Frequency */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Test Frequency (minutes)
                        </label>
                        <Input
                            type="number"
                            min={1}
                            value={settings.frequencyMinutes}
                            onChange={e => setSettings({ ...settings, frequencyMinutes: Number(e.target.value) })}
                        />
                        <p className="text-xs text-gray-500 mt-1">How often to run a speed test within the schedule</p>
                    </div>

                    {/* Timezone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Timezone
                        </label>
                        <Input
                            value={settings.timezone}
                            onChange={e => setSettings({ ...settings, timezone: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">e.g., Asia/Kolkata, America/New_York</p>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button onClick={handleSave} className="gap-2">
                            <Save size={16} /> Save Settings
                        </Button>
                        {saved && (
                            <span className="text-green-600 text-sm font-medium animate-pulse">
                                Settings saved successfully!
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}