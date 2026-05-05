'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, use } from 'react';
import { Calendar, Users, Wallet, MapPin, Clock, Edit2, Trash2, Plus, ChevronDown, ChevronUp, ArrowLeft, UserPlus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Activity { id: number; time: string; name: string; cost: string; category: string; notes?: string; imageUrl?: string }
interface ItineraryDay { id: number; dayNumber: number; date: string; notes?: string; destination: { city: string; country: string }; activities: Activity[] }
interface Member { user: { id: number; name: string; email: string; avatarUrl?: string }; role: string; costSharePct: number }
interface Expense { id: number; description: string; amount: string; currency: string; category: string; payer: { name: string }; splits: Array<{ user: { name: string }; amount: string }> }
interface Trip {
  id: number; name: string; startDate: string; endDate: string; status: string; totalBudget: string; coverImage?: string;
  owner: { id: number; name: string; email: string };
  members: Member[]; itineraryDays: ItineraryDay[]; expenses: Expense[];
  hotelBookings: Array<{ hotel: { name: string }; checkIn: string; checkOut: string; totalPrice: string; status: string }>;
  flightBookings: Array<{ flight: { airline: string; flightNumber: string; origin: string; destination: string }; pricePaid: string; status: string }>;
}

const STATUS_COLORS: Record<string, string> = { Planning: 'badge-primary', Ongoing: 'badge-success', Completed: 'badge-warning' };

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { apiFetch, user } = useAuth();
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', status: '', totalBudget: '', startDate: '', endDate: '' });
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editMemberData, setEditMemberData] = useState({ role: '', costSharePct: '0' });
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [memberShare, setMemberShare] = useState('0');
  const [memberError, setMemberError] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    apiFetch(`/api/trips/${id}`).then(r => r.json()).then(d => {
      setTrip(d.trip);
      if (d.trip) {
        setEditData({ 
          name: d.trip.name, 
          status: d.trip.status, 
          totalBudget: d.trip.totalBudget,
          startDate: new Date(d.trip.startDate).toISOString().split('T')[0],
          endDate: new Date(d.trip.endDate).toISOString().split('T')[0]
        });
      }
      setLoading(false);
    });
  }, [id, apiFetch]);

  async function handleUpdate() {
    await apiFetch(`/api/trips/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify({ 
        ...editData, 
        totalBudget: parseFloat(editData.totalBudget),
        startDate: editData.startDate,
        endDate: editData.endDate
      }) 
    });
    setEditing(false);
    const res = await apiFetch(`/api/trips/${id}`);
    const data = await res.json();
    setTrip(data.trip);
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this trip?')) return;
    await apiFetch(`/api/trips/${id}`, { method: 'DELETE' });
    router.push('/dashboard/trips');
  }

  async function handleAddMember() {
    if (!memberEmail.trim()) { setMemberError('Email is required'); return; }
    setAddingMember(true);
    setMemberError('');
    try {
      const res = await apiFetch(`/api/trips/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: memberEmail.trim(), role: memberRole, costSharePct: parseFloat(memberShare) || 0 })
      });
      const data = await res.json();
      if (!res.ok) { setMemberError(data.error || 'Failed to add member'); setAddingMember(false); return; }
      // Refresh trip data
      const tripRes = await apiFetch(`/api/trips/${id}`);
      const tripData = await tripRes.json();
      setTrip(tripData.trip);
      setMemberEmail('');
      setMemberRole('member');
      setMemberShare('0');
      setShowAddMember(false);
    } catch { setMemberError('Failed to add member'); }
    setAddingMember(false);
  }

  async function handleUpdateMember(userId: number) {
    try {
      await apiFetch(`/api/trips/${id}/members`, {
        method: 'PUT',
        body: JSON.stringify({ userId, role: editMemberData.role, costSharePct: parseFloat(editMemberData.costSharePct) || 0 })
      });
      setEditingMemberId(null);
      const res = await apiFetch(`/api/trips/${id}`);
      const data = await res.json();
      setTrip(data.trip);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRemoveMember(userId: number) {
    if (!confirm('Remove this member?')) return;
    try {
      await apiFetch(`/api/trips/${id}/members?userId=${userId}`, { method: 'DELETE' });
      const res = await apiFetch(`/api/trips/${id}`);
      const data = await res.json();
      setTrip(data.trip);
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--color-shadow)', borderTopColor: 'var(--color-primary)' }} /></div>;
  if (!trip) return <div className="card p-12 text-center"><h2 className="text-lg font-bold">Trip not found</h2></div>;

  const totalExpenses = trip.expenses.reduce((s, e) => s + parseFloat(e.amount), 0);
  const budgetUsed = parseFloat(trip.totalBudget) > 0 ? (totalExpenses / parseFloat(trip.totalBudget) * 100) : 0;
  const daysUntil = Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/dashboard/trips" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <span className="text-sm" style={{ color: 'var(--color-text-light)' }}>Back to trips</span>
      </div>

      <div className="card overflow-hidden">
        <div className="h-48 bg-cover bg-center relative" style={{ backgroundImage: `url(${trip.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800'})` }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.2))' }} />
          <div className="absolute bottom-4 left-6 right-6">
            {editing ? (
              <input type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="input-field text-xl font-bold" />
            ) : (
              <h1 className="text-3xl font-bold text-white font-[family-name:var(--font-heading)]">{trip.name}</h1>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className={`badge ${STATUS_COLORS[trip.status] || 'badge-primary'}`}>{trip.status}</span>
              {daysUntil > 0 && <span className="text-white/80 text-sm">{daysUntil} days until departure</span>}
            </div>
          </div>
          {trip.owner.id === user?.id && (
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => editing ? handleUpdate() : setEditing(true)} className="btn-ghost bg-white/20 text-white border-0 text-xs">
                <Edit2 size={14} /> {editing ? 'Save' : 'Edit'}
              </button>
              <button onClick={handleDelete} className="btn-ghost bg-red-500/20 text-white border-0 text-xs"><Trash2 size={14} /></button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderColor: 'var(--color-shadow)' }}>
          <div className="p-4 text-center">
            <Calendar size={18} className="mx-auto mb-1" style={{ color: 'var(--color-primary)' }} />
            {editing ? (
              <div className="flex flex-col gap-1 mt-1 items-center">
                <input type="date" value={editData.startDate} onChange={e => setEditData({...editData, startDate: e.target.value})} className="input-field text-xs p-1 h-6 w-full max-w-[120px]" />
                <input type="date" value={editData.endDate} onChange={e => setEditData({...editData, endDate: e.target.value})} className="input-field text-xs p-1 h-6 w-full max-w-[120px]" />
              </div>
            ) : (
              <p className="font-bold text-sm">{new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-light)' }}>Dates</p>
          </div>
          
          <div className="p-4 text-center">
            <Users size={18} className="mx-auto mb-1" style={{ color: 'var(--color-primary)' }} />
            <p className="font-bold text-sm">{trip.members.length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>Members</p>
          </div>

          <div className="p-4 text-center">
            <Wallet size={18} className="mx-auto mb-1" style={{ color: 'var(--color-primary)' }} />
            {editing ? (
              <input type="number" value={editData.totalBudget} onChange={e => setEditData({...editData, totalBudget: e.target.value})} className="input-field text-xs p-1 h-6 w-20 mx-auto mt-1" />
            ) : (
              <p className="font-bold text-sm">${parseFloat(trip.totalBudget).toLocaleString()}</p>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-light)' }}>Budget</p>
          </div>

          <div className="p-4 text-center">
            <MapPin size={18} className="mx-auto mb-1" style={{ color: 'var(--color-primary)' }} />
            <p className="font-bold text-sm">{trip.itineraryDays.length}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>Days Planned</p>
          </div>
        </div>
      </div>

      {/* Budget Bar */}
      <div className="card p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Budget Usage</span>
          <span className={budgetUsed > 100 ? 'text-[var(--color-danger)] font-bold' : ''}>${totalExpenses.toFixed(0)} / ${parseFloat(trip.totalBudget).toLocaleString()}</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-shadow)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, budgetUsed)}%`, background: budgetUsed > 100 ? 'var(--color-danger)' : budgetUsed > 80 ? 'var(--color-secondary)' : 'var(--color-success)' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Itinerary - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold font-[family-name:var(--font-heading)]">Itinerary</h2>
          {trip.itineraryDays.length === 0 ? (
            <div className="card p-8 text-center"><p className="text-sm" style={{ color: 'var(--color-text-light)' }}>No itinerary planned yet</p></div>
          ) : (
            trip.itineraryDays.map(day => (
              <div key={day.id} className="card">
                <button onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)} className="w-full p-4 flex items-center justify-between text-left">
                  <div>
                    <span className="badge badge-primary mr-2">Day {day.dayNumber}</span>
                    <span className="font-bold text-sm">{day.destination.city}, {day.destination.country}</span>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-light)' }}>
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      {day.notes && ` · ${day.notes}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--color-text-light)' }}>{day.activities.length} activities</span>
                    {expandedDay === day.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {expandedDay === day.id && (
                  <div className="px-4 pb-4 space-y-2">
                    {day.activities.map(act => (
                      <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--color-bg-main)' }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'rgba(15,76,92,0.1)', color: 'var(--color-primary)' }}>
                          <Clock size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono" style={{ color: 'var(--color-text-light)' }}>{act.time}</span>
                            <span className="font-medium text-sm">{act.name}</span>
                            <span className="badge badge-primary text-[10px]">{act.category}</span>
                          </div>
                          {act.notes && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-light)' }}>{act.notes}</p>}
                        </div>
                        {parseFloat(act.cost) > 0 && (
                          <span className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>${parseFloat(act.cost).toFixed(0)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Members */}
          <div className="card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2"><Users size={16} /> Members</h3>
              {trip.owner.id === user?.id && (
                <button onClick={() => setShowAddMember(!showAddMember)} className="btn-ghost p-1">
                  {showAddMember ? <X size={16} /> : <UserPlus size={16} />}
                </button>
              )}
            </div>

            {showAddMember && (
              <div className="mb-4 p-3 rounded bg-gray-50 dark:bg-gray-800 space-y-2">
                <input type="email" placeholder="User email" className="input-field text-sm p-2 h-8" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} />
                <div className="flex gap-2">
                  <select className="input-field text-sm p-1 h-8 w-1/2" value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                    <option value="member">Member</option>
                    <option value="owner">Owner</option>
                  </select>
                  <input type="number" placeholder="Share %" className="input-field text-sm p-2 h-8 w-1/2" value={memberShare} onChange={e => setMemberShare(e.target.value)} min="0" max="100" />
                </div>
                {memberError && <p className="text-xs text-red-500">{memberError}</p>}
                <button onClick={handleAddMember} disabled={addingMember} className="btn-primary w-full h-8 text-xs">
                  {addingMember ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            )}

            <div className="space-y-2">
              {trip.members.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: ['#0F4C5C', '#F4A261', '#2A9D8F', '#E76F51'][i % 4], color: 'white' }}>
                    {m.user.name.charAt(0)}
                  </div>
                  {editingMemberId === m.user.id ? (
                    <div className="flex-1 flex gap-1 items-center">
                      <select className="input-field text-xs p-1 h-6 w-20" value={editMemberData.role} onChange={e => setEditMemberData({...editMemberData, role: e.target.value})}>
                        <option value="member">Member</option>
                        <option value="owner">Owner</option>
                      </select>
                      <input type="number" className="input-field text-xs p-1 h-6 w-16" value={editMemberData.costSharePct} onChange={e => setEditMemberData({...editMemberData, costSharePct: e.target.value})} />%
                      <button onClick={() => handleUpdateMember(m.user.id)} className="btn-ghost p-1 text-green-600 dark:text-green-400 font-bold text-xs">Save</button>
                      <button onClick={() => setEditingMemberId(null)} className="btn-ghost p-1 text-red-500"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium truncate">{m.user.name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--color-text-light)' }}>{m.role} · {m.costSharePct}%</p>
                      </div>
                      {trip.owner.id === user?.id && m.user.id !== user?.id && (
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingMemberId(m.user.id); setEditMemberData({ role: m.role, costSharePct: m.costSharePct.toString() }); }} className="btn-ghost p-1"><Edit2 size={12}/></button>
                          <button onClick={() => handleRemoveMember(m.user.id)} className="btn-ghost p-1 text-red-500"><Trash2 size={12}/></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bookings */}
          {trip.hotelBookings.length > 0 && (
            <div className="card p-4">
              <h3 className="font-bold text-sm mb-3">🏨 Hotel Bookings</h3>
              {trip.hotelBookings.map((b, i) => (
                <div key={i} className="text-sm mb-2 pb-2 border-b last:border-0" style={{ borderColor: 'var(--color-shadow)' }}>
                  <p className="font-medium">{b.hotel.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>{new Date(b.checkIn).toLocaleDateString()} – {new Date(b.checkOut).toLocaleDateString()}</p>
                  <p className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>${parseFloat(b.totalPrice).toFixed(0)}</p>
                </div>
              ))}
            </div>
          )}

          {trip.flightBookings.length > 0 && (
            <div className="card p-4">
              <h3 className="font-bold text-sm mb-3">✈️ Flight Bookings</h3>
              {trip.flightBookings.map((b, i) => (
                <div key={i} className="text-sm mb-2 pb-2 border-b last:border-0" style={{ borderColor: 'var(--color-shadow)' }}>
                  <p className="font-medium">{b.flight.airline} {b.flight.flightNumber}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>{b.flight.origin} → {b.flight.destination}</p>
                  <p className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>${parseFloat(b.pricePaid).toFixed(0)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Recent Expenses */}
          {trip.expenses.length > 0 && (
            <div className="card p-4">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Wallet size={16} /> Expenses ({trip.expenses.length})</h3>
              {trip.expenses.slice(0, 5).map(e => (
                <div key={e.id} className="flex justify-between text-sm mb-2">
                  <span className="truncate flex-1">{e.description}</span>
                  <span className="font-bold" style={{ color: 'var(--color-primary)' }}>${parseFloat(e.amount).toFixed(0)}</span>
                </div>
              ))}
              <p className="text-sm font-bold pt-2 border-t" style={{ borderColor: 'var(--color-shadow)' }}>
                Total: <span style={{ color: 'var(--color-primary)' }}>${totalExpenses.toFixed(2)}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
