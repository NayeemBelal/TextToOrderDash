"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const TABS = [
  { label: "Home", href: "/" },
  { label: "Configure", href: "/configure" },
];

export function VoiceTopNav() {
  const pathname = usePathname();
  const [hoverState, setHoverState] = useState<
    Record<string, "hovering" | "leaving" | null>
  >({});

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
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
        {/* Left — tabs flush to left edge */}
        <div className="flex-1 flex items-center justify-start">
          <nav className="flex items-center gap-1">
            {TABS.map((tab) => {
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
        </div>

        {/* Right — logo */}
        <div className="flex-1 flex items-center justify-end py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/BelanLogo.png"
            alt="Belan AI"
            className="w-16 h-16 rounded-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
