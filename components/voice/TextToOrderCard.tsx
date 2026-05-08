'use client';

import { useState } from 'react';

interface TextToOrderCardProps {
  initialEnabled: boolean;
  onToggle: (enabled: boolean) => Promise<void>;
}

export function TextToOrderCard({ initialEnabled, onToggle }: TextToOrderCardProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState('');

  const handleToggle = async () => {
    const next = !enabled;
    setEnabled(next);
    setError('');
    try {
      await onToggle(next);
    } catch {
      setEnabled(!next);
      setError("Couldn't update. Try again.");
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-capy-border flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-capy-border flex-shrink-0">
        <div>
          <h2 className="card-heading text-base">Text to Order</h2>
          <p className="text-xs text-capy-muted mt-0.5">Allow customers to place orders via SMS</p>
        </div>
      </div>
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-capy-text">SMS Ordering</p>
          <p className="text-xs text-capy-muted mt-0.5">Customers text your number to browse the menu and order</p>
        </div>
        <button
          onClick={handleToggle}
          className={`relative block h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${enabled ? 'bg-capy-green' : 'bg-gray-200'}`}
          aria-label="Toggle text to order"
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
      <div className="px-5 pb-4">
        {error && <p className="text-red-500 text-xs mb-1">{error}</p>}
        <div className={`px-3 py-2 rounded-lg text-xs font-semibold ${enabled ? 'bg-capy-green-light text-capy-green-dark' : 'bg-gray-50 text-capy-muted'}`}>
          {enabled ? '● SMS ordering is active' : '○ SMS ordering is disabled'}
        </div>
      </div>
    </div>
  );
}
