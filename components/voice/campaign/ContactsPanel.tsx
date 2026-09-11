"use client";

import { useEffect, useMemo, useState } from "react";
import { marketingApiFetch } from "@/lib/api";
import { getJoinSettings, type JoinOptinSettings } from "@/lib/settingsApi";
import { importConsentedRoster, type ImportConsentedResult, type RosterUploadResult } from "@/lib/rosterImportApi";
import { RosterUploadCard } from "@/components/voice/campaign/RosterUploadCard";
import { Skeleton } from "@/components/ui/Skeleton";

interface RosterCustomer {
  id: string;
  phone: string;
  name: string;
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : phone;
}

/**
 * Your text list: who can be targeted by campaigns, and the two ways to grow
 * it without sending anyone an opt-in text — the QR / web sign-up link, and
 * importing contacts who have already agreed to hear from you.
 */
export function ContactsPanel({ restaurantId }: { restaurantId: string }) {
  const [customers, setCustomers] = useState<RosterCustomer[] | null>(null);
  const [search, setSearch] = useState("");
  const [join, setJoin] = useState<JoinOptinSettings | null>(null);
  const [copied, setCopied] = useState(false);

  const [upload, setUpload] = useState<RosterUploadResult | null>(null);
  const [attested, setAttested] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportConsentedResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const loadCustomers = () => {
    marketingApiFetch<{ customers: RosterCustomer[] }>(
      `/api/marketing/opted-in-customers?restaurant_id=${restaurantId}`,
    )
      .then((d) => setCustomers(d.customers ?? []))
      .catch(() => setCustomers([]));
  };

  useEffect(() => {
    loadCustomers();
    getJoinSettings(restaurantId).then(setJoin).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !customers) return customers ?? [];
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")));
  }, [customers, search]);

  const copyJoin = async () => {
    if (!join?.join_url) return;
    try {
      await navigator.clipboard.writeText(join.join_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  };

  const handleImport = async () => {
    if (!upload || !attested) return;
    setImporting(true);
    setImportError(null);
    try {
      const r = await importConsentedRoster(restaurantId, upload.import_id);
      setImportResult(r);
      setUpload(null);
      setAttested(false);
      loadCustomers();
    } catch {
      setImportError("Couldn't import that file. Upload it again and retry.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Sign-up link */}
      <div className="app-card p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="card-heading">QR sign-up link</p>
            <p className="text-xs text-capy-muted mt-0.5">Customers scan, fill in a short form, and join with recorded consent.</p>
          </div>
          {join && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${join.join_optin_enabled ? "bg-capy-green-light text-capy-green-dark" : "bg-capy-surface-2 text-capy-muted"}`}>
              {join.join_optin_enabled ? "Live" : "Off"}
            </span>
          )}
        </div>
        {join?.join_url ? (
          <div className="flex items-center gap-2">
            <p className="flex-1 text-xs font-mono text-capy-text truncate bg-capy-surface border border-capy-border rounded-xl px-3 py-2">{join.join_url}</p>
            <button onClick={copyJoin} className="btn-secondary shrink-0 !py-2">{copied ? "Copied ✓" : "Copy"}</button>
          </div>
        ) : (
          <p className="text-xs text-capy-muted">Set a link name in Settings (gear icon, top right) to turn this on.</p>
        )}
      </div>

      {/* Import already-consented contacts */}
      <div className="app-card p-4 space-y-3">
        <div>
          <p className="card-heading">Import contacts</p>
          <p className="text-xs text-capy-muted mt-0.5">
            Upload a spreadsheet of people who have <span className="font-semibold text-capy-text">already agreed</span> to
            receive your texts — a loyalty list, a sign-up sheet. No message is sent; they simply become eligible for campaigns.
          </p>
        </div>
        <RosterUploadCard restaurantId={restaurantId} result={upload} onResult={(r) => { setUpload(r); setImportResult(null); }} />
        {upload && upload.new > 0 && (
          <div className="space-y-2">
            <label className="flex items-start gap-2 text-xs text-capy-text cursor-pointer">
              <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 accent-capy-green" />
              <span>
                I confirm every contact in this file has already agreed to receive marketing texts from us, and I have a record of that consent.
              </span>
            </label>
            <button onClick={handleImport} disabled={!attested || importing} className="btn-primary w-full">
              {importing ? "Adding…" : `Add ${upload.new} contact${upload.new === 1 ? "" : "s"} to my list`}
            </button>
          </div>
        )}
        {importError && <p className="text-xs text-red-600 dark:text-red-300">{importError}</p>}
        {importResult && (
          <div className="bg-capy-green-light text-capy-green-dark text-xs px-3 py-2 rounded-xl">
            Added {importResult.added}. {importResult.already_on_list > 0 && `${importResult.already_on_list} already on your list. `}
            {importResult.skipped_opted_out > 0 && `${importResult.skipped_opted_out} skipped (they opted out). `}
          </div>
        )}
      </div>

      {/* The list */}
      <div className="app-card overflow-hidden">
        <div className="px-4 py-3 border-b border-capy-border flex items-center justify-between gap-3">
          <div>
            <p className="card-heading">Your text list</p>
            <p className="text-xs text-capy-muted mt-0.5">{customers ? `${customers.length} opted in` : "Loading…"}</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-36 sm:w-44 px-3 py-1.5 bg-capy-surface border border-capy-border rounded-xl text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
          />
        </div>
        <div className="max-h-[45vh] overflow-y-auto">
          {customers === null ? (
            <div className="p-4 space-y-3"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-3/5" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-capy-muted text-center py-8">{search ? "No matches." : "No one on your list yet — share your sign-up link or import contacts above."}</p>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-capy-border/60 last:border-0">
                <div className="w-8 h-8 rounded-full bg-capy-surface-2 flex items-center justify-center text-xs font-bold text-capy-muted shrink-0">
                  {(c.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-capy-text truncate">{c.name}</p>
                  <p className="text-xs text-capy-muted font-mono">{formatPhone(c.phone)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
