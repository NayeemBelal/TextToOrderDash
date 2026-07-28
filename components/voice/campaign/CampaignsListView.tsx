"use client";

import { useEffect, useState } from "react";
import { fetchAllCampaigns, type CampaignListItem } from "@/lib/campaignsListApi";
import { Skeleton } from "@/components/ui/Skeleton";
import { GamifiedMarketingTab } from "@/components/voice/GamifiedMarketingTab";
import { PromoBlastWizard } from "@/components/voice/campaign/PromoBlastWizard";
import { PromoCampaignDetail } from "@/components/voice/campaign/PromoCampaignDetail";

type View =
  | { mode: "list" }
  | { mode: "new-game"; everyoneWins: boolean }
  | { mode: "game-detail"; campaignId: string }
  | { mode: "new-promo" }
  | { mode: "promo-detail"; promoId: string };

const TYPE_LABEL: Record<CampaignListItem["type"], string> = {
  classic: "Classic Game",
  everyone_wins: "Everyone Wins",
  promo: "Promo",
};

const TYPE_BADGE_CLASS: Record<CampaignListItem["type"], string> = {
  classic: "bg-slate-100 text-slate-600",
  everyone_wins: "bg-capy-green-light text-capy-green-dark",
  promo: "bg-amber-100 text-amber-700",
};

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "active" || status === "sent"
      ? "bg-capy-green-light text-capy-green-dark"
      : status === "paused" || status === "pending"
        ? "bg-amber-100 text-amber-700"
        : status === "failed"
          ? "bg-red-100 text-red-700"
          : "bg-slate-100 text-slate-500";
  return <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium capitalize ${cls}`}>{status}</span>;
}

/** Restaurant-wide list of all campaigns (classic games, everyone-wins games,
 * and promo blasts), each runnable concurrently. Click a row for its detail
 * view; the "+" button picks which of the three types to create next. */
export function CampaignsListView({ restaurantId }: { restaurantId: string }) {
  const [view, setView] = useState<View>({ mode: "list" });
  const [campaigns, setCampaigns] = useState<CampaignListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadCampaigns = () => {
    fetchAllCampaigns(restaurantId)
      .then((r) => setCampaigns(r.campaigns))
      .catch(() => setError("Couldn't load campaigns."));
  };

  useEffect(() => {
    if (view.mode === "list") loadCampaigns();
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

  if (view.mode === "promo-detail") {
    return <PromoCampaignDetail restaurantId={restaurantId} promoId={view.promoId} onExit={backToList} />;
  }

  const openCampaign = (c: CampaignListItem) => {
    if (c.type === "promo") setView({ mode: "promo-detail", promoId: c.id });
    else setView({ mode: "game-detail", campaignId: c.id });
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-capy-text">Campaigns</h2>
            <p className="text-xs text-capy-muted">Games and promotional blasts, all in one place</p>
          </div>
          <button
            onClick={() => setPickerOpen(true)}
            className="w-9 h-9 rounded-full bg-capy-green text-white text-xl font-bold flex items-center justify-center hover:bg-capy-green-dark transition-colors shrink-0"
            aria-label="New campaign"
          >
            +
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="bg-white rounded-2xl border border-capy-border shadow-sm overflow-hidden">
          {campaigns === null ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-capy-muted mb-3">No campaigns yet.</p>
              <button
                onClick={() => setPickerOpen(true)}
                className="px-4 py-2 rounded-xl bg-capy-green text-white text-sm font-semibold hover:bg-capy-green-dark transition-colors"
              >
                Create your first campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-capy-muted uppercase tracking-wide border-b border-capy-border">
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Schedule</th>
                    <th className="px-4 py-2.5 font-medium text-right">Recipients</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr
                      key={`${c.type}-${c.id}`}
                      onClick={() => openCampaign(c)}
                      className="border-t border-capy-border/60 first:border-t-0 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${TYPE_BADGE_CLASS[c.type]}`}>
                          {TYPE_LABEL[c.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-capy-text">{c.schedule_label}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-capy-text">{c.recipient_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPickerOpen(false)} aria-hidden />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="card-heading">New campaign</p>
              <button onClick={() => setPickerOpen(false)} className="text-capy-muted hover:text-capy-text" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <button
              onClick={() => {
                setPickerOpen(false);
                setView({ mode: "new-game", everyoneWins: false });
              }}
              className="w-full text-left px-4 py-3 rounded-xl border border-capy-border hover:border-capy-green hover:bg-slate-50 transition-colors"
            >
              <p className="text-sm font-semibold text-capy-text">Classic Game</p>
              <p className="text-xs text-capy-muted mt-0.5">Trivia, pick-a-number, etc. — one winner per round</p>
            </button>

            <button
              onClick={() => {
                setPickerOpen(false);
                setView({ mode: "new-game", everyoneWins: true });
              }}
              className="w-full text-left px-4 py-3 rounded-xl border border-capy-border hover:border-capy-green hover:bg-slate-50 transition-colors"
            >
              <p className="text-sm font-semibold text-capy-text">Everyone Wins Game</p>
              <p className="text-xs text-capy-muted mt-0.5">Same games, but every reply wins a prize</p>
            </button>

            <button
              onClick={() => {
                setPickerOpen(false);
                setView({ mode: "new-promo" });
              }}
              className="w-full text-left px-4 py-3 rounded-xl border border-capy-border hover:border-capy-green hover:bg-slate-50 transition-colors"
            >
              <p className="text-sm font-semibold text-capy-text">Promotional Message</p>
              <p className="text-xs text-capy-muted mt-0.5">Write your own one-off message, optional coupon</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
