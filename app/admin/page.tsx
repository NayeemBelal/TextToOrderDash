"use client";

import { useAuth } from "@/lib/auth-context";
import { AdminSection } from "@/components/admin/AdminSection";

/** Super-admin landing page: Restaurants/Billing content (tabs live in AdminTopNav). */
export default function AdminPage() {
  const { isSuperAdmin, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-capy-bg">
        <div className="w-6 h-6 border-2 border-capy-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null; // ConditionalWrapper redirects non-admins away from /admin
  }

  return <AdminSection />;
}
