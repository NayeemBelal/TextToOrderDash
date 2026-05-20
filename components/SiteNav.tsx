"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";

const ease = [0.22, 1, 0.36, 1] as const;

export default function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();
  const isHome = pathname === "/";

  // On sub-pages, hash anchors need the leading /
  const h = (anchor: string) => (isHome ? anchor : `/${anchor}`);

  const navLinks: [string, string][] = [
    [isHome ? "#" : "/", "HOME"],
    [h("#how-it-works"), "HOW IT WORKS"],
    [h("#sandbox-demo"), "TRY IT"],
    [h("#pricing"), "PRICING"],
    ["/about", "ABOUT"],
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b-2 border-black">
      <div className="flex items-center h-14 md:h-16 xl:h-20 2xl:h-24 px-4 md:px-6 xl:px-12 2xl:px-20 gap-4 md:gap-6 max-w-[1920px] mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src="/BelanLogo.png"
            alt="Belan AI"
            className="w-9 h-9 md:w-12 md:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 rounded-full object-cover border-2 border-black"
            whileHover={{ rotate: -5, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          />
          <span className="font-black text-black text-xs md:text-sm xl:text-base tracking-tight">
            BELAN AI
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-0 flex-1">
          {navLinks.map(([href, label], i) => (
            <motion.a
              key={label}
              href={href}
              className={`flex items-center px-4 xl:px-6 h-12 xl:h-14 2xl:h-16 text-xs xl:text-sm font-bold tracking-widest border-r-2 border-black ${
                i === 0 ? "bg-black text-white border-l-2" : "text-black"
              }`}
              whileHover={i !== 0 ? { backgroundColor: "#000", color: "#fff" } : {}}
              transition={{ duration: 0.15 }}
            >
              {label}
            </motion.a>
          ))}

          {/* Integrations dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setIntegrationsOpen(true)}
            onMouseLeave={() => setIntegrationsOpen(false)}
          >
            <motion.button
              className="flex items-center gap-1 px-4 xl:px-6 h-12 xl:h-14 2xl:h-16 text-xs xl:text-sm font-bold tracking-widest border-r-2 border-black text-black"
              whileHover={{ backgroundColor: "#000", color: "#fff" }}
              transition={{ duration: 0.15 }}
            >
              INTEGRATIONS
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${integrationsOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.button>
            <AnimatePresence>
              {integrationsOpen && (
                <motion.div
                  className="absolute top-full left-0 bg-white border-2 border-black border-t-0 z-50 min-w-[180px]"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                >
                  {[
                    { href: "/integrations", label: "All Integrations" },
                    { href: "/integrations/clover", label: "Clover POS" },
                    { href: "/integrations/toast", label: "Toast POS" },
                    { href: "/integrations/square", label: "Square POS" },
                    { href: "/how-it-works", label: "How It Works" },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center px-4 py-3 text-xs font-bold tracking-widest text-black border-b-2 last:border-b-0 border-black hover:bg-black hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right side: auth + CTA + hamburger */}
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          {user ? (
            <motion.div
              className="hidden md:block"
              whileHover={{ y: -3, boxShadow: "3px 3px 0px #000" }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <Link
                href="/home"
                className="block text-xs xl:text-sm font-bold px-4 xl:px-5 py-2 xl:py-2.5 border-2 border-black tracking-widest"
                style={{ background: "#a4e5f8" }}
              >
                GO TO DASHBOARD →
              </Link>
            </motion.div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden md:block text-xs xl:text-sm font-bold text-black tracking-widest hover:underline"
              >
                LOG IN
              </Link>
              <motion.div
                className="hidden md:block"
                whileHover={{ y: -3, boxShadow: "3px 3px 0px #000" }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <Link
                  href="/register"
                  className="block text-xs xl:text-sm font-bold px-4 xl:px-5 py-2 xl:py-2.5 border-2 border-black tracking-widest"
                  style={{ background: "#a4e5f8" }}
                >
                  SIGN UP
                </Link>
              </motion.div>
            </>
          )}
          <motion.div
            whileHover={{ y: -3, boxShadow: "3px 3px 0px #000" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Link
              href="https://calendar.app.google/uCwfd2qfNtjJMSca9"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white text-xs font-bold px-3 md:px-5 xl:px-7 py-2 md:py-2.5 xl:py-3 tracking-widest border-2 border-black block whitespace-nowrap"
            >
              BOOK A DEMO →
            </Link>
          </motion.div>

          {/* Hamburger */}
          <button
            className="md:hidden text-black p-1"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <motion.svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: mobileOpen ? 90 : 0 }}
              transition={{ duration: 0.25 }}
            >
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </motion.svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="md:hidden bg-white/95 border-t-2 border-black px-6 flex flex-col gap-3 text-xs font-bold tracking-widest overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="py-4 flex flex-col gap-3">
              <a href={h("#how-it-works")} onClick={() => setMobileOpen(false)}>HOW IT WORKS</a>
              <a href={h("#sandbox-demo")} onClick={() => setMobileOpen(false)}>TRY IT</a>
              <a href={h("#pricing")} onClick={() => setMobileOpen(false)}>PRICING</a>
              <Link href="/about" onClick={() => setMobileOpen(false)}>ABOUT</Link>

              {/* Integrations accordion */}
              <button
                className="flex items-center justify-between text-left"
                onClick={() => setIntegrationsOpen((o) => !o)}
              >
                <span>INTEGRATIONS</span>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${integrationsOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AnimatePresence>
                {integrationsOpen && (
                  <motion.div
                    className="flex flex-col gap-2 pl-4 border-l-2 border-black"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease }}
                  >
                    <Link href="/integrations" onClick={() => setMobileOpen(false)} className="text-black/70 hover:text-black transition-colors">All Integrations</Link>
                    <Link href="/integrations/clover" onClick={() => setMobileOpen(false)} className="text-black/70 hover:text-black transition-colors">Clover POS</Link>
                    <Link href="/integrations/toast" onClick={() => setMobileOpen(false)} className="text-black/70 hover:text-black transition-colors">Toast POS</Link>
                    <Link href="/integrations/square" onClick={() => setMobileOpen(false)} className="text-black/70 hover:text-black transition-colors">Square POS</Link>
                    <Link href="/how-it-works" onClick={() => setMobileOpen(false)} className="text-black/70 hover:text-black transition-colors">How It Works</Link>
                  </motion.div>
                )}
              </AnimatePresence>

              {user ? (
                <Link href="/home" onClick={() => setMobileOpen(false)}>GO TO DASHBOARD →</Link>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)}>LOG IN</Link>
              )}
              <a
                href="https://calendar.app.google/uCwfd2qfNtjJMSca9"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black text-white px-4 py-2 text-center"
              >
                BOOK A DEMO →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
