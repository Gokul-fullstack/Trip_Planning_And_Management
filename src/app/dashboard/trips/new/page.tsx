'use client';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Wallet, ImageIcon } from 'lucide-react';

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1493707553966-283afac8c358?w=800',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800',
];

export default function NewTripPage() {
  const { apiFetch } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [coverImage, setCoverImage] = useState(COVER_IMAGES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await apiFetch('/api/trips', {
        method: 'POST',
        body: JSON.stringify({ name, startDate, endDate, totalBudget: parseFloat(budget) || 0, coverImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/dashboard/trips/${data.trip.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create trip');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto slide-up">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] mb-6">Create New Trip</h1>

      {error && <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(231,111,81,0.1)', color: 'var(--color-danger)' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5"><MapPin size={14} className="inline mr-1" /> Trip Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="European Adventure 2025" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5"><Calendar size={14} className="inline mr-1" /> Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5"><Calendar size={14} className="inline mr-1" /> End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5"><Wallet size={14} className="inline mr-1" /> Total Budget (USD)</label>
          <input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="input-field" placeholder="5000" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2"><ImageIcon size={14} className="inline mr-1" /> Cover Image</label>
          <div className="grid grid-cols-3 gap-2">
            {COVER_IMAGES.map(img => (
              <button type="button" key={img} onClick={() => setCoverImage(img)}
                className={`h-20 rounded-lg bg-cover bg-center border-2 transition-all ${coverImage === img ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30' : 'border-transparent'}`}
                style={{ backgroundImage: `url(${img})` }} />
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Trip'}
        </button>
      </form>
    </div>
  );
}
