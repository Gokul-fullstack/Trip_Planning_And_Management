import React from 'react';
import { Plane, Hotel, CreditCard, Calendar, Clock, MapPin, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function BookingPortal() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] p-4 md:p-8 font-[family-name:var(--font-body)]">
      <div className="max-w-6xl mx-auto space-y-6 slide-up">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--color-primary)] text-white p-6 rounded-2xl shadow-lg">
          <div>
            <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-heading)] font-bold">Checkout & Payment</h1>
            <p className="text-[var(--color-text-white)] opacity-80 mt-1">Review your trip details and complete your booking.</p>
          </div>
          <div className="flex items-center gap-2 bg-[var(--color-primary-dark)] px-4 py-2 rounded-lg">
            <ShieldCheck size={20} className="text-[var(--color-success)]" />
            <span className="text-sm font-medium">Secure Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Flight Details */}
            <div className="card p-6 border-l-4 border-[var(--color-secondary)]">
              <div className="flex justify-between items-start mb-6 border-b pb-4 border-[var(--color-shadow)]">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                    <Plane size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)] dark:text-[var(--color-dark-text)]">Flight Details</h2>
                    <p className="text-sm text-[var(--color-text-light)]">Outbound • Emirates Airlines (EK-402)</p>
                  </div>
                </div>
                <span className="badge badge-success">Confirmed</span>
              </div>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative">
                <div className="flex-1 w-full text-center md:text-left">
                  <p className="text-2xl font-bold text-[var(--color-text)] dark:text-[var(--color-dark-text)]">10:30 AM</p>
                  <p className="font-semibold mt-1">New York (JFK)</p>
                  <p className="text-sm text-[var(--color-text-light)] mt-1 flex items-center justify-center md:justify-start gap-1">
                    <Calendar size={14} /> Oct 15, 2026
                  </p>
                </div>
                
                <div className="flex-1 flex flex-col items-center w-full relative px-4">
                  <p className="text-xs text-[var(--color-text-light)] mb-2 flex items-center gap-1">
                    <Clock size={12} /> 7h 45m (Non-stop)
                  </p>
                  <div className="w-full h-[2px] bg-gray-200 dark:bg-gray-700 relative flex items-center justify-center">
                    <Plane size={16} className="text-[var(--color-primary)] absolute bg-white dark:bg-[var(--color-dark-card)] px-1" />
                  </div>
                </div>

                <div className="flex-1 w-full text-center md:text-right">
                  <p className="text-2xl font-bold text-[var(--color-text)] dark:text-[var(--color-dark-text)]">06:15 PM</p>
                  <p className="font-semibold mt-1">Paris (CDG)</p>
                  <p className="text-sm text-[var(--color-text-light)] mt-1 flex items-center justify-center md:justify-end gap-1">
                    <Calendar size={14} /> Oct 15, 2026
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--color-shadow)] flex flex-wrap gap-4 text-sm text-[var(--color-text-light)]">
                <div className="flex items-center gap-2"><span className="font-medium text-[var(--color-text)] dark:text-[var(--color-dark-text)]">Class:</span> Economy</div>
                <div className="flex items-center gap-2"><span className="font-medium text-[var(--color-text)] dark:text-[var(--color-dark-text)]">Baggage:</span> 2x 23kg</div>
                <div className="flex items-center gap-2"><span className="font-medium text-[var(--color-text)] dark:text-[var(--color-dark-text)]">Seat:</span> 12A</div>
              </div>
            </div>

            {/* Hotel Details */}
            <div className="card p-6 border-l-4 border-[var(--color-success)]">
              <div className="flex justify-between items-start mb-6 border-b pb-4 border-[var(--color-shadow)]">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <Hotel size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)] dark:text-[var(--color-dark-text)]">Hotel Accommodation</h2>
                    <p className="text-sm text-[var(--color-text-light)]">Le Meurice, Paris</p>
                  </div>
                </div>
                <div className="flex text-yellow-400">
                  {Array(5).fill(0).map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-[var(--color-text)] dark:text-[var(--color-dark-text)]">Deluxe Suite with City View</h3>
                  <p className="text-sm text-[var(--color-text-light)] flex items-start gap-1 mb-4">
                    <MapPin size={16} className="shrink-0 mt-0.5" /> 228 Rue de Rivoli, 75001 Paris, France
                  </p>
                  <ul className="text-sm text-[var(--color-text-light)] space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[var(--color-success)]" /> Breakfast included</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[var(--color-success)]" /> Free Wi-Fi</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[var(--color-success)]" /> Free cancellation before Oct 10</li>
                  </ul>
                </div>
                
                <div className="bg-[var(--color-bg-main)] dark:bg-[var(--color-dark-bg)] p-4 rounded-xl flex flex-col justify-center">
                  <div className="flex justify-between mb-4 border-b border-[var(--color-shadow)] pb-4">
                    <div>
                      <p className="text-xs text-[var(--color-text-light)]">Check-in</p>
                      <p className="font-bold text-[var(--color-text)] dark:text-[var(--color-dark-text)]">Oct 15, 2026</p>
                      <p className="text-xs">After 3:00 PM</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--color-text-light)]">Check-out</p>
                      <p className="font-bold text-[var(--color-text)] dark:text-[var(--color-dark-text)]">Oct 20, 2026</p>
                      <p className="text-xs">Before 11:00 AM</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-[var(--color-text-light)]"><span className="font-bold text-[var(--color-text)] dark:text-[var(--color-dark-text)]">5</span> Nights, <span className="font-bold text-[var(--color-text)] dark:text-[var(--color-dark-text)]">2</span> Guests</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Payment */}
          <div className="space-y-6">
            
            {/* Price Summary */}
            <div className="card p-6 bg-[var(--color-primary-dark)] text-white">
              <h2 className="text-lg font-bold font-[family-name:var(--font-heading)] mb-4 border-b border-white/10 pb-3">Price Summary</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Flight (2 Passengers)</span>
                  <span className="font-medium">$1,240.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Hotel (5 Nights)</span>
                  <span className="font-medium">$1,850.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Taxes & Fees</span>
                  <span className="font-medium">$324.50</span>
                </div>
                <div className="flex justify-between text-[var(--color-success)] pt-2">
                  <span>Discount Applied</span>
                  <span className="font-medium">-$150.00</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
                <span className="text-lg">Total</span>
                <span className="text-2xl font-bold">$3,264.50</span>
              </div>
            </div>

            {/* Payment Portal */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="text-[var(--color-primary)]" size={24} />
                <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-[var(--color-text)] dark:text-[var(--color-dark-text)]">Payment Method</h2>
              </div>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text)] dark:text-[var(--color-dark-text)]">Cardholder Name</label>
                  <input type="text" className="input-field" placeholder="John Doe" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-[var(--color-text)] dark:text-[var(--color-dark-text)]">Card Number</label>
                  <div className="relative">
                    <input type="text" className="input-field pl-10" placeholder="0000 0000 0000 0000" />
                    <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--color-text)] dark:text-[var(--color-dark-text)]">Expiry Date</label>
                    <input type="text" className="input-field" placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--color-text)] dark:text-[var(--color-dark-text)]">CVC</label>
                    <input type="text" className="input-field" placeholder="123" />
                  </div>
                </div>

                <div className="pt-4">
                  <button type="button" className="btn-primary w-full justify-center text-lg py-3 rounded-xl shadow-lg hover:shadow-xl group">
                    Pay $3,264.50 Securely 
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-xs text-center text-[var(--color-text-light)] mt-3 flex items-center justify-center gap-1">
                    <ShieldCheck size={14} /> Your payment information is encrypted and secure.
                  </p>
                </div>
              </form>
            </div>

            <div className="text-center">
              <Link href="/dashboard" className="text-sm font-medium text-[var(--color-text-light)] hover:text-[var(--color-primary)] transition-colors">
                Cancel and return to dashboard
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
