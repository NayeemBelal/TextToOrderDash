# Gamified SMS Marketing — Architecture & Flow Reference

This document is the canonical reference for agents working on the Belan gamified SMS marketing system. It covers the full end-to-end flow across the frontend (`TextToOrderDashboard`) and backend (`TextToOrderCoffee`), what is real vs. hardcoded, and what still needs to be built.

---

## What This Feature Is

Restaurant owners can run gamified SMS marketing campaigns targeting customers who have opted in to receive texts. Instead of a plain promotional message, the campaign sends a game (e.g., "Pick a number 1–100") with a prize attached. Winners get a full prize (e.g., free item or percent-off discount). Losers still get a smaller consolation discount. Prizes are redeemed via a link that creates a real Clover POS discount.

This is distinct from standard SMS marketing — the engagement mechanic is the core differentiator.

---

## Codebase Locations

| Layer | Path |
|-------|------|
| **Marketing onboarding page** | `TextToOrderDashboard/app/marketing/onboarding/page.tsx` |
| **Onboarding email API route** | `TextToOrderDashboard/app/api/marketing-onboarding/route.ts` |
| **Onboarding account creation route** | `TextToOrderDashboard/app/api/marketing-onboarding/create-account/route.ts` |
| Marketing tab (live) | `TextToOrderDashboard/components/voice/GamifiedMarketingTab.tsx` |
| Prize redemption page | `TextToOrderDashboard/app/prize/[prize_code]/page.tsx` |
| Legacy standalone page (deprecated) | `TextToOrderDashboard/app/marketing/page.tsx` |
| Dashboard entry point | `TextToOrderDashboard/app/home/page.tsx` (Marketing tab = `<GamifiedMarketingTab />`) |
| Backend marketing API | `TextToOrderCoffee/src/api/marketing.py` |
| Campaign scheduler (tick logic) | `TextToOrderCoffee/src/services/campaign_scheduler.py` |
| **Outbound SMS queue (enqueue + drain)** | `TextToOrderCoffee/src/services/sms_outbound_queue.py` |
| **Clover customer fetch (opt-in scan)** | `TextToOrderCoffee/src/services/clover_customers.py` |
| **Opt-in incentive (prize codes)** | `TextToOrderCoffee/src/services/optin_incentive.py` |
| SMS provider abstraction | `TextToOrderCoffee/src/services/sms_provider.py` |
| Consent management | `TextToOrderCoffee/src/services/consent_manager.py` |
| Prize + webhook routes | `TextToOrderCoffee/src/app.py` |
| Queue migration | `TextToOrderCoffee/src/database/migrations/005_sms_outbound_queue.sql` |
| Opt-in blast migration | `TextToOrderCoffee/src/database/migrations/003_marketing_optin.sql` |

---

## Database Tables (Supabase / PostgreSQL)

| Table | Purpose |
|-------|---------|
| `marketing_campaigns` | One row per campaign. Stores `restaurant_id`, `status` (`active`/`paused`/`ended`), and `config` JSON blob. |
| `campaign_game_rounds` | Pre-created rows — one per game occurrence. Fields: `campaign_id`, `game_type`, `scheduled_at`, `status` (`pending`/`sent`/`resolved`), `prize_config`, `loser_discount`, `loser_discount_cap`, `winning_answer`, `sent_at`, `collection_ends_at`. |
| `campaign_responses` | One row per customer reply. Fields: `round_id`, `customer_id`, `response_text`, `is_winner`, `prize_code`, `prize_redeemed`, `redeemed_at`, `redemption_expires_at`, `clover_discount_id`. |
| `customer_restaurant_consents` | Opt-in/out status per customer per restaurant. Fields: `customer_id`, `restaurant_id`, `opt_in_status` (`pending`/`opted_in`/`opted_out`), `opted_in_at`, `opted_out_at`, **`blast_sent_at`** (set when an opt-in invite has been queued — the idempotency guard for re-running a blast), **`opt_in_source`** (`organic`/`blast`). |
| **`sms_outbound_queue`** | Durable queue for ALL bulk SMS (opt-in blasts + campaign rounds). Fields: `restaurant_id`, `customer_id`, `kind` (`optin`/`campaign`), `round_id` (campaign rows), `phone_number`, `message` (fully rendered), `dedup_key` (unique — prevents duplicate enqueues), `status` (`pending`/`sending`/`sent`/`failed`), `attempts`, `error`, `enqueued_at`, `claimed_at`, `sent_at`. Drained by `claim_sms_outbound_batch()`. |
| **`sms_drain_lease`** | Single-row lease ensuring only one drainer runs at a time, so concurrent ticks can never exceed the global rate. Fields: `id` (always 1), `locked_until`, `locked_at`. |
| **`marketing_settings`** | Per-restaurant opt-in blast state. Fields: `restaurant_id`, `last_clover_scan_at`. Used to incrementally scan only newly-added Clover customers. |
| **`optin_prizes`** | 10%-off coupon codes generated when a blasted customer replies YES. Fields: `restaurant_id`, `customer_id`, `prize_code` (`OPTIN-XXXXXX`), `discount_percent`, `is_redeemed`, `expires_at`, `clover_discount_id`. |
| `customers` | `id`, `phone_number`, `first_name`, `last_name`, `user_preferences`. |
| `menu_items` | `item_id`, `restaurant_id`, `name`, `price`, `category`, `description`, `available`. Used for prize selection in wizard. |
| `restaurant_hours` | Used to derive restaurant timezone for scheduling. |

---

## Backend API Endpoints

All marketing endpoints are under `/api/marketing/` in `src/api/marketing.py`.

### Campaign Management

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/marketing/campaigns` | Launch a gamified campaign. Inserts `marketing_campaigns` row + up to 52 weeks of pre-created `campaign_game_rounds` rows. Ends any prior active/paused campaign. |
| `GET` | `/api/marketing/campaigns?restaurant_id=` | Returns the latest active or paused campaign for a restaurant. |
| `PATCH` | `/api/marketing/campaigns/{campaign_id}` | Pause, resume, or end a campaign. Body: `{ "status": "active" | "paused" | "ended" }`. |
| `GET` | `/api/marketing/campaigns/{campaign_id}/stats` | Returns real stats: `opted_in`, `played`, `redeemed`, `campaign_score`, `top_customers`, `per_game`. **Backend is fully implemented. Frontend does not call this yet — see Gaps.** |
| `POST` | `/api/marketing/campaigns/tick` | Called by Cloud Scheduler every 5–15 min. Fires due pending rounds and resolves expired rounds across all active campaigns. **Firing/resolving now *enqueue* messages into `sms_outbound_queue` rather than sending inline** — the drainer does the actual sending. |

### Supporting Data

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/marketing/opted-in-customers?restaurant_id=` | All opted-in customers + timezone. Used in Step 1 of the wizard. Real data. |
| `GET` | `/api/marketing/items?restaurant_id=` | Paginated available menu items. Used for prize selection. Real data. Supports `search`, `page`, `limit`. |
| `POST` | `/api/marketing/preview-campaign` | (Legacy) Count of customers who would receive a non-gamified campaign. Not used by `GamifiedMarketingTab`. |
| `POST` | `/api/marketing/generate-message` | (Legacy) LLM-generates a standard SMS promo body. Not used by gamified flow. |

### Opt-In Blast & Outbound Queue

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/marketing/optin-status?restaurant_id=` | Opt-in counts (`opted_in`/`pending`/`opted_out`) + `last_scan_at`. Populates the opt-in card. Real data. |
| `POST` | `/api/marketing/scan-clover` | **Read-only.** Pulls all Clover customers with phones added since `last_clover_scan_at`, cross-checks our DB, returns `{ new_customers }` (count never contacted). Writes nothing. |
| `POST` | `/api/marketing/send-optin-blast` | Enqueues a TCPA-compliant opt-in invite (with the configured discount incentive) to every never-blasted Clover customer. Bulk-upserts customers + consents (sets `blast_sent_at`), enqueues `kind=optin` rows, advances `last_clover_scan_at`, returns `{ queued, errors }` immediately. **Does not send inline** — the drainer sends. Optional `target_phones` body restricts to specific numbers and drains inline (testing only). |
| `POST` | `/api/marketing/drain-sms-queue` | Called by Cloud Scheduler **every 1 min**. Acquires the drain lease, claims one global batch (`messages_per_minute`), sends via the per-restaurant SMS provider with bounded concurrency, marks rows `sent`/`failed`. Returns `{ sent, failed, remaining, skipped }`. |

### Prize Endpoints (in `src/app.py`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/prize/{prize_code}` | Prize state (`pending`/`active`/`expired`) + config for the redemption page. |
| `POST` | `/api/prize/{prize_code}/redeem` | Marks prize redeemed, calls `create_clover_discount()`, returns `discount_name` and 30-min expiry timestamp. |

### SMS Webhooks

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/webhook/sms` | Twilio inbound SMS handler. Processes opt-in/out and game replies. |
| `POST` | `/webhook/sms/telnyx` | Telnyx inbound SMS handler. Same logic, different payload format. |

---

## Marketing Onboarding Flow (`/marketing/onboarding`)

Restaurant owners who don't yet have a Belan account sign up here before accessing the marketing dashboard. This flow is distinct from the Clover POS onboarding at `/onboarding`.

### Steps

| Step | Fields |
|------|--------|
| 1 — Create Account | Restaurant/Brand name, email, password — creates a pre-confirmed Supabase auth account server-side, then signs the user in immediately |
| 2 — Business Identity | Organization legal name, brand name, legal form (Public/Private/Government/Non-profit/Sole Proprietor), legal entity type (LLC/Sole Proprietorship/Partnership/Corporation/S Corp), national tax ID / EIN |
| 3 — Contact Info | First name, last name, title, business email, phone number |
| 4 — Verification & Address | Business verification document upload (PDF/image), registered company address, city, state, ZIP |
| 5 — Brand & Presence | Logo upload (PNG/JPG — shown as RCS contact photo), store phone, store email, website URL |
| Success | "You're all set!" screen with "Go to Dashboard" → `/home?tab=marketing` |

### How Account Creation Works

Account creation is handled server-side (`POST /api/marketing-onboarding/create-account`) using the Supabase service role key with `email_confirm: true`. This bypasses the email confirmation gate so the user is signed in immediately after Step 1 without needing to check their inbox. Standard `supabase.auth.signInWithPassword()` is called client-side right after.

User metadata set at signup:
```json
{ "restaurant_name": "...", "restaurant_id": null, "marketing_onboarding_complete": false }
```

After final submission, `supabase.auth.updateUser()` sets `marketing_onboarding_complete: true`.

### Notification Email

On form submission, `POST /api/marketing-onboarding` sends all fields + uploaded files (verification doc + logo) as attachments to `belal.nayeem1@gmail.com` via Resend, from `sales@belan.tech`. No database record is created — the email is the record.

### Route Access Control

`/marketing/onboarding` is in `FULL_PAGE_ROUTES` in `ConditionalWrapper.tsx` — accessible without auth.

Users who complete this flow have `marketing_onboarding_complete: true` in their Supabase user metadata. `ConditionalWrapper` uses this flag to allow them to access `/home` without a `restaurant_id` (they have no Clover POS connection yet). Without this flag, users without a `restaurant_id` are redirected to `/onboarding` (the Clover POS flow).

The `/home` page reads `?tab=marketing` from the URL query string to auto-select the Marketing tab on arrival from the success screen.

---

## End-to-End Flow

### Phase 1 — Campaign Setup (Restaurant Owner in Dashboard)

The wizard lives at `/home` → Marketing tab → `GamifiedMarketingTab.tsx`. It is **auth-aware** and uses `useAuth()` to get `restaurantId`.

**Step 1 — Roster**
- Fetches `GET /api/marketing/opted-in-customers` to build the customer list.
- Owner can deselect individuals. Selected IDs go into `targetCustomerIds` in the campaign config.

**Step 2 — Schedule**
- Owner picks up to 2 days/week, a time per day, and an optional end date.
- Displayed timezone comes from the backend.

**Step 3 — Games**
- One game type per scheduled day.
- Game types: `pick-number` (1–100), `trivia` (A/B/C), `guess-letter` (A–Z), `roll-dice` (1–6).

**Step 4 — Prizes**
- Winner prize per game: percent-off or free item (from real `GET /api/marketing/items` menu).
- Loser's discount + cap (max number of losers who receive consolation).

**Step 5 — Review**
- Shows a preview of the SMS message that will be sent.

**Launch**
- Calls `POST /api/marketing/campaigns` with the full config JSON.
- Backend creates one `marketing_campaigns` row + up to 52 × N `campaign_game_rounds` rows with pre-calculated UTC timestamps based on the schedule.

---

### Phase 2 — Round Firing (Cloud Scheduler → Backend)

Cloud Scheduler calls `POST /api/marketing/campaigns/tick` on a 5–15 min interval.

`fire_pending_rounds()` logic:
1. Finds rounds where `scheduled_at ≤ now` and `status = pending`.
2. For each due round, draws a random `winning_answer` (e.g., random int 1–100 for `pick-number`).
3. Updates round: `status = sent`, stores `winning_answer`, sets `collection_ends_at = now + 24h` (mark-before-enqueue idempotency guard).
4. **Enqueues** one `kind=campaign` row per opted-in customer (or `targetCustomerIds` if specified) into `sms_outbound_queue` — it does **not** send inline. Example message: `"Hey! It's {restaurant}! 🎲 Pick a number 1-100 to win a free item! Reply with just the number. You have 24 hours!"` The drainer (Phase 2b) sends these under the global rate cap.

### Phase 2b — Queue Draining (Cloud Scheduler → Backend)

A separate Cloud Scheduler job calls `POST /api/marketing/drain-sms-queue` **every 1 minute**. This is the single chokepoint through which *all* bulk SMS leaves the system, so the shared SMS account's rate limit is never exceeded. See "Outbound SMS Queue" below for the full mechanism.

---

### Phase 3 — Customer Reply (Inbound SMS → Backend)

1. Customer replies with their answer (e.g., `"42"`).
2. Webhook (`/webhook/sms` or `/webhook/sms/telnyx`) receives the message.
3. `get_active_round_for_restaurant()` checks if there's a live round (`status=sent`, within `collection_ends_at`).
4. If a live round exists:
   - Duplicate guard: if customer already played this round → sends "You've already played" reply.
   - Otherwise: records `campaign_responses` row with `response_text`.
   - Generates `prize_code` (format: `WIN-XXXXXX` for winners, `SAVE-XXXXXX` for losers — but **winner/loser is determined at round resolution, not at reply time**).
   - Sends immediate acknowledgment SMS with a link: `{FRONTEND_BASE_URL}/prize/{prize_code}`.

> **Note**: At reply time, the prize code is created but the win/loss determination has not happened yet (the winning answer is sealed but not compared until `resolve_expired_rounds()` runs after 24h).

---

### Phase 4 — Round Resolution (After Collection Window)

`resolve_expired_rounds()` runs on each tick after `collection_ends_at` has passed:
1. Finds rounds where `collection_ends_at ≤ now` and `status = sent`.
2. For each expired round:
   - Compares each `response_text` to `winning_answer`.
   - Winners: sends SMS with their prize code and the redemption link.
   - Losers (up to `loser_discount_cap`): sends consolation discount code.
3. Marks round `status = resolved`.

---

### Phase 5 — Prize Redemption (Customer → Prize Page → Clover)

1. Customer taps the link in their SMS → `/prize/{code}` page (`app/prize/[prize_code]/page.tsx`).
2. Page fetches `GET /api/prize/{code}` → gets prize state + config.
3. **States**:
   - `pending`: Customer sees "Redeem in Store Now" button with a warning that tapping starts a 30-min timer.
   - `active`: Countdown timer shown. Instructs cashier to search for the Clover discount by name.
   - `expired`: Shows expired message. No action available.
4. Customer taps redeem → `POST /api/prize/{code}/redeem`.
5. Backend calls `create_clover_discount()` → creates a named discount in Clover POS (percentage or free item = 100% off).
6. Returns `discount_name` (e.g., `"25% OFF - WIN-AB1234"`) and `redemption_expires_at` (30 min from now).
7. Prize page shows the discount name and countdown.

---

## Outbound SMS Queue (Rate-Limited Sending)

**Why it exists:** All restaurants share a single Twilio/Telnyx account, so the rate limit (~1,000 msg/min) is *global*, not per-restaurant — and that same account also carries live customer order/voice traffic. A 3,000-recipient opt-in blast, or two restaurants firing campaign rounds at once, would blow the limit if each sent in its own loop. Funneling **every** bulk send through one queue drained by one rate-limited worker is the only way to guarantee the global ceiling holds.

**Producers** (both call `enqueue()` in `sms_outbound_queue.py`):
- Opt-in blast → `kind=optin` rows.
- Campaign fire/resolve → `kind=campaign` rows.

Each row carries the fully-rendered `message` and a `dedup_key` (`optin:{rid}:{cid}`, `camp-fire:{round}:{cid}`, `camp-res:{round}:{cid}`) enforced by a unique index, so duplicate enqueues are skipped.

**The drainer** (`drain()`), hit by Cloud Scheduler every minute:
1. **Acquires the `sms_drain_lease`** via an atomic conditional update. If another drain holds it, this tick returns `{ skipped: true }` — guaranteeing only one batch is ever in flight, so the rate cap holds even if ticks overlap. (A DB lease is used instead of a Postgres advisory lock because it's reliable across Supabase's pooled connections.)
2. **Claims a batch** with `claim_sms_outbound_batch(messages_per_minute)` — an atomic `UPDATE ... FOR UPDATE SKIP LOCKED` that flips `pending → sending` in global FIFO order. `SKIP LOCKED` means a row is never handed to two drains. It also **reclaims rows stuck in `sending`** longer than `stuck_sending_minutes` (a crashed worker), bounded by `max_send_attempts`.
3. **Consent re-check**: drops any recipient now `opted_out` (texted STOP after enqueue) → marked `failed`, no send (TCPA safety).
4. **Sends** via the per-restaurant SMS provider with bounded concurrency (`send_concurrency`), each send in its own thread so a full batch clears in seconds.
5. **Records outcome** per row: success → `sent`; permanent failure (invalid number / unsubscribed — e.g. Twilio 21211/21610) → `failed` immediately; transient failure (timeout / 429 / 5xx) → back to `pending` until `max_send_attempts`, then `failed`.

**All tuning lives in one place** — the `marketing:` block in `TextToOrderCoffee/config.yaml` (exposed as `settings.marketing`):

| Key | Default | Meaning |
|-----|---------|---------|
| `messages_per_minute` | 500 | Global send cap == per-tick batch size. Kept under the account limit to leave headroom for live order traffic. |
| `max_send_attempts` | 3 | Transient-failure retries before a row is marked `failed`. |
| `send_concurrency` | 20 | Parallel sends within one drain tick. |
| `stuck_sending_minutes` | 5 | Reclaim rows stuck in `sending` (crashed worker) after this. |
| `optin_discount_percent` | 10 | Opt-in incentive discount. |
| `optin_prize_expiry_days` | 7 | Opt-in prize code validity. |
| `optin_blast_message` | (template) | Opt-in invite text. Supports `{restaurant_name}` and `{discount}`. |

A 3,000-person blast therefore enqueues instantly and drains in ~6 minutes (500/min), with live ordering protected.

---

## Opt-In Blast Flow (Growing the Opted-In List)

Before a restaurant can run campaigns it needs opted-in customers. The opt-in blast imports the restaurant's existing Clover customers and invites them to opt in. Driven from the Marketing tab (`GamifiedMarketingTab.tsx`):

1. **Scan** — owner clicks Scan → `POST /api/marketing/scan-clover`. Read-only; returns the count of Clover customers (with phones) never previously blasted, using `marketing_settings.last_clover_scan_at` to only consider newly-added customers.
2. **Send blast** — owner clicks Send → `POST /api/marketing/send-optin-blast` (body `{ restaurant_id }`, no `target_phones`). The backend, in **batched** bulk operations (not per-row):
   - Bulk-creates any missing `customers` rows.
   - Bulk-upserts `customer_restaurant_consents` with `opt_in_status=pending`, `opt_in_source=blast`, `blast_sent_at=now` (the guard that makes re-running skip already-contacted customers).
   - Enqueues one `kind=optin` row per customer.
   - Advances `last_clover_scan_at` and returns `{ queued }` immediately.
3. **Drain** — the every-minute drainer sends the invites under the global rate cap.
4. **Customer replies YES** → consent webhook flips them to `opted_in` and generates a 10%-off `optin_prizes` coupon (link to `/prize/{code}`). Replying STOP → `opted_out`.

The opt-in invite is TCPA-compliant (clear sender, opt-out instructions, incentive disclosed up front).

---

## Opt-In / Consent System

Managed by `src/services/consent_manager.py`.

- Consent is **per-customer per-restaurant** in `customer_restaurant_consents`.
- `opt_in_status` values: `pending`, `opted_in`, `opted_out`.
- **Soft launch mode is currently active**: new customers who text any restaurant are auto-opted-in, bypassing the TCPA YES/NO prompt. The compliant prompt code exists but is commented out.
- Inbound `STOP` → opts out. Inbound `START` → re-opts in. Inbound `HELP` → sends help message.
- **Proactive opt-in invites are implemented** via the Opt-In Blast Flow (scan Clover → enqueue invites → drain). A blasted customer is `pending` until they reply YES (→ `opted_in` + 10%-off coupon) or STOP (→ `opted_out`). See "Opt-In Blast Flow" above.

---

## SMS Provider

- Abstracted via `SMSProviderInterface` / `SMSProviderFactory` in `src/services/sms_provider.py`.
- Provider is configured per-restaurant in the restaurant config YAML (`twilio` or `telnyx`).
- Twilio is the primary/default provider. Telnyx is also supported.
- The provider layer has **no rate limiting** — bulk-send throttling is handled entirely by the Outbound SMS Queue drainer (see above). The Twilio/Telnyx account is **shared across all restaurants**, so the limit is global.

---

## What Is Real vs. Hardcoded

| Feature | Status | Notes |
|---------|--------|-------|
| Opted-in customer roster in wizard | ✅ Real | `GET /api/marketing/opted-in-customers` |
| Menu items for prize selection | ✅ Real | `GET /api/marketing/items` |
| Campaign launch (saves to DB + creates rounds) | ✅ Real | `POST /api/marketing/campaigns` |
| Pause / resume campaign | ✅ Real | `PATCH /api/marketing/campaigns/{id}` |
| Game round scheduling (pre-creates 52 weeks) | ✅ Real | Done at launch time in backend |
| SMS blast to opted-in customers | ✅ Real | Campaign tick enqueues; drainer sends |
| Rate-limited outbound SMS queue | ✅ Real | `sms_outbound_queue` + `/drain-sms-queue` every 1 min; global cap via `messages_per_minute` |
| Opt-in scan of Clover customers | ✅ Real | `POST /api/marketing/scan-clover` (read-only) |
| Proactive opt-in blast to Clover customers | ✅ Real | `POST /api/marketing/send-optin-blast` → enqueue → drain |
| Inbound reply capture + prize code generation | ✅ Real | Webhook handler |
| Prize page (pending / active / expired states) | ✅ Real | `/prize/[prize_code]/page.tsx` |
| Clover discount creation on redeem | ✅ Real | `create_clover_discount()` in backend |
| Marketing owner onboarding (`/marketing/onboarding`) | ✅ Real | 5-step wizard; creates pre-confirmed Supabase account + emails submission to belal.nayeem1@gmail.com via Resend |
| Dashboard stats (Opted In, Played, Redeemed, Score) | ❌ Hardcoded | `MOCK_STATS` in `GamifiedMarketingTab.tsx` — backend endpoint exists |
| Per-game breakdown numbers | ❌ Hardcoded | `MOCK_PER_GAME` in same component |
| Top 5 customers table | ❌ Hardcoded | `MOCK_STATS.topCustomers` |
| "Not Opted In" count | ❌ Hardcoded | Hard-coded as `42` |
| Campaign state restored on page load | ❌ Missing | Always shows wizard; should auto-enter dashboard if active campaign exists |
| Subscription gate before using marketing | ❌ Missing | No payment check before campaign launch |
| TCPA-compliant YES/NO opt-in prompt | ⚠️ Soft-launch | Auto-opt-in for organic texters; compliant prompt code commented out. (Blast invites *are* TCPA-compliant.) |
| RCS messaging | ❌ Missing | SMS only currently |

---

## Known Gaps / Remaining Work

### 1. Connect Real Dashboard Stats
**File**: `components/voice/GamifiedMarketingTab.tsx`
**Fix**: Replace `MOCK_STATS` and `MOCK_PER_GAME` with a real fetch to `GET /api/marketing/campaigns/{campaign_id}/stats`. The backend endpoint is fully implemented and returns `opted_in`, `played`, `redeemed`, `campaign_score`, `top_customers`, `per_game`.

### 2. Restore Campaign State on Page Load
**File**: `components/voice/GamifiedMarketingTab.tsx`
**Fix**: On mount, call `GET /api/marketing/campaigns?restaurant_id=...`. If an active or paused campaign is returned, skip the wizard and load the dashboard view with that `campaignId`. Currently the component always starts in wizard phase.

### 3. Onboarding Flow
**Status**: Marketing-specific onboarding is implemented at `/marketing/onboarding` (see "Marketing Onboarding Flow" section above). The Clover POS onboarding at `/onboarding` remains separate and unchanged. Belan staff manually sets up the restaurant's RCS number and backend configuration after receiving the onboarding email.

### 4. Subscription / Billing Gate
No Stripe payment check exists before a restaurant can launch a campaign. A Stripe integration exists in `src/integrations/stripe/` but is not connected to marketing. Need to add a subscription check (e.g., `$200/month` plan) before allowing campaign launch. The Terms of Service page already references this price point.

### 5. TCPA-Compliant Opt-In
Currently in soft-launch mode (auto-opt-in for *organic* texters). Before real launch:
- Uncomment the TCPA-compliant YES/NO prompt flow in `consent_manager.py`.
- Update Terms of Service and Privacy Policy with TCPA-specific language.

> ✅ Proactive opt-in invites to existing Clover customers are **implemented** (Opt-In Blast Flow). The invite message itself is TCPA-compliant.

### 6. RCS Support
All messaging is currently SMS only. RCS (Rich Communication Services) support needs to be added to the SMS provider abstraction and tested with a supported carrier/provider.

### 7. Deprecate Legacy Marketing Page
`app/marketing/page.tsx` is an older, non-auth-aware prototype with fully mocked data. It should be removed or redirected to `/home` to avoid confusion.

---

## Architecture Decision: Pre-Created Rounds vs. Dynamic Scheduling

When a campaign launches, the backend pre-creates up to 52 weeks of `campaign_game_rounds` rows with exact UTC timestamps. This design was chosen over a dynamic approach (generating rounds on-the-fly) so that:
- The Cloud Scheduler tick is a simple DB scan (`scheduled_at ≤ now AND status = pending`).
- Pausing/resuming doesn't require recalculating schedules.
- Rounds can be inspected and audited in the DB before they fire.

See `docs/campaign-send-architecture.md` for the older pg_cron-based approach (now superseded by Cloud Scheduler + tick endpoint).

### Cloud Scheduler Jobs

Two GCP Cloud Scheduler jobs (region `us-central1`) drive the backend (Cloud Run scales to zero, so in-process schedulers aren't used):

| Job | Schedule | Target |
|-----|----------|--------|
| `campaign-tick` | every 1–15 min | `POST /api/marketing/campaigns/tick` — fires/resolves campaign rounds (enqueues) |
| `sms-queue-drain` | every 1 min | `POST /api/marketing/drain-sms-queue` — sends one batch from the queue |

Both endpoints are currently unauthenticated (consistent with each other). Adding a shared-secret header is a recommended follow-up before wider exposure.

---

## Environment Variables Relevant to Marketing

| Variable | Where Used | Purpose |
|----------|-----------|---------|
| `FRONTEND_BASE_URL` | Backend | Base URL for prize links in SMS (e.g., `https://belan.tech`) |
| `TWILIO_ACCOUNT_SID` | Backend | Twilio credentials for SMS |
| `TWILIO_AUTH_TOKEN` | Backend | Twilio credentials for SMS |
| `TELNYX_API_KEY` | Backend | Telnyx credentials (alternative provider) |
| `CLOVER_API_KEY` | Backend | For creating discounts on redeem |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Supabase URL (used in `lib/supabase.ts` and server-side admin client in onboarding routes) |
| `SUPABASE_SERVICE_ROLE_KEY` | Frontend (server routes) | Used by `/api/marketing-onboarding/create-account` to create pre-confirmed users via Supabase admin API |
| `RESEND_API_KEY` | Frontend (server routes) | Used by `/api/marketing-onboarding` to send onboarding notification emails via Resend |
