'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MARKETING_DASHBOARD_URL } from '@/lib/api';

// Merged onboarding:
//   account → link (pick unclaimed restaurant + setup code) → branch
//     → [skip to dashboard]  OR  [set up marketing number → RCS steps → success]
type Step =
  | 'account'
  | 'link'
  | 'branch'
  | 'business'
  | 'contact'
  | 'verify'
  | 'brand'
  | 'clover'
  | 'success';

// The optional RCS (marketing number) portion — shown after the restaurant is linked.
const RCS_STEPS: Step[] = ['business', 'contact', 'verify', 'brand', 'clover'];
const RCS_LABELS = ['Business', 'Contact', 'Verify', 'Brand', 'Clover'];

const LEGAL_FORMS = ['Public', 'Private', 'Government', 'Non-profit', 'Sole Proprietor'];
const LEGAL_ENTITY_TYPES = ['LLC', 'Sole Proprietorship', 'Partnership', 'Corporation', 'S Corporation'];

const SESSION_KEY = 'sb_session_active';
const ACCENT = '#c4b5fd'; // Marketing AI purple — matches landing page

// Upload an onboarding file directly to Supabase Storage (private bucket) and
// return its object path. Done browser-side so large files never pass through
// the Netlify function (which caps request bodies at ~6MB). Returns null when
// there is no file. The signed-in onboarding user's RLS policy allows the insert.
async function uploadOnboardingFile(file: File | null, kind: 'verification' | 'logo'): Promise<string | null> {
  if (!file) return null;
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `${crypto.randomUUID()}-${kind}.${ext}`;
  const { error } = await supabase.storage
    .from('onboarding-uploads')
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) {
    const label = kind === 'logo' ? 'logo' : 'verification document';
    throw new Error(`Could not upload your ${label}: ${error.message}`);
  }
  return path;
}

function StepIndicator({ currentIndex }: { currentIndex: number }) {
  if (currentIndex < 0) return null;
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-8">
      {RCS_LABELS.map((label, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={label} className="flex items-center gap-1 sm:gap-1.5">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-black flex items-center justify-center text-xs font-black"
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
                className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest"
                style={{ color: active ? '#000' : 'rgba(0,0,0,0.4)' }}
              >
                {label}
              </span>
            </div>
            {i < RCS_LABELS.length - 1 && (
              <div className="w-3 sm:w-5 h-0.5 mb-4 bg-black" style={{ opacity: done ? 1 : 0.2 }} />
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

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border-2 border-black px-3 py-2.5 text-sm font-medium text-black bg-white focus:outline-none focus:shadow-[3px_3px_0px_#000] transition-shadow ${props.className ?? ''}`}
    >
      {children}
    </select>
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

function SecondaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`h-11 rounded-none bg-white text-black font-bold text-sm uppercase tracking-widest border-2 border-black transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000] flex items-center justify-center gap-2 ${props.className ?? ''}`}
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

function FileUploadBox({
  label,
  accept,
  file,
  onChange,
  hint,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <Label>{label}</Label>
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-black p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-[#c4b5fd]/20"
      >
        {file ? (
          <div className="flex items-center gap-3 w-full">
            <div className="w-9 h-9 border-2 border-black flex items-center justify-center flex-shrink-0" style={{ background: ACCENT }}>
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-black truncate">{file.name}</p>
              <p className="text-xs font-medium text-black/50">{(file.size / 1024).toFixed(0)} KB — click to change</p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-9 h-9 border-2 border-black flex items-center justify-center bg-white">
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-black">Click to upload</p>
              {hint && <p className="text-xs font-medium text-black/50 mt-0.5">{hint}</p>}
            </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

type ClaimableRestaurant = { id: string; name: string };

export default function MarketingOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Account step
  const [accountEmail, setAccountEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Link step
  const [restaurants, setRestaurants] = useState<ClaimableRestaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [linkedRestaurantName, setLinkedRestaurantName] = useState('');

  // Business step
  const [brandName, setBrandName] = useState('');
  const [orgLegalName, setOrgLegalName] = useState('');
  const [legalForm, setLegalForm] = useState('');
  const [legalEntityType, setLegalEntityType] = useState('');
  const [taxId, setTaxId] = useState('');

  // Contact step
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Verify step
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateField, setStateField] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Brand step
  const [logo, setLogo] = useState<File | null>(null);
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Clover step (optional)
  const [cloverMerchantId, setCloverMerchantId] = useState('');
  const [cloverApiKey, setCloverApiKey] = useState('');
  const [cloverEcomApiKey, setCloverEcomApiKey] = useState('');

  // Load the list of claimable restaurants when the owner reaches the link step.
  useEffect(() => {
    if (step !== 'link' || restaurants.length > 0) return;
    let cancelled = false;
    (async () => {
      setRestaurantsLoading(true);
      setError('');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Your session expired. Please start again.');
        const res = await fetch('/api/marketing-onboarding/claimable-restaurants', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Could not load restaurants.');
        if (!cancelled) setRestaurants(body.restaurants ?? []);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load restaurants.');
      } finally {
        if (!cancelled) setRestaurantsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [step, restaurants.length]);

  async function handleAccount() {
    setError('');
    if (!accountEmail.trim()) return setError('Email is required.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setIsLoading(true);
    try {
      // Create account server-side (pre-confirmed, bypasses email confirmation gate)
      const res = await fetch('/api/marketing-onboarding/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountEmail, password }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Account creation failed.');

      // Sign in immediately since the account is pre-confirmed.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: accountEmail,
        password,
      });
      if (signInError) throw signInError;

      // Mark the session active so a page reload doesn't sign the owner out
      // (auth-context requires this flag; mirrors the login page).
      sessionStorage.setItem(SESSION_KEY, '1');

      setStep('link');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLink() {
    setError('');
    if (!selectedRestaurantId) return setError('Please select your restaurant.');
    if (!setupCode.trim()) return setError('Please enter your setup code.');

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Your session expired. Please start again.');

      const res = await fetch('/api/marketing-onboarding/link-restaurant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ restaurantId: selectedRestaurantId, setupCode: setupCode.trim() }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not link your restaurant.');

      // Refresh the session so the new user_metadata.restaurant_id is in the token
      // — the whole dashboard keys off it.
      await supabase.auth.refreshSession();

      setLinkedRestaurantName(body.restaurantName);
      setBrandName(body.restaurantName); // prefill the (optional) RCS business step
      setStep('branch');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleBusiness() {
    setError('');
    if (!orgLegalName.trim()) return setError('Organization legal name is required.');
    if (!legalForm) return setError('Please select a legal form.');
    if (!legalEntityType) return setError('Please select a legal entity type.');
    if (!taxId.trim()) return setError('Tax ID / EIN is required.');
    setStep('contact');
  }

  function handleContact() {
    setError('');
    if (!contactFirstName.trim()) return setError('First name is required.');
    if (!contactLastName.trim()) return setError('Last name is required.');
    if (!contactTitle.trim()) return setError('Title is required.');
    if (!contactEmail.trim()) return setError('Business email is required.');
    if (!contactPhone.trim()) return setError('Phone number is required.');
    setStep('verify');
  }

  function handleVerify() {
    setError('');
    if (!verificationDoc) return setError('Please upload a business verification document.');
    if (!registeredAddress.trim()) return setError('Registered address is required.');
    if (!city.trim()) return setError('City is required.');
    if (!stateField.trim()) return setError('State is required.');
    if (!zipCode.trim()) return setError('ZIP code is required.');
    setStep('brand');
  }

  function handleBrand() {
    setError('');
    if (!storePhone.trim()) return setError('Store phone number is required.');
    if (!storeEmail.trim()) return setError('Store email is required.');
    setStep('clover');
  }

  // Final submission — `includeClover` is false when the owner skips the Clover step.
  async function submitApplication(includeClover: boolean) {
    setError('');
    setIsLoading(true);
    try {
      // Upload files straight to Supabase Storage from the browser. This bypasses
      // the Netlify function entirely (its ~6MB request limit was 500ing real
      // submissions). Only the resulting object paths are sent to the API route.
      const [verificationDocPath, logoPath] = await Promise.all([
        uploadOnboardingFile(verificationDoc, 'verification'),
        uploadOnboardingFile(logo, 'logo'),
      ]);

      const payload = {
        accountEmail,
        brandName,
        orgLegalName,
        legalForm,
        legalEntityType,
        taxId,
        contactFirstName,
        contactLastName,
        contactTitle,
        contactEmail,
        contactPhone,
        registeredAddress,
        city,
        state: stateField,
        zipCode,
        storePhone,
        storeEmail,
        websiteUrl,
        verificationDocPath,
        verificationDocName: verificationDoc?.name ?? null,
        logoPath,
        logoName: logo?.name ?? null,
        ...(includeClover
          ? { cloverMerchantId, cloverApiKey, cloverEcomApiKey }
          : {}),
      };

      const res = await fetch('/api/marketing-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Submission failed. Please try again.');
      }

      await supabase.auth.updateUser({
        data: { marketing_onboarding_complete: true },
      });

      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleFinishWithClover() {
    setError('');
    const anyFilled = cloverMerchantId.trim() || cloverApiKey.trim() || cloverEcomApiKey.trim();
    if (anyFilled && (!cloverMerchantId.trim() || !cloverApiKey.trim() || !cloverEcomApiKey.trim())) {
      return setError('Please fill in all three Clover fields, or skip this step.');
    }
    submitApplication(true);
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
              <h1 className="text-black text-3xl font-black mb-2">You&apos;re all set!</h1>
              <p className="text-black/60 text-sm font-medium leading-relaxed">
                Thanks for signing up. We&apos;re processing your information and getting your business RCS number set up. This usually takes 1–2 business days. We&apos;ll reach out once you&apos;re ready to go.
              </p>
            </div>
            <PrimaryButton onClick={() => { window.location.href = MARKETING_DASHBOARD_URL; }} className="mt-2 w-full px-6">
              Go to Dashboard →
            </PrimaryButton>
          </div>
        </div>
      </div>
    );
  }

  const titleForStep = () => {
    if (step === 'account') return 'Create your account';
    if (step === 'link') return 'Link your restaurant';
    if (step === 'branch') return 'Restaurant linked';
    return 'Set up your marketing number';
  };
  const subtitleForStep = () => {
    if (step === 'account') return 'One login for your whole Belan dashboard.';
    if (step === 'link') return 'Select your restaurant and enter the setup code from Belan.';
    if (step === 'branch') return 'You can start using your dashboard now.';
    return 'Get your business RCS number for gamified SMS marketing.';
  };

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
            <h1 className="text-black text-3xl font-black leading-tight">{titleForStep()}</h1>
            <p className="text-black/50 text-sm font-medium mt-2">{subtitleForStep()}</p>
          </div>

          <div className="bg-white border-2 border-black shadow-[6px_6px_0px_#000] p-6 sm:p-8">
            <StepIndicator currentIndex={RCS_STEPS.indexOf(step)} />

            {error && (
              <div className="mb-5 px-4 py-3 border-2 border-black text-black text-sm font-bold" style={{ background: '#fbc8d4' }}>
                {error}
              </div>
            )}

            {step === 'account' && (
              <div className="flex flex-col gap-4">
                <div>
                  <Label required>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="you@yourrestaurant.com"
                    value={accountEmail}
                    onChange={e => setAccountEmail(e.target.value)}
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black/50 hover:text-black"
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
                  />
                </div>
                <PrimaryButton onClick={handleAccount} disabled={isLoading} className="mt-2 w-full px-6">
                  {isLoading ? (<><Spinner />Creating account…</>) : 'Create Account & Continue'}
                </PrimaryButton>
                <p className="text-center text-xs font-medium text-black/50">
                  Already have an account?{' '}
                  <Link href="/login" className="font-bold underline hover:text-black">Sign in</Link>
                </p>
              </div>
            )}

            {step === 'link' && (
              <div className="flex flex-col gap-4">
                <div>
                  <Label required>Your Restaurant</Label>
                  {restaurantsLoading ? (
                    <div className="flex items-center gap-2 py-4 text-black/50 text-sm font-bold">
                      <Spinner />Loading restaurants…
                    </div>
                  ) : restaurants.length === 0 ? (
                    <div className="border-2 border-black p-4 text-sm font-medium text-black/70" style={{ background: '#f5dda1' }}>
                      No restaurants are available to link yet. Please contact Belan to get your restaurant set up.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                      {restaurants.map(r => {
                        const selected = selectedRestaurantId === r.id;
                        return (
                          <button
                            type="button"
                            key={r.id}
                            onClick={() => setSelectedRestaurantId(r.id)}
                            className="text-left px-4 py-3 border-2 flex items-center gap-3 transition-all"
                            style={{
                              borderColor: selected ? '#000' : 'rgba(0,0,0,0.15)',
                              background: selected ? ACCENT : '#fff',
                              boxShadow: selected ? '3px 3px 0px #000' : 'none',
                            }}
                          >
                            <span
                              className="w-4 h-4 rounded-full border-2 border-black flex-shrink-0 flex items-center justify-center"
                              style={{ background: selected ? '#000' : '#fff' }}
                            >
                              {selected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            <span className="font-bold text-sm text-black">{r.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <Label required>Setup Code</Label>
                  <Input
                    type="text"
                    placeholder="e.g. MEDINA-8843"
                    value={setupCode}
                    onChange={e => setSetupCode(e.target.value)}
                    autoCapitalize="characters"
                  />
                  <p className="text-xs font-medium text-black/50 mt-1">The code Belan gave you for your restaurant.</p>
                </div>
                <PrimaryButton
                  onClick={handleLink}
                  disabled={isLoading || restaurantsLoading || restaurants.length === 0}
                  className="mt-2 w-full px-6"
                >
                  {isLoading ? (<><Spinner />Linking…</>) : 'Link Restaurant'}
                </PrimaryButton>
              </div>
            )}

            {step === 'branch' && (
              <div className="flex flex-col gap-5">
                <div className="border-2 border-black p-4 flex items-center gap-3" style={{ background: '#a1dfc5' }}>
                  <div className="w-10 h-10 border-2 border-black flex items-center justify-center flex-shrink-0" style={{ background: '#2fb67d' }}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-black text-black leading-tight">Linked to {linkedRestaurantName}</p>
                    <p className="text-xs font-medium text-black/60 mt-0.5">Your dashboard is ready to use.</p>
                  </div>
                </div>
                <div className="border-2 border-black p-4" style={{ background: '#f5dda1' }}>
                  <p className="text-sm font-bold text-black leading-snug">Want gamified SMS marketing?</p>
                  <p className="text-xs font-medium text-black/60 mt-1 leading-relaxed">
                    To send marketing texts we need to register a business RCS number for you. It takes a few
                    minutes now and 1–2 business days to activate. You can also do this later from your dashboard.
                  </p>
                </div>
                <PrimaryButton onClick={() => { setError(''); setStep('business'); }} className="w-full px-6">
                  Set up marketing number →
                </PrimaryButton>
                <SecondaryButton onClick={() => router.push('/home')} className="w-full px-6">
                  Skip to dashboard →
                </SecondaryButton>
              </div>
            )}

            {step === 'business' && (
              <div className="flex flex-col gap-4">
                <div>
                  <Label required>Organization Legal Name</Label>
                  <Input
                    type="text"
                    placeholder="Lime N Dime LLC"
                    value={orgLegalName}
                    onChange={e => setOrgLegalName(e.target.value)}
                  />
                  <p className="text-xs font-medium text-black/50 mt-1">The exact legal name on your business registration.</p>
                </div>
                <div>
                  <Label>Brand Name</Label>
                  <Input
                    type="text"
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    placeholder="Lime N Dime"
                  />
                </div>
                <div>
                  <Label required>Legal Form</Label>
                  <Select value={legalForm} onChange={e => setLegalForm(e.target.value)}>
                    <option value="">Select a legal form…</option>
                    {LEGAL_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
                  </Select>
                </div>
                <div>
                  <Label required>Legal Entity Type</Label>
                  <Select value={legalEntityType} onChange={e => setLegalEntityType(e.target.value)}>
                    <option value="">Select an entity type…</option>
                    {LEGAL_ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                </div>
                <div>
                  <Label required>National Tax ID / EIN</Label>
                  <Input
                    type="text"
                    placeholder="XX-XXXXXXX"
                    value={taxId}
                    onChange={e => setTaxId(e.target.value)}
                  />
                </div>
                <div className="flex gap-3 mt-2">
                  <SecondaryButton onClick={() => { setError(''); setStep('branch'); }} className="flex-1">Back</SecondaryButton>
                  <PrimaryButton onClick={handleBusiness} className="flex-1">Continue</PrimaryButton>
                </div>
              </div>
            )}

            {step === 'contact' && (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>First Name</Label>
                    <Input type="text" placeholder="Jane" value={contactFirstName} onChange={e => setContactFirstName(e.target.value)} />
                  </div>
                  <div>
                    <Label required>Last Name</Label>
                    <Input type="text" placeholder="Smith" value={contactLastName} onChange={e => setContactLastName(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label required>Title / Role</Label>
                  <Input type="text" placeholder="Owner, CEO, Manager…" value={contactTitle} onChange={e => setContactTitle(e.target.value)} />
                </div>
                <div>
                  <Label required>Business Email</Label>
                  <Input type="email" placeholder="jane@yourrestaurant.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                </div>
                <div>
                  <Label required>Phone Number</Label>
                  <Input type="tel" placeholder="+1 (555) 000-0000" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                </div>
                <div className="flex gap-3 mt-2">
                  <SecondaryButton onClick={() => { setError(''); setStep('business'); }} className="flex-1">Back</SecondaryButton>
                  <PrimaryButton onClick={handleContact} className="flex-1">Continue</PrimaryButton>
                </div>
              </div>
            )}

            {step === 'verify' && (
              <div className="flex flex-col gap-4">
                <FileUploadBox
                  label="Business Verification Document *"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  file={verificationDoc}
                  onChange={setVerificationDoc}
                  hint="Certificate of incorporation, articles of organization, etc. PDF or image."
                />
                <div>
                  <Label required>Registered Company Address</Label>
                  <Input type="text" placeholder="123 Main St, Suite 100" value={registeredAddress} onChange={e => setRegisteredAddress(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>City</Label>
                    <Input type="text" placeholder="Dallas" value={city} onChange={e => setCity(e.target.value)} />
                  </div>
                  <div>
                    <Label required>State</Label>
                    <Input type="text" placeholder="TX" value={stateField} onChange={e => setStateField(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label required>ZIP Code</Label>
                  <Input type="text" placeholder="75201" value={zipCode} onChange={e => setZipCode(e.target.value)} className="max-w-[160px]" />
                </div>
                <div className="flex gap-3 mt-2">
                  <SecondaryButton onClick={() => { setError(''); setStep('contact'); }} className="flex-1">Back</SecondaryButton>
                  <PrimaryButton onClick={handleVerify} className="flex-1">Continue</PrimaryButton>
                </div>
              </div>
            )}

            {step === 'brand' && (
              <div className="flex flex-col gap-4">
                <FileUploadBox
                  label="Business Logo"
                  accept="image/*"
                  file={logo}
                  onChange={setLogo}
                  hint="This appears as the contact photo on your RCS number. PNG or JPG recommended."
                />
                <div>
                  <Label required>Store Phone Number</Label>
                  <Input type="tel" placeholder="+1 (555) 000-0000" value={storePhone} onChange={e => setStorePhone(e.target.value)} />
                  <p className="text-xs font-medium text-black/50 mt-1">The phone number customers call to reach your store.</p>
                </div>
                <div>
                  <Label required>Store Email</Label>
                  <Input type="email" placeholder="hello@yourrestaurant.com" value={storeEmail} onChange={e => setStoreEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Website URL</Label>
                  <Input type="url" placeholder="https://yourrestaurant.com" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
                </div>
                <div className="flex gap-3 mt-2">
                  <SecondaryButton onClick={() => { setError(''); setStep('verify'); }} className="flex-1">Back</SecondaryButton>
                  <PrimaryButton onClick={handleBrand} className="flex-1">Continue</PrimaryButton>
                </div>
              </div>
            )}

            {step === 'clover' && (
              <div className="flex flex-col gap-4">
                <div className="border-2 border-black p-4" style={{ background: '#f5dda1' }}>
                  <p className="text-sm font-bold text-black leading-snug">Connect your Clover POS</p>
                  <p className="text-xs font-medium text-black/60 mt-1 leading-relaxed">
                    Optional — connect Clover so prizes and orders sync to your POS automatically. You can skip this and add it later from your dashboard.
                  </p>
                </div>
                <div>
                  <Label>Clover Merchant ID</Label>
                  <Input type="text" placeholder="ABC123XYZ456" value={cloverMerchantId} onChange={e => setCloverMerchantId(e.target.value)} />
                </div>
                <div>
                  <Label>Clover API Key</Label>
                  <Input type="text" placeholder="Your Clover API access token" value={cloverApiKey} onChange={e => setCloverApiKey(e.target.value)} />
                </div>
                <div>
                  <Label>Clover Ecommerce API Key</Label>
                  <Input type="text" placeholder="Your Clover ecommerce API token" value={cloverEcomApiKey} onChange={e => setCloverEcomApiKey(e.target.value)} />
                  <p className="text-xs font-medium text-black/50 mt-1">Used to process payments. Find it in your Clover developer dashboard.</p>
                </div>
                <div className="flex gap-3 mt-2">
                  <SecondaryButton onClick={() => { setError(''); setStep('brand'); }} className="flex-1">Back</SecondaryButton>
                  <PrimaryButton onClick={handleFinishWithClover} disabled={isLoading} className="flex-1">
                    {isLoading ? (<><Spinner />Submitting…</>) : 'Finish'}
                  </PrimaryButton>
                </div>
                <button
                  onClick={() => submitApplication(false)}
                  disabled={isLoading}
                  className="text-center text-xs font-bold uppercase tracking-widest text-black/40 hover:text-black transition-colors disabled:opacity-50"
                >
                  Skip for now →
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-xs font-medium text-black/40 mt-6">
            By submitting, you agree to Belan&apos;s{' '}
            <Link href="/terms-of-service" className="font-bold underline hover:text-black">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="font-bold underline hover:text-black">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
