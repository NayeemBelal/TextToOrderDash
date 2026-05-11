'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ConditionalNav } from '@/components/voice/ConditionalNav';
import { useAuth } from '@/lib/auth-context';

const FULL_PAGE_ROUTES = ['/', '/login', '/register'];
// Auth required but rendered without the app nav shell
const NO_NAV_ROUTES = ['/onboarding'];

export function ConditionalWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, restaurantId, isLoading } = useAuth();

  const isFullPage = FULL_PAGE_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
  const isNoNav = NO_NAV_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));

  useEffect(() => {
    if (isLoading || isFullPage) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    // Send users with no restaurant to onboarding (unless already there)
    if (!isNoNav && restaurantId === null) {
      router.replace('/onboarding');
    }
  }, [isLoading, isFullPage, isNoNav, user, restaurantId, router]);

  if (isFullPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-capy-bg">
        <div className="w-6 h-6 border-2 border-capy-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isNoNav) {
    return <>{children}</>;
  }

  if (restaurantId === null) {
    return null; // will redirect via useEffect
  }

  return (
    <div className="flex flex-col h-screen bg-capy-bg overflow-hidden font-tektur">
      <ConditionalNav />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
