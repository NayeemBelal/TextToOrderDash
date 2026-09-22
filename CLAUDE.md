# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repo is the Belan AI web frontend (belan.tech; the repo name "TextToOrderDashboard" is historical). It is one Next.js app serving three things:

1. **Public marketing site** — landing page (`app/page.tsx`), `/about`, `/how-it-works`, `/integrations/*`, legal pages, `/docs`, with SEO metadata, JSON-LD schemas (`app/layout.tsx`), per-route `opengraph-image.tsx`, and `app/sitemap.ts`.
2. **Restaurant-owner dashboard** (auth required) — `/home` is the hub, plus `/configure`, `/customers`, `/items`. Two products gated by subscription: **ordering** (voice/SMS ordering analytics, Sales AI) and **marketing** (gamified SMS campaigns, coupon revenue analytics). Marketing is the current focus product.
3. **Customer-facing public pages** reached from SMS links — `/prize/[prize_code]` (coupon page), `/r/[referral_code]`, `/join/[restaurant_slug]` (QR/web opt-in form).

There is also a super-admin area (`/admin`, `/admin/[restaurantId]`).

## Commands

```bash
npm run dev      # Next dev server with Turbopack (port 3000)
npm run build
npm run lint     # next lint (next/core-web-vitals)

npx playwright test                                        # all tests
npx playwright test tests/ai-productivity-insight.spec.ts  # single file
npx playwright test -g "test name"                         # single test
npx playwright test --ui
```

Playwright expects the app on **port 3001** (`playwright.config.ts` baseURL; `reuseExistingServer: true`, but its `webServer.command` is plain `npm run dev`, which starts on 3000 — start the server yourself with `npm run dev -- -p 3001`). The only spec, `tests/ai-productivity-insight.spec.ts`, targets the original MVP dashboard that no longer lives at `/` and is stale.

Deployed on Netlify (`netlify.toml`, `@netlify/plugin-nextjs`). The CSP header is set in `netlify.toml`; other security headers are in `next.config.ts`. A new third-party origin (scripts, frames) requires a CSP update there.

## Environment

Copy `.env.local.example` to `.env.local`. Supabase URL + anon key are **required** (used for auth). `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY_BELAN`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_BELAN`, and `STRIPE_MARKETING_PRICE_ID` are only needed for the marketing onboarding flow (`app/api/marketing-onboarding/*`). The `_BELAN` Stripe keys are Belan's own SaaS billing account — not the per-restaurant Stripe config used for order payments.

Backend URLs live in `lib/config.ts` and **default to the production Cloud Run services**, so `npm run dev` with no overrides talks to prod. Override with `NEXT_PUBLIC_API_BASE_URL` (or `NEXT_PUBLIC_BACKEND_URL`) and `NEXT_PUBLIC_MARKETING_BACKEND_URL` to point at local backends. `lib/config.ts` is deliberately dependency-free so edge routes (opengraph images) can import it without bundling the Supabase client.

Feature flag: `NEXT_PUBLIC_OPTIN_SMS_ENABLED` (`lib/features.ts`) hides the opt-in invitation SMS tooling; off by default pending legal review, and the backend enforces the same gate with a 403.

## Architecture

### Two backends

| Helper (`lib/api.ts`) | Backend | Auth | Serves |
|---|---|---|---|
| `apiFetch` | TextToOrderCoffee (FastAPI) | none | `/api/analytics/*`, voice calls/stats, restaurant config, FAQs, upsell rules, Sales AI — the **ordering** product |
| `marketingApiFetch` / `marketingApiUpload` | belan-marketing-backend | Supabase JWT as Bearer; backend checks `user_metadata.restaurant_id` matches the requested restaurant | `/api/marketing/*`, `/api/prize/*`, `/api/referral/*`, `/api/join/*` — the **marketing** product |

Marketing endpoints get a thin typed client per area in `lib/*Api.ts` (e.g. `campaignConfigApi.ts`, `timelineApi.ts`, `promoCampaignApi.ts`) — add new endpoints there rather than calling `marketingApiFetch` from components. `marketingApiUpload` intentionally omits `Content-Type` (browser must set the multipart boundary) and surfaces the backend's `detail` string as the error message.

The frontend does not query Supabase tables directly; the Supabase client (`lib/supabase.ts`) is used for **auth only**. The exception is the Next API routes under `app/api/marketing-onboarding/`, which use the service-role key server-side to create accounts and Stripe to run checkout.

### Auth, routing, and the app shell

- `app/layout.tsx` wraps everything in `ThemeProvider` → `AuthProvider` → `ConditionalWrapper`.
- `lib/auth-context.tsx` derives everything from the Supabase user's `user_metadata`: `restaurant_id`, `is_super_admin`, `subscriptions`, `marketing_onboarding_complete`. "Remember me" is implemented by hand via `sb_remember_until` (localStorage) / `sb_session_active` (sessionStorage); a Supabase session without either marker is signed out on load.
- `components/ConditionalWrapper.tsx` is the route guard **and** the shell. `FULL_PAGE_ROUTES` lists public routes rendered bare (no auth, no nav) — **a new public page must be added there** or it will redirect to `/login`. Everything else requires a user; super-admins are forced to `/admin`; users with no `restaurant_id` go to `/onboarding` unless they're marketing-onboarded. Authenticated pages render inside a fixed `h-screen overflow-hidden` shell with `ConditionalNav` (`VoiceTopNav` or `AdminTopNav`).
- Because `<main>` is `overflow-hidden` and not a flex container, pages must use `h-full` (not `flex-1`) at their root and manage their own scrolling — see the comment in `app/admin/[restaurantId]/page.tsx`.
- Password reset: `detectSessionInUrl` is disabled on the Supabase client; `/reset-password` reads the recovery hash manually and calls `setSession()`. `AuthProvider` special-cases that path so it doesn't sign the recovery session out. Don't re-enable URL detection.

### Subscriptions and views

- `lib/subscriptions.ts`: `user_metadata.subscriptions` is `('ordering' | 'marketing')[]`. Legacy accounts without it get full access, except marketing-onboarded accounts which get `['marketing']`.
- `app/home/page.tsx` filters its tabs (Manage / Analytics / Sales AI → ordering; Marketing → marketing) by subscription and honors `?tab=`. With only one allowed tab the tab bar is hidden.
- `lib/marketing-view-context.tsx` and `lib/admin-view-context.tsx` share tab selection between the top nav and the page body. Marketing-only accounts switch Campaigns/Analytics from the header; multi-product accounts and super-admins get a local sub-nav inside `MarketingSection`. "Coupon Timeline" and "Messages" views are super-admin only.
- **Always get the restaurant id via `useSelectedRestaurant()`** (`lib/selected-restaurant-context.tsx`) in dashboard components, not `useAuth().restaurantId`. `/admin/[restaurantId]` overrides it with the route param so admins see the same `MarketingSection` the owner sees.

### Component layout

- `components/voice/` — ordering-product dashboard (revenue card, calls, analytics, Sales AI, configure cards). Despite the name, `components/voice/campaign/` and `components/voice/games.ts` hold the **marketing** campaign wizard, game creator, contacts/roster import, and opt-in panels.
- `components/marketing/` — marketing shell (`MarketingSection`), revenue analytics, coupon timeline, messages, settings, and `MarketingDemo` (used on the landing page).
- `components/admin/` — super-admin restaurants grid and billing.
- Root-level `components/*.tsx` and `components/index.ts` are leftovers from the original MVP dashboard. Still in use: `RevenueChart` (shared with `VoiceRevenueCard`), `ItemAnalytics` (also the home of the `TimeFilterValue`/`RevenueDataPoint` types), and `Navbar`/`Sidebar` (only on the `/items` pages).

### Game/campaign message templates

The backend is the source of truth for SMS templates (`GET /api/marketing/campaign-config`). The `FALLBACK_*` constants in `components/voice/games.ts` are copies used only until that fetch resolves — drift there affects previews, never what is sent. Game types are free-form slugs (curated catalog + creator); `LegacyGameType` is just the set with special-case handling. Template placeholders (`{restaurant_name}`, `{prize}`, `{first_name}`, `{code}`, `{link}`, `{expiry}`, …) must match the backend renderer. `lib/smsSegments.ts` handles SMS segment counting.

## Styling

- Tailwind with a themed `capy-*` palette backed by CSS variables in `app/globals.css`; `.dark` on `<html>` flips them (`darkMode: "class"`). Use the `capy-*` tokens (`bg-capy-bg`, `text-capy-muted`, `border-capy-border`, `capy-green`, …) in dashboard UI so both themes work. Opacity modifiers (`bg-capy-green/30`) work with them. The non-variable `capy-dark`/`capy-brown*` colors are legacy.
- `borderRadius` is **overridden** (not extended) to a tight scale — `rounded-lg` is 8px, `rounded-2xl` is 12px.
- Theme: `lib/theme-context.tsx` plus an inline pre-hydration script in `app/layout.tsx` to avoid a flash. The dashboard shell uses the Tektur font (`font-tektur`).
- The marketing site/onboarding wizard use their own inline design tokens (dark background, `#c4b5fd` purple accent, Framer Motion `fadeUp`/`stagger` variants) rather than the `capy-*` palette.
- All monetary values display with 2 decimal places (`minimumFractionDigits: 2`). In chart data, never round `revenue` — keep cent precision for tooltips. Y-axis ticks: `$Xk` at ≥ 1000, `$X.XX` below.

## Docs

`docs/` has deeper context: `MARKETING_FLOW.md`, `campaign-send-architecture.md`, `VOICE_DASHBOARD.md`, `FULL_SYSTEM_CONTEXT.md` (three-repo system overview + shared Supabase schema), `ARCHITECTURE_PLAN.md`. Parts predate the marketing-backend split and subscription gating (e.g. they describe `/` as the dashboard home and mock data that has since been replaced) — verify against code. `README.md`, `components/README.md`, and `.claude/project.md` describe the original MVP and are largely outdated.
