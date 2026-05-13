'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Ready = 'checking' | 'ready' | 'invalid';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<Ready>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // Store recovery tokens so we can re-establish the session in handleSubmit.
  // AuthProvider may call signOut() asynchronously (when isSessionValid() is false),
  // which races with and clears our setSession() call. Re-calling setSession() right
  // before updateUser() guarantees a fresh session regardless.
  const tokensRef = useRef<{ accessToken: string; refreshToken: string } | null>(null);

  useEffect(() => {
    // Supabase puts the recovery tokens in the URL hash:
    // /reset-password#access_token=...&refresh_token=...&type=recovery
    // Reading them directly avoids the race condition where the singleton
    // Supabase client already consumed the hash before our listener registered.
    const hash = window.location.hash;
    if (!hash) {
      setReady('invalid');
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (type !== 'recovery' || !accessToken || !refreshToken) {
      setReady('invalid');
      return;
    }

    // Hydrate the Supabase session from the recovery tokens so updateUser() works.
    // Store the SESSION tokens returned by setSession (not the original recovery
    // tokens, which may be single-use) so we can re-establish the session in
    // handleSubmit if needed.
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error }) => {
        if (error) {
          setReady('invalid');
        } else {
          if (data.session) {
            tokensRef.current = {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
            };
          }
          setReady('ready');
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      // Re-establish the recovery session before updating the password.
      // AuthProvider may have called signOut() during mount (when no REMEMBER_KEY /
      // SESSION_KEY is present), which races with our earlier setSession() call and
      // clears it. Re-calling here ensures the session is always fresh.
      if (tokensRef.current) {
        await supabase.auth.setSession({
          access_token: tokensRef.current.accessToken,
          refresh_token: tokensRef.current.refreshToken,
        });
      }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.push('/home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (() => {
    if (!password) return null;
    if (password.length < 6) return { label: 'Weak', color: 'bg-red-400', width: 'w-1/4' };
    if (password.length < 10) return { label: 'Fair', color: 'bg-yellow-400', width: 'w-1/2' };
    if (password.length < 14) return { label: 'Good', color: 'bg-capy-brown-accent', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-capy-brown-accent', width: 'w-full' };
  })();

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
          {ready === 'checking' && (
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <svg className="w-6 h-6 animate-spin text-capy-brown-accent" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-capy-muted text-sm">Verifying your link…</p>
            </div>
          )}

          {ready === 'invalid' && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-capy-text text-lg font-semibold mb-1">Invalid or expired link</h2>
                <p className="text-capy-muted text-sm leading-relaxed">
                  This password reset link is no longer valid. Request a new one to continue.
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="mt-2 h-10 w-full rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors flex items-center justify-center"
              >
                Request a new link
              </Link>
            </div>
          )}

          {ready === 'ready' && (
            <>
              <h1 className="text-capy-text text-xl font-semibold mb-1">Set a new password</h1>
              <p className="text-capy-muted text-sm mb-6">Choose a password you haven&apos;t used before.</p>

              {error && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="password" className="section-label">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
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
                  {passwordStrength && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`} />
                      </div>
                      <span className="text-xs text-capy-muted w-10 text-right">{passwordStrength.label}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="confirmPassword" className="section-label">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="card-input h-10 px-3 pr-10 rounded-lg focus:ring-2 focus:ring-capy-brown-accent focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-capy-muted hover:text-capy-text transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? (
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
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-0.5">Passwords don&apos;t match</p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-capy-brown-accent mt-0.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Passwords match
                    </p>
                  )}
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
                      Updating…
                    </>
                  ) : (
                    'Update password'
                  )}
                </button>
              </form>
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
