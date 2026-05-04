'use client';

import { useState, useEffect } from 'react';
import { apiFetch, RESTAURANT_ID, type FAQ } from '@/lib/api';

export function FAQEditor() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [draft, setDraft] = useState({ question: '', answer: '', category: 'General' });
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ faqs: FAQ[] }>(`/api/faqs?restaurant_id=${RESTAURANT_ID}`)
      .then((d) => { setFaqs(d.faqs); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()),
  );

  const openAdd = () => {
    setEditingFaq(null);
    setDraft({ question: '', answer: '', category: 'General' });
    setSaveError('');
    setShowPanel(true);
  };

  const openEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setDraft({ question: faq.question, answer: faq.answer, category: faq.category });
    setSaveError('');
    setShowPanel(true);
  };

  const handleSave = async () => {
    if (!draft.question.trim() || !draft.answer.trim()) return;
    setIsSaving(true);
    setSaveError('');
    try {
      if (editingFaq) {
        const updated = await apiFetch<FAQ>(
          `/api/faqs/${editingFaq.id}?restaurant_id=${RESTAURANT_ID}`,
          { method: 'PATCH', body: JSON.stringify({ question: draft.question, answer: draft.answer, category: draft.category }) }
        );
        setFaqs((prev) => prev.map((f) => (f.id === editingFaq.id ? updated : f)));
      } else {
        const created = await apiFetch<FAQ>(`/api/faqs`, {
          method: 'POST',
          body: JSON.stringify({ restaurant_id: RESTAURANT_ID, ...draft }),
        });
        setFaqs((prev) => [...prev, created]);
      }
      setShowPanel(false);
    } catch {
      setSaveError("Couldn't save. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const prev = faqs;
    setFaqs((f) => f.filter((x) => x.id !== id));
    setDeletingId(id);
    try {
      await apiFetch(`/api/faqs/${id}?restaurant_id=${RESTAURANT_ID}`, { method: 'DELETE' });
    } catch {
      setFaqs(prev);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-capy-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-capy-border rounded-xl focus:outline-none focus:ring-2 focus:ring-capy-green text-capy-text placeholder-capy-muted bg-white"
          />
        </div>
        <button
          onClick={openAdd}
          disabled={showPanel}
          className="flex items-center gap-2 px-4 py-2 bg-capy-green text-white text-sm font-medium rounded-xl hover:bg-capy-green-dark transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add FAQ
        </button>
      </div>

      {filtered.length === 0 && !showPanel ? (
        <div className="text-center py-12 flex flex-col items-center gap-3 text-capy-muted">
          <svg className="w-8 h-8 text-capy-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-sm font-semibold text-capy-text">No FAQs yet</p>
          <p className="text-xs max-w-xs">Add common questions your customers ask — hours, parking, allergens — so your AI can answer them instantly.</p>
          <button onClick={openAdd} className="mt-1 px-4 py-2 bg-capy-green text-white text-sm font-medium rounded-xl hover:bg-capy-green-dark">
            Add your first FAQ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((faq) => (
            <div
              key={faq.id}
              className={`bg-white rounded-2xl border border-capy-border p-5 hover:shadow-sm transition-all ${deletingId === faq.id ? 'opacity-0 duration-200' : ''}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-semibold text-capy-text text-sm leading-snug flex-1">{faq.question}</p>
                <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-capy-bg text-capy-muted border border-capy-border">
                  {faq.category}
                </span>
              </div>
              <p className="text-sm text-capy-muted leading-relaxed line-clamp-3">{faq.answer}</p>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-capy-border">
                <button onClick={() => openEdit(faq)} className="flex items-center gap-1 text-xs text-capy-brown hover:text-capy-text font-medium transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button onClick={() => handleDelete(faq.id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPanel && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setShowPanel(false)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-capy-border">
              <h3 className="font-bold text-capy-text">{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</h3>
              <button onClick={() => setShowPanel(false)} className="text-capy-muted hover:text-capy-text">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-capy-muted uppercase tracking-wide">Question</label>
                <input
                  className="mt-1 w-full border border-capy-border rounded-xl px-3 py-2.5 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                  placeholder="e.g. What are your hours?"
                  value={draft.question}
                  onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-capy-muted uppercase tracking-wide">Answer</label>
                <textarea
                  className="mt-1 w-full border border-capy-border rounded-xl px-3 py-2.5 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green resize-none"
                  rows={5}
                  placeholder="Write a clear, helpful answer..."
                  value={draft.answer}
                  onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-capy-muted uppercase tracking-wide">Category</label>
                <select
                  className="mt-1 w-full border border-capy-border rounded-xl px-3 py-2.5 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green bg-white"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  disabled={isSaving}
                >
                  {['General', 'Menu', 'Ordering', 'Reservations', 'Payment', 'Catering'].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              {saveError && <p className="text-red-500 text-xs">{saveError}</p>}
            </div>
            <div className="px-6 py-4 border-t border-capy-border flex gap-3">
              <button onClick={() => setShowPanel(false)} className="flex-1 py-2 border border-capy-border rounded-xl text-sm text-capy-muted hover:text-capy-text transition-colors" disabled={isSaving}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !draft.question.trim() || !draft.answer.trim()}
                className="flex-1 py-2 bg-capy-green text-white rounded-xl text-sm font-medium hover:bg-capy-green-dark transition-colors disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : editingFaq ? 'Save Changes' : 'Add FAQ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
