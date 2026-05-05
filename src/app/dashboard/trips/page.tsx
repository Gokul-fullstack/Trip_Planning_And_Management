'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Users, Wallet, MapPin, Plus, Search } from 'lucide-react';

interface Trip {
  id: number; name: string; startDate: string; endDate: string; status: string;
  totalBudget: string; coverImage?: string;
  owner: { name: string };
  members: Array<{ user: { name: string } }>;
}

export default function TripsPage() {
  const { apiFetch } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/trips').then(r => r.json()).then(d => { setTrips(d.trips || []); setLoading(false); });
  }, [apiFetch]);

  const filtered = trips.filter(t => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 slide-up">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">My Trips</h1>
        <Link href="/dashboard/trips/new" className="btn-primary"><Plus size={16} /> New Trip</Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-light)' }} />
          <input type="text" placeholder="Search trips..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
        </div>
        <div className="flex gap-2">
          {['all', 'Planning', 'Ongoing', 'Completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filter === f ? 'text-white' : 'btn-ghost'}`}
              style={filter === f ? { background: 'var(--color-primary)' } : {}}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-shadow)', borderTopColor: 'var(--color-primary)' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-light)' }} />
          <p className="text-lg font-semibold">No trips found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(trip => (
            <Link key={trip.id} href={`/dashboard/trips/${trip.id}`} className="card group">
              <div className="h-36 bg-cover bg-center relative" style={{ backgroundImage: `url(${trip.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600'})` }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                <div className="absolute bottom-3 left-4"><h3 className="text-white font-bold text-lg">{trip.name}</h3></div>
                <div className="absolute top-3 right-3">
                  <span className={`badge ${trip.status === 'Planning' ? 'badge-primary' : trip.status === 'Ongoing' ? 'badge-success' : 'badge-warning'}`}>{trip.status}</span>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-light)' }}>
                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="flex items-center gap-1"><Users size={12} /> {trip.members.length}</span>
                <span className="flex items-center gap-1"><Wallet size={12} /> ${parseFloat(trip.totalBudget).toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
