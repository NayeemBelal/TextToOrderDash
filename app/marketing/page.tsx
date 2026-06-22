'use client';

import { useState, useEffect } from 'react';
import { Navbar, Sidebar } from '@/components';

const RESTAURANT_ID = 'a9d9fb45-34a7-4c63-b0d9-70add44b6275';
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://text-to-order-coffee-34770846162.us-central1.run.app';

// ── Types ──────────────────────────────────────────────────────────────────

type GameType = 'pick-number' | 'trivia' | 'guess-letter' | 'roll-dice';
type PrizeType = 'free-item' | 'percent-off';
type ScheduleDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

interface MockCustomer { id: string; phone: string; name: string; }
interface GameConfig { type: GameType; day: ScheduleDay; time: string; }
interface PrizeConfig { type: PrizeType; itemName?: string; percent?: number; }
interface CampaignConfig {
  selectedDays: ScheduleDay[];
  dayTimes: Record<string, string>;
  endDate: string | null;
  games: GameConfig[];
  prizes: PrizeConfig[];
  loserDiscount: number;
  loserDiscountCap: number;
  optedInCount: number;
}
interface MarketingMenuItem {
  clover_id: string;
  name: string;
  price: number;
  category: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const DAYS_OF_WEEK: ScheduleDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const GAME_DEFINITIONS: Record<GameType, { label: string; emoji: string; template: string }> = {
  'pick-number': {
    label: 'Pick a Number 1–100',
    emoji: '🎲',
    template: '🎲 Pick a number between 1–100 for your chance to win [PRIZE]! Reply with your number.',
  },
  trivia: {
    label: 'Food Trivia',
    emoji: '🍕',
    template: '🍕 Trivia time! [QUESTION] Reply A, B, or C. Get it right and win [PRIZE]!',
  },
  'guess-letter': {
    label: 'Guess the Letter A–Z',
    emoji: '🔤',
    template: '🔤 Guess a letter between A–Z for your chance to win [PRIZE]! Reply with your letter.',
  },
  'roll-dice': {
    label: 'Roll the Dice',
    emoji: '🎰',
    template: '🎰 Text a number 1–6. If it matches our roll, you win [PRIZE]. Everyone gets something though!',
  },
};

const DEFAULT_GAME_ORDER: GameType[] = ['pick-number', 'roll-dice', 'trivia', 'guess-letter'];

const MOCK_OPTED_IN: MockCustomer[] = [
  { id: '1', phone: '+1 (555) 234-5678', name: 'Alex Rivera' },
  { id: '2', phone: '+1 (555) 876-5432', name: 'Sam Chen' },
  { id: '3', phone: '+1 (555) 345-6789', name: 'Jordan Lee' },
  { id: '4', phone: '+1 (555) 567-8901', name: 'Taylor Kim' },
  { id: '5', phone: '+1 (555) 678-9012', name: 'Morgan Patel' },
  { id: '6', phone: '+1 (555) 789-0123', name: 'Casey Johnson' },
  { id: '7', phone: '+1 (555) 890-1234', name: 'Riley Nguyen' },
  { id: '8', phone: '+1 (555) 901-2345', name: 'Drew Martinez' },
];

const MOCK_NOT_OPTED_IN_COUNT = 42;

const MOCK_DASHBOARD_STATS = {
  optedIn: 184,
  played: 127,
  redeemed: 89,
  campaignScore: 74,
  topCustomers: [
    { rank: 1, phone: '+1 (555) ***-1234', gamesPlayed: 8, redeemed: 5, returnVisits: 6 },
    { rank: 2, phone: '+1 (555) ***-5678', gamesPlayed: 7, redeemed: 4, returnVisits: 5 },
    { rank: 3, phone: '+1 (555) ***-9012', gamesPlayed: 6, redeemed: 3, returnVisits: 4 },
    { rank: 4, phone: '+1 (555) ***-3456', gamesPlayed: 5, redeemed: 3, returnVisits: 3 },
    { rank: 5, phone: '+1 (555) ***-7890', gamesPlayed: 4, redeemed: 2, returnVisits: 2 },
  ],
};

const MOCK_PER_GAME = [
  { sent: 184, played: 127, won: 1, discounts: 89 },
  { sent: 184, played: 110, won: 1, discounts: 72 },
];

const WIZARD_STEPS = [
  { id: 1, label: 'Roster' },
  { id: 2, label: 'Schedule' },
  { id: 3, label: 'Games' },
  { id: 4, label: 'Prizes' },
  { id: 5, label: 'Review' },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function buildDefaultGames(days: ScheduleDay[], times: Record<string, string>): GameConfig[] {
  return days.map((day, i) => ({
    type: DEFAULT_GAME_ORDER[i % DEFAULT_GAME_ORDER.length],
    day,
    time: times[day] ?? '12:00 PM',
  }));
}

function buildDefaultPrizes(count: number): PrizeConfig[] {
  return Array.from({ length: count }, () => ({ type: 'percent-off' as PrizeType }));
}

// ── Component ──────────────────────────────────────────────────────────────

export default function MarketingPage() {
  // Phase
  const [pagePhase, setPagePhase] = useState<'setup' | 'active' | 'paused'>('setup');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1 — Roster
  const [optedInCustomers, setOptedInCustomers] = useState<MockCustomer[]>(MOCK_OPTED_IN);
  const [rosterSearch, setRosterSearch] = useState('');

  // Step 2 — Schedule
  const [selectedDays, setSelectedDays] = useState<ScheduleDay[]>([]);
  const [dayHours, setDayHours] = useState<Record<string, string>>({});
  const [dayAmPm, setDayAmPm] = useState<Record<string, string>>({});
  const [runIndefinitely, setRunIndefinitely] = useState(true);
  const [endDate, setEndDate] = useState('');

  // Step 3 — Games
  const [games, setGames] = useState<GameConfig[]>([]);
  const [openGamePicker, setOpenGamePicker] = useState<number | null>(null);

  // Step 4 — Prizes
  const [prizes, setPrizes] = useState<PrizeConfig[]>([]);
  const [loserDiscount, setLoserDiscount] = useState(10);
  const [loserDiscountCap, setLoserDiscountCap] = useState(50);
  const [menuItems, setMenuItems] = useState<MarketingMenuItem[]>([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);
  const [menuItemSearch, setMenuItemSearch] = useState('');
  const [openMenuDropdown, setOpenMenuDropdown] = useState<number | null>(null);

  // Dashboard
  const [launchedConfig, setLaunchedConfig] = useState<CampaignConfig | null>(null);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  const handleSignOut = () => console.log('Sign out clicked');

  // Build time string from separate hour + AM/PM state
  const getDayTime = (day: string) => `${dayHours[day] ?? '12'}:00 ${dayAmPm[day] ?? 'PM'}`;

  // Fetch menu items once on mount (used in step 4 free-item prize selection)
  useEffect(() => {
    setMenuItemsLoading(true);
    const params = new URLSearchParams({ restaurant_id: RESTAURANT_ID, limit: '100' });
    fetch(`${API_BASE_URL}/api/marketing/items?${params}`)
      .then(r => r.json())
      .then(d => setMenuItems(d.items ?? []))
      .catch(() => setMenuItems([]))
      .finally(() => setMenuItemsLoading(false));
  }, []);

  // Rebuild games + prizes whenever selected days change
  useEffect(() => {
    if (selectedDays.length === 0) { setGames([]); setPrizes([]); return; }
    const times: Record<string, string> = {};
    selectedDays.forEach(day => { times[day] = getDayTime(day); });
    setGames(buildDefaultGames(selectedDays, times));
    setPrizes(buildDefaultPrizes(selectedDays.length));
  }, [selectedDays]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──

  const handleDayToggle = (day: ScheduleDay) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) return prev.filter(d => d !== day);
      if (prev.length < 2) return [...prev, day];
      return [...prev.slice(1), day]; // drop oldest, add new
    });
  };

  const updateGame = (index: number, type: GameType) => {
    setGames(prev => prev.map((g, i) => i === index ? { ...g, type } : g));
  };

  const updatePrizeType = (index: number, type: PrizeType) => {
    setPrizes(prev => prev.map((p, i) => i === index ? { type } : p));
    if (type === 'free-item') setOpenMenuDropdown(index);
    else { setOpenMenuDropdown(null); setMenuItemSearch(''); }
  };

  const updatePrizePercent = (index: number, value: number) => {
    setPrizes(prev => prev.map((p, i) => i === index ? { ...p, percent: value } : p));
  };

  const selectFreeItem = (index: number, itemName: string) => {
    setPrizes(prev => prev.map((p, i) => i === index ? { ...p, itemName } : p));
    setOpenMenuDropdown(null);
    setMenuItemSearch('');
  };

  const handleNext = () => {
    if (wizardStep < 5) setWizardStep(prev => (prev + 1) as 1 | 2 | 3 | 4 | 5);
  };

  const handleBack = () => {
    if (wizardStep > 1) setWizardStep(prev => (prev - 1) as 1 | 2 | 3 | 4 | 5);
  };

  const handleLaunch = () => {
    const config: CampaignConfig = {
      selectedDays,
      dayTimes: Object.fromEntries(selectedDays.map(d => [d, getDayTime(d)])),
      endDate: runIndefinitely ? null : endDate,
      games,
      prizes,
      loserDiscount,
      loserDiscountCap,
      optedInCount: optedInCustomers.length,
    };
    setLaunchedConfig(config);
    setPagePhase('active');
  };

  // ── Derived ──

  const filteredRoster = rosterSearch
    ? optedInCustomers.filter(c =>
        c.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
        c.phone.includes(rosterSearch)
      )
    : optedInCustomers;

  const filteredMenuItems = menuItemSearch
    ? menuItems.filter(m => m.name.toLowerCase().includes(menuItemSearch.toLowerCase()))
    : menuItems;

  const today = new Date().toISOString().split('T')[0];

  const canProceed = (() => {
    switch (wizardStep) {
      case 1: return true;
      case 2: return selectedDays.length >= 1;
      case 3: return true;
      case 4:
        return (
          prizes.every(p => p.type === 'free-item' ? !!p.itemName : (p.percent ?? 0) > 0) &&
          loserDiscount > 0 &&
          loserDiscountCap > 0
        );
      default: return true;
    }
  })();

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar onSignOut={handleSignOut} />
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pb-32">

          {pagePhase === 'setup' ? (
            /* ── SETUP WIZARD ─────────────────────────────────────────── */
            <div className="max-w-3xl mx-auto">

              {/* Wizard header */}
              <div className="mb-8">
                <div className="mb-6">
                  <h1
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                    style={{ fontFamily: 'Tektur, sans-serif' }}
                  >
                    Gamified SMS Campaign
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Set up your automated game-based marketing
                  </p>
                </div>

                {/* Step indicators */}
                <div className="flex items-center">
                  {WIZARD_STEPS.map((step, index) => {
                    const done = index < wizardStep - 1;
                    const active = index === wizardStep - 1;
                    return (
                      <div key={step.id} className="flex items-center flex-1">
                        <div className="flex flex-col items-center flex-1">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                              done
                                ? 'bg-green-500 text-white'
                                : active
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                            }`}
                            style={{ fontFamily: 'Tektur, sans-serif' }}
                          >
                            {done ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : index + 1}
                          </div>
                          <span
                            className={`text-xs mt-1 hidden sm:block ${
                              done
                                ? 'text-green-600 dark:text-green-400'
                                : active
                                ? 'text-gray-900 dark:text-white font-semibold'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}
                            style={{ fontFamily: 'Tektur, sans-serif' }}
                          >
                            {step.label}
                          </span>
                        </div>
                        {index < WIZARD_STEPS.length - 1 && (
                          <div
                            className={`h-0.5 flex-1 mx-2 transition-all duration-300 ${
                              index < wizardStep - 1 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-800'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step card */}
              <div
                key={wizardStep}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 min-h-[400px]"
                style={{ animation: 'fadeInScale 0.3s ease-out' }}
              >

                {/* ── Step 1: Customer Roster ── */}
                {wizardStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Tektur, sans-serif' }}>
                        Customer Roster
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage who receives your gamified campaigns
                      </p>
                    </div>

                    {/* Opted In */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Opted In</span>
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          {optedInCustomers.length} customers
                        </span>
                      </div>

                      <div className="relative mb-3">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={rosterSearch}
                          onChange={e => setRosterSearch(e.target.value)}
                          placeholder="Search by name or phone..."
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700 text-sm transition-all"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                        {filteredRoster.length === 0 ? (
                          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                            {rosterSearch ? `No customers matching "${rosterSearch}"` : 'No opted-in customers yet'}
                          </p>
                        ) : (
                          filteredRoster.map((customer, i) => (
                            <div
                              key={customer.id}
                              className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                              style={{ animation: `fadeInRight 0.3s ease-out ${i * 0.04}s both` }}
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{customer.phone}</p>
                              </div>
                              <button
                                onClick={() => setOptedInCustomers(prev => prev.filter(c => c.id !== customer.id))}
                                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                aria-label="Remove from opted-in"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {optedInCustomers.length === 0 && (
                      <div
                        className="flex items-start gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
                        style={{ animation: 'fadeInScale 0.3s ease-out' }}
                      >
                        <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          No opted-in customers yet — you can still launch. Customers will be added as they opt in.
                        </p>
                      </div>
                    )}

                    {/* Not Opted In */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">Not Opted In</span>
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          {MOCK_NOT_OPTED_IN_COUNT} customers
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        These customers will receive an opt-in SMS automatically
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Step 2: Schedule ── */}
                {wizardStep === 2 && (
                  <div className="space-y-7">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Tektur, sans-serif' }}>
                        Set Your Schedule
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Choose up to 2 days per week to send your games
                      </p>
                    </div>

                    {/* Day pills */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Send Days</p>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map(day => {
                          const isSelected = selectedDays.includes(day);
                          return (
                            <button
                              key={day}
                              onClick={() => handleDayToggle(day)}
                              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                                isSelected
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-400 dark:hover:border-green-600 hover:text-green-600 dark:hover:text-green-400'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      {selectedDays.length === 2 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          Max 2 days — selecting another will replace the first
                        </p>
                      )}
                    </div>

                    {/* Time inputs */}
                    {selectedDays.length > 0 && (
                      <div style={{ animation: 'fadeInScale 0.3s ease-out' }}>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Send Times</p>
                        <div className="space-y-3">
                          {selectedDays.map(day => (
                            <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                              <span
                                className="w-10 text-sm font-bold text-gray-900 dark:text-white shrink-0"
                                style={{ fontFamily: 'Tektur, sans-serif' }}
                              >
                                {day}
                              </span>
                              <div className="flex items-center gap-2">
                                <select
                                  value={dayHours[day] ?? '12'}
                                  onChange={e => setDayHours(prev => ({ ...prev, [day]: e.target.value }))}
                                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                    <option key={h} value={String(h)}>{h}</option>
                                  ))}
                                </select>
                                <span className="text-gray-400 text-sm">:00</span>
                                <select
                                  value={dayAmPm[day] ?? 'PM'}
                                  onChange={e => setDayAmPm(prev => ({ ...prev, [day]: e.target.value }))}
                                  className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                                >
                                  <option>AM</option>
                                  <option>PM</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* End date */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Campaign Duration</p>
                      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                        <button
                          onClick={() => setRunIndefinitely(true)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            runIndefinitely
                              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          Run indefinitely
                        </button>
                        <button
                          onClick={() => setRunIndefinitely(false)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            !runIndefinitely
                              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          Set end date
                        </button>
                      </div>
                      {!runIndefinitely && (
                        <div className="mt-3" style={{ animation: 'fadeInScale 0.2s ease-out' }}>
                          <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            min={today}
                            className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Step 3: Games ── */}
                {wizardStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Tektur, sans-serif' }}>
                        Choose Your Games
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        One game per send day — swap any game type you&apos;d like
                      </p>
                    </div>

                    {games.length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                        Go back and select at least one send day
                      </div>
                    ) : (
                      games.map((game, i) => (
                        <div
                          key={i}
                          className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden"
                          style={{ animation: `fadeInRight 0.3s ease-out ${i * 0.08}s both` }}
                        >
                          <div className="flex items-start justify-between p-5">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Game {i + 1} — {game.day} at {getDayTime(game.day)}
                              </p>
                              <div className="flex items-center gap-2.5 mb-2">
                                <span className="text-2xl">{GAME_DEFINITIONS[game.type].emoji}</span>
                                <span
                                  className="font-semibold text-gray-900 dark:text-white"
                                  style={{ fontFamily: 'Tektur, sans-serif' }}
                                >
                                  {GAME_DEFINITIONS[game.type].label}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 dark:text-gray-500 italic leading-relaxed max-w-md">
                                &ldquo;{GAME_DEFINITIONS[game.type].template}&rdquo;
                              </p>
                            </div>
                            <button
                              onClick={() => setOpenGamePicker(openGamePicker === i ? null : i)}
                              className="ml-4 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-all shrink-0"
                            >
                              Change
                            </button>
                          </div>

                          {openGamePicker === i && (
                            <div
                              className="px-5 pb-5 border-t border-gray-100 dark:border-gray-800 pt-4"
                              style={{ animation: 'fadeInScale 0.2s ease-out' }}
                            >
                              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 font-medium">Select a game type:</p>
                              <div className="grid grid-cols-2 gap-2">
                                {(Object.keys(GAME_DEFINITIONS) as GameType[]).map(type => (
                                  <button
                                    key={type}
                                    onClick={() => { updateGame(i, type); setOpenGamePicker(null); }}
                                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                                      game.type === type
                                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600'
                                    }`}
                                  >
                                    <span className="text-xl">{GAME_DEFINITIONS[type].emoji}</span>
                                    <p
                                      className="text-xs font-semibold text-gray-900 dark:text-white mt-1"
                                      style={{ fontFamily: 'Tektur, sans-serif' }}
                                    >
                                      {GAME_DEFINITIONS[type].label}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── Step 4: Prizes ── */}
                {wizardStep === 4 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Tektur, sans-serif' }}>
                        Set Up Prizes
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        One prize per game, plus a consolation discount for everyone else
                      </p>
                    </div>

                    {prizes.map((prize, i) => (
                      <div
                        key={i}
                        className="p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl"
                        style={{ animation: `fadeInRight 0.3s ease-out ${i * 0.08}s both` }}
                      >
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                          Game {i + 1} Prize — {games[i]?.day ?? ''}
                        </p>

                        <div className="flex items-center gap-5 mb-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={prize.type === 'percent-off'}
                              onChange={() => updatePrizeType(i, 'percent-off')}
                              className="w-4 h-4 accent-green-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">% Off</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              checked={prize.type === 'free-item'}
                              onChange={() => updatePrizeType(i, 'free-item')}
                              className="w-4 h-4 accent-green-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Free Item</span>
                          </label>
                        </div>

                        {prize.type === 'percent-off' ? (
                          <div className="relative w-40" style={{ animation: 'fadeInScale 0.2s ease-out' }}>
                            <input
                              type="number"
                              value={prize.percent ?? ''}
                              onChange={e => updatePrizePercent(i, Number(e.target.value))}
                              min={1} max={100}
                              placeholder="20"
                              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 pr-8 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                          </div>
                        ) : (
                          <div className="relative" style={{ animation: 'fadeInScale 0.2s ease-out' }}>
                            <input
                              type="text"
                              value={openMenuDropdown === i ? menuItemSearch : (prize.itemName ? '' : '')}
                              onChange={e => { setMenuItemSearch(e.target.value); setOpenMenuDropdown(i); }}
                              onFocus={() => { if (!prize.itemName) setOpenMenuDropdown(i); }}
                              placeholder={prize.itemName ? prize.itemName : 'Search menu items...'}
                              className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                            />
                            {prize.itemName && openMenuDropdown !== i && (
                              <div className="flex items-center justify-between mt-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <span className="text-sm text-green-700 dark:text-green-400 font-medium">{prize.itemName}</span>
                                <button
                                  onClick={() => setPrizes(prev => prev.map((p, idx) => idx === i ? { ...p, itemName: undefined } : p))}
                                  className="text-green-500 hover:text-green-700 ml-2 shrink-0"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                            {openMenuDropdown === i && (
                              <div
                                className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 max-h-44 overflow-y-auto"
                                style={{ animation: 'fadeInScale 0.2s ease-out' }}
                              >
                                {menuItemsLoading ? (
                                  <div className="p-4 text-center text-sm text-gray-400">Loading items...</div>
                                ) : filteredMenuItems.length === 0 ? (
                                  <div className="p-4 text-center text-sm text-gray-400">No items found</div>
                                ) : (
                                  filteredMenuItems.slice(0, 20).map(item => (
                                    <button
                                      key={item.clover_id}
                                      onClick={() => selectFreeItem(i, item.name)}
                                      className="w-full text-left px-4 py-2.5 text-sm text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                                    >
                                      <span className="font-medium">{item.name}</span>
                                      {item.category && (
                                        <span className="text-gray-400 ml-2 text-xs">{item.category}</span>
                                      )}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Loser's Discount */}
                    <div className="pt-5 border-t border-gray-200 dark:border-gray-700">
                      <p
                        className="text-sm font-semibold text-gray-900 dark:text-white mb-1"
                        style={{ fontFamily: 'Tektur, sans-serif' }}
                      >
                        Loser&apos;s Discount
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Every non-winner receives this. After the cap is reached, they get a kind &ldquo;Sorry&rdquo; message.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Discount
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={loserDiscount}
                              onChange={e => setLoserDiscount(Number(e.target.value))}
                              min={1} max={100}
                              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 pr-8 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            Max Redemptions
                          </label>
                          <input
                            type="number"
                            value={loserDiscountCap}
                            onChange={e => setLoserDiscountCap(Number(e.target.value))}
                            min={1}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Step 5: Review & Launch ── */}
                {wizardStep === 5 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1" style={{ fontFamily: 'Tektur, sans-serif' }}>
                        Ready to Launch
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Review your campaign settings before going live
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Schedule</p>
                        {selectedDays.map(day => (
                          <p key={day} className="text-sm text-gray-900 dark:text-white">{day} at {getDayTime(day)}</p>
                        ))}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {runIndefinitely ? 'Runs indefinitely' : `Ends ${endDate || '—'}`}
                        </p>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Games</p>
                        {games.map((g, i) => (
                          <p key={i} className="text-sm text-gray-900 dark:text-white">
                            {GAME_DEFINITIONS[g.type].emoji} {g.day} — {GAME_DEFINITIONS[g.type].label}
                          </p>
                        ))}
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Prizes</p>
                        {prizes.map((p, i) => (
                          <p key={i} className="text-sm text-gray-900 dark:text-white">
                            Game {i + 1}: {p.type === 'free-item' ? `Free ${p.itemName}` : `${p.percent}% off`}
                          </p>
                        ))}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Loser&apos;s discount: {loserDiscount}% off (cap: {loserDiscountCap})
                        </p>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Customers</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {optedInCustomers.length} customer{optedInCustomers.length !== 1 ? 's' : ''} opted in
                        </p>
                        {optedInCustomers.length === 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Campaign will still launch and send opt-in messages
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard navigation */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={handleBack}
                  disabled={wizardStep === 1}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium"
                >
                  Back
                </button>

                {wizardStep < 5 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleLaunch}
                    className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2"
                    style={{ fontFamily: 'Tektur, sans-serif' }}
                  >
                    🚀 Launch Campaign
                  </button>
                )}
              </div>
            </div>

          ) : (
            /* ── DASHBOARD VIEW ─────────────────────────────────────────── */
            <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>

              {/* Header */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                    style={{ fontFamily: 'Tektur, sans-serif' }}
                  >
                    Gamified Campaign
                  </h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      pagePhase === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    }`}>
                      {pagePhase === 'active' ? '● Active' : '⏸ Paused'}
                    </span>
                    {launchedConfig && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {launchedConfig.selectedDays.join(', ')} · {launchedConfig.optedInCount} opted in
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setPagePhase(p => p === 'active' ? 'paused' : 'active')}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-all text-sm ${
                    pagePhase === 'active'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                  style={{ fontFamily: 'Tektur, sans-serif' }}
                >
                  {pagePhase === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
                </button>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Opted In', value: MOCK_DASHBOARD_STATS.optedIn },
                  { label: 'Played', value: MOCK_DASHBOARD_STATS.played },
                  { label: 'Redeemed', value: MOCK_DASHBOARD_STATS.redeemed },
                ].map((stat, i) => (
                  <div
                    key={stat.label}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5"
                    style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }}
                  >
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p
                      className="text-3xl font-bold text-gray-900 dark:text-white mt-1.5"
                      style={{ fontFamily: 'Tektur, sans-serif' }}
                    >
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Score card */}
              <div
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 mb-6 flex items-center gap-6"
                style={{ animation: 'fadeInUp 0.4s ease-out 0.24s both' }}
              >
                <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20 border-4 border-green-400 dark:border-green-600 flex items-center justify-center shrink-0">
                  <span
                    className="text-2xl font-bold text-green-600 dark:text-green-400"
                    style={{ fontFamily: 'Tektur, sans-serif' }}
                  >
                    {MOCK_DASHBOARD_STATS.campaignScore}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: 'Tektur, sans-serif' }}>
                    Campaign Score
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Redemption rate × return visits
                  </p>
                  <div className="w-56 h-2 bg-gray-100 dark:bg-gray-800 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full"
                      style={{ width: `${MOCK_DASHBOARD_STATS.campaignScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Top 5 Returning Customers */}
              <div
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-6"
                style={{ animation: 'fadeInUp 0.4s ease-out 0.32s both' }}
              >
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                  <p className="font-semibold text-gray-900 dark:text-white" style={{ fontFamily: 'Tektur, sans-serif' }}>
                    Top 5 Returning Customers
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Customers who returned within 30 days of redeeming
                  </p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      {['Rank', 'Customer', 'Games Played', 'Redeemed', 'Return Visits'].map(col => (
                        <th
                          key={col}
                          className="px-5 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {MOCK_DASHBOARD_STATS.topCustomers.map(row => (
                      <tr key={row.rank} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <span
                            className="w-6 h-6 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center"
                            style={{ fontFamily: 'Tektur, sans-serif' }}
                          >
                            {row.rank}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300 font-mono">{row.phone}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{row.gamesPlayed}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{row.redeemed}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{row.returnVisits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Per-Game Breakdown */}
              <div className="mb-6" style={{ animation: 'fadeInUp 0.4s ease-out 0.4s both' }}>
                <p
                  className="font-semibold text-gray-900 dark:text-white mb-4"
                  style={{ fontFamily: 'Tektur, sans-serif' }}
                >
                  Per-Game Breakdown
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(launchedConfig?.games ?? []).map((game, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5"
                      style={{ animation: `fadeInUp 0.4s ease-out ${0.4 + i * 0.08}s both` }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">{GAME_DEFINITIONS[game.type].emoji}</span>
                        <div>
                          <p
                            className="font-semibold text-gray-900 dark:text-white text-sm"
                            style={{ fontFamily: 'Tektur, sans-serif' }}
                          >
                            {GAME_DEFINITIONS[game.type].label}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{game.day} at {game.time}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Sent', value: MOCK_PER_GAME[i]?.sent ?? 0 },
                          { label: 'Played', value: MOCK_PER_GAME[i]?.played ?? 0 },
                          { label: 'Won', value: MOCK_PER_GAME[i]?.won ?? 0 },
                          { label: 'Discounts', value: MOCK_PER_GAME[i]?.discounts ?? 0 },
                        ].map(s => (
                          <div key={s.label}>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {s.label}
                            </p>
                            <p
                              className="text-xl font-bold text-gray-900 dark:text-white mt-0.5"
                              style={{ fontFamily: 'Tektur, sans-serif' }}
                            >
                              {s.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collapsible Campaign Settings */}
              <div
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                style={{ animation: 'fadeInUp 0.4s ease-out 0.48s both' }}
              >
                <button
                  onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <p
                    className="font-semibold text-gray-900 dark:text-white text-sm"
                    style={{ fontFamily: 'Tektur, sans-serif' }}
                  >
                    Campaign Settings
                  </p>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isSettingsExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isSettingsExpanded && launchedConfig && (
                  <div
                    className="px-6 pb-6 border-t border-gray-100 dark:border-gray-800 space-y-3 pt-4"
                    style={{ animation: 'fadeInScale 0.2s ease-out' }}
                  >
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Schedule</p>
                      {launchedConfig.selectedDays.map(day => (
                        <p key={day} className="text-sm text-gray-900 dark:text-white">
                          {day} at {launchedConfig.dayTimes[day]}
                        </p>
                      ))}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {launchedConfig.endDate ? `Ends ${launchedConfig.endDate}` : 'Runs indefinitely'}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Games &amp; Prizes</p>
                      {launchedConfig.games.map((g, i) => (
                        <p key={i} className="text-sm text-gray-900 dark:text-white">
                          {GAME_DEFINITIONS[g.type].emoji} {g.day} — {GAME_DEFINITIONS[g.type].label}
                          <span className="text-gray-400 dark:text-gray-500">
                            {' · '}
                            {launchedConfig.prizes[i]?.type === 'free-item'
                              ? `Free ${launchedConfig.prizes[i]?.itemName}`
                              : `${launchedConfig.prizes[i]?.percent}% off`}
                          </span>
                        </p>
                      ))}
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Loser&apos;s Discount
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {launchedConfig.loserDiscount}% off · Cap: {launchedConfig.loserDiscountCap} redemptions
                      </p>
                    </div>

                    <p className="text-xs text-gray-400 dark:text-gray-500 italic pt-1">
                      Settings cannot be edited while a campaign is active or paused.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
