import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Links the signed-in owner account to a restaurant, guarded by the restaurant's
// per-restaurant setup_code. The claim is atomic: a single conditional UPDATE
// sets owner_user_id only when the restaurant is still unclaimed AND the code
// matches, so two people racing the same code can't both win. On success we also
// stamp the owner's user_metadata.restaurant_id so the whole dashboard keys onto it.
export async function POST(req: NextRequest) {
  try {
    const { restaurantId, setupCode } = await req.json();

    if (!restaurantId || !setupCode) {
      return NextResponse.json({ error: 'Restaurant and setup code are required.' }, { status: 400 });
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
    const userId = userData.user.id;

    // Guard: this account may not already own a (different) restaurant.
    const existingRestaurantId = userData.user.user_metadata?.restaurant_id;
    if (existingRestaurantId && existingRestaurantId !== restaurantId) {
      return NextResponse.json(
        { error: 'This account is already linked to a restaurant.' },
        { status: 409 },
      );
    }

    // Atomic claim: only succeeds while unclaimed AND the code matches.
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from('restaurants')
      .update({ owner_user_id: userId })
      .eq('id', restaurantId)
      .eq('setup_code', setupCode)
      .eq('active', true)
      .is('owner_user_id', null)
      .select('id, name')
      .maybeSingle();

    if (claimError) {
      console.error('link-restaurant claim error:', claimError.message);
      return NextResponse.json({ error: 'Could not link restaurant. Please try again.' }, { status: 500 });
    }

    if (!claimed) {
      // Either wrong code, wrong restaurant, or someone already claimed it.
      return NextResponse.json(
        { error: 'That setup code is incorrect, or this restaurant is already claimed.' },
        { status: 400 },
      );
    }

    // Stamp the owner's metadata so useAuth().restaurantId resolves everywhere.
    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        restaurant_id: claimed.id,
        restaurant_name: claimed.name,
      },
    });

    if (metaError) {
      // Roll the claim back so the restaurant stays claimable rather than being
      // orphaned to an account that never got its metadata set.
      await supabaseAdmin
        .from('restaurants')
        .update({ owner_user_id: null })
        .eq('id', restaurantId)
        .eq('owner_user_id', userId);
      console.error('link-restaurant metadata error:', metaError.message);
      return NextResponse.json({ error: 'Could not finish linking. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ restaurantId: claimed.id, restaurantName: claimed.name });
  } catch (err) {
    console.error('link-restaurant error:', err);
    return NextResponse.json({ error: 'Could not link restaurant.' }, { status: 500 });
  }
}
