'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { Package, Check, Plus, Trash2 } from 'lucide-react';

interface PackingItem { id: number; itemName: string; isPacked: boolean; isCustom: boolean }
interface Trip { id: number; name: string }

export default function PackingPage() {
  const { apiFetch } = useAuth();
  const [items, setItems] = useState<PackingItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState(0);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/trips').then(r => r.json()).then(d => {
      setTrips(d.trips || []);
      if (d.trips?.length > 0) setSelectedTrip(d.trips[0].id);
    });
  }, [apiFetch]);

  const fetchItems = useCallback(async () => {
    if (!selectedTrip) return;
    setLoading(true);
    const res = await apiFetch(`/api/packing?tripId=${selectedTrip}`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }, [selectedTrip, apiFetch]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function togglePacked(id: number) {
    await apiFetch('/api/packing', { method: 'POST', body: JSON.stringify({ action: 'toggle', id }) });
    setItems(prev => prev.map(i => i.id === id ? { ...i, isPacked: !i.isPacked } : i));
  }

  async function addCustomItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItem.trim()) return;
    await apiFetch('/api/packing', { method: 'POST', body: JSON.stringify({ tripId: selectedTrip, itemName: newItem }) });
    setNewItem('');
    fetchItems();
  }

  const packed = items.filter(i => i.isPacked).length;
  const progress = items.length > 0 ? Math.round((packed / items.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 slide-up">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">Packing List</h1>
      <select value={selectedTrip} onChange={e => setSelectedTrip(parseInt(e.target.value))} className="input-field max-w-xs">
        {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {/* Progress */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{packed}/{items.length} items packed</span>
          <span className="text-sm font-bold" style={{ color: progress === 100 ? 'var(--color-success)' : 'var(--color-primary)' }}>{progress}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-shadow)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: progress === 100 ? 'var(--color-success)' : 'var(--color-primary)' }} />
        </div>
      </div>

      {/* Add Item */}
      <form onSubmit={addCustomItem} className="flex gap-2">
        <input type="text" value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Add custom item..." className="input-field flex-1" />
        <button type="submit" className="btn-primary"><Plus size={16} /></button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-shadow)', borderTopColor: 'var(--color-primary)' }} /></div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center"><Package size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-light)' }} /><p className="font-semibold">No items in packing list</p></div>
      ) : (
        <div className="space-y-1">
          {items.map(item => (
            <div key={item.id} onClick={() => togglePacked(item.id)}
              className={`card p-3 flex items-center gap-3 cursor-pointer transition-all ${item.isPacked ? 'opacity-60' : ''}`}>
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${item.isPacked ? 'border-[var(--color-success)] bg-[var(--color-success)]' : 'border-[var(--color-shadow)]'}`}>
                {item.isPacked && <Check size={14} className="text-white" />}
              </div>
              <span className={`flex-1 text-sm ${item.isPacked ? 'line-through' : ''}`}>{item.itemName}</span>
              {item.isCustom && <span className="badge badge-warning text-[10px]">Custom</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
