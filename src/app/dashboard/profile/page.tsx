'use client';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { User, Mail, Globe, Shield, Save, Check } from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD'];

export default function ProfilePage() {
  const { user, apiFetch, setCurrency } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferredCurrency || 'USD');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await apiFetch('/api/auth/profile', { method: 'POST', body: JSON.stringify({ name, preferredCurrency }) });
    setCurrency(preferredCurrency);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 slide-up">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">Profile Settings</h1>
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: 'var(--color-secondary)', color: 'var(--color-primary-dark)' }}>
            {user?.name?.charAt(0)}
          </div>
          <div>
            <h2 className="font-bold text-lg">{user?.name}</h2>
            <p className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-light)' }}><Mail size={14} /> {user?.email}</p>
            {user?.isAdmin && <span className="badge badge-primary mt-1"><Shield size={10} className="mr-1" /> Admin</span>}
          </div>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5"><User size={14} className="inline mr-1" /> Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5"><Globe size={14} className="inline mr-1" /> Preferred Currency</label>
            <select value={preferredCurrency} onChange={e => setPreferredCurrency(e.target.value)} className="input-field">
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
            {saved ? <><Check size={16} /> Saved!</> : saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
