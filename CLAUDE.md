# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TextToOrder Dashboard is a mobile-first command center for restaurant owners using an AI-powered SMS ordering system. The dashboard provides real-time revenue tracking, AI productivity insights, and menu intelligence with a "financial terminal" aesthetic inspired by Robinhood and Bloomberg Terminal.

## Development Commands

```bash
# Development server with Turbopack (faster than standard Next.js dev)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Run Playwright tests
npx playwright test

# Run Playwright tests in UI mode
npx playwright test --ui

# Run specific test file
npx playwright test tests/ai-productivity-insight.spec.ts
```

### Running with Backend

**Terminal 1 - Backend (TextToOrderCoffee):**
```bash
cd /path/to/TextToOrderCoffee
python3 -m uvicorn src.app:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend (TextToOrderDashboard):**
```bash
cd /path/to/TextToOrderDashboard
npm run dev
# Opens on http://localhost:3000 (or 3002 if 3000 is taken)
```

The dashboard will automatically fetch data from the backend on load and when filters change.

## Environment Setup

**Prerequisites:**
1. TextToOrderCoffee backend must be running on `http://localhost:8000`
2. Backend CORS must allow frontend ports (3000, 3001, 3002)

**Environment Variables:**
1. Copy `.env.local.example` to `.env.local`
2. Add Supabase credentials (for future direct integrations):
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: (Optional) For server-side operations

**Note:** Current dashboard analytics do NOT use these Supabase env vars - they fetch from the backend API instead.

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **Charts**: Recharts for data visualization
- **Animations**: Framer Motion (AnimatePresence, motion.div, spring animations)
- **Backend API**: FastAPI (TextToOrderCoffee backend)
- **Database**: Supabase (PostgreSQL) - accessed via backend API only
- **Testing**: Playwright

### Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home dashboard page
│   ├── layout.tsx         # Root layout with FloatingChatbot
│   ├── items/             # Menu item analytics pages
│   └── marketing/         # Marketing page
├── components/            # React components (see Components section)
├── lib/
│   ├── supabase.ts       # Supabase client initialization
│   └── utils.ts          # Utility functions
├── types/
│   └── index.ts          # TypeScript type definitions
└── tests/                # Playwright test files
```

### Key Architecture Patterns

1. **Client Components**: Most dashboard components are client-side (`'use client'`) for interactivity
2. **Component Composition**: Components are composed through `components/index.ts` for clean imports
3. **Data Flow**: Frontend fetches from backend API only - NO direct Supabase access from frontend
4. **Backend API First**: All data processing, aggregation, and filtering happens in the FastAPI backend
5. **Layout Pattern**: Sidebar navigation on desktop, mobile-responsive with FloatingChatbot in root layout

### Component Architecture

All components are exported through `components/index.ts`. Key components:

- **RevenueDashboard**: Main orchestrator component that fetches real data from backend API, manages time filters, view modes, and loading states
- **RevenueHero**: Large revenue/orders display with delta indicator and animated number counter (uses real metadata from API)
- **RevenueChart**: Interactive Recharts area chart with scrubbing functionality (displays real time-series data). **Important**: do NOT round `revenue` values in `chartData` — preserve decimals for accurate tooltip display.
- **TimeFilter**: Pill-style time range selector (1H, 24H, 1W, 1M) - triggers API refetch on change
- **BestSellers**: Top 5 menu items with trend indicators (real data from order_items aggregation)
- **Sidebar**: Desktop navigation with restaurant branding
- **FloatingChatbot**: AI chatbot widget (rendered in root layout). Has a dismiss button that collapses it into a floating bubble in the bottom-right corner using Framer Motion spring animations. Uses `inset-x-0 flex justify-center` (not `-translate-x-1/2`) to avoid transform conflicts with framer-motion.
- **ItemAnalytics**: Detailed analytics for individual menu items — fetches real time-series data from `/api/analytics/item-analytics` by `item_name`

### Design System

The dashboard follows a **"High-Contrast Financial Terminal"** aesthetic:

**Typography:**
- Outfit (Bold/Black): Hero revenue numbers
- DM Sans: UI elements
- JetBrains Mono: Data points and technical information

**Color Palette:**
- Deep Navy-Black: `#0A0E1A` to `#1A1F2E` (backgrounds)
- Electric Green: `#10B981` (growth indicators)
- Vibrant Red: `#EF4444` (decline indicators)
- Warm Orange: `#F59E0B` (neutral/small changes)
- Cyan Accents: `#06B6D4` (interactive elements)

**Animation Principles:**
- Number counter animations (800ms)
- Staggered entrance animations (50ms delays)
- Smooth transitions for state changes
- Glow effects on positive metrics

**Mobile-First:**
- Minimum 44px touch targets
- Horizontal scroll for filters on small screens
- Large readable numbers (7xl-8xl text)
- Generous spacing throughout

### Data Types

Core types in `types/index.ts`:
- `Order`: Order data with items, status, totals
- `OrderItem`: Individual menu items with modifiers
- `Restaurant`: Restaurant metadata
- `RevenueData`: Time-series revenue points
- `MenuItemStats`: Item popularity and trends
- `TimeFilter`: Time range options
- `MenuItem`: Full Clover menu item (id, name, price, price_cents, category, category_id, available, orders, revenue, modifier_groups)
- `MenuItemModifier`, `MenuItemModifierGroup`: Modifier structure from Clover
- `MenuCategory`, `MenuItemsResponse`: For the `/items` page API response

### Testing

- Playwright tests are in `tests/` directory
- Test server runs on port 3001 (configured in `playwright.config.ts`)
- Use `npx playwright test --ui` for interactive debugging
- Screenshots saved on test failures only

## Important Notes

### Backend API Integration

The dashboard fetches real data from the TextToOrderCoffee FastAPI backend. **DO NOT connect directly to Supabase from the frontend.**

**API Configuration** (in `components/RevenueDashboard.tsx`):
```typescript
const RESTAURANT_ID = 'a9d9fb45-34a7-4c63-b0d9-70add44b6275';  // Lime N Dime (hardcoded for MVP)
const API_BASE_URL = 'http://localhost:8000';
```

**Analytics Endpoints:**

1. **Revenue Analytics**: `GET /api/analytics/revenue`
   - Query params: `restaurant_id`, `time_range` (1h/24h/1w/1m), `timezone` (default UTC)
   - Returns: Time-series data with revenue/orders per bucket + metadata (totals, deltas, comparison labels)
   - Auto-filters test data (excludes +1555 numbers and specific test phone numbers)

2. **Best Sellers**: `GET /api/analytics/best-sellers`
   - Query params: `restaurant_id`, `time_range` (1w/1m), `limit` (default 5)
   - Returns: Top selling items with order counts, revenue, and trend percentages
   - Auto-filters test data

3. **Menu Items**: `GET /api/analytics/menu-items`
   - Query params: `restaurant_id`, `category_id` (optional), `time_range` (default 1m), `sandbox` (bool)
   - Returns: Full Clover menu merged with real sales stats (orders, revenue) per item
   - Merges Clover API data (menu structure) with Supabase `order_items` aggregation by item name
   - Used by `app/items/page.tsx` — real items replace the old hardcoded fake list

4. **Item Analytics**: `GET /api/analytics/item-analytics`
   - Query params: `restaurant_id`, `item_name`, `time_range` (default 24h)
   - Returns: Time-series revenue/orders for a specific menu item (same shape as revenue analytics)
   - Used by `components/ItemAnalytics.tsx` — replaces old fake sine-wave data

**Data Flow:**
1. Component mounts → `useEffect` fetches initial data via `fetchRevenueData()` and `fetchBestSellers()`
2. User changes filter → `handleFilterChange()` calls API with new time range
3. Backend aggregates data, filters test orders, calculates deltas
4. Frontend displays data using existing components (RevenueChart, BestSellers)

**Test Data Filtering** (handled in backend):
- Automatically excludes phone numbers starting with `+1555` (test prefix)
- Excludes specific test numbers: `+12033007233`, `+14698186844`, `+16827129222`
- Ensures analytics only show real customer data

### Currency Precision
All monetary values must display with 2 decimal places (`minimumFractionDigits: 2`). This applies to:
- `lib/utils.ts` → `formatCurrency()`
- `components/RevenueHero.tsx` → counter formatter
- `components/BestSellers.tsx` → revenue display
- `components/RevenueChart.tsx` → tooltip formatter and YAxis tickFormatter

**YAxis formatter**: values ≥ 1000 display as `$Xk`, values < 1000 display as `$X.XX` (not `$0k`).

**Do NOT round revenue in chart data**: `chartData` must use `revenue: d.revenue` (not `Math.round(d.revenue)`) to preserve cent-level precision in tooltips.

### Pages

- **`app/items/page.tsx`**: Fetches real Clover menu items from `/api/analytics/menu-items`. Has category dropdown filter, 7D/30D time range toggle, loading skeleton, and error state with retry. Uses `available` field (not `isOrderable`).
- **`app/items/[id]/page.tsx`**: Fetches all items from API, finds by Clover item ID. Shows category badge, price, 30-day orders/revenue stats. Does NOT show modifier groups.

### Component State Management
- Most components use local useState for UI state
- No global state management library is used
- Future: Consider React Context or Zustand if global state is needed

### Supabase Integration
- **IMPORTANT**: Frontend does NOT connect directly to Supabase
- All database queries go through the FastAPI backend (`http://localhost:8000/api/*`)
- The `lib/supabase.ts` client exists but should NOT be used for analytics data
- Backend handles all data aggregation, filtering, and business logic
- Frontend only consumes processed data via REST API endpoints

### Design Philosophy
This is not a generic admin dashboard. Every design decision prioritizes:
1. Mobile-first experience for busy restaurant owners
2. Instant validation that the AI system is working
3. Financial app aesthetic for trust and professionalism
4. Satisfying interactions (animations, counters) for positive psychology

Read `components/README.md` for detailed design rationale and component documentation.
