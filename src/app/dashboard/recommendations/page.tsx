'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { MapPin, Star, Compass, Sun, CloudRain, Cloud, Snowflake, Thermometer } from 'lucide-react';

interface Rec {
  destination?: { id: number; city: string; country: string; heroImage?: string; bestSeason?: string; description?: string };
  score: number;
  explanation?: string;
}

interface Weather {
  forecastDate: string; tempMin: number; tempMax: number; condition: string; icon: string; humidity?: number; windSpeed?: number;
}

export default function RecommendationsPage() {
  const { apiFetch } = useAuth();
  const [recs, setRecs] = useState<Rec[]>([]);
  const [weather, setWeather] = useState<Record<number, Weather[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/recommendations').then(r => r.json()).then(d => { setRecs(d.recommendations || []); setLoading(false); });
  }, [apiFetch]);

  async function loadWeather(destId: number) {
    if (weather[destId]) return;
    const res = await fetch(`/api/weather?destinationId=${destId}`);
    const data = await res.json();
    setWeather(prev => ({ ...prev, [destId]: data.weather || [] }));
  }

  const conditionIcon = (condition: string) => {
    if (condition.includes('Clear') || condition.includes('Sunny')) return <Sun size={16} className="text-yellow-500" />;
    if (condition.includes('Rain')) return <CloudRain size={16} className="text-blue-500" />;
    if (condition.includes('Snow')) return <Snowflake size={16} className="text-blue-300" />;
    return <Cloud size={16} className="text-gray-400" />;
  };

  return (
    <div className="space-y-6 slide-up">
      <div>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">Discover Destinations</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>AI-powered recommendations based on your preferences</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-shadow)', borderTopColor: 'var(--color-primary)' }} /></div>
      ) : (
        <div className="space-y-5">
          {recs.map((rec, i) => {
            const dest = rec.destination;
            if (!dest) return null;
            const destWeather = weather[dest.id];
            return (
              <div key={i} className="card overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 h-48 md:h-auto bg-cover bg-center"
                    style={{ backgroundImage: `url(${dest.heroImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600'})` }} />
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <MapPin size={16} style={{ color: 'var(--color-primary)' }} /> {dest.city}, {dest.country}
                        </h3>
                        {dest.bestSeason && <span className="badge badge-success text-xs mt-1">Best: {dest.bestSeason}</span>}
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--color-secondary)' }}>
                        <Star size={14} fill="currentColor" /> {Number(rec.score).toFixed(1)}
                      </div>
                    </div>
                    <p className="text-sm mb-3" style={{ color: 'var(--color-text-light)' }}>{rec.explanation || dest.description}</p>

                    {/* Weather */}
                    {!destWeather ? (
                      <button onClick={() => loadWeather(dest.id)} className="btn-ghost text-xs flex items-center gap-1">
                        <Thermometer size={12} /> Load 7-Day Forecast
                      </button>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {destWeather.slice(0, 7).map((w, j) => (
                          <div key={j} className="flex-shrink-0 w-16 text-center p-2 rounded-lg text-xs" style={{ background: 'var(--color-shadow)' }}>
                            <p className="font-medium">{new Date(w.forecastDate).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                            <div className="flex justify-center my-1">{w.icon || conditionIcon(w.condition)}</div>
                            <p><strong>{Math.round(w.tempMax)}°</strong></p>
                            <p style={{ color: 'var(--color-text-light)' }}>{Math.round(w.tempMin)}°</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
