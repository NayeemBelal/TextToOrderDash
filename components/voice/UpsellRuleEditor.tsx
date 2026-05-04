"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { apiFetch, RESTAURANT_ID, type UpsellRule } from "@/lib/api";

interface MenuItemDropdownProps {
  value: string;
  onChange: (val: string) => void;
  menuItems: string[];
  placeholder?: string;
  disabled?: boolean;
}

function MenuItemDropdown({ value, onChange, menuItems, placeholder = "Select an item…", disabled }: MenuItemDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) { setOpen(false); setQuery(""); }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openDropdown = () => {
    if (disabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({ position: "fixed", top: rect.bottom + 2, left: rect.left, width: rect.width, zIndex: 9999 });
    }
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const filtered = menuItems.filter((item) => item.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div
        ref={triggerRef}
        onClick={openDropdown}
        className={`mt-1 w-full flex items-center justify-between px-4 py-2.5 border border-capy-border rounded-lg bg-white hover:border-capy-text transition-colors text-sm ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {open ? (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={value || placeholder}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 outline-none text-capy-text bg-transparent text-sm placeholder-capy-muted"
          />
        ) : (
          <span className={value ? "text-capy-text font-semibold" : "text-capy-muted"}>{value || placeholder}</span>
        )}
        <svg className={`w-4 h-4 text-capy-muted transition-transform flex-shrink-0 ml-2 ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && typeof window !== "undefined" && createPortal(
        <div ref={dropdownRef} style={dropdownStyle} className="bg-white border border-capy-border shadow-lg rounded-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div>
              <p className="px-4 py-2 text-sm text-capy-muted">No matches. Use as typed:</p>
              <div
                onClick={() => { onChange(query); setOpen(false); setQuery(""); }}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-capy-bg"
              >
                <p className="text-sm text-capy-text">&ldquo;{query}&rdquo;</p>
              </div>
            </div>
          ) : filtered.map((item) => {
            const isSelected = value === item;
            return (
              <div
                key={item}
                onClick={() => { onChange(item); setOpen(false); setQuery(""); }}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isSelected ? "bg-capy-green-light" : "hover:bg-capy-bg"}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${isSelected ? "bg-capy-green border-capy-green" : "border-capy-muted"}`} />
                <p className={`text-sm ${isSelected ? "font-semibold text-capy-text" : "text-capy-text"}`}>{item}</p>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

export function UpsellRuleEditor() {
  const [rules, setRules] = useState<UpsellRule[]>([]);
  const [menuItems, setMenuItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<UpsellRule | null>(null);
  const [draft, setDraft] = useState({ triggerItemName: "", suggestedItemName: "", message: "", active: true });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [toggleError, setToggleError] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      apiFetch<{ upsells: UpsellRule[] }>(`/api/upsells?restaurant_id=${RESTAURANT_ID}`),
      apiFetch<{ items: { name: string }[] }>(`/api/configure/menu-items?restaurant_id=${RESTAURANT_ID}`).catch(() => ({ items: [] })),
    ]).then(([upsellData, menuData]) => {
      setRules(upsellData.upsells);
      setMenuItems((menuData.items ?? []).map((i: { name: string }) => i.name));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditingRule(null);
    setDraft({ triggerItemName: "", suggestedItemName: "", message: "", active: true });
    setSaveError('');
    setShowModal(true);
  };

  const openEdit = (rule: UpsellRule) => {
    setEditingRule(rule);
    setDraft({ triggerItemName: rule.triggerItemName, suggestedItemName: rule.suggestedItemName, message: rule.message, active: rule.active });
    setSaveError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!draft.triggerItemName.trim() || !draft.suggestedItemName.trim()) return;
    setIsSaving(true);
    setSaveError('');
    try {
      if (editingRule) {
        const updated = await apiFetch<UpsellRule>(
          `/api/upsells/${editingRule.id}?restaurant_id=${RESTAURANT_ID}`,
          { method: 'PATCH', body: JSON.stringify({ triggerItemName: draft.triggerItemName, suggestedItemName: draft.suggestedItemName, message: draft.message }) }
        );
        setRules((prev) => prev.map((r) => (r.id === editingRule.id ? updated : r)));
      } else {
        const created = await apiFetch<UpsellRule>(`/api/upsells`, {
          method: 'POST',
          body: JSON.stringify({ restaurant_id: RESTAURANT_ID, ...draft }),
        });
        setRules((prev) => [...prev, created]);
      }
      setShowModal(false);
    } catch {
      setSaveError("Couldn't save. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const prev = rules;
    setRules((r) => r.filter((x) => x.id !== id));
    try {
      await apiFetch(`/api/upsells/${id}?restaurant_id=${RESTAURANT_ID}`, { method: 'DELETE' });
    } catch {
      setRules(prev);
    }
  };

  const toggleActive = async (rule: UpsellRule) => {
    const next = !rule.active;
    setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, active: next } : r)));
    try {
      await apiFetch(`/api/upsells/${rule.id}?restaurant_id=${RESTAURANT_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: next }),
      });
      setToggleError((e) => { const n = { ...e }; delete n[rule.id]; return n; });
    } catch {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, active: rule.active } : r)));
      setToggleError((e) => ({ ...e, [rule.id]: "Couldn't update. Try again." }));
      setTimeout(() => setToggleError((e) => { const n = { ...e }; delete n[rule.id]; return n; }), 4000);
    }
  };

  const filtered = rules.filter(
    (r) =>
      r.triggerItemName.toLowerCase().includes(search.toLowerCase()) ||
      r.suggestedItemName.toLowerCase().includes(search.toLowerCase()) ||
      r.message.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-capy-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search upsell rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-capy-border rounded-xl focus:outline-none focus:ring-2 focus:ring-capy-green text-capy-text placeholder-capy-muted bg-white"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-capy-green text-white text-sm font-medium rounded-xl hover:bg-capy-green-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Rule
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 flex flex-col items-center gap-3 text-capy-muted">
          <p className="text-sm font-semibold text-capy-text">
            {search ? 'No upsell rules found.' : 'No upsell rules yet'}
          </p>
          {!search && (
            <>
              <p className="text-xs max-w-xs">Create rules to suggest add-ons at the right moment — &ldquo;Would you like to add a cookie?&rdquo; triggers after any drink order.</p>
              <button onClick={openAdd} className="mt-1 px-4 py-2 bg-capy-green text-white text-sm font-medium rounded-xl hover:bg-capy-green-dark">
                Add your first upsell rule
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rule) => (
            <div key={rule.id} className={`bg-white rounded-2xl border border-capy-border p-5 transition-opacity ${rule.active ? "opacity-100" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="inline-flex items-center px-3 py-1 bg-capy-bg border border-capy-border rounded-full text-sm font-semibold text-capy-text">
                      {rule.triggerItemName}
                    </span>
                    <svg className="w-5 h-5 text-capy-tan flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="inline-flex items-center px-3 py-1 bg-capy-green-light border border-capy-green/20 rounded-full text-sm font-semibold text-capy-green-dark">
                      {rule.suggestedItemName}
                    </span>
                  </div>
                  {rule.message && <p className="text-xs text-capy-muted mt-1 line-clamp-2">{rule.message}</p>}
                  {toggleError[rule.id] && <p className="text-red-500 text-xs mt-1">{toggleError[rule.id]}</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(rule)}
                    role="switch"
                    aria-checked={rule.active}
                    className={`relative block h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${rule.active ? "bg-capy-green" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${rule.active ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                  <button onClick={() => openEdit(rule)} className="text-xs text-capy-brown hover:text-capy-text font-medium transition-colors">Edit</button>
                  <button onClick={() => handleDelete(rule.id)} className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-capy-text mb-5">{editingRule ? "Edit Upsell Rule" : "New Upsell Rule"}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-capy-muted uppercase tracking-wide">When customer orders...</label>
                <MenuItemDropdown
                  value={draft.triggerItemName}
                  onChange={(val) => setDraft({ ...draft, triggerItemName: val })}
                  menuItems={menuItems}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-capy-muted uppercase tracking-wide">Suggest this item</label>
                <MenuItemDropdown
                  value={draft.suggestedItemName}
                  onChange={(val) => setDraft({ ...draft, suggestedItemName: val })}
                  menuItems={menuItems}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-capy-muted uppercase tracking-wide">AI message (optional)</label>
                <textarea
                  className="mt-1 w-full border border-capy-border rounded-xl px-3 py-2.5 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green resize-none"
                  rows={2}
                  placeholder='e.g. "Would you like to add fries with that?"'
                  value={draft.message}
                  onChange={(e) => setDraft({ ...draft, message: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              {saveError && <p className="text-red-500 text-xs">{saveError}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} disabled={isSaving} className="flex-1 py-2.5 border border-capy-border rounded-xl text-sm text-capy-muted hover:text-capy-text">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !draft.triggerItemName.trim() || !draft.suggestedItemName.trim()}
                className="flex-1 py-2.5 bg-capy-green text-white rounded-xl text-sm font-medium hover:bg-capy-green-dark disabled:opacity-60 transition-colors"
              >
                {isSaving ? 'Saving…' : editingRule ? "Save Changes" : "Add Rule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
