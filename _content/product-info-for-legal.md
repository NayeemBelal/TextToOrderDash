# Belan AI — Product & Data Reference for Privacy Policy / Terms of Service

> **How to use this file:**
> Review every section marked `[CONFIRM]` or `[FILL IN]` and add your answers.
> Then feed this file back to the agent with the message:
> "Create Privacy Policy and Terms of Service pages using `_content/product-info-for-legal.md`"

---

## 1. Company Information

- **Company name:** Belan AI `Yusra Institute LLC`
- **Founded:** `2025`
- **Headquarters:** `Plano, TX`
- **Contact email for privacy/legal inquiries:** `nayeem@belan.tech`
- **Support phone:** (203) 300-7233
- **Website:** https://belan.tech
- **Geographic scope:** United States only (no international operations)

---

## 2. Products Offered

All five products are included in a single $200/month flat-rate subscription. No per-order fees.

### 2a. Voice AI

AI answers every incoming phone call to the restaurant 24/7. It takes orders through natural voice conversation, upsells based on each customer's taste profile, and fires the completed order directly to the POS system. Built on Ultravox AI (model: ultravox-v0.7) with Telnyx for phone call routing.

**What it does with customer data:**

- Identifies caller by phone number
- Greets returning customers by name (if previously collected)
- Surfaces customer taste profile (likes, dislikes, allergies, dietary restrictions) to the AI during the call
- Collects customer name mid-call (optional)
- Sends a Stripe checkout SMS link to complete payment
- Stores full call transcript indefinitely

### 2b. Text AI (SMS Ordering)

Customers order by texting the restaurant's dedicated phone number. No app required. Uses a conversational AI (via OpenRouter, models include Google Gemini Flash, GPT-4o Mini, Mistral) to process orders. SMS delivered via Twilio or Telnyx.

**What it does with customer data:**

- Identifies customer by phone number
- Collects and stores complete SMS conversation history indefinitely
- Builds and updates taste profiles from conversation history
- Sends payment links via SMS (Clover-hosted checkout or Stripe)
- Manages TCPA opt-in/opt-out consent per customer per restaurant

### 2c. Dashboard

Real-time analytics for restaurant owners: revenue, order volume, top-selling items, call/text volume. Built on Next.js frontend + FastAPI backend + Supabase PostgreSQL.

**Data shown:** Aggregated order data, revenue figures, item popularity, customer count. Test data is filtered out automatically.

### 2d. Marketing AI

AI-powered SMS marketing campaign tool. Restaurant owners define a target audience (e.g., "customers who ordered pizza in the last 30 days") and the AI drafts and sends targeted SMS campaigns. Uses Google Gemini Flash for copywriting via OpenRouter.

**What it does with customer data:**

- Queries customer order history and preferences
- Sends promotional SMS messages to opted-in customers
- All marketing SMS requires existing TCPA opt-in

### 2e. Sales AI

Natural language interface for restaurant sales analytics. Owners ask plain-English questions about their data ("What were our top 5 items last Tuesday?") and receive instant answers. Uses Google Gemini Flash via OpenRouter.

**What it does with customer data:**

- Queries aggregated order and revenue data
- No customer-identifiable data is surfaced to restaurant owners in query results

---

## 3. Data Collected — End Customers (Restaurant Patrons)

These are the people who call or text the restaurant.

| Data Type                                                        | Collected           | How Collected                                    | Stored Where                  | Retention                                                      |
| ---------------------------------------------------------------- | ------------------- | ------------------------------------------------ | ----------------------------- | -------------------------------------------------------------- |
| Phone number                                                     | Always              | Inbound call/SMS                                 | Supabase (PostgreSQL)         | Indefinite                                                     |
| First + last name                                                | Optional            | Collected mid-call or mid-text                   | Supabase                      | Indefinite                                                     |
| Email address                                                    | Optional (SMS only) | Requested for payment confirmation               | Supabase                      | Indefinite                                                     |
| Full SMS conversation history                                    | Yes                 | Every inbound/outbound message logged            | Supabase                      | Indefinite (archival to cold storage planned after 90 days)    |
| Voice call transcripts                                           | Yes                 | Ultravox AI captures full transcript             | Supabase + Ultravox servers   | Indefinite on Belan servers; subject to Ultravox policy        |
| Order history                                                    | Yes                 | Every completed order stored                     | Supabase                      | Indefinite                                                     |
| Taste profile (likes, dislikes, allergies, dietary restrictions) | Yes                 | Extracted from conversation history by AI        | Supabase                      | Indefinite with staleness eviction (~6 months for old signals) |
| Special notes / dietary preferences                              | Yes                 | Expressed verbally or in text                    | Supabase (per order)          | Indefinite                                                     |
| Card information                                                 | No                  | Tokenized by Clover/Stripe only                  | Never stored on Belan servers | N/A                                                            |
| Card last 4 digits                                               | Yes                 | Stored for UX display only                       | Supabase                      | Indefinite                                                     |
| TCPA consent status                                              | Yes                 | Opt-in captured before SMS conversation          | Supabase                      | Indefinite (per customer per restaurant)                       |
| Call duration                                                    | Yes                 | Telnyx webhook                                   | Supabase                      | Indefinite                                                     |
| Call outcome                                                     | Yes                 | Classified by AI (order-intent, forwarded, etc.) | Supabase                      | Indefinite                                                     |

---

## 4. Data Collected — Restaurant Owners / Operators

| Data Type                                         | Collected | Notes                            |
| ------------------------------------------------- | --------- | -------------------------------- |
| Restaurant name                                   | Yes       |                                  |
| Restaurant phone number                           | Yes       |                                  |
| POS OAuth tokens (Clover access + refresh tokens) | Yes       | Auto-refreshed; stored encrypted |
| Tax rate                                          | Yes       |                                  |
| Business hours configuration                      | Yes       |                                  |
| AI voice ID preference                            | Yes       |                                  |
| Custom greeting and business rules                | Yes       |                                  |
| FAQ content                                       | Yes       | Stored per restaurant            |
| Upsell rules                                      | Yes       | Stored per restaurant            |
| Forwarding number (for call transfers)            | Yes       |                                  |

`[CONFIRM: Do restaurant owners create a Belan login? If yes, what credentials are stored (email, hashed password)?]` Yes, we store email and password using supabase auth

---

## 5. Third-Party Services — Data Sharing

| Service                                  | Purpose                                           | Data Sent                                                               | Their Privacy Policy                       |
| ---------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------ |
| **Supabase** (database)                  | All data storage                                  | All customer and restaurant data                                        | https://supabase.com/privacy               |
| **OpenRouter**                           | LLM gateway for SMS AI                            | Menu JSON, conversation history, taste profiles, cart state             | https://openrouter.ai/privacy              |
| **Google Gemini Flash** (via OpenRouter) | Order processing, marketing copy, sales analytics | See OpenRouter above                                                    | https://policies.google.com/privacy        |
| **OpenAI GPT-4o Mini** (via OpenRouter)  | Order processing                                  | See OpenRouter above                                                    | https://openai.com/privacy                 |
| **Mistral** (via OpenRouter)             | Menu extraction                                   | See OpenRouter above                                                    | https://mistral.ai/privacy                 |
| **Ultravox AI**                          | Voice call AI conversations                       | System prompt, customer name, taste profile, full call audio/transcript | https://ultravox.ai (check current policy) |
| **Telnyx**                               | SMS + phone calls                                 | Phone numbers, message content, call audio streams                      | https://telnyx.com/privacy                 |
| **Twilio**                               | SMS delivery (alternative)                        | Phone numbers, message content                                          | https://twilio.com/legal/privacy           |
| **Clover** (Fiserv)                      | POS integration                                   | Order details, menu data, OAuth tokens                                  | https://clover.com/privacy                 |
| **Stripe**                               | Payment processing (Voice AI)                     | Line items, order metadata, customer phone number                       | https://stripe.com/privacy                 |
| **Google Cloud Run**                     | Backend hosting                                   | Server logs (may include diagnostic info)                               | https://cloud.google.com/privacy           |
| **Google Cloud Secret Manager**          | Credentials management                            | API keys (not customer data)                                            | https://cloud.google.com/privacy           |

`[CONFIRM: Any other third-party services not listed here?]` We will be integrating with Toast and Square as well

---

## 6. Payment Processing

- **Voice AI orders:** Stripe hosted checkout — customers pay via a link sent by SMS. Stripe handles all PCI compliance. Card data never touches Belan servers.
- **SMS orders:** Clover hosted checkout — customers pay via a Clover-hosted payment URL. Alternatively, Clover iframe SDK for tokenization. Card data never stored on Belan servers.
- **PCI DSS compliance level:** SAQ A (simplest level — no card data on servers)
- **What IS stored on Belan servers:** Card last 4 digits (for UX display), card brand, Clover/Stripe charge IDs

---

## 7. TCPA Compliance (SMS)

- Consent collected before first SMS exchange
- Opt-in status tracked per customer per restaurant (not globally)
- STOP command immediately opts customer out
- START command re-opts customer in
- HELP command returns informational message
- Marketing SMS only sent to customers with active opt-in

`[CONFIRM: What is the exact consent language shown to customers before their first text conversation? This must appear in the Privacy Policy.]`
Reply YES to order by text. Msg freq varies. Msg&Data Rates May Apply. STOP=opt out, HELP=help. Privacy: https://yusrainstitute.netlify.app/privacy
(obviously we will change the privacy link)

---

## 8. Data Retention

| Data                        | Current Retention | Notes                                                   |
| --------------------------- | ----------------- | ------------------------------------------------------- |
| Conversations (SMS history) | Indefinite        | Archival to cold storage planned for >90 days           |
| Voice call transcripts      | Indefinite        |                                                         |
| Taste profiles              | Indefinite        | Staleness eviction: old signals demoted after ~6 months |
| Order history               | Indefinite        |                                                         |
| Payment sessions            | 15 minutes        | Auto-deleted                                            |
| Test data                   | Never deleted     | Filtered from analytics; retained in database           |

`[CONFIRM: Do you offer customers any way to request deletion of their data? Will you commit to honoring deletion requests? This affects CCPA obligations.]`
Yes

`[CONFIRM: Any planned changes to retention policies?]`
No

---

## 9. Security Measures

- All data encrypted at rest via Supabase
- All data encrypted in transit (HTTPS/TLS 1.2+, RTP encryption for voice calls)
- Row-Level Security (RLS) for multi-tenant restaurant data isolation
- Payment data: PCI DSS SAQ A — no card numbers stored on Belan servers
- Credentials: Google Cloud Secret Manager in production (not hardcoded)
- Webhook security: Stripe webhook signature verification (HMAC SHA-256)

`[CONFIRM: Any additional security certifications (SOC 2, ISO 27001)?]` no
`[CONFIRM: Is there a security incident response process?]` you create one

---

## 10. User Rights (CCPA Considerations — California Residents)

California residents have rights to:

- Know what personal information is collected
- Request deletion of personal information
- Opt out of sale of personal information (note: Belan does not sell data)
- Non-discrimination for exercising these rights

`[CONFIRM: Are you willing to commit to responding to data deletion requests within 45 days?]` yes
`[CONFIRM: Contact email for privacy requests — e.g. privacy@belan.tech?]`
nayeem@belan.tech

---

## 11. Pricing & Subscription Terms (for Terms of Service)

- **Price:** $200 per month, flat rate
- **Billing cycle:** Monthly
- **What's included:** All five products (Voice AI, Text AI, Dashboard, Marketing AI, Sales AI)
- **Per-order fees:** None
- **Free trial:** `[CONFIRM: Is there a free trial? If yes, how long and what happens at the end?]` 14 day free trial
- **Cancellation policy:** `[FILL IN: Can customers cancel month-to-month? Is there a minimum commitment?]` yes for now its month to month
- **Refund policy:** `[FILL IN: Any refunds on cancellation?]` None
- **Payment method:** `[CONFIRM: How do restaurant owners pay for the subscription? Credit card via Stripe? Invoice?]` Credit card via stripe or invoice

---

## 12. Liability & Service Guarantees

`[FILL IN: Any uptime SLA you want to commit to? e.g. "99.9% uptime"]` No
`[FILL IN: Limitation of liability clause — what is the maximum liability cap? (common: 3 months of fees paid)]` None
`[FILL IN: Any warranties you explicitly make or disclaim?]` no

---

## 13. Governing Law

`[FILL IN: Which state's law governs the Terms of Service? e.g. "State of Delaware" or "State of [your incorporation state]"]`State of Texas
`[FILL IN: Dispute resolution — courts, arbitration, or both?]` IDK

---

## 14. Updates to Policy

`[CONFIRM: How will users be notified of material changes to the Privacy Policy? (common: email notice, website posting with 30-day advance notice)]`
website posting with 30 day notice
