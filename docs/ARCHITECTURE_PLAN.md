# Belan Dashboard — Architecture Plan: Mock → Real Data

**Date**: 2026-04-29  
**Scope**: Complete elimination of mock data from TextToOrderDashboard — database, backend, and frontend.

---

## Table of Contents
1. [Live System Audit](#1-live-system-audit)
2. [Bugs Found in Original Plan](#2-bugs-found-in-original-plan)
3. [Architecture Overview](#3-architecture-overview)
4. [Phase 1 — Database Schema](#4-phase-1--database-schema)
5. [Phase 2 — Backend API](#5-phase-2--backend-api)
6. [Phase 3 — Caching Layer](#6-phase-3--caching-layer)
7. [Phase 4 — RestaurantVoiceAI Fixes](#7-phase-4--restaurantvoiceai-fixes)
8. [Phase 5 — Frontend Integration](#8-phase-5--frontend-integration)
9. [Live Polling Strategy](#9-live-polling-strategy)
10. [Delivery Sequence](#10-delivery-sequence)
11. [Out of Scope](#11-out-of-scope)
12. [Verification Checklist](#12-verification-checklist)

---

## 1. Live System Audit

### Database State (2026-04-29)

| Table | Rows | Key Finding |
|-------|------|-------------|
| `restaurants` | 6 | Missing 8 config columns needed by dashboard |
| `conversations` | 173 | 19 voice; no `duration_seconds` col; `completed_at` is wrong (see Bug A) |
| `orders` | 131 | All 26 voice orders stuck `open` — Stripe webhook broken (see Bug C) |
| `customers` | 86 | Only 2 unique voice callers, both test numbers |
| `messages` | 5,881 | ~0 from voice — VoiceAI stores state in memory + `current_cart`, not messages |
| `menu_items` | 497 | Rich; powers existing best-sellers endpoint fine |
| `faqs` | — | Does not exist |
| `upsell_rules` | — | Does not exist |

### Backend State (TextToOrderCoffee)

| Item | Finding |
|------|---------|
| Supabase key | **Service role key** — bypasses RLS. New tables work without policy setup. |
| CORS | `localhost:3000-3002` only — **no production domain configured** |
| Test number filtering | **Inline Python filters** in each query — no shared helper function |
| Caching | **None** — no Redis, aiocache, or cachetools installed |

### Critical Data Integrity Bugs

**Bug A — `completed_at` is wrong for voice conversations.**  
VoiceAI sets `completed_at` when the *next* call from the same customer begins (15-min active-conversation check). Result: computed duration = time between calls, not call length. Live data ranges from 1,141s (plausible) to 607,185s (7 days). Fix: store `duration_seconds` from Telnyx hangup event.

**Bug B — Multiple orders per conversation.**  
Some conversations have 4+ `open` orders. Each checkout attempt creates a new order row without closing the prior. Fix: deduplicate on the `/tool/send-checkout` path in VoiceAI.

**Bug C — Voice orders never reach `placed`.**  
All 26 voice orders are `open`. The Stripe webhook completing the voice order flow is broken. Fix: debug `/webhook/stripe` in VoiceAI — likely a webhook secret mismatch or missing `channel='voice'` handling. Until fixed, AOV for voice will always be 0; the voice-stats API falls back to `open` orders temporarily.

---

## 2. Bugs Found in Original Plan

These are errors in the first draft of this plan that have been corrected below:

| # | Bug | Fix Applied |
|---|-----|-------------|
| 1 | SQL called `_is_test_number()` — this function does not exist. Filters are inline Python Supabase client calls. | Replaced with parameterized Python filter pattern |
| 2 | No caching anywhere — analytics queries run on every tab switch | Added `cachetools.TTLCache` layer in Phase 3 |
| 3 | `IncomingCallsCard` had no polling — it would show stale data indefinitely | Added 30s `setInterval` polling in Phase 5 |
| 4 | `VoiceMarketingTab` needs **unique callers**, not call records — deduplicating 50 records in frontend is wasteful | Added dedicated `GET /api/callers` endpoint |
| 5 | Duration cap was 600s (10 min) — too aggressive, legitimate calls can run 15-20 min | Raised to 1200s (20 min) proxy cap |
| 6 | `TextToOrderCard` is inline JSX in `app/configure/page.tsx` — cannot receive props until extracted | Added extraction step to Phase 5 |
| 7 | No `lib/api.ts` exists — plan referenced it but it needs to be created | Formalized creation in Phase 5 |
| 8 | No DB indexes for new voice query patterns — polling every 30s against unindexed columns = slow | Added composite indexes in Phase 1 |
| 9 | `faqs` and `upsell_rules` tables had no seed data — editors would show empty state immediately | Added seed migration from mock data |

---

## 3. Architecture Overview

```
Supabase (PostgreSQL)
       ↕
TextToOrderCoffee (FastAPI)   ← all new endpoints + caching layer
       ↕
TextToOrderDashboard (Next.js) ← replaces mock imports with typed fetch calls
       ↕
RestaurantVoiceAI (Node.js)   ← fix: duration_seconds, call_outcome, order status
```

**Rule**: Frontend never touches Supabase directly. All data through TextToOrderCoffee. No exceptions.

---

## 4. Phase 1 — Database Schema

All migrations are additive (no destructive changes). Safe to run against production.

### 1A. Add config columns to `restaurants`

```sql
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS description          text,
  ADD COLUMN IF NOT EXISTS cuisine_type         varchar(100),
  ADD COLUMN IF NOT EXISTS address              text,
  ADD COLUMN IF NOT EXISTS website              varchar(255),
  ADD COLUMN IF NOT EXISTS ai_greeting          text,
  ADD COLUMN IF NOT EXISTS ai_voice_id          varchar(100),
  ADD COLUMN IF NOT EXISTS forwarding_number    varchar(20),
  ADD COLUMN IF NOT EXISTS sms_ordering_enabled boolean NOT NULL DEFAULT true;
```

Immediately seed Lime N Dime:
```sql
UPDATE restaurants SET
  description          = 'Fast-casual burger and milkshake spot with bold flavors.',
  cuisine_type         = 'American',
  address              = 'Austin, TX',
  ai_greeting          = 'Hi, thanks for calling Lime N Dime! I can take your order — what sounds good today?',
  ai_voice_id          = 'Mark',
  forwarding_number    = '+15124892563',
  sms_ordering_enabled = true
WHERE id = 'a9d9fb45-34a7-4c63-b0d9-70add44b6275';
```

### 1B. Add call tracking columns to `conversations`

```sql
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS call_outcome varchar(30)
    CHECK (call_outcome IN ('order-intent','forwarded','no-outcome','robo-caller'));
```

- `duration_seconds`: written by VoiceAI on call hangup. Until then, API applies proxy: `LEAST(completed_at - created_at in seconds, 1200)`.
- `call_outcome`: written by VoiceAI at checkout/transfer/hangup. Until then, API derives from order presence.

### 1C. Create `faqs`

```sql
CREATE TABLE IF NOT EXISTS faqs (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  question      text NOT NULL,
  answer        text NOT NULL,
  category      varchar(100) NOT NULL DEFAULT 'General',
  active        boolean NOT NULL DEFAULT true,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS faqs_restaurant_id_idx ON faqs(restaurant_id);
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
```

Seed with 3 generic onboarding-guide FAQs (restaurant-agnostic, meant to show owners the format):
```sql
INSERT INTO faqs (restaurant_id, question, answer, category, sort_order) VALUES
  ('a9d9fb45-34a7-4c63-b0d9-70add44b6275',
   'What are your hours?',
   'Update this with your actual hours. Example: We are open Monday–Saturday 11am–9pm, closed Sundays.',
   'General', 0),
  ('a9d9fb45-34a7-4c63-b0d9-70add44b6275',
   'What payment methods do you accept?',
   'Update this with your accepted payments. Example: We accept all major credit cards, Apple Pay, and Google Pay via the secure link our AI texts you.',
   'Payment', 1),
  ('a9d9fb45-34a7-4c63-b0d9-70add44b6275',
   'Can I customize my order?',
   'Update this with your modification policy. Example: Yes — just tell our AI when you call and we will do our best to accommodate.',
   'Ordering', 2);
```

### 1D. Create `upsell_rules`

```sql
CREATE TABLE IF NOT EXISTS upsell_rules (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id        uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  trigger_item_name    varchar(255) NOT NULL,
  suggested_item_name  varchar(255) NOT NULL,
  message              text NOT NULL,
  active               boolean NOT NULL DEFAULT true,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS upsell_rules_restaurant_id_idx ON upsell_rules(restaurant_id);
ALTER TABLE upsell_rules ENABLE ROW LEVEL SECURITY;
```

Seed with 3 generic onboarding-guide upsell rules (restaurant-agnostic, meant to show owners the format):
```sql
INSERT INTO upsell_rules (restaurant_id, trigger_item_name, suggested_item_name, message) VALUES
  ('a9d9fb45-34a7-4c63-b0d9-70add44b6275',
   'Your most popular main dish',
   'Your most popular side',
   'Replace with a real pairing. Example: "Our fries go great with that — want to add an order?"'),
  ('a9d9fb45-34a7-4c63-b0d9-70add44b6275',
   'Your smallest size of an item',
   'Your larger size of the same item',
   'Replace with a real upgrade. Example: "Want to upgrade to the large for just $2 more?"'),
  ('a9d9fb45-34a7-4c63-b0d9-70add44b6275',
   'Any food item',
   'Your most popular drink',
   'Replace with a real drink pairing. Example: "Can I add a drink to go with that?"');
```

### 1E. Add missing indexes for voice query performance

These are critical — `GET /api/calls` is polled every 30 seconds:

```sql
-- Primary query pattern: restaurant + channel + time range
CREATE INDEX IF NOT EXISTS conversations_restaurant_channel_created_idx
  ON conversations(restaurant_id, channel, created_at DESC);

-- JOIN from conversations to orders
CREATE INDEX IF NOT EXISTS orders_conversation_id_idx
  ON orders(conversation_id);

-- Voice stats: orders by restaurant + channel + status + time
CREATE INDEX IF NOT EXISTS orders_restaurant_channel_status_created_idx
  ON orders(restaurant_id, channel, status, created_at DESC);
```

### 1F. Add production domain to CORS (TextToOrderCoffee)

In `src/app.py`, update `allow_origins` to include the deployed dashboard URL:
```python
allow_origins=[
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://your-dashboard-domain.com",  # ADD THIS
],
```

---

## 5. Phase 2 — Backend API

### Install `cachetools` in TextToOrderCoffee

Add to `requirements.txt`:
```
cachetools==5.3.2
```

No Redis needed — `TTLCache` is in-process and sufficient for a single-instance Cloud Run deployment.

### Shared cache setup — `src/core/cache.py` (new file)

```python
from cachetools import TTLCache
from threading import Lock

# Keyed by (endpoint, restaurant_id, params_hash)
analytics_cache = TTLCache(maxsize=200, ttl=300)   # 5-minute TTL
config_cache    = TTLCache(maxsize=100, ttl=300)   # 5-minute TTL
cache_lock      = Lock()

def cache_key(*parts) -> str:
    return ":".join(str(p) for p in parts)

def invalidate_config(restaurant_id: str):
    """Call after any PATCH/POST/DELETE on config endpoints."""
    with cache_lock:
        keys_to_delete = [k for k in config_cache if restaurant_id in k]
        for k in keys_to_delete:
            config_cache.pop(k, None)
```

### Test number filter — shared Python helper

Since `_is_test_number()` is inline filters throughout `db.py`, extract to a shared constant:

```python
# src/core/constants.py (new file)
TEST_PHONE_PREFIXES = ["+1555"]
TEST_PHONE_NUMBERS  = {"+12033007233", "+14698186844", "+16827129222"}

def is_test_number(phone: str) -> bool:
    return any(phone.startswith(p) for p in TEST_PHONE_PREFIXES) or phone in TEST_PHONE_NUMBERS
```

Apply in all new queries using Python-side filtering after DB fetch (matching existing pattern in `db.py`).

---

### New File: `src/api/voice.py`

Registered in `src/app.py` same as `analytics.py`.

#### `GET /api/calls`

**Not cached.** Powers `IncomingCallsCard` / `CallFeed` (polled every 30s).

**Query params**: `restaurant_id` (required), `limit` (default 20, max 100), `offset` (default 0)

**Implementation** (uses Supabase Python client, matching db.py pattern):
```python
@router.get("/api/calls")
async def get_calls(restaurant_id: str, limit: int = 20, offset: int = 0):
    result = (
        supabase.table("conversations")
        .select("id, created_at, completed_at, call_outcome, duration_seconds, channel, "
                "customers(phone_number, first_name, last_name), "
                "orders(id, total)")
        .eq("restaurant_id", restaurant_id)
        .eq("channel", "voice")
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    # Filter test numbers in Python (matching existing pattern)
    calls = [c for c in result.data if not is_test_number(c["customers"]["phone_number"])]
    return {"calls": [format_call(c) for c in calls], "total": len(calls)}
```

**`format_call()` helper**:
```python
def format_call(c: dict) -> dict:
    phone = c["customers"]["phone_number"]
    order_count = sum(1 for o in (c.get("orders") or []) if o["total"] > 0)
    
    raw_duration = c.get("duration_seconds")
    if raw_duration is None and c.get("completed_at"):
        delta = (parse_dt(c["completed_at"]) - parse_dt(c["created_at"])).total_seconds()
        raw_duration = min(int(delta), 1200)  # 20-min proxy cap
    
    return {
        "id":           c["id"],
        "timestamp":    c["created_at"],
        "timeLabel":    format_time_label(c["created_at"]),
        "phoneNumber":  format_phone(phone),
        "customerName": format_name(c["customers"]),
        "statuses":     derive_status(c.get("call_outcome"), order_count),
        "duration":     format_duration(raw_duration),
        "locationId":   c.get("restaurant_id", ""),
    }

def derive_status(call_outcome: str | None, order_count: int) -> list[str]:
    if call_outcome:
        return [call_outcome]
    return ["order-intent"] if order_count > 0 else ["no-outcome"]

def format_duration(seconds: int | None) -> str:
    if not seconds:
        return "—"
    m, s = divmod(seconds, 60)
    return f"{m}m {s}s" if m else f"{s}s"
```

**Response shape**:
```json
{
  "calls": [
    {
      "id": "uuid",
      "timestamp": "2026-04-22T05:38:09Z",
      "timeLabel": "5:38 am",
      "phoneNumber": "+1 (203) 970-5544",
      "customerName": "James R.",
      "statuses": ["order-intent"],
      "duration": "2m 15s",
      "locationId": "a9d9fb45-..."
    }
  ],
  "total": 19
}
```

---

#### `GET /api/callers`

**Cached 2 min.** Powers `VoiceMarketingTab` (needs unique phone numbers, not call records).

```python
@router.get("/api/callers")
async def get_callers(restaurant_id: str):
    key = cache_key("callers", restaurant_id)
    with cache_lock:
        if key in analytics_cache:
            return analytics_cache[key]

    result = (
        supabase.table("conversations")
        .select("customer_id, created_at, call_outcome, customers(phone_number, first_name, last_name)")
        .eq("restaurant_id", restaurant_id)
        .eq("channel", "voice")
        .order("created_at", desc=True)
        .execute()
    )

    seen = {}
    for c in result.data:
        phone = c["customers"]["phone_number"]
        if is_test_number(phone) or phone in seen:
            continue
        seen[phone] = {
            "phoneNumber":  format_phone(phone),
            "customerName": format_name(c["customers"]),
            "lastCallAt":   c["created_at"],
            "lastStatus":   c.get("call_outcome") or "no-outcome",
        }

    payload = {"callers": list(seen.values())}
    with cache_lock:
        analytics_cache[key] = payload
    return payload
```

**Response shape**:
```json
{
  "callers": [
    {
      "phoneNumber": "+1 (203) 970-5544",
      "customerName": "James R.",
      "lastCallAt": "2026-04-22T05:38:09Z",
      "lastStatus": "order-intent"
    }
  ]
}
```

---

#### `GET /api/analytics/voice-stats`

**Cached 5 min.**

**Query params**: `restaurant_id` (required), `time_range` (`24h` | `1w` | `1m`)

**Time range → interval mapping**:
```python
INTERVALS = {"24h": "24 hours", "1w": "7 days", "1m": "30 days"}
PRIOR_INTERVALS = {"24h": "48 hours", "1w": "14 days", "1m": "60 days"}
```

**Implementation** — two separate Supabase fetches (current period + prior period), filtered in Python:

```python
@router.get("/api/analytics/voice-stats")
async def get_voice_stats(restaurant_id: str, time_range: str = "1w"):
    key = cache_key("voice-stats", restaurant_id, time_range)
    with cache_lock:
        if key in analytics_cache:
            return analytics_cache[key]

    now = datetime.utcnow()
    interval = INTERVALS.get(time_range, "7 days")
    current_start = now - timedelta_from(interval)
    prior_start   = now - timedelta_from(PRIOR_INTERVALS[time_range])

    # Fetch current period conversations
    current_convs = fetch_voice_convs(restaurant_id, current_start, now)
    prior_convs   = fetch_voice_convs(restaurant_id, prior_start, current_start)

    # Fetch all-time first-call dates per customer (for new vs repeat)
    first_calls   = fetch_first_call_dates(restaurant_id)

    # Compute stats
    total_calls   = len(current_convs)
    prior_total   = len(prior_convs)
    delta         = pct_delta(total_calls, prior_total)

    durations     = [resolved_duration(c) for c in current_convs if resolved_duration(c)]
    call_minutes  = round(sum(durations) / 60.0, 1)
    avg_duration  = round(sum(durations) / len(durations)) if durations else 0

    customer_ids  = {c["customer_id"] for c in current_convs}
    new_callers   = sum(1 for cid in customer_ids
                        if first_calls.get(cid, now) >= current_start)
    repeat_callers = len(customer_ids) - new_callers

    # minutes_saved: assume 4-min human handle time
    minutes_saved = max(round(total_calls * 4.0 - call_minutes, 1), 0)

    # AOV: prefer placed orders, fall back to open (Bug C workaround)
    aov = fetch_voice_aov(restaurant_id, current_start, status="placed")
    if aov == 0:
        aov = fetch_voice_aov(restaurant_id, current_start, status="open")

    payload = {
        "dateRange": time_range,
        "stats": {
            "totalCalls":      total_calls,
            "totalCallsDelta": delta,
            "callMinutes":     call_minutes,
            "avgCallDuration": avg_duration,
            "newCallers":      new_callers,
            "repeatCallers":   repeat_callers,
            "minutesSaved":    minutes_saved,
            "aov":             aov,
            "successfulUpsells": 0,   # future: upsell_events table
            "upsellRevenue":    0.0,
        }
    }
    with cache_lock:
        analytics_cache[key] = payload
    return payload
```

**Response shape**:
```json
{
  "dateRange": "1w",
  "stats": {
    "totalCalls": 12,
    "totalCallsDelta": 20.0,
    "callMinutes": 38.5,
    "avgCallDuration": 192,
    "newCallers": 5,
    "repeatCallers": 7,
    "minutesSaved": 9.5,
    "aov": 18.50,
    "successfulUpsells": 0,
    "upsellRevenue": 0.0
  }
}
```

---

### New File: `src/api/configure.py`

#### `GET /api/restaurant`

**Cached 5 min.** Single request for all Configure tab data.

```python
@router.get("/api/restaurant")
async def get_restaurant(restaurant_id: str):
    key = cache_key("restaurant", restaurant_id)
    with cache_lock:
        if key in config_cache:
            return config_cache[key]

    result = supabase.table("restaurants").select("*").eq("id", restaurant_id).single().execute()
    r = result.data
    payload = {
        "id":                r["id"],
        "name":              r["name"],
        "description":       r.get("description"),
        "cuisineType":       r.get("cuisine_type"),
        "address":           r.get("address"),
        "website":           r.get("website"),
        "phoneNumber":       r["phone_number"],
        "voiceCallNumber":   r.get("voice_call_number"),
        "aiGreeting":        r.get("ai_greeting"),
        "aiVoiceId":         r.get("ai_voice_id"),
        "forwardingNumber":  r.get("forwarding_number"),
        "smsOrderingEnabled": r.get("sms_ordering_enabled", True),
    }
    with cache_lock:
        config_cache[key] = payload
    return payload
```

#### PATCH endpoints (all invalidate config cache on success)

```
PATCH /api/restaurant/brand      → updates name, description, cuisineType, address, website
PATCH /api/restaurant/greeting   → updates aiGreeting, aiVoiceId
PATCH /api/restaurant/forwarding → updates forwardingNumber
PATCH /api/restaurant/sms-toggle → updates smsOrderingEnabled
```

Each calls `invalidate_config(restaurant_id)` after a successful DB write.

#### FAQ CRUD

```
GET    /api/faqs?restaurant_id=X          → { faqs: FAQ[] }           cached 5 min
POST   /api/faqs                          → FAQ                        invalidates cache
PATCH  /api/faqs/{id}?restaurant_id=X    → FAQ                        invalidates cache
DELETE /api/faqs/{id}?restaurant_id=X    → 204                        invalidates cache
```

All mutation endpoints verify ownership: `SELECT id FROM faqs WHERE id=:id AND restaurant_id=:restaurant_id` before UPDATE/DELETE.

#### Upsell Rule CRUD

```
GET    /api/upsells?restaurant_id=X        → { rules: UpsellRule[] }   cached 5 min
POST   /api/upsells                        → UpsellRule                 invalidates cache
PATCH  /api/upsells/{id}?restaurant_id=X  → UpsellRule                 invalidates cache
DELETE /api/upsells/{id}?restaurant_id=X  → 204                        invalidates cache
```

Same ownership verification pattern.

---

## 6. Phase 3 — Caching Layer Summary

| Endpoint | Cached? | TTL | Invalidated By |
|----------|---------|-----|----------------|
| `GET /api/calls` | No | — | N/A — must be live |
| `GET /api/callers` | Yes | 2 min | — |
| `GET /api/analytics/voice-stats` | Yes | 5 min | — |
| `GET /api/analytics/revenue` | Yes | 2 min | — (add to existing endpoint) |
| `GET /api/analytics/best-sellers` | Yes | 5 min | — (add to existing endpoint) |
| `GET /api/restaurant` | Yes | 5 min | Any PATCH to restaurant |
| `GET /api/faqs` | Yes | 5 min | FAQ POST/PATCH/DELETE |
| `GET /api/upsells` | Yes | 5 min | Upsell POST/PATCH/DELETE |

**Why no Redis**: The backend is a single Cloud Run instance. In-process `TTLCache` is sufficient and adds no infrastructure. If the service scales to multiple instances, switch to Redis — but that's a one-line change to the cache backend.

---

## 7. Phase 4 — RestaurantVoiceAI Fixes

**File**: `src/index.js`

### Fix A — Store `duration_seconds` on call hangup

```js
// In Telnyx webhook handler for call.hangup event:
if (event.data.event_type === 'call.hangup') {
  const callerPhone = event.data.payload.from;
  const callDuration = event.data.payload.call_duration; // seconds from Telnyx
  const state = activeCallState.get(callerPhone);

  if (state?.conversationId) {
    await supabase.from('conversations').update({
      duration_seconds: Math.round(callDuration),
      completed_at: new Date().toISOString(),
    }).eq('id', state.conversationId);
  }
  activeCallState.delete(callerPhone);
}
```

### Fix B — Set `call_outcome` at key decision points

```js
// /tool/send-checkout: customer approved order
await supabase.from('conversations')
  .update({ call_outcome: 'order-intent' })
  .eq('id', state.conversationId);

// /tool/transfer-call: call forwarded to human
await supabase.from('conversations')
  .update({ call_outcome: 'forwarded' })
  .eq('id', state.conversationId);

// call.hangup with no outcome set yet:
if (!state.outcomeSet) {
  await supabase.from('conversations')
    .update({ call_outcome: 'no-outcome' })
    .eq('id', state.conversationId);
}
```

### Fix C — Fix voice order status (Bug B + C)

In `/webhook/stripe` (`checkout.session.completed`): ensure the handler finds the voice order by `stripe_session_id` and updates `status='placed'`. Likely a webhook secret mismatch for the voice service — verify `STRIPE_WEBHOOK_SECRET` env var in VoiceAI matches the webhook registered in Stripe Dashboard.

Also in `/tool/send-checkout`: before creating a new Stripe session, cancel any existing `open` orders for the same `conversationId` to fix Bug B:
```js
await supabase.from('orders')
  .update({ status: 'failed' })
  .eq('conversation_id', state.conversationId)
  .eq('status', 'open');
```

---

## 8. Phase 5 — Frontend Integration

### 5A. Create `lib/api.ts`

```ts
export const RESTAURANT_ID = 'a9d9fb45-34a7-4c63-b0d9-70add44b6275';
export const API_BASE_URL  = 'https://text-to-order-coffee-34770846162.us-central1.run.app';

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}
```

### 5B. Extract `TextToOrderCard` to its own component

Move the inline `function TextToOrderCard()` from `app/configure/page.tsx` (lines 18–50) to `components/voice/TextToOrderCard.tsx`. It needs to accept `initialEnabled: boolean` as a prop and call `PATCH /api/restaurant/sms-toggle` on toggle.

### 5C. Configure page — single fetch, prop drilling

`app/configure/page.tsx` fetches `GET /api/restaurant` once on mount. Passes result as props to all four cards. On successful PATCH from any card, the page re-fetches to sync state:

```tsx
const [config, setConfig] = useState(null);

useEffect(() => {
  apiFetch(`/api/restaurant?restaurant_id=${RESTAURANT_ID}`)
    .then(setConfig);
}, []);

const handleSaved = () => {
  apiFetch(`/api/restaurant?restaurant_id=${RESTAURANT_ID}`)
    .then(setConfig); // re-fetch after any save
};
```

FAQEditor and UpsellRuleEditor fetch independently when their tab becomes active (lazy) — no need to preload them.

### 5D. Component migration map

| Component | File | Replaces | Endpoint | Notes |
|-----------|------|----------|----------|-------|
| CallFeed | `components/voice/CallFeed.tsx` | `mockCalls` | `GET /api/calls` | 30s poll (see §9) |
| VoiceMarketingTab | `components/voice/VoiceMarketingTab.tsx` | `mockCalls` | `GET /api/callers` | Unique callers endpoint |
| VoiceAnalyticsTab | `components/voice/VoiceAnalyticsTab.tsx` | `MOCK_STATS` | `GET /api/analytics/voice-stats` | Re-fetch on range change |
| BrandSnapshotCard | `components/voice/BrandSnapshotCard.tsx` | `INITIAL` hardcoded | prop from page | PATCH /api/restaurant/brand on save |
| AIGreetingCard | `components/voice/AIGreetingCard.tsx` | `mockGreeting`, `mockVoices` | prop from page + static voices | PATCH /api/restaurant/greeting on save |
| ForwardingCard | `components/voice/ForwardingCard.tsx` | `mockForwardingNumber` | prop from page | PATCH /api/restaurant/forwarding on save |
| TextToOrderCard | `components/voice/TextToOrderCard.tsx` | local state | prop from page | PATCH /api/restaurant/sms-toggle on toggle |
| FAQEditor | `components/voice/FAQEditor.tsx` | `mockFAQs` | `GET /api/faqs` (lazy) | Full CRUD with optimistic updates |
| UpsellRuleEditor | `components/voice/UpsellRuleEditor.tsx` | `mockUpsells`, `mockMenuItems` | `GET /api/upsells` + `GET /api/analytics/menu-items` | Full CRUD |

### 5E. Static voices list

`mockVoices` becomes a static constant inside `AIGreetingCard.tsx`. Ultravox voices don't change frequently. No endpoint needed.

```ts
const VOICES = [
  { id: 'Mark',   name: 'Mark',   gender: 'male',   accent: 'American', description: 'Friendly and professional', emoji: '😊' },
  { id: 'Monika', name: 'Monika', gender: 'female', accent: 'American', description: 'Warm and conversational',  emoji: '😄' },
  { id: 'Daniel', name: 'Daniel', gender: 'male',   accent: 'British',  description: 'Clear and confident',       emoji: '🎯' },
  { id: 'Lily',   name: 'Lily',   gender: 'female', accent: 'British',  description: 'Calm and precise',          emoji: '✨' },
]
```

---

## 9. Live Polling Strategy

`IncomingCallsCard` / `CallFeed` must reflect real-time call activity. Polling every 30 seconds is the right approach — no Supabase Realtime (would require frontend DB access, breaking the architecture rule).

```tsx
// In CallFeed.tsx
useEffect(() => {
  let mounted = true;

  const fetchCalls = async () => {
    try {
      const data = await apiFetch<CallsResponse>(
        `/api/calls?restaurant_id=${RESTAURANT_ID}&limit=20`
      );
      if (mounted) setCalls(data.calls);
    } catch { /* silent — stale data is acceptable for 30s */ }
  };

  fetchCalls();                               // immediate on mount
  const id = setInterval(fetchCalls, 30_000); // then every 30s
  return () => { mounted = false; clearInterval(id); }; // cleanup on unmount
}, []);
```

**Why `mounted` flag**: Prevents `setState` on an unmounted component if the user navigates away mid-fetch.

**Request cost**: A `GET /api/calls?limit=20` fetches 20 rows with one JOIN. With the composite index on `(restaurant_id, channel, created_at DESC)`, this query executes in <10ms. At 30s intervals, that's 2 requests/minute per open dashboard tab — negligible.

**VoiceAnalyticsTab** does NOT poll. Stats are cached server-side and only re-fetched when the user changes the date range filter.

---

## 10. Delivery Sequence

```
Step 1: Supabase migrations 1A–1E  (unblocks all backend work)
Step 2: Seed restaurants + faqs + upsell_rules
Step 3: Install cachetools, create src/core/cache.py + constants.py
Step 4: Build src/api/voice.py  (GET /api/calls, GET /api/callers, GET /api/analytics/voice-stats)
Step 5: Build src/api/configure.py  (GET/PATCH restaurant, FAQ CRUD, Upsell CRUD)
Step 6: Add cache to existing GET /api/analytics/revenue + best-sellers endpoints
Step 7: Update CORS in app.py with production domain
Step 8: RestaurantVoiceAI: Fix A + B (duration_seconds + call_outcome)  ← parallel with step 4–5
Step 9: Frontend: Create lib/api.ts
Step 10: Frontend: Extract TextToOrderCard to components/voice/
Step 11: Frontend: Configure page — single fetch + prop drilling
Step 12: Frontend: CallFeed with 30s polling
Step 13: Frontend: VoiceMarketingTab → GET /api/callers
Step 14: Frontend: VoiceAnalyticsTab → GET /api/analytics/voice-stats
Step 15: Frontend: FAQEditor + UpsellRuleEditor → CRUD endpoints
Step 16: RestaurantVoiceAI: Fix C (voice order status)  ← improves AOV accuracy
```

Steps 4–5 and 8 can run in parallel. Steps 9–15 can start as soon as steps 4–5 are deployed.

---

## 11. Out of Scope

| Item | Why Deferred |
|------|-------------|
| `mockLocations` (4 locations) | Multi-location requires location selector UI + per-location filtering. Separate feature. |
| `mockReportingData` (7-day chart) | Not rendered in any current component. |
| Upsell event tracking | Needs `upsell_events` table + VoiceAI integration. Returns 0 for now. |
| SMS broadcast | `POST /api/marketing/broadcast` exists in TextToOrderCoffee; wiring it to the UI is a separate task. |
| RLS policies for `faqs`/`upsell_rules` | Backend uses service role key — RLS is bypassed. Policy setup is a security hardening task, not MVP. |
| Supabase Realtime for calls | Would require frontend Supabase access, breaking architecture. 30s polling is sufficient. |

---

## 12. Verification Checklist

### Database
```sql
-- Config seeded
SELECT name, description, ai_greeting, forwarding_number
FROM restaurants WHERE id = 'a9d9fb45-34a7-4c63-b0d9-70add44b6275';

-- New tables exist with seed data
SELECT COUNT(*) FROM faqs;         -- expect 3
SELECT COUNT(*) FROM upsell_rules; -- expect 3

-- New conversation columns
SELECT duration_seconds, call_outcome FROM conversations WHERE channel = 'voice' LIMIT 3;

-- New indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'conversations';
```

### Backend (curl against production)
```bash
# Must return real call records (empty if all are test numbers, which is expected for now)
curl "https://text-to-order-coffee-34770846162.us-central1.run.app/api/calls?restaurant_id=a9d9fb45-34a7-4c63-b0d9-70add44b6275"

# Must return 9 stats with numeric values (not nulls)
curl "https://text-to-order-coffee-34770846162.us-central1.run.app/api/analytics/voice-stats?restaurant_id=a9d9fb45-34a7-4c63-b0d9-70add44b6275&time_range=1w"

# Must return restaurant config (not 404)
curl "https://text-to-order-coffee-34770846162.us-central1.run.app/api/restaurant?restaurant_id=a9d9fb45-34a7-4c63-b0d9-70add44b6275"

# Must return unique callers list
curl "https://text-to-order-coffee-34770846162.us-central1.run.app/api/callers?restaurant_id=a9d9fb45-34a7-4c63-b0d9-70add44b6275"

# Must return 9 FAQs
curl "https://text-to-order-coffee-34770846162.us-central1.run.app/api/faqs?restaurant_id=a9d9fb45-34a7-4c63-b0d9-70add44b6275"
```

### Frontend (visual QA)
1. Home → Manage: `IncomingCallsCard` updates every 30s (verify via DevTools Network tab)
2. Home → Analytics: 9 stat tiles show live numbers; date range change triggers new fetch
3. Configure → Configure: All 4 cards load from DB; edits to each persist independently
4. Configure → FAQs: 9 seeded FAQs visible; add/edit/delete persists across page refresh
5. Configure → Upsells: 6 seeded rules visible; active toggle persists
6. DevTools → Network: `GET /api/restaurant` fires once on Configure page load, not 4 times
