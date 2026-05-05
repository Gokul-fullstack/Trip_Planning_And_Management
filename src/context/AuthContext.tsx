'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string;
  preferredCurrency: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  currency: string;
  setCurrency: (c: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrencyState] = useState('USD');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const savedCurrency = localStorage.getItem('currency');
    if (savedTheme) { setTheme(savedTheme); document.documentElement.classList.toggle('dark', savedTheme === 'dark'); }
    if (savedCurrency) setCurrencyState(savedCurrency);
    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUser(t: string) {
    try {
      const res = await fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user.preferredCurrency) setCurrencyState(data.user.preferredCurrency);
      } else { localStorage.removeItem('token'); setToken(null); }
    } catch { localStorage.removeItem('token'); setToken(null); }
    setLoading(false);
  }

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
    if (data.user.preferredCurrency) setCurrencyState(data.user.preferredCurrency);
  }

  async function register(email: string, password: string, name: string) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
  }

  function logout() {
    setUser(null); setToken(null);
    localStorage.removeItem('token');
  }

  function setCurrency(c: string) {
    setCurrencyState(c);
    localStorage.setItem('currency', c);
  }

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }

  const apiFetch = useCallback((url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, currency, setCurrency, theme, toggleTheme, apiFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
