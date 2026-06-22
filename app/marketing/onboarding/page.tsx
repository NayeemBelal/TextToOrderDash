'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Step = 1 | 2 | 3 | 4 | 5 | 'success';

const LEGAL_FORMS = ['Public', 'Private', 'Government', 'Non-profit', 'Sole Proprietor'];
const LEGAL_ENTITY_TYPES = ['LLC', 'Sole Proprietorship', 'Partnership', 'Corporation', 'S Corporation'];

const STEP_LABELS = ['Account', 'Business', 'Contact', 'Verification', 'Brand'];

function StepIndicator({ step }: { step: Step }) {
  if (step === 'success') return null;
  const current = step as number;
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                done ? 'bg-capy-brown-accent text-white' :
                active ? 'bg-capy-brown-accent text-white ring-4 ring-orange-100' :
                'bg-gray-100 text-capy-muted'
              }`}>
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : n}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-capy-brown-accent' : 'text-capy-muted'}`}>{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`w-8 h-px mb-4 ${done ? 'bg-capy-brown-accent' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-capy-text mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-capy-border rounded-lg px-3 py-2.5 text-sm text-capy-text placeholder:text-capy-muted focus:outline-none focus:ring-2 focus:ring-capy-brown-accent/30 focus:border-capy-brown-accent transition-colors bg-white ${props.className ?? ''}`}
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full border border-capy-border rounded-lg px-3 py-2.5 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-brown-accent/30 focus:border-capy-brown-accent transition-colors bg-white ${props.className ?? ''}`}
    >
      {children}
    </select>
  );
}

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
        className="border-2 border-dashed border-capy-border rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-capy-brown-accent/60 hover:bg-orange-50/40 transition-colors"
      >
        {file ? (
          <div className="flex items-center gap-3 w-full">
            <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-capy-brown-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-capy-text truncate">{file.name}</p>
              <p className="text-xs text-capy-muted">{(file.size / 1024).toFixed(0)} KB — click to change</p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-capy-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-capy-text">Click to upload</p>
              {hint && <p className="text-xs text-capy-muted mt-0.5">{hint}</p>}
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

export default function MarketingOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [accountEmail, setAccountEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2
  const [brandName, setBrandName] = useState('');
  const [orgLegalName, setOrgLegalName] = useState('');
  const [legalForm, setLegalForm] = useState('');
  const [legalEntityType, setLegalEntityType] = useState('');
  const [taxId, setTaxId] = useState('');

  // Step 3
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Step 4
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateField, setStateField] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Step 5
  const [logo, setLogo] = useState<File | null>(null);
  const [storePhone, setStorePhone] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  async function handleStep1() {
    setError('');
    if (!brandName.trim()) return setError('Restaurant name is required.');
    if (!accountEmail.trim()) return setError('Email is required.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setIsLoading(true);
    try {
      // Create account server-side (pre-confirmed, bypasses email confirmation gate)
      const res = await fetch('/api/marketing-onboarding/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountEmail, password, brandName }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Account creation failed.');

      // Sign in immediately since the account is pre-confirmed
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: accountEmail,
        password,
      });
      if (signInError) throw signInError;

      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleStep2() {
    setError('');
    if (!orgLegalName.trim()) return setError('Organization legal name is required.');
    if (!legalForm) return setError('Please select a legal form.');
    if (!legalEntityType) return setError('Please select a legal entity type.');
    if (!taxId.trim()) return setError('Tax ID / EIN is required.');
    setStep(3);
  }

  function handleStep3() {
    setError('');
    if (!contactFirstName.trim()) return setError('First name is required.');
    if (!contactLastName.trim()) return setError('Last name is required.');
    if (!contactTitle.trim()) return setError('Title is required.');
    if (!contactEmail.trim()) return setError('Business email is required.');
    if (!contactPhone.trim()) return setError('Phone number is required.');
    setStep(4);
  }

  function handleStep4() {
    setError('');
    if (!verificationDoc) return setError('Please upload a business verification document.');
    if (!registeredAddress.trim()) return setError('Registered address is required.');
    if (!city.trim()) return setError('City is required.');
    if (!stateField.trim()) return setError('State is required.');
    if (!zipCode.trim()) return setError('ZIP code is required.');
    setStep(5);
  }

  async function handleStep5() {
    setError('');
    if (!storePhone.trim()) return setError('Store phone number is required.');
    if (!storeEmail.trim()) return setError('Store email is required.');

    setIsLoading(true);
    try {
      const fd = new FormData();
      fd.append('accountEmail', accountEmail);
      fd.append('brandName', brandName);
      fd.append('orgLegalName', orgLegalName);
      fd.append('legalForm', legalForm);
      fd.append('legalEntityType', legalEntityType);
      fd.append('taxId', taxId);
      fd.append('contactFirstName', contactFirstName);
      fd.append('contactLastName', contactLastName);
      fd.append('contactTitle', contactTitle);
      fd.append('contactEmail', contactEmail);
      fd.append('contactPhone', contactPhone);
      fd.append('registeredAddress', registeredAddress);
      fd.append('city', city);
      fd.append('state', stateField);
      fd.append('zipCode', zipCode);
      fd.append('storePhone', storePhone);
      fd.append('storeEmail', storeEmail);
      fd.append('websiteUrl', websiteUrl);
      if (verificationDoc) fd.append('verificationDoc', verificationDoc);
      if (logo) fd.append('logo', logo);

      const res = await fetch('/api/marketing-onboarding', { method: 'POST', body: fd });
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

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-capy-bg flex flex-col font-sans">
        <header className="bg-white border-b border-capy-border flex-shrink-0 h-16 flex items-center px-6 justify-between">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/BelanLogo.png" alt="Belan" className="w-10 h-10 rounded-full object-cover" />
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white rounded-2xl p-10 flex flex-col items-center text-center gap-5 shadow-sm border border-capy-border">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h1 className="text-capy-text text-2xl font-semibold mb-2">You&apos;re all set!</h1>
              <p className="text-capy-muted text-sm leading-relaxed">
                Thanks for signing up. We&apos;re processing your information and getting your business RCS number set up. This usually takes 1–2 business days. We&apos;ll reach out once you&apos;re ready to go.
              </p>
            </div>
            <button
              onClick={() => router.push('/home?tab=marketing')}
              className="mt-2 h-11 w-full rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-capy-bg flex flex-col font-sans">
      <header className="bg-white border-b border-capy-border flex-shrink-0 h-16 flex items-center px-6 justify-between">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/BelanLogo.png" alt="Belan" className="w-10 h-10 rounded-full object-cover" />
        </Link>
        <p className="text-xs text-capy-muted">Marketing Onboarding</p>
      </header>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <h1 className="text-capy-text text-2xl font-semibold">Set up your marketing account</h1>
            <p className="text-capy-muted text-sm mt-1">Get your business RCS number for gamified SMS marketing.</p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-capy-border">
            <StepIndicator step={step} />

            {error && (
              <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <Label required>Restaurant / Brand Name</Label>
                  <Input
                    type="text"
                    placeholder="Lime N Dime"
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                  />
                </div>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-capy-muted hover:text-capy-text"
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
                <button
                  onClick={handleStep1}
                  disabled={isLoading}
                  className="mt-2 h-11 w-full rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating account…</>
                  ) : 'Create Account & Continue'}
                </button>
                <p className="text-center text-xs text-capy-muted">
                  Already have an account?{' '}
                  <Link href="/login" className="text-capy-brown-accent hover:underline font-medium">Sign in</Link>
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div>
                  <Label required>Organization Legal Name</Label>
                  <Input
                    type="text"
                    placeholder="Lime N Dime LLC"
                    value={orgLegalName}
                    onChange={e => setOrgLegalName(e.target.value)}
                  />
                  <p className="text-xs text-capy-muted mt-1">The exact legal name on your business registration.</p>
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
                  <button onClick={() => { setError(''); setStep(1); }} className="h-11 flex-1 rounded-lg border border-capy-border text-capy-text font-semibold text-sm hover:bg-gray-50 transition-colors">Back</button>
                  <button onClick={handleStep2} className="h-11 flex-1 rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors">Continue</button>
                </div>
              </div>
            )}

            {step === 3 && (
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
                  <button onClick={() => { setError(''); setStep(2); }} className="h-11 flex-1 rounded-lg border border-capy-border text-capy-text font-semibold text-sm hover:bg-gray-50 transition-colors">Back</button>
                  <button onClick={handleStep3} className="h-11 flex-1 rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors">Continue</button>
                </div>
              </div>
            )}

            {step === 4 && (
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
                  <button onClick={() => { setError(''); setStep(3); }} className="h-11 flex-1 rounded-lg border border-capy-border text-capy-text font-semibold text-sm hover:bg-gray-50 transition-colors">Back</button>
                  <button onClick={handleStep4} className="h-11 flex-1 rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors">Continue</button>
                </div>
              </div>
            )}

            {step === 5 && (
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
                  <p className="text-xs text-capy-muted mt-1">The phone number customers call to reach your store.</p>
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
                  <button onClick={() => { setError(''); setStep(4); }} className="h-11 flex-1 rounded-lg border border-capy-border text-capy-text font-semibold text-sm hover:bg-gray-50 transition-colors">Back</button>
                  <button
                    onClick={handleStep5}
                    disabled={isLoading}
                    className="h-11 flex-1 rounded-lg bg-capy-brown-accent hover:bg-capy-brown-accent-dark text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Submitting…</>
                    ) : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-capy-muted mt-6">
            By submitting, you agree to Belan&apos;s{' '}
            <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
