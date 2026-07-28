"use client";

import { useAuth } from "@/lib/auth-context";
import { useSelectedRestaurant } from "@/lib/selected-restaurant-context";
import { useMarketingView, type MarketingView } from "@/lib/marketing-view-context";
import { CampaignsListView } from "@/components/voice/campaign/CampaignsListView";
import { RevenueAnalyticsTab } from "@/components/marketing/RevenueAnalyticsTab";
import { CouponTimelineTab } from "@/components/marketing/timeline/CouponTimelineTab";
import { MessagesTab } from "@/components/marketing/messages/MessagesTab";

const BASE_VIEWS: { key: MarketingView; label: string }[] = [
  { key: "campaign", label: "Campaign" },
  { key: "revenue", label: "Revenue" },
];

// Super-admin-only: internal ops tooling, not part of the owner-facing product.
const ADMIN_VIEWS: { key: MarketingView; label: string }[] = [
  { key: "timeline", label: "Coupon Timeline" },
  { key: "messages", label: "Messages" },
];

/**
 * The Marketing tab shell over the Campaign and Revenue surfaces.
 *
 * The view selection is shared (marketing-view-context): marketing-only accounts
 * drive it from the header toggle (aligned with the logo), so this component
 * renders only the content. Multi-product accounts, whose header shows the
 * ordering tabs, get the Campaign/Revenue sub-nav here instead.
 *
 * Coupon Timeline and Messages are gated to isSuperAdmin — restaurant owners
 * never see these tabs, only the super-admin viewing a restaurant via /admin.
 */
export function MarketingSection() {
  const { view, setView } = useMarketingView();
  const { hasSubscription, isSuperAdmin } = useAuth();
  const restaurantId = useSelectedRestaurant();
  const showLocalNav = hasSubscription("ordering") || isSuperAdmin;
  const views = isSuperAdmin ? [...BASE_VIEWS, ...ADMIN_VIEWS] : BASE_VIEWS;
  // Safety fallback: a non-admin should never render an admin-only view, even
  // if shared view state was left on "timeline"/"messages" from a prior session.
  const activeView = isSuperAdmin || (view !== "timeline" && view !== "messages") ? view : "campaign";

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      {showLocalNav && (
        <div className="flex items-center gap-1 flex-shrink-0 px-4 border-b border-capy-border">
          {views.map((v) => {
            const active = activeView === v.key;
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
        {activeView === "campaign" ? (
          restaurantId ? (
            <CampaignsListView restaurantId={restaurantId} />
          ) : (
            <div className="h-full flex items-center justify-center p-6 text-sm text-capy-muted">
              No restaurant linked to this account.
            </div>
          )
        ) : activeView === "revenue" ? (
          <RevenueAnalyticsTab />
        ) : activeView === "timeline" ? (
          <CouponTimelineTab />
        ) : (
          <MessagesTab />
        )}
      </div>
    </div>
  );
}
