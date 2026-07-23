'use client';

import { usePathname } from 'next/navigation';
import { VoiceTopNav } from './VoiceTopNav';
import { AdminTopNav } from '@/components/admin/AdminTopNav';
import { useAuth } from '@/lib/auth-context';

const AUTH_ROUTES = ['/login', '/register'];

export function ConditionalNav() {
  const pathname = usePathname();
  const { isSuperAdmin } = useAuth();
  if (AUTH_ROUTES.includes(pathname)) return null;
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  if (isSuperAdmin && isAdminRoute) return <AdminTopNav />;
  return <VoiceTopNav />;
}
