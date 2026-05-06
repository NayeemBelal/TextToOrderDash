'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const REMEMBER_KEY = 'sb_remember_until';
const SESSION_KEY = 'sb_session_active';

interface AuthContextValue {
  user: User | null;
  restaurantId: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  restaurantId: null,
  isLoading: true,
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
        if (isSessionValid()) {
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

  return (
    <AuthContext.Provider value={{ user, restaurantId, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
