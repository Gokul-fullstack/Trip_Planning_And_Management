'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Plane, Mountain, Sun, MapPin, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (isLogin) { await login(email, password); }
      else { await register(email, password, name); }
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F4C5C 0%, #1a6b80 50%, #2A9D8F 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 animate-bounce" style={{ animationDuration: '3s' }}><Mountain size={80} /></div>
          <div className="absolute top-40 right-32 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}><Plane size={60} /></div>
          <div className="absolute bottom-40 left-40 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}><Sun size={70} /></div>
          <div className="absolute bottom-20 right-20 animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '2s' }}><MapPin size={50} /></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(244, 162, 97, 0.3)' }}>
              <Plane size={28} className="text-[#F4A261]" />
            </div>
            <span className="text-2xl font-bold font-[family-name:var(--font-heading)]">TripPlanner Pro</span>
          </div>
          <h1 className="text-5xl font-bold font-[family-name:var(--font-heading)] mb-6 leading-tight">
            Plan Your<br />
            <span className="text-[#F4A261]">Perfect Journey</span>
          </h1>
          <p className="text-lg opacity-80 max-w-md leading-relaxed">
            Smart budgeting, flight tracking, collaborative planning, and AI-powered recommendations — all in one beautiful platform.
          </p>
          <div className="mt-12 flex gap-8">
            {[{ label: '10K+', sub: 'Destinations' }, { label: '50K+', sub: 'Trips Planned' }, { label: '4.9★', sub: 'User Rating' }].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-[#F4A261]">{s.label}</div>
                <div className="text-sm opacity-60">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8" style={{ background: 'var(--color-bg-main)' }}>
        <div className="w-full max-w-md fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <Plane size={28} className="text-[#0F4C5C]" />
            <span className="text-2xl font-bold font-[family-name:var(--font-heading)] text-[#0F4C5C]">TripPlanner Pro</span>
          </div>

          <h2 className="text-3xl font-bold font-[family-name:var(--font-heading)] mb-2">
            {isLogin ? 'Welcome back!' : 'Create account'}
          </h2>
          <p className="text-[var(--color-text-light)] mb-8">
            {isLogin ? 'Enter your credentials to access your trips.' : 'Start planning your dream journey today.'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm font-medium" style={{ background: 'rgba(231,111,81,0.1)', color: 'var(--color-danger)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="John Doe" required={!isLogin} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-light)]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-[var(--color-text-light)]">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </span>
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-[var(--color-primary)] font-semibold hover:underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>

          {isLogin && (
            <div className="mt-8 p-4 rounded-lg border border-dashed" style={{ borderColor: 'var(--color-shadow)' }}>
              <p className="text-xs font-medium text-[var(--color-text-light)] mb-2">Demo Credentials</p>
              <div className="space-y-1 text-xs">
                <p><span className="font-medium">Admin:</span> admin@tripplanner.com / password123</p>
                <p><span className="font-medium">User:</span> alice@example.com / password123</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
