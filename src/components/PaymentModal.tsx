import { useState } from 'react';
import { CreditCard, CheckCircle, X } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, amount, itemType }: { isOpen: boolean, onClose: () => void, amount: string, itemType: string }) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  if (!isOpen) return null;

  const handlePay = () => {
    setStatus('processing');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] w-full max-w-md rounded-2xl p-6 shadow-xl relative slide-up" style={{ backgroundColor: 'var(--color-surface, white)' }}>
        <button onClick={onClose} className="absolute right-4 top-4 text-[var(--color-text-light)] hover:text-[var(--color-text)]">
          <X size={20} />
        </button>
        
        {status === 'success' ? (
          <div className="flex flex-col items-center py-8 text-center space-y-4">
            <CheckCircle size={64} className="text-green-500" />
            <h2 className="text-2xl font-bold">Payment Successful!</h2>
            <p className="text-[var(--color-text-light)]">Your {itemType} has been booked.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold font-[family-name:var(--font-heading)]">Complete Booking</h2>
              <p className="text-sm text-[var(--color-text-light)]">Enter your payment details to book this {itemType}.</p>
            </div>
            
            <div className="p-4 rounded-xl bg-[rgba(15,76,92,0.05)] border border-[var(--color-shadow)] flex justify-between items-center">
              <span className="font-semibold">Total Amount</span>
              <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>${amount}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-light)' }}>Card Number</label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-light)' }} />
                  <input type="text" placeholder="0000 0000 0000 0000" className="input-field pl-10 w-full" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-light)' }}>Expiry Date</label>
                  <input type="text" placeholder="MM/YY" className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-light)' }}>CVC</label>
                  <input type="text" placeholder="123" className="input-field w-full" />
                </div>
              </div>
            </div>

            <button 
              onClick={handlePay}
              disabled={status === 'processing'}
              className="btn-primary w-full py-3 flex justify-center items-center rounded-lg"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              {status === 'processing' ? (
                <div className="w-5 h-5 border-2 rounded-full animate-spin border-[var(--color-shadow)] border-t-white" />
              ) : (
                `Pay $${amount}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
