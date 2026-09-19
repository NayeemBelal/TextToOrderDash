'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';

// Self-serve marketing onboarding, three steps:
//   account (restaurant name + email + password) → payment (Stripe) → success
// No setup code / restaurant linking: Belan's account rep provisions the
// restaurant and links it to the account after payment (see confirm-payment,
// which emails ops the new signup).
type Step = 'account' | 'payment' | 'success';

const STEPS: { key: Step; label: string }[] = [
  { key: 'account', label: 'Account' },
  { key: 'payment', label: 'Payment' },
  { key: 'success', label: 'Done' },
];

const SESSION_KEY = 'sb_session_active';
const ACCENT = '#c4b5fd'; // Marketing AI purple — matches landing page

// Belan's own Stripe account (SaaS billing) — NOT the per-restaurant Stripe
// config used for customer order payments. loadStripe is called once at module
// scope so the Stripe.js instance is shared across renders.
const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_BELAN;
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex(s => s.key === current);
  return (
    <div className="flex items-center justify-center gap-1.5 mb-8">
      {STEPS.map((s, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 border-2 border-black flex items-center justify-center text-xs font-black"
                style={{
                  background: done ? '#000' : active ? ACCENT : '#fff',
                  color: done ? '#fff' : '#000',
                  boxShadow: active ? '2px 2px 0px #000' : 'none',
                }}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : i + 1}
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: active ? '#000' : 'rgba(0,0,0,0.4)' }}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-6 sm:w-10 h-0.5 mb-4 bg-black" style={{ opacity: done ? 1 : 0.2 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-widest text-black mb-1.5">
      {children}{required && <span className="text-[#e01d5a] ml-0.5">*</span>}
    </label>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border-2 border-black px-3 py-2.5 text-sm font-medium text-black placeholder:text-black/30 bg-white focus:outline-none focus:shadow-[3px_3px_0px_#000] transition-shadow ${props.className ?? ''}`}
    />
  );
}

function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`h-11 rounded-none bg-black text-white font-bold text-sm uppercase tracking-widest border-2 border-black transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2 ${props.className ?? ''}`}
    >
      {children}
    </button>
  );
}

const Spinner = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const ErrorBox = ({ children }: { children: React.ReactNode }) => (
  <div className="border-2 border-black px-4 py-3 text-black text-sm font-bold" style={{ background: '#fbc8d4' }}>
    {children}
  </div>
);

export default function MarketingOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Account step
  const [restaurantName, setRestaurantName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Payment step (Stripe Embedded Checkout)
  const [checkoutClientSecret, setCheckoutClientSecret] = useState('');
  const [checkoutSessionId, setCheckoutSessionId] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  // Create the Stripe Embedded Checkout session when the owner reaches the
  // payment step (also re-invoked by the retry button after a failure).
  const startCheckout = useCallback(async () => {
    setCheckoutLoading(true);
    setCheckoutError('');
    setConfirmError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session expired. Please sign in and try again.');
      const res = await fetch('/api/marketing-onboarding/checkout-session', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not start checkout.');
      setCheckoutSessionId(body.sessionId);
      setCheckoutClientSecret(body.clientSecret);
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Could not start checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step !== 'payment' || !STRIPE_PK) return;
    if (checkoutClientSecret || checkoutLoading || checkoutError) return;
    startCheckout();
  }, [step, checkoutClientSecret, checkoutLoading, checkoutError, startCheckout]);

  // Stripe's onComplete fires when checkout finishes inside the embedded form.
  // The server re-verifies the session with Stripe before marking the account
  // paid — only then do we advance to the success screen.
  const handleCheckoutComplete = useCallback(async () => {
    setConfirmError('');
    setIsConfirming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session expired. Please sign in and try again.');
      const res = await fetch('/api/marketing-onboarding/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ session_id: checkoutSessionId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not confirm your payment.');
      // Pick up the updated user_metadata (marketing_onboarding_complete) so the
      // dashboard's route guard treats this as a marketing account.
      await supabase.auth.refreshSession();
      setStep('success');
    } catch (err: unknown) {
      setConfirmError(err instanceof Error ? err.message : 'Could not confirm your payment.');
    } finally {
      setIsConfirming(false);
    }
  }, [checkoutSessionId]);

  async function handleAccount() {
    setError('');
    if (!restaurantName.trim()) return setError('Restaurant name is required.');
    if (!accountEmail.trim()) return setError('Email is required.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setIsLoading(true);
    try {
      // Create account server-side (pre-confirmed, bypasses email confirmation gate)
      const res = await fetch('/api/marketing-onboarding/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountEmail.trim(), password, restaurant_name: restaurantName.trim() }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Account creation failed.');

      // Sign in immediately since the account is pre-confirmed.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: accountEmail.trim(),
        password,
      });
      if (signInError) throw signInError;

      // Mark the session active so a page reload doesn't sign the owner out
      // (auth-context requires this flag; mirrors the login page).
      sessionStorage.setItem(SESSION_KEY, '1');

      setStep('payment');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // ── Shared page chrome ──────────────────────────────────────────────
  const GridBg = () => (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        zIndex: 0,
      }}
    />
  );

  const Header = ({ withLabel = true }: { withLabel?: boolean }) => (
    <header className="relative z-10 bg-white border-b-2 border-black flex-shrink-0 h-16 flex items-center px-6 justify-between">
      <Link href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/BelanLogo.png" alt="Belan" className="w-10 h-10 rounded-full object-cover border-2 border-black" />
      </Link>
      {withLabel && (
        <p className="text-xs font-bold uppercase tracking-widest text-black/50">Marketing Onboarding</p>
      )}
    </header>
  );

  if (step === 'success') {
    return (
      <div className="min-h-screen font-tektur relative overflow-x-hidden" style={{ background: '#fafafa' }}>
        <GridBg />
        <Header withLabel={false} />
        <div className="relative z-10 flex items-center justify-center px-4 py-12 min-h-[calc(100vh-4rem)]">
          <div className="w-full max-w-md bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-10 flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 border-2 border-black flex items-center justify-center" style={{ background: '#2fb67d' }}>
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-black text-3xl font-black mb-2">You&apos;re in!</h1>
              <p className="text-black/60 text-sm font-medium leading-relaxed">
                Your subscription is active and we&apos;re getting <span className="font-bold text-black">{restaurantName}</span> set up.
                Give us about <span className="font-bold text-black">3 days</span> to get everything ready.
              </p>
            </div>
            <div className="w-full border-2 border-black p-4 text-left" style={{ background: '#f5dda1' }}>
              <p className="text-xs font-bold uppercase tracking-widest text-black mb-1">What happens next</p>
              <ul className="text-xs font-medium text-black/70 leading-relaxed list-disc pl-4 space-y-1">
                <li>Your account representative will reach out <span className="font-bold text-black">within 24 hours</span> at {accountEmail}.</li>
                <li>We&apos;ll connect your point of sale and set up your marketing number.</li>
                <li>You&apos;ll get a walkthrough of your dashboard once it&apos;s live.</li>
              </ul>
            </div>
            <PrimaryButton onClick={() => router.push('/home?tab=marketing')} className="mt-1 w-full px-6">
              Go to Dashboard →
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  const title = step === 'account' ? 'Create your account' : 'Activate your subscription';
  const subtitle = step === 'account'
    ? 'Tell us your restaurant, pick a login, and you’re one step from done.'
    : 'Gamified Marketing — $200/month. Cancel anytime.';

  return (
    <div className="min-h-screen font-tektur relative overflow-x-hidden" style={{ background: '#fafafa' }}>
      <GridBg />
      <Header />

      <div className="relative z-10 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <span
              className="inline-block border-2 border-black px-3 py-1.5 mb-4 text-xs font-bold uppercase tracking-widest"
              style={{ background: ACCENT, transform: 'rotate(-1deg)' }}
            >
              Marketing AI
            </span>
            <h1 className="text-black text-3xl font-black leading-tight">{title}</h1>
            <p className="text-black/50 text-sm font-medium mt-2">{subtitle}</p>
          </div>

          <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-6 sm:p-8">
            <StepIndicator current={step} />

            {error && <div className="mb-5"><ErrorBox>{error}</ErrorBox></div>}

            {step === 'account' && (
              <div className="flex flex-col gap-4">
                <div>
                  <Label required>Restaurant Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Medina Grill"
                    value={restaurantName}
                    onChange={e => setRestaurantName(e.target.value)}
                    autoComplete="organization"
                  />
                </div>
                <div>
                  <Label required>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="you@yourrestaurant.com"
                    value={accountEmail}
                    onChange={e => setAccountEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <Label required>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                <div>
                  <Label required>Confirm Password</Label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    onKeyDown={e => { if (e.key === 'Enter') handleAccount(); }}
                  />
                </div>
                <PrimaryButton onClick={handleAccount} disabled={isLoading} className="mt-2 w-full px-6">
                  {isLoading ? (<><Spinner />Creating account…</>) : 'Continue to Payment →'}
                </PrimaryButton>
                <p className="text-center text-xs font-medium text-black/50">
                  Already have an account?{' '}
                  <Link href="/login" className="font-bold underline hover:text-black">Sign in</Link>
                </p>
              </div>
            )}

            {step === 'payment' && (
              <div className="flex flex-col gap-4">
                <div className="border-2 border-black p-4" style={{ background: '#f5dda1' }}>
                  <p className="text-sm font-bold text-black leading-snug">Gamified Marketing Monthly Subscription</p>
                  <p className="text-xs font-medium text-black/60 mt-1 leading-relaxed">
                    $200/month, billed monthly. Have a promo code? Apply it inside the payment form below.
                  </p>
                </div>

                {!STRIPE_PK ? (
                  <ErrorBox>Payment is not configured. Please contact Belan support.</ErrorBox>
                ) : checkoutError ? (
                  <div className="flex flex-col gap-3">
                    <ErrorBox>{checkoutError}</ErrorBox>
                    <PrimaryButton onClick={startCheckout} className="w-full px-6">
                      Try again
                    </PrimaryButton>
                  </div>
                ) : !checkoutClientSecret ? (
                  <div className="flex items-center justify-center gap-2 py-10 text-black/50 text-sm font-bold">
                    <Spinner />Loading secure checkout…
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="border-2 border-black bg-white shadow-[6px_6px_0px_#000] p-2 sm:p-3">
                      <EmbeddedCheckoutProvider
                        stripe={stripePromise}
                        options={{ clientSecret: checkoutClientSecret, onComplete: handleCheckoutComplete }}
                      >
                        <EmbeddedCheckout />
                      </EmbeddedCheckoutProvider>
                    </div>
                    {isConfirming && (
                      <div className="flex items-center justify-center gap-2 py-2 text-black/50 text-sm font-bold">
                        <Spinner />Confirming your payment…
                      </div>
                    )}
                    {confirmError && (
                      <div className="flex flex-col gap-3">
                        <ErrorBox>{confirmError}</ErrorBox>
                        <PrimaryButton onClick={handleCheckoutComplete} disabled={isConfirming} className="w-full px-6">
                          {isConfirming ? (<><Spinner />Confirming…</>) : 'Retry confirmation'}
                        </PrimaryButton>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-center text-xs font-medium text-black/40 mt-6">
            By continuing, you agree to Belan&apos;s{' '}
            <Link href="/terms-of-service" className="font-bold underline hover:text-black">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="font-bold underline hover:text-black">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
