import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Returns the restaurants an owner can self-claim during onboarding:
//   active AND not yet claimed (owner_user_id IS NULL) AND published for
//   self-setup (setup_code IS NOT NULL). Only id + name are exposed — never
//   the setup_code or any credentials. Requires a valid signed-in session.
export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Require an authenticated user (the picker step runs after account creation).
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('restaurants')
      .select('id, name')
      .eq('active', true)
      .is('owner_user_id', null)
      .not('setup_code', 'is', null)
      .order('name');

    if (error) {
      console.error('claimable-restaurants query error:', error.message);
      return NextResponse.json({ error: 'Could not load restaurants' }, { status: 500 });
    }

    return NextResponse.json({ restaurants: data ?? [] });
  } catch (err) {
    console.error('claimable-restaurants error:', err);
    return NextResponse.json({ error: 'Could not load restaurants' }, { status: 500 });
  }
}
