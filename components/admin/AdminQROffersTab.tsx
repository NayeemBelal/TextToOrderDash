"use client";

import { useEffect, useState } from "react";
import {
  createQROffer,
  fetchQROffers,
  qrLink,
  type QROffer,
  type QROfferKind,
} from "@/lib/qrOffersApi";
import { fetchInsightsRestaurants, type InsightsRestaurant } from "@/lib/insightsApi";
import { Skeleton } from "@/components/ui/Skeleton";

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 min-w-0">
      <code className="text-xs bg-capy-bg border border-capy-border rounded-lg px-2 py-1.5 truncate flex-1 text-capy-text">
        {link}
      </code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* ignore */
          }
        }}
        className="text-xs px-2.5 py-1.5 rounded-lg border border-capy-border text-capy-text hover:bg-capy-bg whitespace-nowrap"
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}

const inputCls =
  "w-full text-sm rounded-lg border border-capy-border bg-capy-bg text-capy-text px-2.5 py-1.5 focus:outline-none focus:border-capy-green";
const labelCls = "text-xs font-medium text-capy-muted";

/**
 * QR-offer wizard: pick a restaurant, define the offer (percent off or a
 * special promo), tag the placement — get the link to encode in the QR code.
 * Every offer is its own join promo on the backend, so a new QR campaign
 * never changes the restaurant's default offer or QR codes already printed.
 */
export function AdminQROffersTab() {
  const [restaurants, setRestaurants] = useState<InsightsRestaurant[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [kind, setKind] = useState<QROfferKind>("percent");
  const [percent, setPercent] = useState("10");
  const [expiryDays, setExpiryDays] = useState("10");
  const [headline, setHeadline] = useState("");
  const [finePrint, setFinePrint] = useState("");
  const [amountDollars, setAmountDollars] = useState("");
  const [itemName, setItemName] = useState("");
  const [dailyStart, setDailyStart] = useState("");
  const [dailyEnd, setDailyEnd] = useState("");
  const [src, setSrc] = useState("");

  const [existing, setExisting] = useState<QROffer[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ link: string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInsightsRestaurants()
      .then((r) => setRestaurants(r.restaurants))
      .catch(() => setError("Couldn't load restaurants."));
  }, []);

  useEffect(() => {
    setExisting(null);
    setCreated(null);
    setError(null);
    if (!restaurantId) return;
    fetchQROffers(restaurantId)
      .then((r) => setExisting(r.offers))
      .catch(() =>
        setError("This restaurant's join page isn't set up (marketing slug / join opt-in)."),
      );
  }, [restaurantId]);

  const canCreate =
    !!restaurantId &&
    Number(expiryDays) >= 1 &&
    (kind === "percent"
      ? Number(percent) >= 1 && Number(percent) <= 100
      : headline.trim().length > 0 && (Number(amountDollars) > 0 || itemName.trim().length > 0));

  async function handleCreate() {
    if (!canCreate || creating) return;
    setCreating(true);
    setError(null);
    setCreated(null);
    try {
      const offer = await createQROffer({
        restaurant_id: restaurantId,
        kind,
        expiry_days: Number(expiryDays),
        ...(kind === "percent"
          ? { discount_percent: Number(percent), headline: headline.trim() || undefined }
          : {
              headline: headline.trim(),
              fine_print: finePrint.trim() || undefined,
              discount_amount_cents: Number(amountDollars) > 0
                ? Math.round(Number(amountDollars) * 100)
                : undefined,
              clover_item_name: itemName.trim() || undefined,
              ...(dailyStart && dailyEnd
                ? { daily_start_time: dailyStart, daily_end_time: dailyEnd }
                : {}),
            }),
      });
      setCreated({ link: qrLink(offer.link, src), label: offer.label });
      const refreshed = await fetchQROffers(restaurantId);
      setExisting(refreshed.offers);
    } catch {
      setError("Couldn't create the offer — check the fields and try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h2 className="text-lg font-bold text-capy-text">QR offers</h2>
          <p className="text-xs text-capy-muted">
            Build an offer, get the link to encode in a QR code. Each offer is separate from the
            restaurant&apos;s default join offer — printing a new code never changes old ones.
          </p>
        </div>

        {error && (
          <div className="bg-capy-card border border-capy-border rounded-2xl p-4 text-sm text-capy-muted">
            {error}
          </div>
        )}

        <div className="bg-capy-card rounded-2xl border border-capy-border shadow-sm p-4 space-y-4">
          {/* 1 · restaurant */}
          <div className="space-y-1">
            <p className={labelCls}>1 · Restaurant</p>
            <select
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className={inputCls}
            >
              <option value="">Choose a restaurant…</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* 2 · offer */}
          <div className="space-y-2">
            <p className={labelCls}>2 · The offer</p>
            <div className="inline-flex items-center gap-1 rounded-lg border border-capy-border p-0.5">
              {(
                [
                  { key: "percent", label: "% off" },
                  { key: "amount", label: "Special promo" },
                ] as { key: QROfferKind; label: string }[]
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setKind(t.key)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    kind === t.key
                      ? "bg-capy-bg text-capy-text font-semibold"
                      : "text-capy-muted hover:text-capy-text"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {kind === "percent" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className={labelCls}>Discount %</p>
                    <input type="number" min={1} max={100} value={percent}
                      onChange={(e) => setPercent(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <p className={labelCls}>Coupon lasts (days)</p>
                    <input type="number" min={1} max={60} value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className={labelCls}>Headline on the sign-up page (optional)</p>
                  <input value={headline} onChange={(e) => setHeadline(e.target.value)}
                    placeholder={`${Number(percent) || 10}% OFF YOUR ORDER`} className={inputCls} />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className={labelCls}>Headline (what the page shouts)</p>
                  <input value={headline} onChange={(e) => setHeadline(e.target.value)}
                    placeholder="BUY ONE COPYCAT, GET ONE FREE" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className={labelCls}>$ off (fixed)</p>
                    <input type="number" min={0} step="0.01" value={amountDollars}
                      onChange={(e) => setAmountDollars(e.target.value)}
                      placeholder="10.10" className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <p className={labelCls}>…or POS item to price from</p>
                    <input value={itemName} onChange={(e) => setItemName(e.target.value)}
                      placeholder="The Copycat" className={inputCls} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className={labelCls}>Fine print (optional)</p>
                  <input value={finePrint} onChange={(e) => setFinePrint(e.target.value)}
                    placeholder="Valid only with 2 Copycat sandwiches on the order." className={inputCls} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <p className={labelCls}>Coupon lasts (days)</p>
                    <input type="number" min={1} max={60} value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <p className={labelCls}>Daily from (optional)</p>
                    <input type="time" value={dailyStart}
                      onChange={(e) => setDailyStart(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <p className={labelCls}>Daily until</p>
                    <input type="time" value={dailyEnd}
                      onChange={(e) => setDailyEnd(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3 · placement */}
          <div className="space-y-1">
            <p className={labelCls}>3 · Where will this QR live? (src tag — splits the funnel stats)</p>
            <input value={src} onChange={(e) => setSrc(e.target.value)}
              placeholder="table-tent" className={inputCls} />
          </div>

          <button
            type="button"
            disabled={!canCreate || creating}
            onClick={handleCreate}
            className="w-full py-2 rounded-xl text-sm font-semibold bg-capy-green text-white disabled:opacity-40"
          >
            {creating ? "Creating…" : "Create offer & get link"}
          </button>

          {created && (
            <div className="rounded-xl border border-capy-green/40 bg-capy-green/5 p-3 space-y-2">
              <p className="text-sm font-semibold text-capy-text">
                {created.label} is live — encode this link in your QR code:
              </p>
              <CopyLink link={created.link} />
              <p className="text-[11px] text-capy-muted">
                Reprinting somewhere else? Reuse the same offer below with a different src tag.
              </p>
            </div>
          )}
        </div>

        {/* existing offers */}
        {restaurantId && (
          <div className="bg-capy-card rounded-2xl border border-capy-border shadow-sm overflow-hidden">
            <div className="px-4 pt-3 pb-2">
              <h3 className="text-sm font-semibold text-capy-text">Existing offers</h3>
              <p className="text-[11px] text-capy-muted">
                Links include the src tag typed above — same offer, different placement, separate stats.
              </p>
            </div>
            {existing === null ? (
              <div className="px-4 pb-4"><Skeleton className="h-4 w-full" /></div>
            ) : existing.length === 0 ? (
              <p className="px-4 pb-4 text-sm text-capy-muted">No offers yet for this restaurant.</p>
            ) : (
              <div className="divide-y divide-capy-border">
                {existing.map((o) => (
                  <div key={o.id} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-capy-text font-medium">
                        {o.label}
                        <span className="text-capy-muted font-normal">
                          {" · "}
                          {o.kind === "percent" ? `${o.discount_percent}% off` : "promo"} ·{" "}
                          {o.expiry_days}d coupon
                        </span>
                      </p>
                      {!o.active && (
                        <span className="text-[10px] uppercase tracking-wide text-capy-muted border border-capy-border rounded-full px-2 py-0.5">
                          inactive
                        </span>
                      )}
                    </div>
                    <CopyLink link={qrLink(o.link, src)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
