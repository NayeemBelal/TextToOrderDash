import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const { email, password, brandName } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use service role key to create a pre-confirmed user (bypasses email confirmation)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        restaurant_name: brandName ?? null,
        restaurant_id: null,
        marketing_onboarding_complete: false,
        subscriptions: ['marketing'],
      },
    });

    if (error) {
      // Surface duplicate email clearly
      if (error.message.toLowerCase().includes('already registered') || error.status === 422) {
        return NextResponse.json({ error: 'An account with this email already exists. Please sign in instead.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ userId: data.user.id });
  } catch (err) {
    console.error('Create account error:', err);
    return NextResponse.json({ error: 'Account creation failed' }, { status: 500 });
  }
}
