"use client";

import { useAdminView } from "@/lib/admin-view-context";
import { AdminRestaurantsTab } from "@/components/admin/AdminRestaurantsTab";
import { AdminBillingTab } from "@/components/admin/AdminBillingTab";
import { AdminInsightsTab } from "@/components/admin/AdminInsightsTab";
import { AdminQROffersTab } from "@/components/admin/AdminQROffersTab";

/** Super-admin grid page body — the tab toggle lives in AdminTopNav. */
export function AdminSection() {
  const { view } = useAdminView();

  return (
    // h-full (not flex-1): this is rendered as a direct child of <main> (a plain
    // block element, not a flex container) via app/admin/page.tsx — flex-1 would
    // be a no-op there, so this div must size off h-full instead.
    <div className="h-full overflow-y-auto">
      {view === "restaurants" && <AdminRestaurantsTab />}
      {view === "billing" && <AdminBillingTab />}
      {view === "insights" && <AdminInsightsTab />}
      {view === "qr-offers" && <AdminQROffersTab />}
    </div>
  );
}
