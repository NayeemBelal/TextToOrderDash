'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { resolveSubscriptions, type SubscriptionKey } from '@/lib/subscriptions';

const REMEMBER_KEY = 'sb_remember_until';
const SESSION_KEY = 'sb_session_active';

interface AuthContextValue {
  user: User | null;
  restaurantId: string | null;
  isSuperAdmin: boolean;
  isLoading: boolean;
  subscriptions: SubscriptionKey[];
  hasSubscription: (key: SubscriptionKey) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  restaurantId: null,
  isSuperAdmin: false,
  isLoading: true,
  subscriptions: [],
  hasSubscription: () => false,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSessionValid = () => {
    const rememberUntil = localStorage.getItem(REMEMBER_KEY);
    if (rememberUntil && Date.now() < parseInt(rememberUntil, 10)) return true;
    const sessionActive = sessionStorage.getItem(SESSION_KEY);
    if (sessionActive) return true;
    return false;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Never sign out on the reset-password page — the recovery session is
        // established by reset-password's useEffect via setSession().
        // Calling signOut() here revokes those tokens server-side (Supabase
        // strips the hash before this callback runs, so hash checks don't work),
        // which causes updateUser() to fail with "Auth session missing!".
        const isResetPasswordPage =
          typeof window !== 'undefined' &&
          window.location.pathname === '/reset-password';

        if (isSessionValid() || isResetPasswordPage) {
          setUser(session.user);
        } else {
          supabase.auth.signOut();
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    await supabase.auth.signOut();
    router.push('/login');
  };

  const restaurantId: string | null = user?.user_metadata?.restaurant_id ?? null;
  const isSuperAdmin: boolean = user?.user_metadata?.is_super_admin === true;

  const subscriptions = useMemo(() => resolveSubscriptions(user), [user]);
  const hasSubscription = (key: SubscriptionKey) => subscriptions.includes(key);

  return (
    <AuthContext.Provider
      value={{ user, restaurantId, isSuperAdmin, isLoading, subscriptions, hasSubscription, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
