"use client";

import { useEffect, useState } from "react";
import { marketingApiFetch } from "@/lib/api";
import {
  fetchCustomerGroups,
  fetchGroupMembers,
  type CustomerGroup,
} from "@/lib/customerGroupsApi";
import {
  previewPromo,
  sendPromoNow,
  schedulePromo,
  sendTestPromo,
  type PromoPreview,
} from "@/lib/promoCampaignApi";
import { countSegments } from "@/lib/smsSegments";
import { Skeleton } from "@/components/ui/Skeleton";
import { CustomerGroupsPanel } from "@/components/voice/campaign/CustomerGroupsPanel";

interface RosterCustomer {
  id: string;
  phone: string;
  name: string;
}

const PLACEHOLDERS = "{restaurant_name} {name} {discount} {code} {link}";
const STEPS = [
  { key: "roster", label: "Recipients" },
  { key: "compose", label: "Message" },
  { key: "send", label: "Send" },
] as const;
type Step = (typeof STEPS)[number]["key"];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatUSD(amount: number): string {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 });
}

export function PromoBlastWizard({
  restaurantId,
  onBackToGames,
}: {
  restaurantId: string;
  onBackToGames: () => void;
}) {
  const [step, setStep] = useState<Step>("roster");

  // Roster + groups
  const [optedInCustomers, setOptedInCustomers] = useState<RosterCustomer[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterSearch, setRosterSearch] = useState("");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[] | null>(null);
  const [activeGroupIds, setActiveGroupIds] = useState<Set<string>>(new Set());
  const [groupMembersCache, setGroupMembersCache] = useState<Record<string, string[]>>({});
  const [groupsPanelOpen, setGroupsPanelOpen] = useState(false);

  // Compose
  const [message, setMessage] = useState("");
  const [hasCoupon, setHasCoupon] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [couponExpiryDays, setCouponExpiryDays] = useState(7);

  // Send
  const [sendMode, setSendMode] = useState<"now" | "schedule">("now");
  const today = toISODate(new Date());
  const [sendDate, setSendDate] = useState(today);
  const [sendHour, setSendHour] = useState("12");
  const [sendMinute, setSendMinute] = useState("00");
  const [sendAmPm, setSendAmPm] = useState("PM");

  const [preview, setPreview] = useState<PromoPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [testPhone, setTestPhone] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testCreateClover, setTestCreateClover] = useState(false);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentResult, setSentResult] = useState<string | null>(null);

  const loadGroups = () => {
    fetchCustomerGroups(restaurantId).then((r) => setCustomerGroups(r.groups)).catch(() => {});
  };

  useEffect(() => {
    setRosterLoading(true);
    marketingApiFetch<{ customers: RosterCustomer[] }>(
      `/api/marketing/opted-in-customers?restaurant_id=${restaurantId}`,
    )
      .then((d) => setOptedInCustomers(d.customers ?? []))
      .catch(() => setOptedInCustomers([]))
      .finally(() => setRosterLoading(false));
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Live cost/recipient preview whenever selection, coupon settings, or message change.
  useEffect(() => {
    if (step !== "send") return;
    let cancelled = false;
    const t = setTimeout(() => {
      setPreviewLoading(true);
      setPreviewError(null);
      previewPromo({
        restaurant_id: restaurantId,
        target_customer_ids: Array.from(selectedCustomerIds),
        message,
        has_coupon: hasCoupon,
        discount_percent: hasCoupon ? discountPercent : null,
        coupon_expiry_days: hasCoupon ? couponExpiryDays : null,
      })
        .then((p) => !cancelled && setPreview(p))
        .catch(() => !cancelled && setPreviewError("Couldn't estimate cost."))
        .finally(() => !cancelled && setPreviewLoading(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [step, restaurantId, selectedCustomerIds, message, hasCoupon, discountPercent, couponExpiryDays]);

  const toggleGroupChip = async (groupId: string) => {
    const isActive = activeGroupIds.has(groupId);
    let memberIds = groupMembersCache[groupId];
    if (!memberIds) {
      try {
        const res = await fetchGroupMembers(restaurantId, groupId);
        memberIds = res.members.map((m) => m.customer_id);
        setGroupMembersCache((prev) => ({ ...prev, [groupId]: memberIds! }));
      } catch {
        return;
      }
    }
    setActiveGroupIds((prev) => {
      const next = new Set(prev);
      isActive ? next.delete(groupId) : next.add(groupId);
      return next;
    });
    setSelectedCustomerIds((prev) => {
      const next = new Set(prev);
      for (const cid of memberIds!) {
        isActive ? next.delete(cid) : next.add(cid);
      }
      return next;
    });
  };

  const filteredRoster = rosterSearch
    ? optedInCustomers.filter(
        (c) => c.name.toLowerCase().includes(rosterSearch.toLowerCase()) || c.phone.includes(rosterSearch),
      )
    : optedInCustomers;

  const to24h = () => {
    let h = parseInt(sendHour, 10) % 12;
    if (sendAmPm === "PM") h += 12;
    return `${String(h).padStart(2, "0")}:${sendMinute}`;
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) return;
    setTestSending(true);
    setTestStatus(null);
    try {
      await sendTestPromo({
        restaurant_id: restaurantId,
        phone: testPhone,
        message,
        has_coupon: hasCoupon,
        discount_percent: hasCoupon ? discountPercent : null,
        coupon_expiry_days: hasCoupon ? couponExpiryDays : null,
        create_clover_coupon: testCreateClover,
      });
      setTestStatus("Sent! Check your phone.");
    } catch {
      setTestStatus(
        hasCoupon
          ? "Test failed — that number needs an existing customer record for a coupon test."
          : "Test failed. Check the number and try again.",
      );
    } finally {
      setTestSending(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    setSendError(null);
    try {
      const params = {
        restaurant_id: restaurantId,
        target_customer_ids: Array.from(selectedCustomerIds),
        message,
        has_coupon: hasCoupon,
        discount_percent: hasCoupon ? discountPercent : null,
        coupon_expiry_days: hasCoupon ? couponExpiryDays : null,
      };
      if (sendMode === "now") {
        const result = await sendPromoNow(params);
        setSentResult(`Sent to ${result.queued} recipient${result.queued === 1 ? "" : "s"}.`);
      } else {
        await schedulePromo({ ...params, send_date: sendDate, send_time: to24h() });
        setSentResult(`Scheduled for ${sendDate} at ${sendHour}:${sendMinute} ${sendAmPm}.`);
      }
    } catch {
      setSendError("Couldn't send/schedule the promo. Try again.");
    } finally {
      setSending(false);
    }
  };

  const seg = countSegments(message);
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="flex flex-col">
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-capy-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="card-heading">Promotional Message</p>
            <p className="text-xs text-capy-muted mt-0.5">
              Write a one-off message, optionally with a coupon, and send or schedule it.
            </p>
          </div>
          <button
            onClick={onBackToGames}
            className="px-3 py-2 rounded-xl border border-capy-border text-xs font-semibold text-capy-text hover:bg-slate-50 transition-colors shrink-0"
          >
            Back to Games
          </button>
        </div>

        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const done = i < stepIndex;
            const active = i === stepIndex;
            return (
              <div key={s.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      done ? "bg-capy-green text-white" : active ? "bg-capy-text text-white" : "bg-slate-100 text-capy-muted"
                    }`}
                    style={{ fontFamily: "Tektur, sans-serif" }}
                  >
                    {done ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 ${done ? "text-capy-green-dark" : active ? "text-capy-text font-semibold" : "text-capy-muted"}`}
                    style={{ fontFamily: "Tektur, sans-serif" }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-px flex-1 mx-1.5 mb-3 ${i < stepIndex ? "bg-capy-green" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {step === "roster" && (
          <>
            <div className="bg-white rounded-2xl border border-capy-border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-capy-border">
                <p className="card-heading">Opted In</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGroupsPanelOpen(true)}
                    className="text-xs font-semibold text-capy-muted hover:text-capy-text hover:underline"
                  >
                    Manage groups
                  </button>
                  <span className="text-xs font-semibold text-capy-green-dark bg-capy-green-light px-2.5 py-1 rounded-full">
                    {selectedCustomerIds.size} / {optedInCustomers.length} selected
                  </span>
                </div>
              </div>

              {customerGroups && customerGroups.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-capy-border">
                  {customerGroups.map((g) => {
                    const active = activeGroupIds.has(g.id);
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleGroupChip(g.id)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                          active
                            ? "bg-capy-green-light border-capy-green text-capy-green-dark"
                            : "bg-white border-capy-border text-capy-muted hover:text-capy-text"
                        }`}
                      >
                        {g.name} · {g.member_count}
                      </button>
                    );
                  })}
                </div>
              )}

              {!rosterLoading && optedInCustomers.length > 0 && (
                <div
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-capy-border cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    const allSelected = selectedCustomerIds.size === optedInCustomers.length;
                    setSelectedCustomerIds(allSelected ? new Set() : new Set(optedInCustomers.map((c) => c.id)));
                  }}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                      selectedCustomerIds.size === optedInCustomers.length
                        ? "bg-capy-green border-capy-green"
                        : selectedCustomerIds.size > 0
                          ? "bg-capy-green/30 border-capy-green"
                          : "border-capy-border bg-white"
                    }`}
                  >
                    {selectedCustomerIds.size === optedInCustomers.length ? (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : selectedCustomerIds.size > 0 ? (
                      <div className="w-2 h-0.5 bg-capy-green rounded" />
                    ) : null}
                  </div>
                  <span className="text-sm font-medium text-capy-text">
                    {selectedCustomerIds.size === optedInCustomers.length ? "Deselect all" : "Select all"}
                  </span>
                </div>
              )}

              <div className="px-4 py-2.5 border-b border-capy-border">
                <div className="flex items-center gap-2 bg-slate-50 border border-capy-border rounded-xl px-3 py-2">
                  <svg className="w-3.5 h-3.5 text-capy-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="flex-1 bg-transparent text-sm text-capy-text placeholder:text-capy-muted outline-none"
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {rosterLoading ? (
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : filteredRoster.length === 0 ? (
                  <p className="text-xs text-capy-muted text-center py-6">
                    {rosterSearch ? `No results for "${rosterSearch}"` : "No opted-in customers yet"}
                  </p>
                ) : (
                  filteredRoster.map((customer) => {
                    const isChecked = selectedCustomerIds.has(customer.id);
                    return (
                      <div
                        key={customer.id}
                        className="flex items-center gap-3 px-4 py-3 border-b border-capy-border/60 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() =>
                          setSelectedCustomerIds((prev) => {
                            const next = new Set(prev);
                            isChecked ? next.delete(customer.id) : next.add(customer.id);
                            return next;
                          })
                        }
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isChecked ? "bg-capy-green border-capy-green" : "border-capy-border bg-white"
                          }`}
                        >
                          {isChecked && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-capy-text truncate">{customer.name}</p>
                          <p className="text-xs text-capy-muted font-mono">{customer.phone}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              onClick={() => setStep("compose")}
              disabled={selectedCustomerIds.size === 0}
              className="w-full py-2.5 rounded-xl bg-capy-text text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
              style={{ fontFamily: "Tektur, sans-serif" }}
            >
              Continue
            </button>
          </>
        )}

        {step === "compose" && (
          <>
            <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4 space-y-2">
              <p className="section-label">Message</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Write your exact message here..."
                className="w-full bg-slate-50 border border-capy-border rounded-xl px-3 py-2 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green resize-none"
              />
              <div className="flex items-center justify-between text-[11px] text-capy-muted">
                <span className="font-mono truncate">{PLACEHOLDERS}</span>
                <span className="shrink-0 ml-2">
                  {seg.chars} chars · {seg.segments} SMS segment{seg.segments !== 1 ? "s" : ""} · {seg.encoding}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="section-label">Include a coupon</p>
                  <p className="text-[11px] text-capy-muted mt-0.5">
                    Mints an instant discount code per recipient — no reply needed.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hasCoupon}
                  onChange={(e) => setHasCoupon(e.target.checked)}
                  className="w-5 h-5 accent-capy-green"
                />
              </label>

              {hasCoupon && (
                <div className="flex items-center gap-4 pt-2 border-t border-capy-border">
                  <div>
                    <p className="text-[11px] text-capy-muted mb-1">Discount %</p>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Math.max(1, Math.min(100, parseInt(e.target.value) || 0)))}
                      className="w-20 px-2.5 py-1.5 bg-slate-50 border border-capy-border rounded-lg text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] text-capy-muted mb-1">Expires after (days)</p>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={couponExpiryDays}
                      onChange={(e) => setCouponExpiryDays(Math.max(1, Math.min(90, parseInt(e.target.value) || 0)))}
                      className="w-20 px-2.5 py-1.5 bg-slate-50 border border-capy-border rounded-lg text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep("roster")}
                className="px-4 py-2.5 rounded-xl border border-capy-border text-sm font-semibold text-capy-text hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("send")}
                disabled={!message.trim()}
                className="flex-1 py-2.5 rounded-xl bg-capy-text text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
                style={{ fontFamily: "Tektur, sans-serif" }}
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === "send" && (
          <>
            <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4 space-y-3">
              <p className="section-label">When</p>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                {(["now", "schedule"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSendMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      sendMode === m ? "bg-white text-capy-text shadow-sm" : "text-capy-muted"
                    }`}
                  >
                    {m === "now" ? "Send now" : "Schedule"}
                  </button>
                ))}
              </div>

              {sendMode === "schedule" && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <input
                    type="date"
                    value={sendDate}
                    min={today}
                    onChange={(e) => setSendDate(e.target.value)}
                    className="bg-white border border-capy-border rounded-lg px-2 py-1 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                  />
                  <select
                    value={sendHour}
                    onChange={(e) => setSendHour(e.target.value)}
                    className="bg-white border border-capy-border rounded-lg px-2 py-1 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={String(h)}>{h}</option>
                    ))}
                  </select>
                  <span className="text-xs text-capy-muted">:</span>
                  <select
                    value={sendMinute}
                    onChange={(e) => setSendMinute(e.target.value)}
                    className="bg-white border border-capy-border rounded-lg px-2 py-1 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                  >
                    {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={sendAmPm}
                    onChange={(e) => setSendAmPm(e.target.value)}
                    className="bg-white border border-capy-border rounded-lg px-2 py-1 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                  >
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
              )}
            </div>

            <div className="border-t border-capy-border pt-3 space-y-2">
              <p className="section-label">Send a test text</p>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="flex-1 px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                />
                <button
                  onClick={handleSendTest}
                  disabled={testSending || !testPhone.trim()}
                  className="px-4 py-2 rounded-xl bg-capy-text text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
                >
                  {testSending ? "Sending…" : "Send test"}
                </button>
              </div>
              {hasCoupon && (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-capy-text">
                  <input
                    type="checkbox"
                    checked={testCreateClover}
                    onChange={(e) => setTestCreateClover(e.target.checked)}
                    className="w-3.5 h-3.5 accent-capy-green"
                  />
                  Create real coupon in Clover when redeemed
                </label>
              )}
              {testStatus && (
                <div
                  className={`text-xs px-3 py-2 rounded-xl ${
                    testStatus.startsWith("Sent") ? "bg-capy-green-light text-capy-green-dark" : "bg-red-50 text-red-600"
                  }`}
                >
                  {testStatus}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4 space-y-3">
              <p className="section-label">Cost estimate</p>
              {previewError && <p className="text-xs text-red-600">{previewError}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-capy-muted">Recipients</p>
                  {previewLoading ? <Skeleton className="h-5 w-10 mt-0.5" /> : (
                    <p className="text-sm font-bold text-capy-text">{preview?.recipient_count ?? 0}</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-capy-muted">Outbound cost</p>
                  {previewLoading ? <Skeleton className="h-5 w-16 mt-0.5" /> : (
                    <p className="text-sm font-bold text-capy-text">{preview ? formatUSD(preview.outbound_cost) : "—"}</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-capy-muted">Worst case (all reply)</p>
                  {previewLoading ? <Skeleton className="h-5 w-16 mt-0.5" /> : (
                    <p className="text-sm font-bold text-capy-text">{preview ? formatUSD(preview.worst_case_cost) : "—"}</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] text-capy-muted">Telnyx balance</p>
                  {previewLoading ? <Skeleton className="h-5 w-16 mt-0.5" /> : (
                    <p className="text-sm font-bold text-capy-text">
                      {preview?.account_balance ? formatUSD(parseFloat(preview.account_balance.balance)) : "—"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {sendError && <p className="text-xs text-red-600">{sendError}</p>}
            {sentResult && (
              <div className="text-sm px-3 py-2.5 rounded-xl bg-capy-green-light text-capy-green-dark">{sentResult}</div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep("compose")}
                className="px-4 py-2.5 rounded-xl border border-capy-border text-sm font-semibold text-capy-text hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSend}
                disabled={sending || previewLoading || (preview?.recipient_count ?? 0) === 0}
                className="flex-1 py-2.5 rounded-xl bg-capy-green text-white text-sm font-semibold hover:bg-capy-green-dark disabled:opacity-50 transition-colors"
                style={{ fontFamily: "Tektur, sans-serif" }}
              >
                {sending ? "Sending…" : sendMode === "now" ? "Send Now" : "Schedule"}
              </button>
            </div>
          </>
        )}
      </div>

      {groupsPanelOpen && (
        <CustomerGroupsPanel
          restaurantId={restaurantId}
          optedInCustomers={optedInCustomers}
          onClose={() => setGroupsPanelOpen(false)}
          onGroupsChanged={loadGroups}
        />
      )}
    </div>
  );
}
