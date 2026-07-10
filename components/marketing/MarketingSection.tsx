"use client";

import { useAuth } from "@/lib/auth-context";
import { useMarketingView, type MarketingView } from "@/lib/marketing-view-context";
import { GamifiedMarketingTab } from "@/components/voice/GamifiedMarketingTab";
import { RevenueAnalyticsTab } from "@/components/marketing/RevenueAnalyticsTab";

const VIEWS: { key: MarketingView; label: string }[] = [
  { key: "campaign", label: "Campaign" },
  { key: "revenue", label: "Revenue" },
];

/**
 * The Marketing tab shell over the Campaign and Revenue surfaces.
 *
 * The view selection is shared (marketing-view-context): marketing-only accounts
 * drive it from the header toggle (aligned with the logo), so this component
 * renders only the content. Multi-product accounts, whose header shows the
 * ordering tabs, get the Campaign/Revenue sub-nav here instead.
 */
export function MarketingSection() {
  const { view, setView } = useMarketingView();
  const { hasSubscription } = useAuth();
  const showLocalNav = hasSubscription("ordering");

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {showLocalNav && (
        <div className="flex items-center gap-1 flex-shrink-0 px-4 border-b border-capy-border">
          {VIEWS.map((v) => {
            const active = view === v.key;
            return (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`relative px-3 pb-2 pt-1 text-sm transition-colors -mb-px border-b-2 ${
                  active
                    ? "border-capy-green text-capy-text font-semibold"
                    : "border-transparent text-capy-muted hover:text-capy-text"
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Single page-level scroll: inner lists keep their own scroll. */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {view === "campaign" ? <GamifiedMarketingTab /> : <RevenueAnalyticsTab />}
      </div>
    </div>
  );
}
