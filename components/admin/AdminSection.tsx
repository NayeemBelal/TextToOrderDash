"use client";

import { useAdminView } from "@/lib/admin-view-context";
import { AdminRestaurantsTab } from "@/components/admin/AdminRestaurantsTab";
import { AdminBillingTab } from "@/components/admin/AdminBillingTab";

/** Super-admin grid page body — the Restaurants/Billing toggle lives in AdminTopNav. */
export function AdminSection() {
  const { view } = useAdminView();

  return (
    // h-full (not flex-1): this is rendered as a direct child of <main> (a plain
    // block element, not a flex container) via app/admin/page.tsx — flex-1 would
    // be a no-op there, so this div must size off h-full instead.
    <div className="h-full overflow-y-auto">
      {view === "restaurants" ? <AdminRestaurantsTab /> : <AdminBillingTab />}
    </div>
  );
}
