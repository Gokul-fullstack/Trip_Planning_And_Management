'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Map, Plane, Hotel, Wallet, TrendingUp, Calendar, Users, ArrowRight } from 'lucide-react';

interface Trip {
  id: number; name: string; startDate: string; endDate: string; status: string;
  totalBudget: string; coverImage?: string;
  owner: { name: string };
  members: Array<{ user: { name: string; avatarUrl?: string } }>;
  _count: { itineraryDays: number; expenses: number };
}

export default function DashboardPage() {
  const { user, apiFetch } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/trips').then(r => r.json()).then(d => { setTrips(d.trips || []); setLoading(false); }).catch(() => setLoading(false));
  }, [apiFetch]);

  const upcomingTrips = trips.filter(t => new Date(t.startDate) > new Date());
  const activeTrips = trips.filter(t => t.status === 'Ongoing');
  const totalBudget = trips.reduce((s, t) => s + parseFloat(t.totalBudget || '0'), 0);

  const stats = [
    { icon: Map, label: 'Total Trips', value: trips.length, color: '#0F4C5C' },
    { icon: Calendar, label: 'Upcoming', value: upcomingTrips.length, color: '#F4A261' },
    { icon: TrendingUp, label: 'Active', value: activeTrips.length, color: '#2A9D8F' },
    { icon: Wallet, label: 'Total Budget', value: `$${totalBudget.toLocaleString()}`, color: '#E76F51' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-shadow)', borderTopColor: 'var(--color-primary)' }} />
    </div>
  );

  return (
    <div className="space-y-8 slide-up">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold font-[family-name:var(--font-heading)]">
          Welcome back, <span style={{ color: 'var(--color-primary)' }}>{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="mt-1" style={{ color: 'var(--color-text-light)' }}>Here&apos;s an overview of your travel plans.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon size={22} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold font-[family-name:var(--font-heading)]">{s.value}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trips Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-[family-name:var(--font-heading)]">Your Trips</h2>
          <Link href="/dashboard/trips/new" className="btn-primary text-sm">
            <Map size={16} /> New Trip
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="card p-12 text-center">
            <Plane size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-light)' }} />
            <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-light)' }}>Start planning your first adventure!</p>
            <Link href="/dashboard/trips/new" className="btn-primary">Create Your First Trip</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map(trip => (
              <Link key={trip.id} href={`/dashboard/trips/${trip.id}`} className="card group cursor-pointer">
                <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url(${trip.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600'})` }}>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-white font-bold text-lg truncate">{trip.name}</h3>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`badge ${trip.status === 'Planning' ? 'badge-primary' : trip.status === 'Ongoing' ? 'badge-success' : 'badge-warning'}`}>
                      {trip.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-light)' }}>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {trip.members.length}</span>
                    <span className="flex items-center gap-1"><Wallet size={12} /> ${parseFloat(trip.totalBudget).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center mt-3">
                    <div className="flex -space-x-2">
                      {trip.members.slice(0, 3).map((m, i) => (
                        <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white"
                          style={{ background: ['#0F4C5C', '#F4A261', '#2A9D8F', '#E76F51'][i % 4], color: 'white' }}>
                          {m.user.name.charAt(0)}
                        </div>
                      ))}
                      {trip.members.length > 3 && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white" style={{ background: 'var(--color-shadow)' }}>
                          +{trip.members.length - 3}
                        </div>
                      )}
                    </div>
                    <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-primary)' }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/hotels', icon: Hotel, label: 'Find Hotels', desc: 'Browse and book accommodations', color: '#0F4C5C' },
          { href: '/dashboard/flights', icon: Plane, label: 'Search Flights', desc: 'Find the best flight deals', color: '#F4A261' },
          { href: '/dashboard/recommendations', icon: TrendingUp, label: 'AI Suggestions', desc: 'Get personalized recommendations', color: '#2A9D8F' },
        ].map(a => (
          <Link key={a.href} href={a.href} className="card p-5 flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${a.color}15` }}>
              <a.icon size={24} style={{ color: a.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{a.label}</h3>
              <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>{a.desc}</p>
            </div>
            <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-text-light)' }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
