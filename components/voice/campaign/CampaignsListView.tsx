"use client";

import { useEffect, useState } from "react";
import { fetchAllCampaigns, type CampaignListItem } from "@/lib/campaignsListApi";
import { OPTIN_SMS_ENABLED } from "@/lib/features";
import { Skeleton } from "@/components/ui/Skeleton";
import { GamifiedMarketingTab } from "@/components/voice/GamifiedMarketingTab";
import { PromoBlastWizard } from "@/components/voice/campaign/PromoBlastWizard";
import { PromoCampaignDetail } from "@/components/voice/campaign/PromoCampaignDetail";
import { OptInPanel } from "@/components/voice/campaign/OptInPanel";
import { ContactsPanel } from "@/components/voice/campaign/ContactsPanel";
import { NewCampaignPicker, type NewCampaignChoice } from "@/components/voice/campaign/NewCampaignPicker";
import { ResponsivePanel } from "@/components/ui/ResponsivePanel";
import { AutopilotPanel } from "@/components/voice/campaign/autopilot/AutopilotPanel";
import { fetchAutopilot, type AutopilotDashboard } from "@/lib/autopilotApi";

// Terminal states — these go in the History section below the active list.
const TERMINAL_STATUSES = new Set(["ended", "sent", "canceled", "failed"]);

type View =
  | { mode: "list" }
  | { mode: "new-game"; everyoneWins: boolean }
  | { mode: "game-detail"; campaignId: string }
  | { mode: "new-promo" }
  | { mode: "promo-detail"; promoId: string }
  | { mode: "autopilot" };

const TYPE_META: Record<CampaignListItem["type"], { label: string; emoji: string; chip: string }> = {
  classic: { label: "Game", emoji: "🎯", chip: "bg-capy-accent-light text-capy-accent" },
  everyone_wins: { label: "Everyone wins", emoji: "🎉", chip: "bg-capy-green-light text-capy-green-dark" },
  promo: { label: "Promo", emoji: "📣", chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
};

function StatusBadge({ status }: { status: string }) {
  const live = status === "active";
  const cls =
    live || status === "sent"
      ? "bg-capy-green-light text-capy-green-dark"
      : status === "paused" || status === "pending"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        : status === "failed"
          ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
          : "bg-capy-surface-2 text-capy-muted";
  const label = status === "pending" ? "Scheduled" : status;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-semibold capitalize ${cls}`}>
      {live && <span className="w-1.5 h-1.5 rounded-full bg-capy-green animate-pulse" />}
      {label}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CampaignRow({ c, onOpen }: { c: CampaignListItem; onOpen: () => void }) {
  const meta = TYPE_META[c.type];
  return (
    <button
      onClick={onOpen}
      className="w-full text-left flex items-center gap-3.5 px-4 py-3.5 hover:bg-capy-surface transition-colors group"
    >
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${meta.chip}`}>{meta.emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-capy-text">{meta.label}</span>
          <StatusBadge status={c.status} />
        </span>
        <span className="block text-xs text-capy-muted mt-0.5 truncate">{c.schedule_label}</span>
      </span>
      <span className="text-right shrink-0">
        <span className="block text-sm font-bold text-capy-text tabular-nums">{c.recipient_count.toLocaleString()}</span>
        <span className="block text-[11px] text-capy-muted">recipients · {formatDate(c.created_at)}</span>
      </span>
      <svg className="w-4 h-4 text-capy-muted group-hover:text-capy-text shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

/** Entry point to Autopilot — shown only where the backend says it's available
 * (Belan admins everywhere while the feature flag is on; owners on the pilot list). */
function AutopilotCard({ ap, onOpen }: { ap: AutopilotDashboard; onOpen: () => void }) {
  const s = ap.settings;
  const slots = ap.slots ?? [];
  const next = slots[0];
  const on = !!s?.enabled;
  const summary = !on
    ? "Off. Texts each customer a game only when they're due, with a first line written for them."
    : next
      ? `Next: ${next.local_label} · ${next.size} customer${next.size === 1 ? "" : "s"} · ${slots.reduce((n, x) => n + x.size, 0)} planned this week`
      : "On. No one is due this week.";
  return (
    <button onClick={onOpen} className="app-card w-full text-left flex items-center gap-3.5 px-4 py-3.5 hover:bg-capy-surface transition-colors group">
      <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-capy-accent-light text-capy-accent">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-capy-text">Autopilot</span>
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-capy-accent-light text-capy-accent">Beta</span>
          {on && (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-semibold ${s?.mode === "live" ? "bg-capy-green-light text-capy-green-dark" : "bg-capy-surface-2 text-capy-muted"}`}
            >
              {s?.mode === "live" && <span className="w-1.5 h-1.5 rounded-full bg-capy-green animate-pulse" />}
              {s?.mode === "live" ? "Live" : "Preview"}
            </span>
          )}
          {ap.admin_only && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Admin only</span>
          )}
        </span>
        <span className="block text-xs text-capy-muted mt-0.5 truncate">{summary}</span>
      </span>
      <svg className="w-4 h-4 text-capy-muted group-hover:text-capy-text shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function Section({
  title,
  count,
  children,
  collapsible,
  defaultOpen = true,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="app-card overflow-hidden">
      <button
        onClick={() => collapsible && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 border-b border-capy-border ${collapsible ? "hover:bg-capy-surface" : "cursor-default"} transition-colors`}
      >
        <span className="flex items-center gap-2">
          <span className="card-heading">{title}</span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-capy-surface-2 text-capy-muted">{count}</span>
        </span>
        {collapsible && (
          <svg className={`w-4 h-4 text-capy-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      {open && <div className="divide-y divide-capy-border/60">{children}</div>}
    </div>
  );
}

/** Restaurant-wide list of all campaigns — what's running now and what already
 * ran, on one page — plus the entry points to create one and to manage the
 * text list. */
export function CampaignsListView({ restaurantId }: { restaurantId: string }) {
  const [view, setView] = useState<View>({ mode: "list" });
  const [campaigns, setCampaigns] = useState<CampaignListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [optInPanelOpen, setOptInPanelOpen] = useState(false);
  const [autopilot, setAutopilot] = useState<AutopilotDashboard | null>(null);

  const loadCampaigns = () => {
    fetchAllCampaigns(restaurantId)
      .then((r) => setCampaigns(r.campaigns))
      .catch(() => setError("Couldn't load campaigns."));
  };

  useEffect(() => {
    if (view.mode === "list") {
      loadCampaigns();
      // Autopilot is optional: a 404/403 or network error just hides the card.
      fetchAutopilot(restaurantId)
        .then((a) => setAutopilot(a.available ? a : null))
        .catch(() => setAutopilot(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, view.mode]);

  const backToList = () => setView({ mode: "list" });

  if (view.mode === "new-game" || view.mode === "game-detail") {
    return (
      <GamifiedMarketingTab
        campaignId={view.mode === "game-detail" ? view.campaignId : undefined}
        initialEveryoneWins={view.mode === "new-game" ? view.everyoneWins : undefined}
        onExit={backToList}
      />
    );
  }
  if (view.mode === "new-promo") {
    return <PromoBlastWizard restaurantId={restaurantId} onExit={backToList} />;
  }
  if (view.mode === "autopilot") {
    return <AutopilotPanel restaurantId={restaurantId} onExit={backToList} />;
  }
  if (view.mode === "promo-detail") {
    return <PromoCampaignDetail restaurantId={restaurantId} promoId={view.promoId} onExit={backToList} />;
  }

  const openCampaign = (c: CampaignListItem) => {
    if (c.type === "promo") setView({ mode: "promo-detail", promoId: c.id });
    else setView({ mode: "game-detail", campaignId: c.id });
  };

  const pick = (choice: NewCampaignChoice) => {
    setPickerOpen(false);
    if (choice === "promo") setView({ mode: "new-promo" });
    else setView({ mode: "new-game", everyoneWins: choice === "everyone_wins" });
  };

  const active = (campaigns ?? []).filter((c) => !TERMINAL_STATUSES.has(c.status));
  const history = (campaigns ?? []).filter((c) => TERMINAL_STATUSES.has(c.status));

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-capy-text" style={{ fontFamily: "Tektur, sans-serif" }}>
              Campaigns
            </h2>
            <p className="text-xs text-capy-muted mt-0.5">Games and promotional texts — running now, and everything that already went out.</p>
          </div>
          <div className="flex items-center gap-2">
            {OPTIN_SMS_ENABLED && (
              <button onClick={() => setOptInPanelOpen(true)} className="btn-secondary">
                Opt-in progress
              </button>
            )}
            <button onClick={() => setContactsOpen(true)} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Contacts
            </button>
            <button onClick={() => setPickerOpen(true)} className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New campaign
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}

        {autopilot && <AutopilotCard ap={autopilot} onOpen={() => setView({ mode: "autopilot" })} />}

        {campaigns === null ? (
          <div className="app-card p-4 space-y-3">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (
          <>
            <Section title="Running now" count={active.length}>
              {active.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <div className="text-3xl mb-2">🎮</div>
                  <p className="text-sm font-semibold text-capy-text">Nothing running yet</p>
                  <p className="text-xs text-capy-muted mt-1 mb-4 max-w-sm mx-auto">
                    Pick a game, set a prize, test it on your phone, and launch. Belan takes it from there.
                  </p>
                  <button onClick={() => setPickerOpen(true)} className="btn-primary">Create your first campaign</button>
                </div>
              ) : (
                active.map((c) => <CampaignRow key={`${c.type}-${c.id}`} c={c} onOpen={() => openCampaign(c)} />)
              )}
            </Section>

            <Section title="History" count={history.length} collapsible defaultOpen={history.length > 0}>
              {history.length === 0 ? (
                <p className="text-xs text-capy-muted text-center py-6">Finished and sent campaigns will show up here.</p>
              ) : (
                history.map((c) => <CampaignRow key={`${c.type}-${c.id}`} c={c} onOpen={() => openCampaign(c)} />)
              )}
            </Section>
          </>
        )}
      </div>

      <NewCampaignPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={pick} />

      <ResponsivePanel open={contactsOpen} onClose={() => setContactsOpen(false)} title="Contacts">
        <ContactsPanel restaurantId={restaurantId} />
      </ResponsivePanel>

      {OPTIN_SMS_ENABLED && (
        <ResponsivePanel open={optInPanelOpen} onClose={() => setOptInPanelOpen(false)} title="Opt-In Progress">
          <OptInPanel restaurantId={restaurantId} />
        </ResponsivePanel>
      )}
    </div>
  );
}
