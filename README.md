# TextToOrder Dashboard

A mobile-first command center for restaurant owners using the TextToOrder AI-powered SMS ordering system.

## Features

### MVP (Phase 1)
- **Revenue Dashboard**: Robinhood-style revenue tracking with interactive sparkline
- **AI Productivity Insight**: Quantified time savings from automated ordering
- **Menu Intelligence**: Top 5 selling items with "hot item" indicators

## Tech Stack

- **Frontend**: Next.js 15 (App Router) + React 19
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project (from existing TextToOrder service)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials.

Environment variables:

| Variable | Where it runs | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Service role key for API routes (account creation, restaurant claims, payment confirmation) |
| `STRIPE_SECRET_KEY_BELAN` | server | Belan's own Stripe secret key — SaaS subscription billing for marketing onboarding (NOT the per-restaurant Stripe config for order payments) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_BELAN` | client | Belan's Stripe publishable key for the embedded checkout form |
| `STRIPE_MARKETING_PRICE_ID` | server | Recurring price id for the Gamified Marketing Monthly Subscription ($200/mo) |

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (dashboard)
│   └── globals.css        # Global styles
├── components/            # React components
├── lib/                   # Utility functions
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Helper functions
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## Development

```bash
# Run development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Design Philosophy

This dashboard follows a **financial app aesthetic** (Robinhood-inspired):
- Mobile-first, touch-friendly interactions
- Big numbers and clear visual hierarchy
- Minimalist design with bold color accents
- Smooth animations and micro-interactions
- Instant gratification for busy restaurant owners

## License

Proprietary - TextToOrder
