'use client';

import { useState } from 'react';

const API_BASE_URL = 'http://localhost:8000';

interface TaxExportCardProps {
  restaurantId: string;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfYear() {
  return `${new Date().getFullYear()}-01-01`;
}

export function TaxExportCard({ restaurantId }: TaxExportCardProps) {
  const [startDate, setStartDate] = useState(firstDayOfYear());
  const [endDate, setEndDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/api/analytics/tax-export?restaurant_id=${restaurantId}&start_date=${startDate}&end_date=${endDate}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `tax-report-${startDate}-to-${endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValid = startDate && endDate && startDate <= endDate;

  return (
    <div className="bg-white rounded-2xl border border-capy-border flex flex-col overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-capy-border">
        <h2 className="card-heading text-base">Tax &amp; Revenue Export</h2>
        <p className="text-xs text-capy-muted mt-0.5">
          Download a PDF report of all revenue for tax filings — broken down by TextToOrder and Voice AI.
        </p>
      </div>

      <div className="px-5 py-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-capy-muted mb-1">From</label>
            <input
              type="date"
              value={startDate}
              max={endDate || today()}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-capy-border rounded-xl px-3 py-2 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green font-mono"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-capy-muted mb-1">To</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={today()}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-capy-border rounded-xl px-3 py-2 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green font-mono"
            />
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs text-capy-muted">
          <p className="font-medium text-capy-text mb-1">Included in the report</p>
          <ul className="space-y-0.5">
            <li>• Gross revenue &amp; tax collected — by product (TextToOrder, Voice AI)</li>
            <li>• Order count per product</li>
            <li>• Per-item revenue breakdown</li>
            <li>• Combined totals</li>
          </ul>
        </div>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <button
          onClick={handleExport}
          disabled={!isValid || loading}
          className="flex items-center justify-center gap-2 bg-capy-green text-white text-sm font-bold px-4 py-2.5 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating PDF…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
