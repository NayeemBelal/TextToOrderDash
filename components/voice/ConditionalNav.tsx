'use client';

import { usePathname } from 'next/navigation';
import { VoiceTopNav } from './VoiceTopNav';

const AUTH_ROUTES = ['/login', '/register'];

export function ConditionalNav() {
  const pathname = usePathname();
  if (AUTH_ROUTES.includes(pathname)) return null;
  return <VoiceTopNav />;
}
