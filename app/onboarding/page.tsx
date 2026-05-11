'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get('status');
  const errorMessage = searchParams.get('message');

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  // Refresh session after successful OAuth so restaurantId is picked up
  useEffect(() => {
    if (status === 'success') {
      supabase.auth.refreshSession().then(() => {
        // brief delay to allow auth-context to propagate new restaurantId
        setTimeout(() => {}, 500);
      });
    }
  }, [status]);

  async function handleConnectClover() {
    setError('');
    setIsConnecting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/clover/auth-url`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Server error ${res.status}`);
      }

      const { auth_url } = await res.json();
      window.location.href = auth_url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsConnecting(false);
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-capy-bg flex flex-col font-tektur">
        <header className="bg-white flex-shrink-0 h-16 flex items-center px-6 justify-end">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/BelanLogo.png" alt="Belan AI" className="w-16 h-16 rounded-full object-cover" />
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-capy-text text-lg font-semibold mb-1">Clover connected!</h2>
              <p className="text-capy-muted text-sm">Your POS system is linked. You&apos;re ready to start taking orders.</p>
            </div>
            <button
              onClick={() => router.push('/home')}
              className="mt-2 h-10 w-full rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-capy-bg flex flex-col font-tektur">
        <header className="bg-white flex-shrink-0 h-16 flex items-center px-6 justify-end">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/BelanLogo.png" alt="Belan AI" className="w-16 h-16 rounded-full object-cover" />
          </Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-capy-text text-lg font-semibold mb-1">Connection failed</h2>
              <p className="text-capy-muted text-sm">
                {errorMessage ? decodeURIComponent(errorMessage).replace(/_/g, ' ') : 'Something went wrong connecting your Clover account.'}
              </p>
            </div>
            <button
              onClick={() => router.replace('/onboarding')}
              className="mt-2 h-10 w-full rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-capy-bg flex flex-col font-tektur">
      <header className="bg-white flex-shrink-0 h-16 flex items-center px-6 justify-end">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/BelanLogo.png" alt="Belan AI" className="w-16 h-16 rounded-full object-cover" />
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-capy-text text-2xl font-semibold mb-2">Connect your POS</h1>
            <p className="text-capy-muted text-sm">Link your Point of Sale system so Belan can place orders directly.</p>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Clover card */}
          <div className="bg-white rounded-2xl p-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              {/* Clover logo placeholder */}
              <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div>
                <p className="text-capy-text font-semibold text-sm">Clover</p>
                <p className="text-capy-muted text-xs">Connect your Clover merchant account</p>
              </div>
            </div>
            <button
              onClick={handleConnectClover}
              disabled={isConnecting}
              className="h-9 px-4 rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connecting…
                </>
              ) : (
                'Connect'
              )}
            </button>
          </div>

          <p className="text-center text-capy-muted text-xs mt-6">
            More POS integrations coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
