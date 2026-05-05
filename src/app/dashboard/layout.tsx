'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Map, PlaneTakeoff, Hotel, Wallet,
  Bell, PackageCheck, BarChart3, User, Settings, LogOut,
  Plane, Menu, X, Sun, Moon, ChevronDown, Globe
} from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/trips', icon: Map, label: 'My Trips' },
  { href: '/dashboard/trips/new', icon: PlaneTakeoff, label: 'New Trip' },
  { href: '/dashboard/hotels', icon: Hotel, label: 'Hotels' },
  { href: '/dashboard/flights', icon: PlaneTakeoff, label: 'Flights' },
  { href: '/dashboard/expenses', icon: Wallet, label: 'Expenses' },
  { href: '/dashboard/packing', icon: PackageCheck, label: 'Packing List' },
  { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
  { href: '/dashboard/recommendations', icon: Globe, label: 'Discover' },
];

const ADMIN_NAV = [
  { href: '/dashboard/admin', icon: BarChart3, label: 'Admin Dashboard' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, theme, toggleTheme, currency, setCurrency } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push('/');
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      fetch('/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
        .then(r => r.json()).then(d => setUnreadCount(d.unreadCount || 0)).catch(() => {});
    }
    const interval = setInterval(() => {
      if (user) {
        fetch('/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
          .then(r => r.json()).then(d => setUnreadCount(d.unreadCount || 0)).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg-main)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-shadow)', borderTopColor: 'var(--color-primary)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>Loading...</p>
      </div>
    </div>
  );
  if (!user) return null;

  const allNav = [...NAV_ITEMS, ...(user.isAdmin ? ADMIN_NAV : [])];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg-main)' }}>
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--color-bg-sidebar)' }}>
        {/* Logo */}
        <div className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(244,162,97,0.25)' }}>
            <Plane size={22} className="text-[#F4A261]" />
          </div>
          <span className="text-lg font-bold text-white font-[family-name:var(--font-heading)]">TripPlanner</span>
          <button className="lg:hidden ml-auto text-white/60" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allNav.map(item => (
            <Link key={item.href} href={item.href}
              className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              <item.icon size={18} />
              <span>{item.label}</span>
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full text-xs flex items-center justify-center text-white" style={{ background: 'var(--color-danger)' }}>{unreadCount}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <Link href="/dashboard/profile" className="sidebar-link" onClick={() => setSidebarOpen(false)}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--color-secondary)', color: 'var(--color-primary-dark)' }}>
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-white/50 truncate">{user.email}</p>
            </div>
          </Link>
          <button onClick={logout} className="sidebar-link w-full mt-2 text-red-300 hover:text-red-200 hover:bg-red-500/10">
            <LogOut size={18} /> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 px-6 py-3 border-b" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-shadow)' }}>
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} style={{ color: 'var(--color-text)' }} />
          </button>

          <div className="flex-1" />

          {/* Currency Switcher */}
          <div className="relative">
            <button onClick={() => setCurrencyOpen(!currencyOpen)} className="btn-ghost flex items-center gap-1.5 text-xs">
              <Globe size={14} /> {currency} <ChevronDown size={14} />
            </button>
            {currencyOpen && (
              <div className="absolute right-0 top-full mt-1 w-28 rounded-lg shadow-lg border py-1 z-50" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-shadow)' }}>
                {CURRENCIES.map(c => (
                  <button key={c} onClick={() => { setCurrency(c); setCurrencyOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--color-shadow)] ${c === currency ? 'font-bold text-[var(--color-primary)]' : ''}`}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="btn-ghost p-2">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Notifications Bell */}
          <Link href="/dashboard/notifications" className="relative p-2">
            <Bell size={20} style={{ color: 'var(--color-text-light)' }} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white notification-pulse" style={{ background: 'var(--color-danger)' }}>
                {unreadCount}
              </span>
            )}
          </Link>

          {/* Profile Avatar */}
          <Link href="/dashboard/profile" className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: 'var(--color-secondary)', color: 'var(--color-primary-dark)' }}>
            {user.name.charAt(0)}
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 fade-in">
          {children}
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 text-center text-xs border-t" style={{ color: 'var(--color-text-light)', borderColor: 'var(--color-shadow)' }}>
          © 2025 TripPlanner Pro. Built for DBMS Course Project.
        </footer>
      </div>
    </div>
  );
}
