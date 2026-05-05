'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Star, MapPin, Wifi, Search } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

interface Hotel { id: number; name: string; address: string; pricePerNight: string; rating: string; amenities: string; images: string; description: string; destination: { city: string; country: string } }

export default function HotelsPage() {
  const { apiFetch, currency } = useAuth();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('0');

  useEffect(() => {
    apiFetch('/api/hotels').then(r => r.json()).then(d => { setHotels(d.hotels || []); setLoading(false); });
  }, [apiFetch]);

  const filtered = hotels.filter(h => !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.destination?.city?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 slide-up">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">Hotels</h1>
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-light)' }} />
        <input type="text" placeholder="Search hotels or cities..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-shadow)', borderTopColor: 'var(--color-primary)' }} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(hotel => {
            const imgs = (() => { try { return JSON.parse(hotel.images as string); } catch { return []; } })();
            const amenities = (() => { try { return JSON.parse(hotel.amenities as string); } catch { return []; } })();
            return (
              <div key={hotel.id} className="card">
                <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${imgs[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'})` }} />
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-sm">{hotel.name}</h3>
                    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--color-secondary)' }}>
                      <Star size={12} fill="currentColor" /> {parseFloat(hotel.rating).toFixed(1)}
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-light)' }}>
                    <MapPin size={12} /> {hotel.destination?.city}, {hotel.destination?.country}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {amenities.slice(0, 3).map((a: string) => (
                      <span key={a} className="badge badge-primary text-[10px]"><Wifi size={10} className="mr-0.5" />{a}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-shadow)' }}>
                    <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>${parseFloat(hotel.pricePerNight).toFixed(0)}<span className="text-xs font-normal" style={{ color: 'var(--color-text-light)' }}>/night</span></span>
                    <button 
                      onClick={() => {
                        setPaymentAmount(parseFloat(hotel.pricePerNight).toFixed(0));
                        setShowPayment(true);
                      }}
                      className="btn-primary text-xs py-1.5 px-3">Book Now</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PaymentModal 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)} 
        amount={paymentAmount} 
        itemType="hotel" 
      />
    </div>
  );
}
