"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useMarketingView, type MarketingView } from "@/lib/marketing-view-context";
import { ThemeToggle } from "@/lib/theme-context";
import { SettingsPanel } from "@/components/marketing/settings/SettingsPanel";

const TABS = [
  { label: "Home", href: "/home" },
  { label: "Configure", href: "/configure" },
  { label: "Customers", href: "/customers" },
];

// Marketing product navigation. Campaigns and Revenue are views on /home;
// Customers is its own route — but all three are rendered together on every
// page so switching between them never makes the others disappear.
const MARKETING_TABS: { key: MarketingView | "customers"; label: string }[] = [
  { key: "campaign", label: "Campaigns" },
  { key: "revenue", label: "Revenue" },
  { key: "customers", label: "Customers" },
];

function tabClass(active: boolean) {
  return `nav-tab-bar relative px-4 pt-1.5 pb-0.5 text-base transition-colors duration-150 ${
    active ? "nav-tab-active text-capy-text" : "text-capy-muted hover:text-capy-text"
  }`;
}

/**
 * Header tabs for marketing-only accounts: one consistent row of
 * Campaigns / Revenue / Customers, wherever you are. Campaigns and Revenue
 * switch the /home view (navigating there first if needed); Customers is a
 * route.
 */
function MarketingHeaderTabs() {
  const { view, setView } = useMarketingView();
  const pathname = usePathname();
  const router = useRouter();
  const onCustomers = pathname.startsWith("/customers");

  const go = (key: MarketingView) => {
    setView(key);
    if (pathname !== "/home") router.push("/home");
  };

  return (
    <nav className="flex items-center gap-1">
      {MARKETING_TABS.map((tab) => {
        if (tab.key === "customers") {
          return (
            <Link
              key={tab.key}
              href="/customers"
              className={tabClass(onCustomers)}
              style={{ fontFamily: "Tektur, sans-serif", fontWeight: 600 }}
            >
              {tab.label}
            </Link>
          );
        }
        const key = tab.key as MarketingView;
        const active = !onCustomers && view === key;
        return (
          <button
            key={key}
            onClick={() => go(key)}
            className={tabClass(active)}
            style={{ fontFamily: "Tektur, sans-serif", fontWeight: 600 }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export function VoiceTopNav() {
  const pathname = usePathname();
  const { signOut, hasSubscription, restaurantId } = useAuth();
  const [hoverState, setHoverState] = useState<Record<string, "hovering" | "leaving" | null>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Configure is part of the ordering product — hide it for accounts
  // without an 'ordering' subscription (e.g. marketing-only owners).
  const visibleTabs = TABS.filter(
    (tab) => tab.href !== "/configure" || hasSubscription("ordering"),
  );
  const marketingOnly = !hasSubscription("ordering");
  const showSettings = hasSubscription("marketing") && !!restaurantId;

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";
    if (href === "/configure") {
      return pathname === "/configure" || pathname.startsWith("/configure/");
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-capy-card border-b border-capy-border flex-shrink-0 relative z-20">
      <div className="flex items-center h-16 px-4 sm:px-6">
        {/* Left — product navigation */}
        <div className="flex-1 flex items-center justify-start min-w-0 overflow-x-auto">
          {marketingOnly ? (
            <MarketingHeaderTabs />
          ) : (
            <nav className="flex items-center gap-1">
              {visibleTabs.length > 1 &&
                visibleTabs.map((tab) => {
                  const active = isActive(tab.href);
                  const hover = hoverState[tab.href];
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      onMouseEnter={() => setHoverState((s) => ({ ...s, [tab.href]: "hovering" }))}
                      onMouseLeave={() => setHoverState((s) => ({ ...s, [tab.href]: "leaving" }))}
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

        {/* Right — theme, settings, sign out, logo */}
        <div className="flex items-center justify-end gap-1 sm:gap-2 py-3 shrink-0">
          <ThemeToggle />
          {showSettings && (
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
              title="Branding, sign-up link & referrals"
              className="w-9 h-9 rounded-full flex items-center justify-center text-capy-muted hover:text-capy-text hover:bg-capy-surface-2 transition-colors"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={signOut}
            className="text-sm text-capy-muted hover:text-capy-text transition-colors px-2"
            style={{ fontFamily: "Tektur, sans-serif", fontWeight: 500 }}
          >
            Sign out
          </button>
          <Link href="/" className="ml-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/BelanLogo.png"
              alt="Belan AI"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-1 ring-capy-border"
            />
          </Link>
        </div>
      </div>

      {showSettings && restaurantId && (
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} restaurantId={restaurantId} />
      )}
    </header>
  );
}
