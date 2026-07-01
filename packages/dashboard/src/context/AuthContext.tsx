import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
    token: string | null;
    loginWithOtp: (email: string, otp: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    const loginWithOtp = async (email: string, otp: string) => {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, { email, otp });
        const newToken = res.data.token;
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    useEffect(() => {
        const interceptor = axios.interceptors.request.use(config => {
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });
        return () => axios.interceptors.request.eject(interceptor);
    }, [token]);

    return (
        <AuthContext.Provider value={{ token, loginWithOtp, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);