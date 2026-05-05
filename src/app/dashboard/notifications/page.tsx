'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Bell, CheckCheck, AlertTriangle, CreditCard, Calendar, Info } from 'lucide-react';

interface Notification { id: number; message: string; type: string; isRead: boolean; createdAt: string }

const typeIcons: Record<string, typeof Bell> = { price_alert: AlertTriangle, trip_reminder: Calendar, expense: CreditCard, system: Info };
const typeColors: Record<string, string> = { price_alert: '#E76F51', trip_reminder: '#F4A261', expense: '#2A9D8F', system: '#0F4C5C' };

export default function NotificationsPage() {
  const { apiFetch } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    const res = await apiFetch('/api/notifications');
    const data = await res.json();
    setNotifications(data.notifications || []);
    setLoading(false);
  }

  async function markAllRead() {
    await apiFetch('/api/notifications', { method: 'PUT', body: JSON.stringify({ markAllRead: true }) });
    fetchNotifications();
  }

  async function markRead(id: number) {
    await apiFetch('/api/notifications', { method: 'PUT', body: JSON.stringify({ id }) });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-6 slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)]">Notifications {unread > 0 && <span className="badge badge-danger ml-2">{unread} new</span>}</h1>
        {unread > 0 && <button onClick={markAllRead} className="btn-ghost text-xs flex items-center gap-1"><CheckCheck size={14} /> Mark all read</button>}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-shadow)', borderTopColor: 'var(--color-primary)' }} /></div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-light)' }} />
          <p className="font-semibold">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = typeIcons[n.type] || Bell;
            const color = typeColors[n.type] || '#6C757D';
            return (
              <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
                className={`card p-4 flex items-start gap-3 cursor-pointer ${!n.isRead ? 'border-l-4' : 'opacity-70'}`}
                style={!n.isRead ? { borderLeftColor: color } : {}}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-light)' }}>{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full mt-2" style={{ background: color }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
