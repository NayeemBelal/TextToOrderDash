import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';

// Where new-signup notifications go so the account rep can reach out within 24h.
const OPS_NOTIFY_TO = process.env.ONBOARDING_NOTIFY_EMAIL ?? 'belal.nayeem1@gmail.com';

function escapeHtml(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

// Emails ops that a new restaurant paid and needs provisioning (restaurant row,
// POS connection, marketing number, linking restaurant_id to the account).
// Best-effort: a failure here is logged but never fails the payment confirmation.
async function notifyOps(input: {
  userId: string;
  email: string;
  restaurantName: string;
  customerId: string | null;
  subscriptionId: string | null;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('confirm-payment: RESEND_API_KEY not set; skipping ops notification');
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const rows: [string, string][] = [
    ['Restaurant', input.restaurantName || '—'],
    ['Owner email', input.email],
    ['Supabase user id', input.userId],
    ['Stripe customer', input.customerId ?? '—'],
    ['Stripe subscription', input.subscriptionId ?? '—'],
    ['Paid at', new Date().toISOString()],
  ];
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#111">
    <h2 style="margin:0 0 8px">New Marketing signup — ${escapeHtml(input.restaurantName)}</h2>
    <p style="margin:0 0 16px;color:#555">Payment confirmed. The owner was told a rep will reach out within 24 hours and setup takes ~3 days.</p>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows.map(([k, v]) => `<tr><td style="color:#555;border-bottom:1px solid #eee">${escapeHtml(k)}</td><td style="border-bottom:1px solid #eee"><b>${escapeHtml(v)}</b></td></tr>`).join('')}
    </table>
    <p style="margin:16px 0 0;color:#555">To do: create the restaurant row, set <code>restaurant_id</code> on the user, connect POS, provision the marketing number.</p>
  </body></html>`;
  const { error } = await resend.emails.send({
    from: 'Belan Onboarding <sales@belan.tech>',
    to: OPS_NOTIFY_TO,
    subject: `New Marketing signup — ${input.restaurantName || input.email}`,
    html,
  });
  if (error) console.error('confirm-payment: ops notification failed:', JSON.stringify(error));
}

// Confirms the Stripe Embedded Checkout session actually completed, then stamps
// the owner's user_metadata with marketing_paid + the Stripe customer/subscription
// ids and flags onboarding complete. Called by the wizard's onComplete callback —
// the session status is always re-verified server-side with Stripe, never
// trusted from the client.
export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY_BELAN;
    if (!stripeSecretKey) {
      console.error('confirm-payment: STRIPE_SECRET_KEY_BELAN is not set');
      return NextResponse.json(
        { error: 'Payment is not configured. Please contact Belan support.' },
        { status: 500 },
      );
    }

    const { session_id: sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'session_id is required.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Resolve the user from their access token (never trust a user id from the body).
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const user = userData.user;

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // The session must belong to this owner account.
    if (session.metadata?.user_id !== user.id) {
      return NextResponse.json({ error: 'This checkout session does not belong to your account.' }, { status: 403 });
    }

    // 'no_payment_required' covers 100%-off promotion codes.
    const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
    if (session.status !== 'complete' || !paid) {
      return NextResponse.json(
        { error: 'Payment has not been completed yet. Please finish checkout and try again.' },
        { status: 402 },
      );
    }

    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;

    // Idempotency: a retry (or a double onComplete) must not email ops twice.
    const alreadyPaid = user.user_metadata?.marketing_paid === true;

    // Merge into (never replace) the existing user_metadata — restaurant_name
    // etc. must survive. marketing_onboarding_complete lets the dashboard's
    // route guard treat this as a marketing account even before a restaurant
    // is linked (see components/ConditionalWrapper.tsx).
    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        marketing_paid: true,
        marketing_onboarding_complete: true,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      },
    });

    if (metaError) {
      console.error('confirm-payment metadata error:', metaError.message);
      return NextResponse.json({ error: 'Payment succeeded but we could not update your account. Please contact Belan support.' }, { status: 500 });
    }

    if (!alreadyPaid) {
      await notifyOps({
        userId: user.id,
        email: user.email ?? '',
        restaurantName: user.user_metadata?.restaurant_name ?? '',
        customerId,
        subscriptionId,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('confirm-payment error:', err);
    return NextResponse.json({ error: 'Could not verify your payment. Please try again.' }, { status: 500 });
  }
}
