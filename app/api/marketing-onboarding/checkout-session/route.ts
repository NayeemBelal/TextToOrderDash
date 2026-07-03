import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Creates a Stripe Embedded Checkout session for the Gamified Marketing Monthly
// Subscription ($200/mo). Billed on Belan's own Stripe account (SaaS billing) —
// NOT the per-restaurant Stripe config used for customer order payments.
// The embedded form renders inline in the onboarding wizard; promotion codes
// (created by Belan in the Stripe dashboard) are entered inside the form itself.
export async function POST(req: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY_BELAN;
    const priceId = process.env.STRIPE_MARKETING_PRICE_ID;
    if (!stripeSecretKey || !priceId) {
      console.error('checkout-session: STRIPE_SECRET_KEY_BELAN or STRIPE_MARKETING_PRICE_ID is not set');
      return NextResponse.json(
        { error: 'Payment is not configured. Please contact Belan support.' },
        { status: 500 },
      );
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

    // Metadata is stamped on both the checkout session and the resulting
    // subscription so the customer is traceable back to the owner account
    // and restaurant from the Stripe dashboard.
    const metadata = {
      user_id: user.id,
      restaurant_id: user.user_metadata?.restaurant_id ?? '',
      restaurant_name: user.user_metadata?.restaurant_name ?? '',
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      // 'embedded_page' is the renamed value for embedded checkout in the API
      // version pinned by stripe-node v22 (previously ui_mode: 'embedded').
      ui_mode: 'embedded_page',
      redirect_on_completion: 'never',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true, // renders Stripe's own "Add promotion code" field
      customer_email: user.email,
      metadata,
      subscription_data: { metadata },
    });

    return NextResponse.json({ clientSecret: session.client_secret, sessionId: session.id });
  } catch (err) {
    console.error('checkout-session error:', err);
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 });
  }
}
