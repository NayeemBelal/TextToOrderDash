"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useAdminView, type AdminView } from "@/lib/admin-view-context";

const ADMIN_TABS: { key: AdminView; label: string }[] = [
  { key: "restaurants", label: "Restaurants" },
  { key: "billing", label: "Billing" },
];

/**
 * Same header chrome as VoiceTopNav (logo + sign out on the right, a header-level
 * tab toggle on the left) so the super-admin view reads as the same product,
 * not a separate "admin panel" — just different tabs, no "Admin" label anywhere.
 */
export function AdminTopNav() {
  const { signOut } = useAuth();
  const { view, setView } = useAdminView();
  const router = useRouter();
  const pathname = usePathname();
  const onGrid = pathname === "/admin";

  return (
    <header className="bg-white flex-shrink-0 relative">
      <div className="flex items-center h-16 px-6">
        <div className="flex-1 flex items-center justify-start">
          {onGrid ? (
            <nav className="flex items-center gap-1">
              {ADMIN_TABS.map((tab) => {
                const active = view === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setView(tab.key)}
                    className={`nav-tab-bar relative px-4 pt-1.5 pb-0.5 text-base transition-colors duration-150 ${
                      active ? "nav-tab-active text-capy-text" : "text-capy-muted hover:text-capy-text"
                    }`}
                    style={{ fontFamily: "Tektur, sans-serif", fontWeight: 600 }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          ) : (
            <button
              onClick={() => router.push("/admin")}
              aria-label="Back to all restaurants"
              className="p-2 -ml-2 rounded-lg text-capy-muted hover:text-capy-text hover:bg-slate-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex-1 flex items-center justify-end gap-4 py-3">
          <button
            onClick={signOut}
            className="text-sm text-capy-muted hover:text-capy-text transition-colors"
            style={{ fontFamily: "Tektur, sans-serif", fontWeight: 500 }}
          >
            Sign out
          </button>
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/BelanLogo.png"
              alt="Belan AI"
              className="w-16 h-16 rounded-full object-cover"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
