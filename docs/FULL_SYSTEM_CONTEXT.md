# Belan Full System Context

This document is the single source of truth for the three projects that make up the Belan restaurant AI platform. Use it to understand the full system before building any integration work.

---

## Table of Contents
1. [System Overview](#system-overview)
2. [TextToOrderDashboard — Frontend](#1-texttoorderdashboard--frontend)
3. [TextToOrderCoffee — SMS Backend](#2-texttoordercoffee--sms-backend)
4. [RestaurantVoiceAI — Voice Backend](#3-restaurantvoiceai--voice-backend)
5. [Database Schema (Shared Supabase)](#4-database-schema-shared-supabase)
6. [Backend Integration Gaps](#5-backend-integration-gaps)
7. [Mock Data → Real API Mapping](#6-mock-data--real-api-mapping)
8. [Design System Quick Reference](#7-design-system-quick-reference)

---

## System Overview

**Belan** is an AI-powered phone ordering system for restaurants. Customers call a restaurant's phone number; Belan's voice AI answers, takes their order, and sends a Stripe checkout link via SMS. Restaurant owners manage everything through the Belan Dashboard.

### Three-Repo Architecture

| Repo | Path | Purpose |
|------|------|---------|
| `TextToOrderDashboard` | `/Users/nayeembelal/Downloads/TextToOrderDashboard` | Next.js 15 dashboard — restaurant owner's command center |
| `TextToOrderCoffee` | `/Users/nayeembelal/Downloads/TextToOrderCoffee` | FastAPI backend — SMS ordering + analytics API |
| `RestaurantVoiceAI` | `/Users/nayeembelal/workspace/ResturauntVoiceAi` | Node.js/Express backend — voice call handling |

### Demo Restaurant
- **Name**: Burrito Bros (multi-location, TX/CO) in marketing copy; actual live data is **Lime N Dime**
- **Restaurant ID**: `a9d9fb45-34a7-4c63-b0d9-70add44b6275` (hardcoded for MVP in both backends and frontend)
- **SMS API**: `https://text-to-order-coffee-34770846162.us-central1.run.app`

### Data Flow (End-to-End)
```
Customer calls Telnyx number
    ↓
RestaurantVoiceAI handles call via Ultravox voice AI
    ↓
Cart persisted to Supabase (conversations.current_cart)
    ↓
AI sends Stripe checkout link via SMS
    ↓
Customer pays → Stripe webhook → order placed in Clover POS
    ↓
Order, order_items, customer written to Supabase
    ↓
TextToOrderCoffee analytics API reads from Supabase
    ↓
TextToOrderDashboard fetches from analytics API → displays to owner
```

---

## 1. TextToOrderDashboard — Frontend

**Tech**: Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS, Recharts

### Routes

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Home — Manage / Analytics / Marketing tabs |
| `/configure` | `app/configure/page.tsx` | Configure — Configure / FAQs / Upsells tabs |
| `/items` | `app/items/page.tsx` | Menu items list (legacy) |
| `/items/[id]` | `app/items/[id]/page.tsx` | Per-item analytics (legacy) |

### Global Layout
`app/layout.tsx` wraps all pages with `VoiceTopNav`. Full-screen height, each page controls its own scroll.

### Home Page (`/`) — Three Sub-tabs

**Manage tab (default)**
- `VoiceRevenueCard` — Revenue/Orders area chart. Calls `GET /api/analytics/revenue`.
- `IncomingCallsCard` — Live call feed. Currently uses `mockCalls` — **needs real API**.

**Analytics tab**
- `VoiceAnalyticsTab` — Date range dropdown + Top Selling Items + 9 stat tiles.
- Top Selling Items calls `GET /api/analytics/best-sellers`.
- 9 stat tiles (Total Calls, Call Minutes, Avg Duration, New Callers, Repeat Callers, Minutes Saved, AOV, Successful Upsells, Upsell Revenue) are currently **all mock data** — **need real APIs**.

**Marketing tab**
- `VoiceMarketingTab` — 3-step SMS broadcast wizard.
- Step 1 recipient list uses `mockCalls` for phone numbers — **needs real API**.
- Send functionality is currently a no-op — **needs real SMS API**.

### Configure Page (`/configure`) — Three Sub-tabs

**Configure tab (default)**
All four cards use mock/hardcoded data. **All need real API backing.**
- `BrandSnapshotCard` — Restaurant name, description, cuisine, address (hardcoded "Lime N Dime" values).
- `AIGreetingCard` — Greeting text + voice selector. Uses `mockGreeting`, `mockVoices`.
- `ForwardingCard` — Forwarding phone number. Uses `mockForwardingNumber`.
- `TextToOrderCard` — SMS ordering toggle. State is local only.

**FAQs tab** — `FAQEditor` — CRUD for FAQ entries. Uses `mockFAQs`.

**Upsells tab** — `UpsellRuleEditor` — CRUD for upsell rules. Uses `mockUpsells`, `mockMenuItems`.

### All Voice Components (in `components/voice/`)

| Component | File | Data Needed |
|-----------|------|-------------|
| VoiceTopNav | VoiceTopNav.tsx | None |
| VoiceRevenueCard | VoiceRevenueCard.tsx | `/api/analytics/revenue` ✅ wired |
| IncomingCallsCard | IncomingCallsCard.tsx | `mockCalls` ❌ needs API |
| CallFeed | CallFeed.tsx | MockCall[] |
| CallCard | CallCard.tsx | MockCall |
| VoiceAnalyticsTab | VoiceAnalyticsTab.tsx | `/api/analytics/best-sellers` ✅ partial; stat tiles ❌ |
| VoiceMarketingTab | VoiceMarketingTab.tsx | `mockCalls` ❌ |
| AIGreetingCard | AIGreetingCard.tsx | `mockGreeting`, `mockVoices` ❌ |
| BrandSnapshotCard | BrandSnapshotCard.tsx | Hardcoded ❌ |
| ForwardingCard | ForwardingCard.tsx | `mockForwardingNumber` ❌ |
| FAQEditor | FAQEditor.tsx | `mockFAQs` ❌ |
| UpsellRuleEditor | UpsellRuleEditor.tsx | `mockUpsells`, `mockMenuItems` ❌ |

### Existing Real API Calls

All hit `https://text-to-order-coffee-34770846162.us-central1.run.app` with `restaurant_id=a9d9fb45-34a7-4c63-b0d9-70add44b6275`.

**GET `/api/analytics/revenue`**
```
Params: restaurant_id, time_range (1h|24h|1w|1m), timezone=UTC
Response: {
  data: [{ timestamp: string, revenue: number, orders: number }],
  metadata: { total_revenue, total_orders, revenue_delta_pct, orders_delta_pct }
}
```

**GET `/api/analytics/best-sellers`**
```
Params: restaurant_id, time_range (1w|1m), limit=5
Response: {
  items: [{ id, name, orders, revenue, trend }]
}
```

**GET `/api/analytics/item-analytics`** (items/[id] page)
```
Params: restaurant_id, item_name, time_range
Response: {
  data: [{ timestamp, revenue, orders }],
  metadata: { total_revenue, total_orders, previous_period_revenue, previous_period_orders,
              revenue_delta_pct, orders_delta_pct, comparison_label, interval }
}
```

**GET `/api/analytics/menu-items`** (items/ page)
```
Params: restaurant_id, time_range (1w|1m)
Response: { items: MenuItem[], categories: MenuCategory[] }
```

---

## 2. TextToOrderCoffee — SMS Backend

**Path**: `/Users/nayeembelal/Downloads/TextToOrderCoffee`
**Tech**: FastAPI (Python 3.9+), Uvicorn, LangChain, Supabase, pgvector
**Production URL**: `https://text-to-order-coffee-34770846162.us-central1.run.app`

### What It Does
AI-powered SMS ordering: customers text orders in natural language, an LLM parses them using "OneFlow" (single system prompt with full menu), and the system handles the entire order lifecycle through to Clover POS placement and Stripe payment.

### Project Structure
```
src/
├── app.py                    # Main FastAPI entry point
├── api/
│   ├── analytics.py          # Dashboard analytics endpoints
│   └── marketing.py          # Marketing API
├── core/
│   ├── orchestrator.py       # Main flow coordinator
│   └── handlers/oneflow.py   # OneFlow v2 (single LLM prompt)
├── database/
│   ├── db.py                 # DatabaseClient (Supabase wrapper)
│   └── models.py             # Pydantic models
├── llm/client.py             # OpenRouter LLM client
├── integrations/
│   ├── clover/               # Clover POS (menu sync, orders, payments)
│   └── stripe/               # Stripe checkout + webhooks
├── services/
│   ├── sms_provider.py       # Twilio / Telnyx (pluggable)
│   ├── consent_manager.py    # TCPA opt-in/out
│   └── menu_scheduler.py     # Background menu sync
└── rag/search.py             # Supabase pgvector menu search
```

### All API Endpoints

#### Customer-Facing Webhooks
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/webhook/sms` | Twilio inbound SMS |
| POST | `/webhook/sms/telnyx` | Telnyx inbound SMS |
| POST | `/webhook/status` | SMS delivery status |

#### Payment Webhooks
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/webhook/stripe/{restaurant_slug}` | Stripe checkout.session.completed |
| GET | `/pay/stripe-success` | Stripe success redirect page |
| GET | `/pay/stripe-cancel` | Stripe cancellation redirect |
| POST | `/webhook/clover-payment` | Clover iframe payment |
| GET | `/webhook/payment-callback` | Clover hosted payment callback |
| GET | `/pay/{session_id}` | Payment page (iframe or hosted) |
| POST | `/api/process-payment` | Process iframe payment |

#### Analytics (Dashboard)
| Method | Endpoint | Params | Notes |
|--------|----------|--------|-------|
| GET | `/api/analytics/revenue` | `restaurant_id`, `time_range`, `timezone` | Wired to dashboard |
| GET | `/api/analytics/best-sellers` | `restaurant_id`, `time_range`, `limit` | Wired to dashboard |

#### Admin/Testing
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/sync-menu/{restaurant_id}` | Manual Clover menu sync |
| GET | `/api/restaurants` | List all restaurants |
| GET | `/api/orders/{order_id}` | Get order details |
| POST | `/api/send-sms` | Send SMS (testing) |
| GET | `/health` | Health check |

### OneFlow Architecture
The LLM conversation handler uses a single system prompt containing the compressed menu + current cart state. LLM returns structured JSON:
```json
{
  "message": "text to send to customer",
  "oneflow_cart": [...],
  "ready_for_checkout": false,
  "ready_for_payment": false,
  "action": "continue"
}
```

### Analytics Data Filtering
All analytics endpoints auto-exclude test phone numbers:
- Numbers starting with `+1555`
- Specific numbers: `+12033007233`, `+14698186844`, `+16827129222`

### Key Config
- **LLM models** (in `config.yaml`): `llm_model`, `llm_oneflow_model`, `llm_extraction_model`
- **SMS provider**: Twilio (primary), Telnyx (alternative) — pluggable
- **Payment**: Stripe hosted checkout or Clover iframe (per-restaurant `config.yaml`)
- **POS**: Clover (primary), Square (pluggable architecture ready)

---

## 3. RestaurantVoiceAI — Voice Backend

**Path**: `/Users/nayeembelal/workspace/ResturauntVoiceAi`
**Tech**: Node.js, Express.js 5.2.1, Ultravox AI, Telnyx, Supabase, Stripe, Clover

### What It Does
Handles inbound phone calls for restaurants using Ultravox voice AI. Customers call → AI answers → takes order via voice → sends Stripe checkout link via SMS → Stripe webhook places order in Clover POS.

### Project Structure
```
src/
├── index.js              # Main Express server + all webhook handlers
├── secrets.js            # GCP Secret Manager + env var resolution
├── db.js                 # Supabase database operations
├── ultravox.js           # Ultravox call creation + tool definitions
├── prompt.js             # System prompt builder
├── checkout.js           # Stripe session + SMS send
├── clover.js             # Clover POS integration
├── googlePlaces.js       # Business hours lookup
└── restaurant-configs.js # YAML config loader
data/{restaurant_slug}/
├── config.yaml           # Phone numbers, transfer target, Place ID
├── menu.json             # Full menu with modifiers
├── oneflow.txt           # System prompt template
└── business_logic.txt    # Restaurant-specific AI instructions
```

### All API Endpoints

| Method | Endpoint | Called By | Purpose |
|--------|----------|-----------|---------|
| POST | `/incoming` | Telnyx | Inbound call webhook → returns TeXML with Ultravox stream |
| POST | `/webhook/stripe` | Stripe | Payment completion → place Clover order + send SMS |
| POST | `/tool/business-address` | Ultravox LLM | Get restaurant address |
| POST | `/tool/business-hours` | Ultravox LLM | Get hours via Google Places |
| POST | `/tool/customer-name/{callerPhone}` | Ultravox LLM | Save customer first/last name |
| POST | `/tool/cart/get/{callerPhone}` | Ultravox LLM | Get current cart |
| POST | `/tool/cart/add/{callerPhone}` | Ultravox LLM | Add item to cart |
| POST | `/tool/cart/remove/{callerPhone}` | Ultravox LLM | Remove item from cart |
| POST | `/tool/cart/clear/{callerPhone}` | Ultravox LLM | Clear cart |
| POST | `/tool/transfer-call/{callerPhone}` | Ultravox LLM | Transfer call to human |
| POST | `/tool/send-checkout/{callerPhone}` | Ultravox LLM | Create Stripe session + send SMS link |
| GET | `/payment/success` | Browser (Stripe redirect) | Success page |
| GET | `/payment/cancel` | Browser (Stripe redirect) | Cancel page |
| GET | `/` | Health check | "server is running" |

### Inbound Call Flow
```
Telnyx POST /incoming (From, To, CallSid)
    ↓
Look up restaurant by called number (Supabase)
Upsert customer by caller phone
Check for active conversation (< 15 min) → resume or create new
    ↓
Create Ultravox call (POST api.ultravox.ai/api/calls)
  → system prompt (business_logic.txt + full menu JSON + customer name + existing cart)
  → 9 tool definitions
  → Returns joinUrl
    ↓
Return TeXML <Stream> to Telnyx (RTP/L16/16kHz)
    ↓
LLM tools called back to /tool/* endpoints → cart persisted to Supabase
    ↓
Customer approves checkout → /tool/send-checkout
  → Create Stripe session
  → SMS payment link via Telnyx
    ↓
Stripe POST /webhook/stripe (checkout.session.completed)
  → Create Clover order
  → Mark as paid (external payment tender)
  → Print kitchen ticket
  → Update DB order status → 'placed'
  → Complete conversation
  → SMS confirmation to customer
```

### In-Memory State
An in-memory Map stores active call context keyed by `callerPhone`:
```js
{
  restaurantId, posMerchantId, conversationId, customerId,
  customerFirstName, customerLastName, callSid, calledNumber,
  transferPhoneNumber, cart
}
```
Cart updates persist to Supabase immediately but are also held in memory for fast tool responses.

### Restaurant Config (`data/{slug}/config.yaml`)
```yaml
telnyx_phone_number: "+1XXXXXXXXXX"   # Number customers dial
transfer_phone_number: "+1XXXXXXXXXX" # Human staff forwarding number
google_place_id: "ChIJ..."            # For Google Places hours lookup
```

### External Service Dependencies
| Service | Purpose |
|---------|---------|
| **Telnyx** | Inbound call webhook, call transfer, SMS |
| **Ultravox AI** | Voice LLM (model: ultravox-v0.7, voice: Mark) |
| **Clover** | Menu item verification, order creation, payment marking, ticket printing |
| **Stripe** | Hosted checkout sessions, payment webhooks |
| **Google Places API** | Business hours lookup |
| **Supabase** | Persistent storage (conversations, carts, orders, customers) |
| **GCP Secret Manager** | Production secrets (API keys, tokens) |

---

## 4. Database Schema (Shared Supabase)

Both `TextToOrderCoffee` and `RestaurantVoiceAI` write to the **same Supabase instance**. The dashboard reads through the `TextToOrderCoffee` analytics API.

### Core Tables

**`restaurants`**
```
id (uuid PK), name, phone_number (SMS), voice_call_number (Telnyx voice),
pos_merchant_id (Clover), pos_api_key, ecom_api_token, active
```

**`customers`**
```
id (uuid PK), phone (unique), first_name, last_name,
user_likes[], user_dislikes[], user_allergic_to[], user_dietary_restrictions[],
updated_at
```

**`conversations`**
```
id (uuid PK), restaurant_id (FK), customer_id (FK),
channel ('voice' | 'sms'), current_cart (JSONB),
completed_at (null = active), created_at, updated_at
UNIQUE(customer_id, restaurant_id) per channel
```

**`messages`** (SMS channel only)
```
id (uuid PK), conversation_id (FK),
role ('user' | 'assistant' | 'system'), content,
llm_response_json (JSONB), created_at
```

**`orders`**
```
id (uuid PK), restaurant_id (FK), customer_id (FK), conversation_id (FK),
subtotal, tax, total, status ('confirmed' | 'placed' | 'rejected' | 'failed'),
pos_order_id (Clover), stripe_session_id,
channel ('voice' | 'sms'), created_at
```

**`order_items`**
```
id (uuid PK), order_id (FK), menu_item_id, menu_item_name,
quantity, base_price, size,
modifications (JSONB — [{id, name, price_cents}]),
special_notes, modifiers_total, item_total, clover_id,
created_at
```

**`menu_items`**
```
id (uuid PK), item_id (Clover ID), restaurant_id (FK),
name, price, category, description,
embedding (pgvector — text-embedding-3-small),
embedded_content, available
```

**`payment_sessions`** (SMS backend only)
```
id (uuid PK), session_id (unique), conversation_id (FK),
restaurant_id (FK), customer_phone, amount_cents,
status ('pending' | 'completed' | 'expired' | 'failed'),
clover_source_token, clover_charge_id, expires_at
```

**`customer_restaurant_consents`** (SMS backend only)
```
id (uuid PK), customer_id (FK), restaurant_id (FK),
opt_in_status ('pending' | 'opted_in' | 'opted_out'),
opted_in_at, opted_out_at
```

### Key Indexes
- `conversations`: `(customer_id, restaurant_id)`, `updated_at DESC`
- `messages`: `(conversation_id, created_at DESC)`
- `orders`: `restaurant_id`, `status`, `created_at DESC`
- `order_items`: `order_id`, `menu_item_name`, `created_at DESC`
- `menu_items`: `restaurant_id`, pgvector HNSW on `embedding`

---

## 5. Backend Integration Gaps

The dashboard currently has several components running on mock data. These are the endpoints that need to be built in `TextToOrderCoffee` (or queried directly from Supabase via backend) to replace them:

### High Priority — Dashboard Live Data

| Dashboard Component | Mock Export Used | API Needed | Data Source |
|---------------------|-----------------|------------|-------------|
| `IncomingCallsCard` / `VoiceMarketingTab` | `mockCalls` | `GET /api/calls` | `conversations` + `orders` + `customers` (voice channel) |
| Analytics stat tiles (9 tiles) | `MOCK_STATS` | `GET /api/analytics/voice-stats` | `conversations`, `orders`, `order_items` |

#### `GET /api/calls` — Needed Response Shape
```typescript
{
  calls: Array<{
    id: string                    // conversation.id
    timestamp: string             // conversation.updated_at (ISO 8601)
    timeLabel: string             // e.g. "4:33 pm"
    phoneNumber: string           // customer.phone (formatted)
    statuses: CallStatusType[]    // derived from order.status + conversation.completed_at
    duration: string              // e.g. "1m 42s" — needs to be stored or computed
    locationId: string            // restaurant.id
  }>
}
// CallStatusType = 'forwarded' | 'order-intent' | 'reservation-intent' | 'robo-caller' | 'no-outcome'
```

> **Note on call duration**: `RestaurantVoiceAI` does not currently persist call duration to Supabase. Either add a `duration_seconds` column to `conversations`, or compute a proxy from `created_at` vs `completed_at`.

> **Note on call status**: Status must be derived — e.g., a conversation with a completed order = `order-intent`; one with no order = `no-outcome`. Transfer events currently are not stored.

#### `GET /api/analytics/voice-stats` — Needed Response Shape
```typescript
{
  dateRange: '24h' | '1w' | '1m'
  stats: {
    totalCalls: number
    callMinutes: number
    avgDuration: number           // in seconds
    newCallers: number
    repeatCallers: number
    minutesSaved: number          // estimate: totalCalls * avgHandleTime - totalCallMinutes
    aov: number                   // orders total / orders count
    successfulUpsells: number
    upsellRevenue: number
  }
}
```

### Medium Priority — Configure Page Live Data

| Component | What It Needs | Where Data Lives |
|-----------|--------------|-----------------|
| `BrandSnapshotCard` | Restaurant name, description, cuisine, address | `restaurants` table |
| `AIGreetingCard` | `mockGreeting` → real greeting per restaurant | `data/{slug}/oneflow.txt` or new `restaurants` column |
| `ForwardingCard` | `mockForwardingNumber` → real forwarding number | `data/{slug}/config.yaml` (RestaurantVoiceAI) or `restaurants` table |
| `TextToOrderCard` | Toggle state | New `sms_ordering_enabled` column on `restaurants` |
| `FAQEditor` | `mockFAQs` | New `faqs` table in Supabase |
| `UpsellRuleEditor` | `mockUpsells` | New `upsell_rules` table in Supabase |
| `VoiceMarketingTab` (send) | Actual SMS broadcast | `POST /api/marketing/broadcast` |

---

## 6. Mock Data → Real API Mapping

### `MockCall` (15 records) → needs `GET /api/calls`
```typescript
// Current mock shape:
interface MockCall {
  id: string
  timestamp: string        // ISO 8601
  timeLabel: string        // "4:33 pm"
  phoneNumber: string      // "+1 (361) 433-2933"
  statuses: CallStatusType[] // ['order-intent'] etc.
  unknownsCount: number
  locationId: string       // references MockLocation.id
  duration: string         // "1m 42s"
}
```

### `MockLocation` (4 records) → needs `GET /api/locations`
```typescript
interface MockLocation {
  id: string
  nickname: string
  address: string
  city: string
  state: string
  belanPhone: string       // Telnyx voice number
  activeOrdering: boolean
  isOpen: boolean
  hours: string
}
```

### `mockFAQs` (9 records) → needs `faqs` Supabase table + CRUD API
```typescript
interface MockFAQ {
  id: string
  question: string
  answer: string
  category: string  // "General" | "Menu" | "Ordering" | "Reservations" | "Payment" | "Catering"
}
```

### `mockUpsells` (6 records) → needs `upsell_rules` Supabase table + CRUD API
```typescript
interface MockUpsell {
  id: string
  triggerItem: string    // menu item name
  suggestedItem: string  // menu item name
  message: string
  active: boolean
}
```

### `mockVoices` (4 records) → needs `GET /api/voices` (Ultravox voices or static list)
```typescript
interface MockVoice {
  id: string
  name: string
  gender: 'male' | 'female'
  accent: string
  description: string
  emoji: string
}
```

### `mockGreeting` (string) → needs `GET /api/restaurant/greeting` + `PUT /api/restaurant/greeting`

### `mockForwardingNumber` (string) → needs `GET /api/restaurant/forwarding` + `PUT /api/restaurant/forwarding`

### `mockMenuItems` (14 strings) → already available from `GET /api/analytics/menu-items`

---

## 7. Design System Quick Reference

### Tailwind Color Tokens
| Token | Hex | Usage |
|-------|-----|-------|
| `capy-bg` | `#ffffff` | Page/input background |
| `capy-card` | `#ffffff` | Card background |
| `capy-dark` | `#0F172A` | Dark slate |
| `capy-border` | `#CBD5E1` | All borders |
| `capy-text` | `#0F172A` | Primary text |
| `capy-muted` | `#64748B` | Secondary/placeholder text |
| `capy-brown` | `#475569` | Edit button color |
| `capy-tan` | `#94A3B8` | Arrow icons |
| `capy-green` | `#22C55E` | Primary action, toggles on, upsell arrows |
| `capy-green-dark` | `#16A34A` | Hover/active state |
| `capy-green-light` | `#DCFCE7` | Selected row backgrounds, status pills |

### Custom CSS Classes (globals.css)
- `.card-heading` — Tektur 600, text-sm, capy-text
- `.card-subheading` — Tektur 700, text-sm
- `.body-text` — Helvetica, text-sm, capy-text
- `.body-muted` — Helvetica, text-sm, capy-muted
- `.section-label` — Helvetica, text-xs, 600, uppercase, letter-spacing 0.05em, capy-muted
- `.card-input` — Full-width input with focus:ring-2 capy-green
- `.nav-tab-bar` / `.nav-tab-active` / `.nav-tab-hovering` / `.nav-tab-leaving` — animated underline tabs

### Toggle Switch Pattern
```tsx
<button className={`relative block h-6 w-11 rounded-full transition-colors ${checked ? 'bg-capy-green' : 'bg-gray-200'}`}>
  <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
</button>
```

### Portal Dropdown Pattern
Custom dropdowns (voice picker, menu item dropdown) use `createPortal` to `document.body` with `getBoundingClientRect()` positioning to avoid clipping inside cards/modals. Outside-click dismissal via `useEffect` + `mousedown`. Style: `border-capy-border rounded-lg`, green radio dots, `bg-capy-green-light` on selected row.

### Typography
- **Tektur** — headings, buttons, numbers (imported via Google Fonts in globals.css)
- **Helvetica / Arial** — body text (system sans-serif stack)
