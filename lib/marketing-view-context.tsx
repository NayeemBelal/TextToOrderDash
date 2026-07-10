"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type MarketingView = "campaign" | "revenue";

interface MarketingViewValue {
  view: MarketingView;
  setView: (v: MarketingView) => void;
}

const MarketingViewContext = createContext<MarketingViewValue | null>(null);

/**
 * Shares the Marketing Campaign/Revenue selection between the top header and the
 * page body. For marketing-only accounts the toggle lives in the header (aligned
 * with the logo); for multi-product accounts it stays in the page's own sub-nav.
 * Both read/write the same state here.
 */
export function MarketingViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<MarketingView>("campaign");
  return (
    <MarketingViewContext.Provider value={{ view, setView }}>
      {children}
    </MarketingViewContext.Provider>
  );
}

export function useMarketingView(): MarketingViewValue {
  const ctx = useContext(MarketingViewContext);
  // Safe fallback for trees rendered outside the provider.
  return ctx ?? { view: "campaign", setView: () => {} };
}
