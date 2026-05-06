'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ConditionalNav } from '@/components/voice/ConditionalNav';
import { useAuth } from '@/lib/auth-context';

const FULL_PAGE_ROUTES = ['/', '/login', '/register'];

export function ConditionalWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, restaurantId, isLoading } = useAuth();

  const isFullPage = FULL_PAGE_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));

  useEffect(() => {
    if (isLoading || isFullPage) return;
    if (!user) {
      router.replace('/login');
    }
  }, [isLoading, isFullPage, user, router]);

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

  if (restaurantId === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-capy-bg font-tektur">
        <div className="text-center max-w-sm px-6">
          <div className="w-12 h-12 rounded-full bg-capy-green-light flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-capy-green-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-capy-text font-semibold text-lg mb-2">Your account is being set up</h2>
          <p className="text-capy-muted text-sm">Please contact support and we&apos;ll get your restaurant connected shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-capy-bg overflow-hidden font-tektur">
      <ConditionalNav />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
