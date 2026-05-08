'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    restaurantName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            restaurant_name: form.restaurantName,
            restaurant_id: null,
          },
        },
      });
      if (authError) throw authError;
      // When the email is already registered, Supabase returns success with a
      // user object whose identities array is empty (anti-enumeration behaviour).
      if (!data.user || data.user.identities?.length === 0) {
        setError('An account with this email already exists. Please sign in instead.');
        return;
      }
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (() => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Weak', color: 'bg-red-400', width: 'w-1/4' };
    if (p.length < 10) return { label: 'Fair', color: 'bg-yellow-400', width: 'w-1/2' };
    if (p.length < 14) return { label: 'Good', color: 'bg-capy-brown-accent', width: 'w-3/4' };
    return { label: 'Strong', color: 'bg-capy-brown-accent', width: 'w-full' };
  })();

  return (
    <div className="min-h-screen bg-capy-bg flex flex-col font-tektur">
      {/* Nav bar */}
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

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl p-8">
        {success ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-14 h-14 rounded-full bg-capy-brown-accent/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-capy-brown-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-capy-text text-lg font-semibold mb-1">You&apos;re on the list!</h2>
              <p className="text-capy-muted text-sm leading-relaxed">
                Give us <span className="font-medium text-capy-text">one day</span> to finish setting up your account. We&apos;ll reach out once everything is ready.
              </p>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="mt-2 h-10 w-full rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
        <h1 className="text-capy-text text-xl font-semibold mb-1">Create your account</h1>
        <p className="text-capy-muted text-sm mb-6">Get started with your restaurant dashboard</p>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
            {error.includes('already exists') ? (
              <>
                An account with this email already exists.{' '}
                <Link
                  href="/login"
                  className="underline font-medium hover:text-red-700 transition-colors"
                >
                  Sign in instead →
                </Link>
              </>
            ) : (
              error
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="restaurantName" className="section-label">
              Restaurant name
            </label>
            <input
              id="restaurantName"
              type="text"
              required
              value={form.restaurantName}
              onChange={set('restaurantName')}
              placeholder="Lime N Dime"
              className="card-input h-10 px-3 rounded-lg focus:ring-2 focus:ring-capy-brown-accent focus:border-transparent transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="section-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={set('email')}
              placeholder="you@restaurant.com"
              className="card-input h-10 px-3 rounded-lg focus:ring-2 focus:ring-capy-brown-accent focus:border-transparent transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="section-label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={form.password}
                onChange={set('password')}
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
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
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
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-xs text-red-500 mt-0.5">Passwords don&apos;t match</p>
            )}
            {form.confirmPassword && form.password === form.confirmPassword && (
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
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-capy-muted">
          Already have an account?{' '}
          <Link href="/login" className="text-capy-brown-accent hover:text-capy-brown-accent-dark font-medium transition-colors">
            Sign in
          </Link>
        </p>
          </>
        )}
      </div>

      </div>

      {/* Dishwasher pinned to the bottom */}
      <div className="fixed bottom-0 left-0 right-0 pointer-events-none overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/dishwashertalkingonphone.svg"
          alt=""
          className="w-full object-contain object-bottom"
          style={{ maxHeight: '100px', mixBlendMode: 'multiply' }}
        />
      </div>
    </div>
  );
}
