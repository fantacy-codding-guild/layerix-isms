import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Login() {
    const [email, setEmail] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { loginWithOtp } = useAuth();
    const navigate = useNavigate();

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setOtpSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await loginWithOtp(email, otp);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-96">
                <CardHeader>
                    <CardTitle>Login with OTP</CardTitle>
                </CardHeader>
                <CardContent>
                    {!otpSent ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? 'Sending...' : 'Send OTP'}
                            </Button>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <p className="text-sm text-gray-600">Enter the 6‑digit code sent to {email}</p>
                            <Input type="text" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} required />
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? 'Verifying...' : 'Verify OTP'}
                            </Button>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <button type="button" className="text-sm text-blue-600 underline w-full" onClick={() => setOtpSent(false)}>
                                Change email
                            </button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}