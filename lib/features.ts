/**
 * Product feature flags.
 *
 * OPTIN_SMS_ENABLED — may this dashboard offer to SEND opt-in invitation texts
 * (the Opt-In Progress panel, "scan POS + blast", test opt-in sends)? Off by
 * default while the legal footing of unsolicited opt-in texts is reviewed; the
 * backend enforces the same gate (OPTIN_SMS_ENABLED → 403), this just hides the
 * UI. Customer-initiated consent — the QR/web sign-up form, referral links,
 * importing contacts who already agreed — is always available.
 *
 * Set NEXT_PUBLIC_OPTIN_SMS_ENABLED=true to bring the opt-in tooling back.
 */
export const OPTIN_SMS_ENABLED =
  process.env.NEXT_PUBLIC_OPTIN_SMS_ENABLED === "true" ||
  process.env.NEXT_PUBLIC_OPTIN_SMS_ENABLED === "1";
