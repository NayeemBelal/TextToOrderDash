// Backend base URLs, dependency-free so edge routes (e.g. the generated
// coupon link-preview image) can import them without dragging the Supabase
// client into their bundle.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://text-to-order-coffee-34770846162.us-central1.run.app';

// Decoupled marketing backend (belan-marketing-backend on Cloud Run).
// Serves /api/marketing/*, /api/prize/*, /api/referral/*, /api/join/*.
export const MARKETING_API_BASE_URL =
  process.env.NEXT_PUBLIC_MARKETING_BACKEND_URL ||
  'https://belan-marketing-backend-34770846162.us-central1.run.app';
