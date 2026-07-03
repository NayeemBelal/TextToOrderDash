import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Confirms the Stripe Embedded Checkout session actually completed, then stamps
// the owner's user_metadata with marketing_paid + the Stripe customer/subscription
// ids. Called by the wizard's onComplete callback — the session status is always
// re-verified server-side with Stripe, never trusted from the client.
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

    // Merge into (never replace) the existing user_metadata — restaurant_id etc.
    // must survive.
    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        marketing_paid: true,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      },
    });

    if (metaError) {
      console.error('confirm-payment metadata error:', metaError.message);
      return NextResponse.json({ error: 'Payment succeeded but we could not update your account. Please contact Belan support.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('confirm-payment error:', err);
    return NextResponse.json({ error: 'Could not verify your payment. Please try again.' }, { status: 500 });
  }
}
