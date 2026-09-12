"use client";

import { useEffect, useState } from "react";
import { ResponsivePanel } from "@/components/ui/ResponsivePanel";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getBranding,
  getJoinSettings,
  getReferralSettings,
  updateBranding,
  updateJoinSettings,
  updateReferralSettings,
  getPosConnection,
  connectPos,
  disconnectPos,
  type PosConnectionStatus,
  type PosProvider,
  type Branding,
  type JoinOptinSettings,
  type ReferralSettings,
} from "@/lib/settingsApi";

type Section = "branding" | "signup" | "referrals" | "pos";

const SECTIONS: { key: Section; label: string; blurb: string }[] = [
  { key: "branding", label: "Branding", blurb: "How your coupon links and pages look to customers" },
  { key: "signup", label: "Sign-up link", blurb: "The QR / web form customers use to join your list" },
  { key: "referrals", label: "Referrals", blurb: "Let customers earn a bump for bringing a friend" },
  { key: "pos", label: "POS", blurb: "Connect your register so coupons become real discounts and orders flow in" },
];

const inputClass =
  "w-full px-3 py-2 bg-capy-surface border border-capy-border rounded-xl text-sm text-capy-text placeholder:text-capy-muted focus:outline-none focus:ring-2 focus:ring-capy-green";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="section-label mb-1">{label}</p>
      {children}
      {hint && <p className="text-[11px] text-capy-muted mt-1 leading-relaxed">{hint}</p>}
    </div>
  );
}

function SaveBar({ saving, saved, error, onSave }: { saving: boolean; saved: boolean; error: string | null; onSave: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <span className={`text-xs ${error ? "text-red-600 dark:text-red-300" : "text-capy-green-dark"}`}>
        {error ?? (saved ? "Saved ✓" : "")}
      </span>
      <button onClick={onSave} disabled={saving} className="btn-primary">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}

function textOn(hex: string): string {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "#ffffff";
  const n = parseInt(h, 16);
  const L = (0.299 * ((n >> 16) & 0xff) + 0.587 * ((n >> 8) & 0xff) + 0.114 * (n & 0xff)) / 255;
  return L > 0.6 ? "#111827" : "#ffffff";
}

/* ── Branding ─────────────────────────────────────────────────────────── */
function BrandingSection({ restaurantId }: { restaurantId: string }) {
  const [data, setData] = useState<Branding | null>(null);
  const [form, setForm] = useState({
    logo_url: "", brand_color: "", background_image_url: "", og_image_url: "", referral_share_image_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getBranding(restaurantId)
      .then((b) => {
        setData(b);
        setForm({
          logo_url: b.logo_url ?? "", brand_color: b.brand_color ?? "",
          background_image_url: b.background_image_url ?? "", og_image_url: b.og_image_url ?? "",
          referral_share_image_url: b.referral_share_image_url ?? "",
        });
      })
      .catch(() => setError("Couldn't load branding."));
  }, [restaurantId]);

  const save = async () => {
    setSaving(true); setSaved(false); setError(null);
    try {
      await updateBranding(restaurantId, {
        logo_url: form.logo_url || null, brand_color: form.brand_color || null,
        background_image_url: form.background_image_url || null, og_image_url: form.og_image_url || null,
        referral_share_image_url: form.referral_share_image_url || null,
      });
      setSaved(true);
    } catch {
      setError("Couldn't save — check the URLs and colour.");
    } finally {
      setSaving(false);
    }
  };

  if (!data && !error) {
    return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  }

  const brand = /^#?[0-9a-fA-F]{6}$/.test(form.brand_color) ? (form.brand_color.startsWith("#") ? form.brand_color : `#${form.brand_color}`) : "#1e293b";

  return (
    <div className="space-y-4">
      {/* Live preview of the coupon link + page header */}
      <div className="app-card overflow-hidden">
        <div className="px-4 pt-3 pb-2 border-b border-capy-border flex items-center justify-between">
          <p className="card-heading">Preview · what customers see</p>
          <span className="text-[11px] text-capy-muted">coupon page</span>
        </div>
        <div className="p-4 bg-capy-surface">
          <div className="mx-auto max-w-[260px] rounded-2xl overflow-hidden shadow-card bg-white">
            <div
              className="relative h-28 flex flex-col items-center justify-end pb-3 text-center"
              style={{
                background: form.background_image_url
                  ? `linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,.15) 60%, transparent), url(${form.background_image_url}) center/cover`
                  : `linear-gradient(135deg, ${brand}, ${brand}cc)`,
                color: form.background_image_url ? "#fff" : textOn(brand),
              }}
            >
              <div className="w-11 h-11 rounded-full bg-white shadow flex items-center justify-center overflow-hidden mb-1">
                {form.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logo_url} alt="" className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-xl">🎁</span>
                )}
              </div>
              <p className="text-xs font-bold leading-tight">{data?.restaurant_name ?? "Your restaurant"}</p>
            </div>
            <div className="p-3 text-center">
              <span className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold" style={{ background: `${brand}1a`, color: brand }}>
                15% off your order
              </span>
              <div className="mt-2 h-8 rounded-lg text-[11px] font-bold flex items-center justify-center" style={{ background: brand, color: textOn(brand) }}>
                Redeem in store
              </div>
            </div>
          </div>
        </div>
      </div>

      <Field label="Logo URL" hint="Square or wide PNG with a transparent background works best.">
        <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://…/logo.png" className={inputClass} />
      </Field>
      <Field label="Brand colour" hint="Used for buttons and the coupon badge.">
        <div className="flex items-center gap-2">
          <input type="color" value={brand} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} className="w-10 h-10 rounded-lg border border-capy-border bg-transparent p-0.5 cursor-pointer" aria-label="Pick brand colour" />
          <input value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} placeholder="#B5245C" className={inputClass} />
        </div>
      </Field>
      <Field label="Hero photo URL" hint="A wide shot of your food, shown at the top of the coupon page.">
        <input value={form.background_image_url} onChange={(e) => setForm({ ...form, background_image_url: e.target.value })} placeholder="https://…/hero.jpg" className={inputClass} />
      </Field>
      <Field label="Link preview image URL" hint="The thumbnail iMessage/WhatsApp show under your coupon link. Leave blank to auto-generate one from your logo and colour.">
        <input value={form.og_image_url} onChange={(e) => setForm({ ...form, og_image_url: e.target.value })} placeholder="https://…/preview.jpg" className={inputClass} />
      </Field>
      <Field label="Referral share image URL" hint="Optional — shown on the “invite a friend” card.">
        <input value={form.referral_share_image_url} onChange={(e) => setForm({ ...form, referral_share_image_url: e.target.value })} placeholder="https://…/friends.jpg" className={inputClass} />
      </Field>
      <SaveBar saving={saving} saved={saved} error={error} onSave={save} />
    </div>
  );
}

/* ── Sign-up link (QR / web form) ─────────────────────────────────────── */
function SignupSection({ restaurantId }: { restaurantId: string }) {
  const [data, setData] = useState<JoinOptinSettings | null>(null);
  const [form, setForm] = useState({ join_optin_enabled: false, marketing_slug: "", join_discount_percent: 10, join_expiry_hours: 24 });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getJoinSettings(restaurantId)
      .then((j) => {
        setData(j);
        setForm({
          join_optin_enabled: j.join_optin_enabled, marketing_slug: j.marketing_slug ?? "",
          join_discount_percent: j.join_discount_percent, join_expiry_hours: j.join_expiry_hours,
        });
      })
      .catch(() => setError("Couldn't load sign-up settings."));
  }, [restaurantId]);

  const save = async () => {
    setSaving(true); setSaved(false); setError(null);
    try {
      const r = await updateJoinSettings(restaurantId, form);
      setData((d) => (d ? { ...d, ...form, join_url: r.join_url } : d));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error && e.message.includes("409") ? "That link name is taken — try another." : "Couldn't save. Use 3–50 lowercase letters, numbers or hyphens.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    if (!data?.join_url) return;
    try {
      await navigator.clipboard.writeText(data.join_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  };

  if (!data && !error) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-capy-muted leading-relaxed">
        Print this link as a QR code on table tents, receipts, or your counter. Customers who scan it fill in a short form,
        agree to texts, and get a welcome coupon — no opt-in text needed from you.
      </p>
      <label className="app-card px-4 py-3 flex items-center justify-between cursor-pointer">
        <div>
          <p className="text-sm font-semibold text-capy-text">Sign-up link is live</p>
          <p className="text-[11px] text-capy-muted">Turn off to pause new sign-ups without losing the link.</p>
        </div>
        <input type="checkbox" checked={form.join_optin_enabled} onChange={(e) => setForm({ ...form, join_optin_enabled: e.target.checked })} className="w-5 h-5 accent-capy-green" />
      </label>
      <Field label="Link name" hint="belan.tech/join/your-name — lowercase letters, numbers and hyphens.">
        <div className="flex items-center gap-2">
          <span className="text-xs text-capy-muted shrink-0">belan.tech/join/</span>
          <input value={form.marketing_slug} onChange={(e) => setForm({ ...form, marketing_slug: e.target.value.toLowerCase() })} placeholder="sauce-bros" className={inputClass} />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Welcome discount">
          <div className="relative">
            <input type="number" min={1} max={100} value={form.join_discount_percent} onChange={(e) => setForm({ ...form, join_discount_percent: Number(e.target.value) })} className={`${inputClass} pr-7`} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-capy-muted">%</span>
          </div>
        </Field>
        <Field label="Coupon valid for">
          <div className="relative">
            <input type="number" min={1} max={720} value={form.join_expiry_hours} onChange={(e) => setForm({ ...form, join_expiry_hours: Number(e.target.value) })} className={`${inputClass} pr-12`} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-capy-muted">hours</span>
          </div>
        </Field>
      </div>
      {data?.join_url && (
        <div className="app-card px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="section-label">Your link</p>
            <p className="text-sm font-mono text-capy-text truncate">{data.join_url}</p>
          </div>
          <button onClick={copy} className="btn-secondary shrink-0">{copied ? "Copied ✓" : "Copy"}</button>
        </div>
      )}
      <SaveBar saving={saving} saved={saved} error={error} onSave={save} />
    </div>
  );
}

/* ── Referrals ────────────────────────────────────────────────────────── */
function ReferralsSection({ restaurantId }: { restaurantId: string }) {
  const [form, setForm] = useState<ReferralSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getReferralSettings(restaurantId).then(setForm).catch(() => setError("Couldn't load referral settings."));
  }, [restaurantId]);

  const save = async () => {
    if (!form) return;
    setSaving(true); setSaved(false); setError(null);
    try {
      await updateReferralSettings(restaurantId, form);
      setSaved(true);
    } catch {
      setError("Couldn't save referral settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!form) return error ? <p className="text-sm text-red-600 dark:text-red-300">{error}</p> : <Skeleton className="h-24 w-full" />;

  return (
    <div className="space-y-4">
      <p className="text-xs text-capy-muted leading-relaxed">
        Every coupon page gets an “invite a friend” button. The friend gets a first-order discount; the customer who
        shared gets their own coupon bumped once.
      </p>
      <label className="app-card px-4 py-3 flex items-center justify-between cursor-pointer">
        <div>
          <p className="text-sm font-semibold text-capy-text">Referral program on</p>
          <p className="text-[11px] text-capy-muted">Shows the invite button on coupon pages.</p>
        </div>
        <input type="checkbox" checked={form.referral_enabled} onChange={(e) => setForm({ ...form, referral_enabled: e.target.checked })} className="w-5 h-5 accent-capy-green" />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Sharer's bump">
          <div className="relative">
            <input type="number" min={1} max={50} value={form.referrer_bonus_percent} onChange={(e) => setForm({ ...form, referrer_bonus_percent: Number(e.target.value) })} className={`${inputClass} pr-7`} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-capy-muted">%</span>
          </div>
        </Field>
        <Field label="Friend's discount">
          <div className="relative">
            <input type="number" min={1} max={100} value={form.referred_discount_percent} onChange={(e) => setForm({ ...form, referred_discount_percent: Number(e.target.value) })} className={`${inputClass} pr-7`} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-capy-muted">%</span>
          </div>
        </Field>
        <Field label="Bonus valid">
          <div className="relative">
            <input type="number" min={1} max={90} value={form.referral_expiry_days} onChange={(e) => setForm({ ...form, referral_expiry_days: Number(e.target.value) })} className={`${inputClass} pr-10`} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-capy-muted">days</span>
          </div>
        </Field>
      </div>
      <SaveBar saving={saving} saved={saved} error={error} onSave={save} />
    </div>
  );
}

/* ── POS connection ───────────────────────────────────────────────────── */
function PosSection({ restaurantId }: { restaurantId: string }) {
  const [status, setStatus] = useState<PosConnectionStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [provider, setProvider] = useState<PosProvider>("clover");
  const [merchantId, setMerchantId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [apiHost, setApiHost] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; checks?: Record<string, boolean | undefined> } | null>(null);

  const load = () =>
    getPosConnection(restaurantId)
      .then((st) => {
        setStatus(st);
        setProvider(st.provider);
        setMerchantId(st.merchant_id ?? "");
      })
      .catch(() => setLoadError("Couldn't load the POS connection."));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const canSubmit =
    merchantId.trim().length > 0 &&
    (provider === "clover" ? apiKey.trim().length > 0 : clientId.trim().length > 0 && clientSecret.trim().length > 0);

  const connect = async () => {
    setBusy(true);
    setResult(null);
    try {
      const r = await connectPos(restaurantId, {
        provider,
        merchant_id: merchantId.trim(),
        api_key: provider === "clover" ? apiKey.trim() : undefined,
        client_id: provider === "toast" ? clientId.trim() : undefined,
        client_secret: provider === "toast" ? clientSecret.trim() : undefined,
        api_host: provider === "toast" && apiHost.trim() ? apiHost.trim() : undefined,
      });
      setResult({ ok: true, text: `Connected to ${r.merchant_name || "your POS"}.`, checks: r.checks });
      setApiKey(""); setClientSecret("");
      load();
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : "Couldn't connect." });
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await disconnectPos(restaurantId);
      setResult({ ok: true, text: "Disconnected. Coupons will stop creating POS discounts until you reconnect." });
      load();
    } catch {
      setResult({ ok: false, text: "Couldn't disconnect." });
    } finally {
      setBusy(false);
    }
  };

  if (!status && !loadError) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  if (loadError) return <p className="text-sm text-red-600 dark:text-red-300">{loadError}</p>;

  return (
    <div className="space-y-4">
      <div className={`app-card px-4 py-3 flex items-center gap-3 ${status?.connected ? "border-capy-green/50" : ""}`}>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${status?.connected ? "bg-capy-green" : "bg-capy-muted/40"}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-capy-text">
            {status?.connected ? `Connected · ${status.provider === "toast" ? "Toast" : "Clover"}` : "Not connected"}
          </p>
          <p className="text-[11px] text-capy-muted">
            {status?.connected
              ? `Merchant ${status.merchant_id}. Coupons create real discounts and orders flow into Revenue and the customer timeline.`
              : "Without a POS, coupon pages still work but can't create a discount at the register, and Revenue stays empty."}
          </p>
        </div>
        {status?.connected && (
          <button onClick={disconnect} disabled={busy} className="btn-secondary !py-1.5 text-xs shrink-0">Disconnect</button>
        )}
      </div>

      <Field label="Point of sale">
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: "clover", label: "Clover", enabled: true },
            { key: "toast", label: "Toast", enabled: !!status?.toast_supported },
            { key: "square", label: "Square", enabled: false },
          ] as { key: string; label: string; enabled: boolean }[]).map((o) => (
            <button
              key={o.key}
              disabled={!o.enabled}
              onClick={() => o.enabled && setProvider(o.key as PosProvider)}
              className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                provider === o.key
                  ? "border-capy-green bg-capy-green-light text-capy-green-dark"
                  : "border-capy-border text-capy-muted hover:border-capy-green disabled:opacity-40 disabled:hover:border-capy-border"
              }`}
            >
              {o.label}
              {!o.enabled && <span className="block text-[10px] font-normal opacity-70">coming soon</span>}
            </button>
          ))}
        </div>
      </Field>

      {provider === "clover" ? (
        <>
          <Field label="Merchant ID" hint="Clover dashboard → Account & Setup → the 13-character id, also in your Clover URL.">
            <input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} placeholder="e.g. SBSTMYS9MJG36" className={inputClass} autoComplete="off" />
          </Field>
          <Field
            label="API token"
            hint="Clover dashboard → Account & Setup → API Tokens → Create new token. Tick Customers, Orders, Inventory (read + write) and Merchant (read). Paste the token once; we store it securely and never show it again."
          >
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={status?.has_credentials ? "•••••••• (saved — paste a new one to replace)" : "Paste your Clover API token"} className={inputClass} autoComplete="new-password" />
          </Field>
        </>
      ) : (
        <>
          <Field label="Restaurant GUID" hint="From Toast Web → Integrations → the restaurant's external id.">
            <input value={merchantId} onChange={(e) => setMerchantId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={inputClass} autoComplete="off" />
          </Field>
          <Field label="Client ID" hint="From your Toast standard API access credentials.">
            <input value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass} autoComplete="off" />
          </Field>
          <Field label="Client secret">
            <input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} className={inputClass} autoComplete="new-password" />
          </Field>
          <Field label="API access URL" hint="Optional — only if Toast gave you one other than the default.">
            <input value={apiHost} onChange={(e) => setApiHost(e.target.value)} placeholder="https://ws-api.toasttab.com" className={inputClass} autoComplete="off" />
          </Field>
        </>
      )}

      {result && (
        <div className={`text-xs px-3 py-2.5 rounded-xl space-y-1 ${result.ok ? "bg-capy-green-light text-capy-green-dark" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300"}`}>
          <p className="font-semibold">{result.text}</p>
          {result.checks && (
            <p>
              {(["orders", "customers", "inventory"] as const).map((k) => (
                <span key={k} className="mr-3">{result.checks?.[k] ? "✓" : "✗"} {k === "inventory" ? "discounts" : k}</span>
              ))}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-end">
        <button onClick={connect} disabled={!canSubmit || busy} className="btn-primary">
          {busy ? "Checking with your POS…" : status?.connected ? "Update connection" : "Connect"}
        </button>
      </div>
    </div>
  );
}

/**
 * Marketing settings drawer (gear icon in the header): branding for the
 * customer-facing coupon / sign-up / referral pages, the QR sign-up link, and
 * the referral program. Nothing here changes the dashboard's own look.
 */
export function SettingsPanel({ open, onClose, restaurantId }: { open: boolean; onClose: () => void; restaurantId: string }) {
  const [section, setSection] = useState<Section>("branding");
  return (
    <ResponsivePanel open={open} onClose={onClose} title="Settings">
      <div className="p-4 space-y-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                section === s.key ? "bg-capy-text text-capy-card" : "border border-capy-border text-capy-muted hover:text-capy-text"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-capy-muted -mt-1">{SECTIONS.find((s) => s.key === section)?.blurb}</p>
        {section === "branding" && <BrandingSection restaurantId={restaurantId} />}
        {section === "signup" && <SignupSection restaurantId={restaurantId} />}
        {section === "referrals" && <ReferralsSection restaurantId={restaurantId} />}
        {section === "pos" && <PosSection restaurantId={restaurantId} />}
      </div>
    </ResponsivePanel>
  );
}
