'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-capy-bg flex flex-col font-tektur">
      <header className="bg-white flex-shrink-0 h-16 flex items-center px-6 justify-end">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/BelanLogo.png"
            alt="Belan AI"
            className="w-16 h-16 rounded-full object-cover"
          />
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl p-8">
          {sent ? (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-capy-brown-accent/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-capy-brown-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-capy-text text-lg font-semibold mb-1">Check your email</h2>
                <p className="text-capy-muted text-sm leading-relaxed">
                  If an account exists for <span className="font-medium text-capy-text">{email}</span>, we&apos;ve sent a link to reset your password. It may take a minute to arrive.
                </p>
              </div>
              <Link
                href="/login"
                className="mt-2 h-10 w-full rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors flex items-center justify-center"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-capy-text text-xl font-semibold mb-1">Forgot password?</h1>
              <p className="text-capy-muted text-sm mb-6">
                Enter your email and we&apos;ll send you a link to reset it.
              </p>

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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-10 w-full rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending…
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-capy-muted">
                Remembered it?{' '}
                <Link href="/login" className="text-capy-brown-accent hover:text-capy-brown-accent-dark font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

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
