# Belan Voice AI Dashboard

This document describes the voice AI dashboard that lives at the root of the app (`/`). It is a command center for restaurant owners using Belan, an AI that handles incoming phone calls — taking orders, answering questions, blocking robocallers, and forwarding calls when needed.

The product is called **Belan**. The demo restaurant is **Burrito Bros** (multi-location, Texas/Colorado).

---

## Route Structure

| Route | Page file | What it is |
|---|---|---|
| `/` | `app/page.tsx` | Voice home — Manage / Analytics / Marketing |
| `/configure` | `app/configure/page.tsx` | Voice configuration — Configure / FAQs / Upsells |
| `/items` | `app/items/page.tsx` | Menu items list (legacy, uses old Navbar/Sidebar) |
| `/items/[id]` | `app/items/[id]/page.tsx` | Per-item analytics detail (legacy) |

The global layout (`app/layout.tsx`) wraps every page with `VoiceTopNav` (top nav bar with Home → `/` and Configure → `/configure` links) and sets `h-screen overflow-hidden` so each page controls its own scroll.

---

## Home Page — `app/page.tsx`

Three sub-tabs rendered inline (not separate routes):

### Manage tab (default)
Two cards side-by-side on desktop, stacked on mobile:
- **Left — `VoiceRevenueCard`**: Revenue/Orders area chart with 1H / 24H / 1W / 1M filter pills and a Revenue / Orders view toggle. Fetches real data from the backend API. On mobile the chart fills the card with no inner border box; Y-axis has `pl-3` padding so labels don't touch the card edge.
- **Right — `IncomingCallsCard`**: Live feed of recent incoming calls (phone number, time, duration, status badge). Scrolls internally on desktop so it always fits the viewport height. Powered by `mockCalls` from `lib/mock-voice-data.ts`.

### Analytics tab
Rendered by `VoiceAnalyticsTab`:
- **Date range dropdown** (Last Day / Last 7 Days / Last Month) — custom portal dropdown, not a native select.
- **Top Selling Items card**: Fetches real best-seller data from the backend. Clicking a row shows a seeded 7-day bar chart for that item.
- **9 stat tiles** in a `grid-cols-2 md:grid-cols-3` grid: Total Calls, Call Minutes, Avg Duration, New Callers, Repeat Callers, Minutes Saved, AOV, Successful Upsells, Upsell Revenue. Stats are mock data keyed by date range (`MOCK_STATS`).

### Marketing tab
Rendered by `VoiceMarketingTab`. A 3-step SMS broadcast wizard with a step indicator (numbered circles + connector lines, green checkmark when done):

1. **Recipients** — Scrollable list of unique callers from `mockCalls`. Search by phone number. Select/deselect individually or via "Select all". Shows call status badge (Ordered / Reservation / Forwarded / Robo / No outcome). Footer shows count + Continue button (disabled until ≥1 selected).
2. **Message** — Textarea with 480-char limit, segment counter (160 chars = 1 SMS segment), char count display. Back / Review buttons.
3. **Send** — Review screen with 3 stat pills (Recipients, Segments, Delivery), message text preview, scrollable recipients list with an Edit shortcut back to step 1. Send Broadcast button.
4. **Sent state** — Full-page success card with green checkmark, recipient count, message recap, and "New Broadcast" reset button.

---

## Configure Page — `app/configure/page.tsx`

Three sub-tabs:

### Configure tab (default)
Four cards in a 2×2 grid on desktop, stacked vertically on mobile:

**Top row (fixed height 320px on desktop):**
- **`BrandSnapshotCard`** — Restaurant name, description, cuisine type, address. Editable via an Edit button in the card header (pencil icon, same pattern across all editable cards). Save/Cancel in the header when editing.
- **`AIGreetingCard`** — The AI phone greeting text (editable textarea). Voice selector dropdown — custom portal dropdown with radio dots, voice name + accent, gender symbol, and a play button per row. Voices come from `mockVoices` in mock data.

**Bottom row:**
- **`ForwardingCard`** — The phone number Belan forwards calls to when it cannot handle them. Displays the number in a monospace pill. Edit/Cancel/Save in the card header (same pattern as top cards).
- **`TextToOrderCard`** — Toggle switch to enable/disable SMS ordering. Shows active/disabled status pill.

All four cards share the same header pattern: `px-5 pt-5 pb-3 border-b border-capy-border` with a `card-heading` title and subtitle.

### FAQs tab
Rendered by `FAQEditor`. Full CRUD for FAQ entries (question, answer, category). Search bar + Add FAQ button. Edit/Delete inline per row. Add/edit via a modal. Data from `mockFAQs`.

### Upsells tab
Rendered by `UpsellRuleEditor`. Full CRUD for upsell rules. Each rule: trigger item → suggested item with a toggle to enable/disable. Search bar + Add Rule button. Add/edit via a modal with two custom searchable dropdowns (see below). Data from `mockUpsells`.

---

## Key Components

All voice components live in `components/voice/`.

| Component | File | Notes |
|---|---|---|
| `VoiceTopNav` | `VoiceTopNav.tsx` | Top nav. Home (`/`) and Configure (`/configure`) tabs. Belan logo on the right. Active state via `usePathname`. |
| `VoiceRevenueCard` | `VoiceRevenueCard.tsx` | Revenue chart card. Uses `RevenueChart` with `bare` prop (no inner border wrapper). |
| `IncomingCallsCard` | `IncomingCallsCard.tsx` | Wraps `CallFeed`. `h-full` so it fills desktop viewport. |
| `CallFeed` | `CallFeed.tsx` | Renders list of `CallCard`s. |
| `CallCard` | `CallCard.tsx` | Single call row with phone, time, duration, status badges. |
| `VoiceAnalyticsTab` | `VoiceAnalyticsTab.tsx` | Analytics tab content. See above. |
| `VoiceMarketingTab` | `VoiceMarketingTab.tsx` | Marketing wizard. See above. |
| `AIGreetingCard` | `AIGreetingCard.tsx` | Greeting + voice picker. Voice picker is a portaled custom dropdown (`createPortal`). |
| `BrandSnapshotCard` | `BrandSnapshotCard.tsx` | Editable brand info card. |
| `ForwardingCard` | `ForwardingCard.tsx` | Editable call forwarding number. |
| `FAQEditor` | `FAQEditor.tsx` | FAQ CRUD. |
| `UpsellRuleEditor` | `UpsellRuleEditor.tsx` | Upsell rule CRUD with `MenuItemDropdown`. |

### `MenuItemDropdown` (inside `UpsellRuleEditor.tsx`)
A reusable combobox component used for both the trigger item and suggested item fields in the upsell modal. Behavior:
- Closed state: shows selected value or placeholder, chevron rotates on open.
- Open state: the trigger becomes a live text input that filters `mockMenuItems` as you type. Clicking an item selects it and closes the dropdown.
- Dropdown is portaled to `document.body` via `createPortal` with `getBoundingClientRect()` positioning so it never clips inside a modal.
- Outside-click dismissal via `useEffect` + `mousedown`.
- Matches the visual style of the voice picker in `AIGreetingCard`: `border-capy-border rounded-lg`, green radio dots, `bg-capy-green-light` on selected row.

---

## Mock Data — `lib/mock-voice-data.ts`

All voice UI runs off mock data from this file. Types and exports:

| Export | Type | Used by |
|---|---|---|
| `mockCalls` | `MockCall[]` | `IncomingCallsCard`, `VoiceMarketingTab` |
| `mockLocations` | `MockLocation[]` | (available, not currently rendered) |
| `mockFAQs` | `MockFAQ[]` | `FAQEditor` |
| `mockUpsells` | `MockUpsell[]` | `UpsellRuleEditor` |
| `mockVoices` | `MockVoice[]` | `AIGreetingCard` |
| `mockReportingData` | `MockReportingPoint[]` | (available, not currently rendered) |
| `mockMenuItems` | `string[]` | `UpsellRuleEditor` dropdowns |
| `mockGreeting` | `string` | `AIGreetingCard` |
| `mockForwardingNumber` | `string` | `ForwardingCard` |

---

## Design System

Custom Tailwind tokens (defined in `tailwind.config.ts`):

| Token | Usage |
|---|---|
| `capy-bg` | Page background, input backgrounds |
| `capy-border` | All card/input borders |
| `capy-text` | Primary text |
| `capy-muted` | Secondary/placeholder text |
| `capy-brown` | Edit button color |
| `capy-tan` | Arrow icons |
| `capy-green` | Primary action color, toggles on, upsell arrows |
| `capy-green-dark` | Positive delta text |
| `capy-green-light` | Selected row backgrounds, status pills |

Typography uses **Tektur** (headings, buttons, numbers) and standard sans for body text. `card-heading`, `section-label`, `nav-tab-bar`, `nav-tab-active`, `nav-tab-hovering`, `nav-tab-leaving` are custom CSS classes defined in `app/globals.css`.

### Toggle switch pattern
All toggles use this pattern (not a library component):
```tsx
<button className={`relative block h-6 w-11 rounded-full transition-colors ${checked ? 'bg-capy-green' : 'bg-gray-200'}`}>
  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
</button>
```

---

## Backend API

Two real endpoints are called (others use mock data):

- `GET /api/analytics/revenue` — used by `VoiceRevenueCard`
- `GET /api/analytics/best-sellers` — used by `VoiceAnalyticsTab` → `TopSellingItems`

Both hit `https://text-to-order-coffee-34770846162.us-central1.run.app` with `restaurant_id = a9d9fb45-34a7-4c63-b0d9-70add44b6275` (Lime N Dime, hardcoded for MVP).
