'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { Wallet, Plus, Users, PieChart, ArrowUpDown } from 'lucide-react';

interface Expense {
  id: number; description: string; amount: string; currency: string; category: string; createdAt: string;
  payer: { id: number; name: string; avatarUrl?: string };
  splits: Array<{ userId: number; amount: string; user: { id: number; name: string } }>;
}

interface Trip { id: number; name: string }

const CATEGORIES = ['Accommodation', 'Food', 'Transport', 'Activities', 'Shopping', 'Other'];

export default function ExpensesPage() {
  const { apiFetch, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: 'Food', currency: 'USD' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch('/api/trips').then(r => r.json()).then(d => {
      setTrips(d.trips || []);
      if (d.trips?.length > 0) setSelectedTrip(d.trips[0].id);
    });
  }, [apiFetch]);

  const fetchExpenses = useCallback(async () => {
    if (!selectedTrip) return;
    setLoading(true);
    const res = await apiFetch(`/api/expenses?tripId=${selectedTrip}`);
    const data = await res.json();
    setExpenses(data.expenses || []);
    setLoading(false);
  }, [selectedTrip, apiFetch]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true);
    await apiFetch('/api/expenses', { method: 'POST', body: JSON.stringify({ ...form, tripId: selectedTrip, amount: parseFloat(form.amount) }) });
    setShowForm(false); setForm({ description: '', amount: '', category: 'Food', currency: 'USD' }); setSubmitting(false);
    fetchExpenses();
  }

  const total = expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const byCategory = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount); return acc; }, {} as Record<string, number>);

  // Calculate who owes whom
  const balances: Record<number, { name: string; paid: number; owes: number }> = {};
  expenses.forEach(e => {
    const payerId = e.payer.id;
    if (!balances[payerId]) balances[payerId] = { name: e.payer.name, paid: 0, owes: 0 };
    balances[payerId].paid += parseFloat(e.amount);
    e.splits.forEach(s => {
      if (!balances[s.userId]) balances[s.userId] = { name: s.user.name, paid: 0, owes: 0 };
      balances[s.userId].owes += parseFloat(s.amount);
    });
  });

  return (
    <div className="space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">Expenses</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} /> Add Expense</button>
      </div>

      <select value={selectedTrip} onChange={e => setSelectedTrip(parseInt(e.target.value))} className="input-field max-w-xs">
        {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(15,76,92,0.1)' }}>
              <Wallet size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div><p className="text-xl font-bold">${total.toFixed(2)}</p><p className="text-xs" style={{ color: 'var(--color-text-light)' }}>Total Expenses</p></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(244,162,97,0.1)' }}>
              <PieChart size={20} style={{ color: 'var(--color-secondary)' }} />
            </div>
            <div><p className="text-xl font-bold">{Object.keys(byCategory).length}</p><p className="text-xs" style={{ color: 'var(--color-text-light)' }}>Categories</p></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(42,157,143,0.1)' }}>
              <Users size={20} style={{ color: 'var(--color-success)' }} />
            </div>
            <div><p className="text-xl font-bold">{expenses.length}</p><p className="text-xs" style={{ color: 'var(--color-text-light)' }}>Transactions</p></div>
          </div>
        </div>
      </div>

      {/* Balances */}
      {Object.keys(balances).length > 0 && (
        <div className="card p-4">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><ArrowUpDown size={16} /> Member Balances</h3>
          <div className="space-y-2">
            {Object.entries(balances).map(([id, b]) => {
              const net = b.paid - b.owes;
              return (
                <div key={id} className="flex items-center justify-between text-sm py-1">
                  <span className="font-medium">{b.name}</span>
                  <div className="flex gap-4 text-xs">
                    <span>Paid: <strong>${b.paid.toFixed(2)}</strong></span>
                    <span>Owes: <strong>${b.owes.toFixed(2)}</strong></span>
                    <span className={`font-bold ${net >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                      {net >= 0 ? `+$${net.toFixed(2)}` : `-$${Math.abs(net).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Expense Form */}
      {showForm && (
        <div className="card p-5">
          <h3 className="font-bold mb-4">Add Expense</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <input type="text" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" required />
            <div className="grid grid-cols-3 gap-3">
              <input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input-field" required />
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="input-field">
                {['USD', 'EUR', 'GBP', 'INR', 'JPY'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Adding...' : 'Add'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Expense List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-shadow)', borderTopColor: 'var(--color-primary)' }} /></div>
      ) : expenses.length === 0 ? (
        <div className="card p-12 text-center"><Wallet size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-light)' }} /><p className="font-semibold">No expenses yet</p></div>
      ) : (
        <div className="space-y-2">
          {expenses.map(e => (
            <div key={e.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--color-secondary)', color: 'var(--color-primary-dark)' }}>
                {e.payer.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{e.description}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>Paid by {e.payer.name} · {e.category} · {new Date(e.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold" style={{ color: 'var(--color-primary)' }}>{e.currency} {parseFloat(e.amount).toFixed(2)}</p>
                <p className="text-[10px]" style={{ color: 'var(--color-text-light)' }}>Split {e.splits.length} ways</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
