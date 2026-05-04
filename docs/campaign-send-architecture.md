# Campaign Launch Architecture

## Problem

The marketing campaign flow (item selection → message generation → customer targeting) needs a send layer: a "Launch Campaign" button that dispatches SMS messages to all recipients, tracks progress, and shows live status back on the campaign list.

**Key constraint**: The FastAPI server cannot stay alive for the full send duration (e.g. 500 recipients × 3s spacing = 25 minutes). The send logic must be decoupled from the API server.

---

## What We Investigated

### Supabase Realtime

**For dispatch: ❌ Wrong tool.**

Supabase Realtime is a WebSocket-based pub/sub system with three modes: Broadcast, Presence, and Postgres Changes.

| Property | Reality |
|----------|---------|
| Message persistence | ❌ Ephemeral — messages lost if no subscriber is connected |
| Retry on failure | ❌ None built-in |
| Trigger Edge Functions | ❌ No auto-invoke — something must actively subscribe |
| Edge Function as subscriber | ❌ Functions are stateless, 150s timeout, can't hold WebSocket open |
| Guaranteed delivery | ❌ No |

**Free tier**: 2M messages/month, 200 concurrent connections, 100 msgs/sec — well within range for campaigns, but the architectural mismatch makes it the wrong choice for dispatch.

**For live dashboard status updates: ✅ Perfect fit.**

Once a campaign is sending, the frontend can subscribe to Postgres Changes on the `campaigns` table. As the Edge Function increments `sent_count`, Realtime pushes the delta to every connected browser instantly. This is exactly the use case Realtime was designed for.

### Supabase Queues (pgmq)

Supabase's built-in queue extension. Durable, exactly-once semantics, archived for auditing. BUT — queues are not auto-triggered. Something must poll them (a cron job or a consumer process). No native integration to fire an Edge Function per message.

### Database Webhooks + pg_net

Database Webhooks are syntactic sugar over pg_net triggers. They fire an HTTP POST to any URL on INSERT/UPDATE/DELETE. Combined with `net.http_post()` in a trigger or cron job, they can invoke an Edge Function per row.

---

## Chosen Architecture

```
FastAPI backend
    │
    │  POST /api/marketing/launch-campaign
    │  ┌──────────────────────────────────────────┐
    │  │ 1. INSERT campaigns row (status=sending)  │
    │  │ 2. INSERT N campaign_messages rows        │
    │  │    process_at = now() + (i × 3 seconds)   │
    │  │ 3. Return { campaign_id } immediately     │
    │  └──────────────────────────────────────────┘
    │
    ▼
campaign_messages table  ◄──── durable queue (one row per recipient)
    │
    │  pg_cron (every 5 seconds)
    │  Finds 1 pending row WHERE process_at <= now()
    │  → net.http_post() to Edge Function
    │
    ▼
Supabase Edge Function: send-campaign-sms
    │  Input: { id, campaign_id, to_phone, from_phone, message, provider }
    │  1. Calls Twilio or Telnyx REST API (creds read from function secrets)
    │  2. Marks campaign_messages row → sent / failed
    │  3. Increments campaigns.sent_count or failed_count (atomic SQL function)
    │  4. If all done → campaigns.status = 'completed'
    │
    ▼
Supabase Realtime (Postgres Changes on campaigns table)
    │
    ▼
Frontend subscribes → live sent_count / status dot updates in real time
```

---

## Why This Works

| Requirement | Solution |
|-------------|----------|
| Server-independent sending | pg_cron + Edge Function — no FastAPI involvement after launch |
| 3-second spacing | `LIMIT 1` on the cron query + messages pre-scheduled 3s apart |
| Each message triggers one run | pg_cron fires one Edge Function invocation per message |
| Durable, not lost if server restarts | `campaign_messages` table persists everything |
| Retry-able | Failed rows stay in table, can be requeued |
| Live progress on dashboard | Supabase Realtime Postgres Changes on `campaigns` |
| No extra infrastructure | Everything runs inside Supabase — no Redis, no Celery, no GCP Pub/Sub |

---

## Database Schema

### `campaigns`

```sql
CREATE TABLE campaigns (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id     UUID NOT NULL REFERENCES restaurants(id),
  item_name         TEXT NOT NULL,
  message           TEXT NOT NULL,
  targeting         TEXT NOT NULL DEFAULT 'all',
  discount_percentage NUMERIC,
  total_recipients  INT NOT NULL DEFAULT 0,
  sent_count        INT NOT NULL DEFAULT 0,
  failed_count      INT NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'sending'
                    CHECK (status IN ('sending', 'completed', 'failed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);
```

### `campaign_messages` (the queue)

```sql
CREATE TABLE campaign_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  customer_id UUID REFERENCES customers(id),
  to_phone    TEXT NOT NULL,
  from_phone  TEXT NOT NULL,
  message     TEXT NOT NULL,
  provider    TEXT NOT NULL,          -- 'twilio' | 'telnyx'
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'sent', 'failed')),
  process_at  TIMESTAMPTZ NOT NULL,   -- pre-scheduled send time
  sent_at     TIMESTAMPTZ,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index to make the cron query fast
CREATE INDEX campaign_messages_queue_idx
  ON campaign_messages(process_at, status)
  WHERE status = 'pending';
```

### SQL Helper Functions

```sql
-- Atomically increment sent_count or failed_count
CREATE OR REPLACE FUNCTION increment_campaign_counter(
  p_campaign_id UUID,
  p_field TEXT
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_field = 'sent_count' THEN
    UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = p_campaign_id;
  ELSE
    UPDATE campaigns SET failed_count = failed_count + 1 WHERE id = p_campaign_id;
  END IF;
END;
$$;

-- Mark campaign completed when all messages are processed
CREATE OR REPLACE FUNCTION maybe_complete_campaign(
  p_campaign_id UUID
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_total  INT;
  v_sent   INT;
  v_failed INT;
BEGIN
  SELECT total_recipients, sent_count, failed_count
    INTO v_total, v_sent, v_failed
    FROM campaigns WHERE id = p_campaign_id;

  IF (v_sent + v_failed) >= v_total THEN
    UPDATE campaigns
      SET status = 'completed', completed_at = NOW()
      WHERE id = p_campaign_id;
  END IF;
END;
$$;
```

### pg_cron Job

```sql
-- Fires every 5 seconds, picks up 1 pending message at a time
SELECT cron.schedule(
  'dispatch-campaign-messages',
  '5 seconds',
  $$
    SELECT net.http_post(
      url     := 'https://<project-ref>.supabase.co/functions/v1/send-campaign-sms',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || '<service_role_key>',
        'Content-Type',  'application/json'
      ),
      body    := row_to_json(m)::jsonb
    )
    FROM campaign_messages m
    WHERE m.status = 'pending'
      AND m.process_at <= now()
    ORDER BY m.process_at
    LIMIT 1;
  $$
);
```

> `LIMIT 1` means one Edge Function call per 5-second tick. Adjust to `LIMIT 2` for ~2.5s effective spacing, or match `LIMIT` to cron interval ÷ 3.

---

## Supabase Edge Function: `send-campaign-sms`

**File**: `supabase/functions/send-campaign-sms/index.ts`

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req: Request) => {
  const { id, campaign_id, to_phone, from_phone, message, provider } =
    await req.json();

  let success = false;
  let errorText = "";

  try {
    if (provider === "twilio") {
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
      const authToken  = Deno.env.get("TWILIO_AUTH_TOKEN")!;
      const creds      = btoa(`${accountSid}:${authToken}`);

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${creds}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To:   to_phone,
            From: from_phone,
            Body: message,
          }),
        }
      );
      success = res.ok;
      if (!res.ok) errorText = await res.text();
    } else {
      // Telnyx
      const res = await fetch("https://api.telnyx.com/v2/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("TELNYX_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from: from_phone, to: to_phone, text: message }),
      });
      success = res.ok;
      if (!res.ok) errorText = await res.text();
    }
  } catch (e) {
    errorText = String(e);
    console.error("SMS send error:", e);
  }

  // Update this message row
  await supabase
    .from("campaign_messages")
    .update({
      status:  success ? "sent" : "failed",
      sent_at: new Date().toISOString(),
      error:   success ? null : errorText,
    })
    .eq("id", id);

  // Increment the right counter on the campaign
  await supabase.rpc("increment_campaign_counter", {
    p_campaign_id: campaign_id,
    p_field:       success ? "sent_count" : "failed_count",
  });

  // Complete the campaign if all messages are processed
  await supabase.rpc("maybe_complete_campaign", {
    p_campaign_id: campaign_id,
  });

  return new Response("ok", { status: 200 });
});
```

**Secrets to set on the Edge Function** (via Supabase dashboard or CLI):
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TELNYX_API_KEY`

Credentials are never passed in the request body — they live only in the function's secret store.

---

## Backend Changes (FastAPI `marketing.py`)

### `POST /api/marketing/launch-campaign`

```python
class LaunchCampaignRequest(BaseModel):
    restaurant_id: str
    item_name: str
    message: str
    customer_ids: List[str]             # from preview-campaign
    targeting: str                      # 'all' | 'targeted'
    discount_percentage: Optional[float] = None

# Logic:
# 1. Fetch restaurant → get phone_number (from_phone) + sms provider
# 2. Fetch customers WHERE id IN (customer_ids) → get phone numbers
# 3. INSERT campaigns row → get campaign_id
# 4. Bulk INSERT campaign_messages rows:
#      process_at = datetime.utcnow() + timedelta(seconds=i * 3)
# 5. Return { campaign_id: "..." }
```

### `GET /api/marketing/campaigns?restaurant_id=...`

Returns all campaigns for the restaurant, newest first:
```json
[
  {
    "id": "...",
    "item_name": "Classic Cheeseburger",
    "message": "...",
    "targeting": "all",
    "discount_percentage": 15,
    "total_recipients": 87,
    "sent_count": 43,
    "failed_count": 0,
    "status": "sending",
    "created_at": "2026-02-22T14:00:00Z",
    "completed_at": null
  }
]
```

---

## Frontend Changes (`app/marketing/page.tsx`)

1. **Replace `mockCampaigns`** with real `GET /api/marketing/campaigns` on mount
2. **Enable Launch button** — calls `POST /api/marketing/launch-campaign` with the current `campaignMessage` + `customer_ids` from the configure step, then `setShowCreateFlow(false)` to return to the list
3. **Polling** — `useEffect` with `setInterval(3000)` while any campaign has `status === 'sending'`
4. **Status indicators**:
   - `sending`: pulsing green dot (CSS `animate-pulse`) + `X / Y sent` text
   - `completed`: static green checkmark icon
   - `failed`: red X icon

---

## File Summary

| File | Change |
|------|--------|
| Supabase migration | CREATE campaigns, campaign_messages, indexes, RLS, helper functions |
| Supabase migration | pg_cron job (every 5s) + pg_net call to Edge Function |
| `supabase/functions/send-campaign-sms/index.ts` | New Edge Function |
| `src/api/marketing.py` | Add `launch-campaign` + `campaigns` endpoints |
| `app/marketing/page.tsx` | Enable button, real campaign data, status UI, polling |

---

## Verification Steps

1. Run backend + frontend
2. Go through campaign wizard → click "Launch Campaign"
3. Immediately redirected to campaign list — new row appears with `sending` status + pulsing dot
4. Every 3 seconds, counter increments (`sent_count` ticks up)
5. Check Supabase Table Editor → `campaign_messages` rows flip `pending` → `sent`
6. Check pg_cron history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20`
7. When all sent → dot becomes a checkmark, `campaigns.status = 'completed'`
