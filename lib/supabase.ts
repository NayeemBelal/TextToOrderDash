import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable automatic URL hash processing. The reset-password page reads the
    // recovery tokens from the hash manually and calls setSession() explicitly.
    // Leaving this on causes Supabase to strip the hash via history.replaceState
    // before our code can reliably read it, and races with AuthProvider's getSession().
    detectSessionInUrl: false,
  },
});
