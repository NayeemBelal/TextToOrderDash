'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-capy-bg flex flex-col font-tektur">
      {/* Nav bar */}
      <header className="bg-white flex-shrink-0 h-16 flex items-center px-6 justify-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/BelanLogo.png"
          alt="Belan AI"
          className="w-16 h-16 rounded-full object-cover"
        />
      </header>

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl p-8">
        <h1 className="text-capy-text text-xl font-semibold mb-1">Welcome back</h1>
        <p className="text-capy-muted text-sm mb-6">Sign in to your dashboard</p>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="section-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@restaurant.com"
              className="card-input h-10 px-3 rounded-lg focus:ring-2 focus:ring-capy-brown-accent focus:border-transparent transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="section-label">
                Password
              </label>
              <button
                type="button"
                className="text-xs text-capy-brown-accent hover:text-capy-brown-accent-dark transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="card-input h-10 px-3 pr-10 rounded-lg focus:ring-2 focus:ring-capy-brown-accent focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-capy-muted hover:text-capy-text transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 h-10 w-full rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-capy-muted">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-capy-brown-accent hover:text-capy-brown-accent-dark font-medium transition-colors">
            Create one
          </Link>
        </p>
      </div>

      </div>

      {/* Running capybaras pinned to the bottom */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/belanRunningai.png"
          alt=""
          className="w-full object-contain object-bottom"
          style={{ maxHeight: '100px', mixBlendMode: 'multiply' }}
        />
      </div>
    </div>
  );
}
