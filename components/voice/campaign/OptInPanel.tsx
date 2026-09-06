"use client";

import { useEffect, useState } from "react";
import { marketingApiFetch } from "@/lib/api";
import { countSegments } from "@/lib/smsSegments";
import { getOptinConfig } from "@/lib/optinConfigApi";
import { sendTestOptin } from "@/lib/testSendApi";
import { Skeleton } from "@/components/ui/Skeleton";
import { RosterUploadCard } from "@/components/voice/campaign/RosterUploadCard";
import type { RosterUploadResult } from "@/lib/rosterImportApi";

interface OptinStatus {
  opted_in: number;
  pending: number;
  opted_out: number;
  last_scan_at: string | null;
  blast_sent: number;
  blast_opted_in: number;
  blast_pending: number;
  blast_opted_out: number;
}

interface RosterCustomer {
  id: string;
  phone: string;
  name: string;
}

function from24h(t: string | null | undefined): { hour: string; minute: string; ampm: string } {
  if (!t) return { hour: "11", minute: "00", ampm: "PM" };
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour: String(hour12), minute: String(m).padStart(2, "0"), ampm };
}

function to24h(hour: string, minute: string, ampm: string): string {
  let h = parseInt(hour, 10) % 12;
  if (ampm === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

function RosterRowSkeletons() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-capy-border/60 last:border-0">
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Opt-in status: the progress bar/funnel + scan/send/config controls that
 * used to live inline on the campaign wizard, plus the full opted-in
 * customer list — this is restaurant-wide (not campaign-specific), so it
 * lives on the Campaigns list page, opened from a button into a panel.
 */
export function OptInPanel({ restaurantId }: { restaurantId: string }) {
  const [optinStatus, setOptinStatus] = useState<OptinStatus | null>(null);
  const [scanResult, setScanResult] = useState<{ new_customers: number } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [blastLoading, setBlastLoading] = useState(false);
  const [blastToast, setBlastToast] = useState<string | null>(null);
  const [optinRefreshing, setOptinRefreshing] = useState(false);

  const [optinConfigOpen, setOptinConfigOpen] = useState(false);
  const [optinMessage, setOptinMessage] = useState("");
  const [optinDiscount, setOptinDiscount] = useState(10);
  const [optinRestaurantName, setOptinRestaurantName] = useState("");
  const [optinExpiryDays, setOptinExpiryDays] = useState(1);
  const [optinExpiryHour, setOptinExpiryHour] = useState("11");
  const [optinExpiryMinute, setOptinExpiryMinute] = useState("00");
  const [optinExpiryAmPm, setOptinExpiryAmPm] = useState("PM");

  const [optinTestPhone, setOptinTestPhone] = useState("");
  const [optinTestSending, setOptinTestSending] = useState(false);
  const [optinTestStatus, setOptinTestStatus] = useState<string | null>(null);
  const [optinTestClover, setOptinTestClover] = useState(false);

  const [optedInCustomers, setOptedInCustomers] = useState<RosterCustomer[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);

  // Where this blast's contacts come from. "clover" scans the POS; "upload"
  // takes a spreadsheet, which is the only route for a merchant who isn't on
  // Clover. Both feed the same Send button below.
  const [source, setSource] = useState<"clover" | "upload">("clover");
  const [rosterUpload, setRosterUpload] = useState<RosterUploadResult | null>(null);

  const refreshOptinStatus = (id: string) => {
    setOptinRefreshing(true);
    marketingApiFetch<OptinStatus>(`/api/marketing/optin-status?restaurant_id=${id}`)
      .then((d) => setOptinStatus(d))
      .catch(() => {})
      .finally(() => setOptinRefreshing(false));
  };

  useEffect(() => {
    refreshOptinStatus(restaurantId);

    getOptinConfig(restaurantId)
      .then((c) => {
        setOptinMessage(c.message ?? "");
        setOptinDiscount(c.discount_percent ?? 10);
        setOptinRestaurantName(c.restaurant_name ?? "");
        if (c.expiry_days) setOptinExpiryDays(c.expiry_days);
        const t = from24h(c.expiry_time);
        setOptinExpiryHour(t.hour);
        setOptinExpiryMinute(t.minute);
        setOptinExpiryAmPm(t.ampm);
      })
      .catch(() => {});

    setRosterLoading(true);
    marketingApiFetch<{ customers: RosterCustomer[] }>(
      `/api/marketing/opted-in-customers?restaurant_id=${restaurantId}`,
    )
      .then((d) => setOptedInCustomers(d.customers ?? []))
      .catch(() => setOptedInCustomers([]))
      .finally(() => setRosterLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const handleScanClover = async () => {
    setScanLoading(true);
    setScanResult(null);
    setScanError(null);
    try {
      const data = await marketingApiFetch<{ new_customers?: number }>("/api/marketing/scan-clover", {
        method: "POST",
        body: JSON.stringify({ restaurant_id: restaurantId }),
      });
      setScanResult({ new_customers: data.new_customers ?? 0 });
    } catch {
      setScanError("Scan failed. Check the Clover connection and try again.");
    } finally {
      setScanLoading(false);
    }
  };

  const handleSendBlast = async () => {
    if (newCustomers === 0) return;
    setBlastLoading(true);
    try {
      const data = await marketingApiFetch<{ queued?: number }>("/api/marketing/send-optin-blast", {
        method: "POST",
        body: JSON.stringify({
          restaurant_id: restaurantId,
          // Present ⇒ blast the staged spreadsheet instead of the Clover roster.
          import_id: source === "upload" ? rosterUpload?.import_id : undefined,
          message: optinMessage,
          discount_percent: optinDiscount,
          expiry_days: optinExpiryDays,
          expiry_time: to24h(optinExpiryHour, optinExpiryMinute, optinExpiryAmPm),
        }),
      });
      const queued = data.queued ?? 0;
      setBlastToast(`Queued ${queued} customer${queued !== 1 ? "s" : ""} — texts are sending now.`);
      setScanResult(null);
      // An upload is single-use on the backend; clearing it keeps the button
      // from offering a send that would now 409.
      setRosterUpload(null);
      refreshOptinStatus(restaurantId);
      setTimeout(() => setBlastToast(null), 4000);
    } catch {
      setBlastToast("Something went wrong. Please try again.");
      setTimeout(() => setBlastToast(null), 4000);
    } finally {
      setBlastLoading(false);
    }
  };

  const handleSendTestOptin = async () => {
    if (!optinTestPhone.trim()) return;
    setOptinTestSending(true);
    setOptinTestStatus(null);
    try {
      await sendTestOptin({
        restaurantId,
        phone: optinTestPhone,
        message: optinMessage,
        discountPercent: optinDiscount,
        expiryDays: optinExpiryDays,
        expiryTime: to24h(optinExpiryHour, optinExpiryMinute, optinExpiryAmPm),
        createCloverCoupon: optinTestClover,
      });
      setOptinTestStatus("Sent! Check your phone — reply YES to get the coupon.");
    } catch {
      setOptinTestStatus("Test failed. Check the number and try again.");
    } finally {
      setOptinTestSending(false);
    }
  };

  const hasBlasted = (optinStatus?.blast_sent ?? 0) > 0;
  const conversion =
    optinStatus && optinStatus.blast_sent > 0
      ? Math.round((optinStatus.blast_opted_in / optinStatus.blast_sent) * 100)
      : 0;
  // How many people the Send button would actually text, whichever source
  // the owner picked.
  const newCustomers =
    source === "upload" ? rosterUpload?.new ?? 0 : scanResult?.new_customers ?? 0;

  const renderedOptinMessage = optinMessage
    .replace(/\{restaurant_name\}/g, optinRestaurantName)
    .replace(/\{discount\}/g, String(optinDiscount));
  const seg = countSegments(renderedOptinMessage);

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4 space-y-3">
        {hasBlasted && optinStatus ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="card-heading text-sm">Opt-In Progress</p>
                <p className="text-xs text-capy-muted mt-0.5">How your opt-in blast is converting</p>
              </div>
              <button
                onClick={() => refreshOptinStatus(restaurantId)}
                disabled={optinRefreshing}
                title="Refresh"
                className="p-1.5 rounded-lg text-capy-muted hover:text-capy-text hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <svg className={`w-4 h-4 ${optinRefreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="section-label">Sent</p>
                <p className="text-2xl font-bold text-capy-text mt-0.5" style={{ fontFamily: "Tektur, sans-serif" }}>
                  {optinStatus.blast_sent.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="section-label">Opted In</p>
                <p className="text-2xl font-bold text-capy-green-dark mt-0.5" style={{ fontFamily: "Tektur, sans-serif" }}>
                  {optinStatus.blast_opted_in.toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-capy-green rounded-full transition-all" style={{ width: `${conversion}%` }} />
              </div>
              <p className="text-xs text-capy-muted mt-1">{conversion}% opted in</p>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-capy-green" />
                <span className="font-semibold text-capy-text">{optinStatus.blast_opted_in}</span>
                <span className="text-capy-muted">opted in</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-semibold text-capy-text">{optinStatus.blast_pending}</span>
                <span className="text-capy-muted">awaiting reply</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="font-semibold text-capy-text">{optinStatus.blast_opted_out}</span>
                <span className="text-capy-muted">declined</span>
              </span>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="card-heading text-sm">Opt-In Your Customer List</p>
              <p className="text-xs text-capy-muted mt-0.5">Send a compliant opt-in invite to your Clover contacts</p>
            </div>
            {optinStatus && (
              <div className="flex gap-3 text-xs text-right">
                <div>
                  <p className="font-semibold text-capy-green-dark">{optinStatus.opted_in}</p>
                  <p className="text-capy-muted">opted in</p>
                </div>
                <div>
                  <p className="font-semibold text-amber-600">{optinStatus.pending}</p>
                  <p className="text-capy-muted">pending</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-400">{optinStatus.opted_out}</p>
                  <p className="text-capy-muted">opted out</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-1.5">
          {(["clover", "upload"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                source === s
                  ? "bg-capy-green text-white"
                  : "border border-capy-border text-capy-muted hover:border-capy-green hover:text-capy-green-dark"
              }`}
            >
              {s === "clover" ? "From Clover" : "From a spreadsheet"}
            </button>
          ))}
        </div>

        {source === "upload" && (
          <RosterUploadCard
            restaurantId={restaurantId}
            result={rosterUpload}
            onResult={setRosterUpload}
          />
        )}

        {source === "clover" && optinStatus?.last_scan_at && !scanResult && (
          <p className="text-xs text-capy-muted">
            Last scan: {new Date(optinStatus.last_scan_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        )}
        {source === "clover" && scanError && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <span className="font-semibold">!</span>
            <span>{scanError}</span>
          </div>
        )}
        {source === "clover" && scanResult !== null && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-capy-green-dark font-semibold">✓</span>
            {newCustomers > 0 ? (
              <span className="text-capy-text">{newCustomers} new customer{newCustomers !== 1 ? "s" : ""} ready to receive opt-in</span>
            ) : (
              <span className="text-capy-muted">All Clover customers have already been contacted</span>
            )}
          </div>
        )}
        {blastToast && (
          <div className="bg-capy-green-light text-capy-green-dark text-xs font-semibold px-3 py-2 rounded-xl">{blastToast}</div>
        )}

        <div className="border-t border-capy-border pt-3">
          <button
            onClick={() => setOptinConfigOpen((o) => !o)}
            className="flex items-center justify-between w-full text-xs font-semibold text-capy-text"
          >
            <span>⚙ Configure message &amp; offer</span>
            <svg className={`w-3.5 h-3.5 text-capy-muted transition-transform ${optinConfigOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {optinConfigOpen && (
            <div className="space-y-3 mt-3">
              <div>
                <p className="section-label mb-1">Opt-in message</p>
                <textarea
                  value={optinMessage}
                  onChange={(e) => setOptinMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-capy-border rounded-xl px-3 py-2 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green resize-none"
                />
                <div className="flex items-center justify-between text-[11px] text-capy-muted mt-1">
                  <span>{seg.chars} char{seg.chars !== 1 ? "s" : ""} · {seg.segments} SMS segment{seg.segments !== 1 ? "s" : ""} · {seg.encoding}</span>
                  <span className="font-mono">{"{discount}"} {"{restaurant_name}"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="section-label">Discount</p>
                <div className="relative w-24">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={optinDiscount}
                    onChange={(e) => setOptinDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-capy-text text-xs focus:outline-none focus:ring-2 focus:ring-capy-green pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-capy-muted text-xs">%</span>
                </div>
              </div>

              <div>
                <p className="section-label mb-1">Coupon expires</p>
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-capy-text">
                  <select
                    value={optinExpiryDays}
                    onChange={(e) => setOptinExpiryDays(Number(e.target.value))}
                    className="bg-white border border-capy-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-capy-green"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span className="text-capy-muted">day{optinExpiryDays !== 1 ? "s" : ""} after opt-in, at</span>
                  <select
                    value={optinExpiryHour}
                    onChange={(e) => setOptinExpiryHour(e.target.value)}
                    className="bg-white border border-capy-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-capy-green"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={String(h)}>{h}</option>
                    ))}
                  </select>
                  <span className="text-capy-muted">:</span>
                  <select
                    value={optinExpiryMinute}
                    onChange={(e) => setOptinExpiryMinute(e.target.value)}
                    className="bg-white border border-capy-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-capy-green"
                  >
                    {["00", "15", "30", "45"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={optinExpiryAmPm}
                    onChange={(e) => setOptinExpiryAmPm(e.target.value)}
                    className="bg-white border border-capy-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-capy-green"
                  >
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-capy-border pt-3 space-y-2">
                <p className="section-label">Send a test text</p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={optinTestPhone}
                    onChange={(e) => setOptinTestPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                  />
                  <button
                    onClick={handleSendTestOptin}
                    disabled={optinTestSending || !optinTestPhone.trim()}
                    className="px-4 py-2 rounded-xl bg-capy-text text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
                  >
                    {optinTestSending ? "Sending…" : "Send test"}
                  </button>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-capy-text">
                  <input
                    type="checkbox"
                    checked={optinTestClover}
                    onChange={(e) => setOptinTestClover(e.target.checked)}
                    className="w-3.5 h-3.5 accent-capy-green"
                  />
                  Create real coupon in Clover when redeemed
                </label>
                <p className="text-[11px] text-capy-muted">
                  Runs the real opt-in flow with the settings above and resets this number&apos;s opt-in state first — use a number you control.
                  Reply YES to get the coupon (test coupons last 3 minutes).
                </p>
                {optinTestStatus && (
                  <div className={`text-xs px-3 py-2 rounded-xl ${optinTestStatus.startsWith("Sent") ? "bg-capy-green-light text-capy-green-dark" : "bg-red-50 text-red-600"}`}>
                    {optinTestStatus}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {source === "clover" && (
            <button
              onClick={handleScanClover}
              disabled={scanLoading || blastLoading}
              className="flex-1 py-2 px-3 rounded-xl border border-capy-border text-xs font-semibold text-capy-text hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {scanLoading ? "Scanning…" : "Scan Clover"}
            </button>
          )}
          {newCustomers > 0 && (
            <button
              onClick={handleSendBlast}
              disabled={blastLoading}
              className="flex-1 py-2 px-3 rounded-xl bg-capy-green text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {blastLoading ? "Sending…" : hasBlasted ? `Send opt-in to ${newCustomers} new` : `Send ${optinDiscount}% Off Opt-In to ${newCustomers} Customer${newCustomers !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-capy-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-capy-border">
          <p className="card-heading text-sm">All Opted-In Customers</p>
          <p className="text-xs text-capy-muted mt-0.5">{optedInCustomers.length} total</p>
        </div>
        <div className="max-h-[40vh] overflow-y-auto">
          {rosterLoading ? (
            <RosterRowSkeletons />
          ) : optedInCustomers.length === 0 ? (
            <p className="text-xs text-capy-muted text-center py-6">No opted-in customers yet.</p>
          ) : (
            optedInCustomers.map((customer) => (
              <div key={customer.id} className="flex items-center gap-3 px-4 py-3 border-b border-capy-border/60 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-capy-text truncate">{customer.name}</p>
                  <p className="text-xs text-capy-muted font-mono">{customer.phone}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
