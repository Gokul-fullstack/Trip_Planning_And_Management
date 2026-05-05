'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { BarChart3, Users, Map, Plane, Hotel, TrendingUp, Shield } from 'lucide-react';

interface Stats {
  summary?: { total_users: number; total_trips: number; total_bookings: number };
  popular_destinations?: Array<{ city: string; country: string; trip_count: number }>;
  budget_vs_actual?: Array<{ trip_name: string; budget: number; actual: number }>;
  [key: string]: unknown;
}

export default function AdminPage() {
  const { apiFetch, user } = useAuth();
  const [stats, setStats] = useState<Stats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.isAdmin) {
      apiFetch('/api/admin').then(r => r.json()).then(d => { setStats(d.stats || {}); setLoading(false); }).catch(() => setLoading(false));
    }
  }, [apiFetch, user]);

  if (!user?.isAdmin) return (
    <div className="flex items-center justify-center h-64">
      <div className="card p-8 text-center"><Shield size={48} className="mx-auto mb-4" style={{ color: 'var(--color-danger)' }} /><h2 className="text-lg font-bold">Access Denied</h2><p className="text-sm" style={{ color: 'var(--color-text-light)' }}>Admin privileges required.</p></div>
    </div>
  );

  const summary = stats.summary || { total_users: 0, total_trips: 0, total_bookings: 0 };

  return (
    <div className="space-y-6 slide-up">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] flex items-center gap-2"><BarChart3 size={24} /> Admin Dashboard</h1>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-shadow)', borderTopColor: 'var(--color-primary)' }} /></div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Users, label: 'Total Users', value: summary.total_users, color: '#0F4C5C' },
              { icon: Map, label: 'Total Trips', value: summary.total_trips, color: '#F4A261' },
              { icon: Plane, label: 'Total Bookings', value: summary.total_bookings, color: '#2A9D8F' },
            ].map(s => (
              <div key={s.label} className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <s.icon size={24} style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold font-[family-name:var(--font-heading)]">{s.value}</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>{s.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Popular Destinations */}
          {stats.popular_destinations && stats.popular_destinations.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} /> Popular Destinations</h3>
              <div className="space-y-3">
                {stats.popular_destinations.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--color-primary)', color: 'white' }}>{i + 1}</span>
                    <span className="flex-1 font-medium text-sm">{d.city}, {d.country}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-shadow)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, d.trip_count * 20)}%`, background: 'var(--color-primary)' }} />
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-primary)' }}>{d.trip_count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget vs Actual */}
          {stats.budget_vs_actual && stats.budget_vs_actual.length > 0 && (
            <div className="card p-5">
              <h3 className="font-bold mb-4">Budget vs Actual Spending</h3>
              <div className="space-y-4">
                {stats.budget_vs_actual.map((t, i) => {
                  const pct = t.budget > 0 ? Math.min(100, (t.actual / t.budget) * 100) : 0;
                  const over = t.actual > t.budget;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{t.trip_name}</span>
                        <span className={over ? 'text-[var(--color-danger)] font-bold' : 'text-[var(--color-success)]'}>{over ? 'Over Budget' : `${pct.toFixed(0)}% used`}</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-shadow)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: over ? 'var(--color-danger)' : 'var(--color-success)' }} />
                      </div>
                      <div className="flex justify-between text-xs mt-0.5" style={{ color: 'var(--color-text-light)' }}>
                        <span>Spent: ${t.actual.toFixed(0)}</span><span>Budget: ${t.budget.toFixed(0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
