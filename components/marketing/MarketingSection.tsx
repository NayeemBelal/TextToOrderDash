"use client";

import { useState } from "react";
import { GamifiedMarketingTab } from "@/components/voice/GamifiedMarketingTab";
import { RevenueAnalyticsTab } from "@/components/marketing/RevenueAnalyticsTab";

type MarketingView = "campaign" | "revenue";

const VIEWS: { key: MarketingView; label: string }[] = [
  { key: "campaign", label: "Campaign" },
  { key: "revenue", label: "Revenue" },
];

/**
 * The Marketing tab shell: a Campaign | Revenue sub-nav over the two marketing
 * surfaces. Gated by the existing `marketing` subscription (no new access needed),
 * so it just appears for marketing accounts.
 */
export function MarketingSection() {
  const [view, setView] = useState<MarketingView>("campaign");

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {view === "campaign" ? <GamifiedMarketingTab /> : <RevenueAnalyticsTab />}
      </div>
    </div>
  );
}
