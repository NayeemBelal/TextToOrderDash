'use client';

import { usePathname } from 'next/navigation';
import { ConditionalNav } from '@/components/voice/ConditionalNav';

const FULL_PAGE_ROUTES = ['/home', '/login', '/register'];

export function ConditionalWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullPage = FULL_PAGE_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));

  if (isFullPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen bg-capy-bg overflow-hidden font-tektur">
      <ConditionalNav />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
