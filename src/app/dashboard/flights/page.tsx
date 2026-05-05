'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Plane, Clock, Search, TrendingDown, AlertCircle } from 'lucide-react';
import PaymentModal from '@/components/PaymentModal';

interface Flight { id: number; airline: string; flightNumber: string; origin: string; destination: string; departureTime: string; arrivalTime: string; durationMins: number; basePrice: string; class: string }

export default function FlightsPage() {
  const { apiFetch } = useAuth();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState<unknown[]>([]);
  const [adviceRoute, setAdviceRoute] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('0');

  useEffect(() => {
    apiFetch('/api/flights').then(r => r.json()).then(d => { setFlights(d.flights || []); setLoading(false); });
  }, [apiFetch]);

  async function getAdvice(route: string) {
    setAdviceRoute(route);
    try {
      const res = await apiFetch(`/api/flights/prices?action=advice&routeKey=${route}`);
      if (!res.ok) {
        console.error('Failed to fetch advice:', res.statusText);
        setAdvice([]);
        return;
      }
      const text = await res.text();
      if (!text) {
        setAdvice([]);
        return;
      }
      const data = JSON.parse(text);
      setAdvice(Array.isArray(data.advice) ? (Array.isArray(data.advice[0]) ? data.advice[0] : data.advice) : []);
    } catch (e) {
      console.error('Error fetching advice:', e);
      setAdvice([]);
    }
  }

  const filtered = flights.filter(f => !search || f.airline.toLowerCase().includes(search.toLowerCase()) || f.origin.toLowerCase().includes(search.toLowerCase()) || f.destination.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 slide-up">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">Flights</h1>
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-light)' }} />
        <input type="text" placeholder="Search by airline, origin, or destination..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-shadow)', borderTopColor: 'var(--color-primary)' }} /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map(flight => (
            <div key={flight.id} className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(15,76,92,0.1)' }}>
                <Plane size={22} style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{flight.airline}</span>
                  <span className="badge badge-primary text-[10px]">{flight.flightNumber}</span>
                </div>
                <p className="text-sm mt-0.5">{flight.origin} → {flight.destination}</p>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--color-text-light)' }}>
                  <span>{new Date(flight.departureTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {Math.floor(flight.durationMins/60)}h {flight.durationMins%60}m</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>${parseFloat(flight.basePrice).toFixed(0)}</p>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-light)' }}>{flight.class}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => {
                      setPaymentAmount(parseFloat(flight.basePrice).toFixed(0));
                      setShowPayment(true);
                    }}
                    className="btn-primary text-xs py-1.5 px-3">Book</button>
                  <button onClick={() => getAdvice(`${flight.origin.substring(0,3).toUpperCase()}-${flight.destination.substring(0,3).toUpperCase()}`)}
                    className="btn-ghost text-xs py-1 px-2 flex items-center gap-1"><TrendingDown size={10} /> Advice</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {advice.length > 0 && (
        <div className="card p-5">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
            <AlertCircle size={16} style={{ color: 'var(--color-secondary)' }} /> Booking Advice for {adviceRoute}
          </h3>
          <div className="space-y-2">
            {advice.slice(0, 5).map((a: unknown, i: number) => {
              const item = a as Record<string, unknown>;
              const days = item.days_before_travel ?? item.daysBeforeTravel ?? '?';
              const avgPrice = item.avg_price ?? item.avgPrice ?? '0';
              const savings = item.potential_savings_pct ?? item.potentialSavingsPct ?? '0';
              return (
                <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg" style={{ background: i === 0 ? 'rgba(42,157,143,0.1)' : 'transparent' }}>
                  <span className="font-bold w-6">{i === 0 ? '🏆' : `#${i+1}`}</span>
                  <span>Book <strong>{String(days)}</strong> days before</span>
                  <span style={{ color: 'var(--color-primary)' }}>Avg: ${String(avgPrice)}</span>
                  <span className="badge badge-success text-[10px]">Save {String(savings)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {advice.length > 0 && (
        <div className="card p-5 mt-8 bg-gradient-to-r from-[rgba(15,76,92,0.05)] to-transparent border-l-4" style={{ borderLeftColor: 'var(--color-primary)' }}>
          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Plane size={20} style={{ color: 'var(--color-primary)' }} /> General Flight Booking Tricks
          </h3>
          <ul className="space-y-2 text-sm" style={{ color: 'var(--color-text-light)' }}>
            <li>• <strong>Be Flexible:</strong> Flying on Tuesdays, Wednesdays, and Saturdays usually offers lower fares than Mondays or Fridays.</li>
            <li>• <strong>Incognito Mode:</strong> Always search for flights in incognito or private browsing mode to prevent price hikes based on your search history.</li>
            <li>• <strong>Book Early:</strong> For domestic flights, aim to book 1-3 months in advance. For international, 2-8 months is optimal.</li>
            <li>• <strong>Mix and Match:</strong> Consider booking two one-way tickets on different airlines instead of a round trip to save money.</li>
            <li>• <strong>Set Alerts:</strong> Use price alerts (like the ones available on this platform) to get notified when prices drop for your desired route.</li>
          </ul>
        </div>
      )}

      <PaymentModal 
        isOpen={showPayment} 
        onClose={() => setShowPayment(false)} 
        amount={paymentAmount} 
        itemType="flight" 
      />
    </div>
  );
}
