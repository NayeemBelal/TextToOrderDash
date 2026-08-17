'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ConditionalNav } from '@/components/voice/ConditionalNav';
import { useAuth } from '@/lib/auth-context';
import { MarketingViewProvider } from '@/lib/marketing-view-context';
import { AdminViewProvider } from '@/lib/admin-view-context';

const FULL_PAGE_ROUTES = ['/', '/login', '/register', '/about', '/privacy-policy', '/terms-of-service', '/how-it-works', '/integrations', '/forgot-password', '/reset-password', '/prize', '/r', '/marketing'];
// Auth required but rendered without the app nav shell
const NO_NAV_ROUTES = ['/onboarding'];

export function ConditionalWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, restaurantId, isSuperAdmin, isLoading } = useAuth();

  const isFullPage = FULL_PAGE_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
  const isNoNav = NO_NAV_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  useEffect(() => {
    if (isLoading || isFullPage) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (isSuperAdmin) {
      if (!isAdminRoute) {
        router.replace('/admin');
      }
      return;
    }
    // Marketing-only users (no Clover POS) can access /home directly
    const isMarketingUser = user?.user_metadata?.marketing_onboarding_complete === true;
    if (!isNoNav && restaurantId === null && !isMarketingUser) {
      router.replace('/onboarding');
    }
  }, [isLoading, isFullPage, isNoNav, isAdminRoute, isSuperAdmin, user, restaurantId, router]);

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

  const isMarketingUser = user?.user_metadata?.marketing_onboarding_complete === true;
  if (!isSuperAdmin && restaurantId === null && !isMarketingUser) {
    return null; // will redirect via useEffect
  }

  return (
    <AdminViewProvider>
      <MarketingViewProvider>
        <div className="flex flex-col h-screen bg-capy-bg overflow-hidden font-tektur">
          <ConditionalNav />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </MarketingViewProvider>
    </AdminViewProvider>
  );
}
