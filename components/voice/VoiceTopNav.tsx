"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMarketingView, type MarketingView } from "@/lib/marketing-view-context";

const TABS = [
  { label: "Home", href: "/home" },
  { label: "Configure", href: "/configure" },
  { label: "Customers", href: "/customers" },
];

// Coupon Timeline and Messages are super-admin-only (see MarketingSection);
// this header toggle is only ever shown to regular (non-admin) owner accounts.
const MARKETING_TABS: { key: MarketingView; label: string }[] = [
  { key: "campaign", label: "Campaign" },
  { key: "revenue", label: "Revenue" },
];

/**
 * Campaign/Revenue toggle rendered in the header's left slot for marketing-only
 * accounts, so it sits on the same row as the logo instead of in a separate bar.
 */
function MarketingHeaderTabs() {
  const { view, setView } = useMarketingView();
  return (
    <nav className="flex items-center gap-1">
      {MARKETING_TABS.map((tab) => {
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
      {/* Customer history is a route (not a view toggle), so it's a Link.
          Surfaced here too, since marketing-only accounts don't see the main nav
          on /home and would otherwise have no way to reach it. */}
      <Link
        href="/customers"
        className="nav-tab-bar relative px-4 pt-1.5 pb-0.5 text-base text-capy-muted hover:text-capy-text transition-colors duration-150"
        style={{ fontFamily: "Tektur, sans-serif", fontWeight: 600 }}
      >
        Customers
      </Link>
    </nav>
  );
}

export function VoiceTopNav() {
  const pathname = usePathname();
  const { signOut, hasSubscription } = useAuth();
  const [hoverState, setHoverState] = useState<
    Record<string, "hovering" | "leaving" | null>
  >({});

  // Configure is part of the ordering product — hide it for accounts
  // without an 'ordering' subscription (e.g. marketing-only owners).
  const visibleTabs = TABS.filter(
    (tab) => tab.href !== "/configure" || hasSubscription("ordering"),
  );
  // Marketing-only accounts (no ordering product) get the Campaign/Revenue toggle
  // in the header instead of a redundant "Home" tab.
  const marketingOnly = !hasSubscription("ordering");

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";
    if (href === "/configure") {
      return pathname === "/configure" || pathname.startsWith("/configure/");
    }
    return pathname.startsWith(href);
  };

  return (
    <header
      className="bg-white flex-shrink-0 relative"
      style={{  }}
    >
      <div className="flex items-center h-16 px-6">
        {/* Left — tabs flush to left edge. Marketing-only accounts have no
            second destination, so instead of a lone "Home" we surface the
            Campaign/Revenue toggle here, aligned with the logo. */}
        <div className="flex-1 flex items-center justify-start">
          {marketingOnly && pathname === "/home" ? (
            <MarketingHeaderTabs />
          ) : (
          <nav className="flex items-center gap-1">
            {visibleTabs.length > 1 && visibleTabs.map((tab) => {
              const active = isActive(tab.href);
              const hover = hoverState[tab.href];
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onMouseEnter={() =>
                    setHoverState((s) => ({ ...s, [tab.href]: "hovering" }))
                  }
                  onMouseLeave={() =>
                    setHoverState((s) => ({ ...s, [tab.href]: "leaving" }))
                  }
                  className={`nav-tab-bar relative px-4 pt-1.5 pb-0.5 text-base transition-colors duration-150 ${
                    active
                      ? "nav-tab-active text-capy-text"
                      : hover === "hovering"
                        ? "nav-tab-hovering text-capy-text"
                        : hover === "leaving"
                          ? "nav-tab-leaving text-capy-muted"
                          : "text-capy-muted"
                  }`}
                  style={{ fontFamily: "Tektur, sans-serif", fontWeight: 600 }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
          )}
        </div>

        {/* Right — sign out + logo */}
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
