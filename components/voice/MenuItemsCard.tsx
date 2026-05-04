'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiFetch, RESTAURANT_ID } from '@/lib/api';

interface MenuItem {
  itemId: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
}

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative block h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${on ? 'bg-capy-green' : 'bg-gray-200'}`}
      aria-label={on ? 'Disable item' : 'Enable item'}
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

export function MenuItemsCard() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch<{ items: MenuItem[] }>(`/api/menu-items?restaurant_id=${RESTAURANT_ID}`)
      .then((data) => setItems(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (itemId: string, current: boolean) => {
    setItems((prev) => prev.map((i) => i.itemId === itemId ? { ...i, available: !current } : i));
    setSaving((s) => ({ ...s, [itemId]: true }));
    setErrors((e) => { const next = { ...e }; delete next[itemId]; return next; });

    try {
      await apiFetch(`/api/menu-items/${itemId}/availability?restaurant_id=${RESTAURANT_ID}`, {
        method: 'PUT',
        body: JSON.stringify({ available: !current }),
      });
    } catch {
      // Revert
      setItems((prev) => prev.map((i) => i.itemId === itemId ? { ...i, available: current } : i));
      setErrors((e) => ({ ...e, [itemId]: "Couldn't update. Try again." }));
      setTimeout(() => setErrors((e) => { const next = { ...e }; delete next[itemId]; return next; }), 4000);
    } finally {
      setSaving((s) => { const next = { ...s }; delete next[itemId]; return next; });
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [items, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of filtered) {
      const cat = item.category || 'Uncategorized';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return map;
  }, [filtered]);

  const availableCount = items.filter((i) => i.available).length;

  return (
    <div className="bg-white rounded-2xl border border-capy-border flex flex-col overflow-hidden h-full">
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-capy-border flex-shrink-0">
        <div>
          <h2 className="card-heading text-base">Menu Items</h2>
          <p className="text-xs text-capy-muted mt-0.5">Control which items customers can order via SMS</p>
        </div>
        {!loading && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${availableCount > 0 ? 'bg-capy-green-light text-capy-green-dark' : 'bg-gray-100 text-capy-muted'}`}>
            {availableCount} / {items.length} available
          </span>
        )}
      </div>

      <div className="px-5 pt-3 pb-2 border-b border-capy-border">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-capy-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-capy-border rounded-xl focus:outline-none focus:ring-2 focus:ring-capy-green text-capy-text placeholder:text-capy-muted"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-5 py-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="animate-pulse h-3.5 w-36 bg-gray-100 rounded" />
                  <div className="animate-pulse h-2.5 w-20 bg-gray-100 rounded" />
                </div>
                <div className="animate-pulse h-6 w-11 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-6 text-sm text-capy-muted text-center">
            {search ? 'No items match your search.' : 'No menu items found.'}
          </p>
        ) : (
          Array.from(grouped.entries()).map(([category, catItems]) => (
            <div key={category}>
              <div className="px-5 py-2 bg-gray-50 border-b border-capy-border">
                <span className="text-xs font-semibold text-capy-muted uppercase tracking-wide">{category}</span>
              </div>
              {catItems.map((item) => (
                <div key={item.itemId} className="flex items-center justify-between px-5 py-3 border-b border-capy-border last:border-b-0">
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="text-sm font-semibold text-capy-text truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-capy-muted">${item.price.toFixed(2)}</span>
                      {errors[item.itemId] && (
                        <span className="text-xs text-red-500">{errors[item.itemId]}</span>
                      )}
                    </div>
                  </div>
                  <Toggle
                    on={item.available}
                    onToggle={() => handleToggle(item.itemId, item.available)}
                    disabled={!!saving[item.itemId]}
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
