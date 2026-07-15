"use client";

import { useState, useEffect } from "react";
import { marketingApiFetch } from "@/lib/api";
import { countSegments } from "@/lib/smsSegments";
import { getOptinConfig } from "@/lib/optinConfigApi";
import {
  getCampaignConfig,
  type CampaignMessageDefaults,
} from "@/lib/campaignConfigApi";
import { sendTestOptin, sendTestCampaign } from "@/lib/testSendApi";
import { useAuth } from "@/lib/auth-context";
import {
  GAME_DEFINITIONS,
  DEFAULT_GAME_ORDER,
  DEFAULT_TRIVIA,
  FALLBACK_GAME_MESSAGES,
  FALLBACK_WINNER_MESSAGE,
  FALLBACK_LOSER_MESSAGE,
  buildTriviaChoices,
  type GameType,
  type TriviaConfig,
} from "@/components/voice/games";

// ── Types ──────────────────────────────────────────────────────────────────

type PrizeType = "free-item" | "percent-off";
type ScheduleDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

interface MockCustomer {
  id: string;
  phone: string;
  name: string;
}
// Per-slot editable SMS copy, sent to the backend inside each game's config.
// Placeholders match the backend renderer (services/campaign_templates.py).
interface GameMessages {
  game?: string; // {restaurant_name} {prize}; trivia also {question} {choices}
  winner?: string; // {first_name} {prize} {code} {link} {expiry}
  loser?: string; // {first_name} {discount} {code} {link} {expiry}
}
interface GameConfig {
  type: GameType;
  day: ScheduleDay;
  time: string;
  trivia?: TriviaConfig;
  messages?: GameMessages;
}
interface PrizeConfig {
  type: PrizeType;
  itemName?: string;
  percent?: number;
}
interface CampaignConfig {
  selectedDays: ScheduleDay[];
  dayTimes: Record<string, string>;
  endDate: string | null;
  games: GameConfig[];
  prizes: PrizeConfig[];
  loserDiscount: number;
  loserDiscountCap: number;
  // Coupon validity for winner + loser prizes: N days after playing, at a
  // restaurant-local time of day ("HH:MM" 24h). Backend falls back to the
  // rolling 24h default when absent (old campaigns).
  couponExpiryDays?: number | null;
  couponExpiryTime?: string | null;
  optedInCount: number;
  targetCustomerIds: string[];
}
interface OptinStatus {
  opted_in: number;
  pending: number;
  opted_out: number;
  last_scan_at: string | null;
  // Sent-cohort counts — how many customers we actually texted the opt-in blast
  // to (blast_sent), and how that cohort has responded so far. blast_opted_in +
  // blast_pending + blast_opted_out === blast_sent.
  blast_sent: number;
  blast_opted_in: number;
  blast_pending: number;
  blast_opted_out: number;
}
interface MarketingMenuItem {
  clover_id: string;
  name: string;
  price: number;
  category: string | null;
}

// ── Constants ──────────────────────────────────────────────────────────────

const DAYS_OF_WEEK: ScheduleDay[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

interface TopCustomerRow {
  rank: number;
  phone: string;
  name: string;
  games_played: number;
  redeemed: number;
}
interface PerGameStats {
  game_type: string;
  sent: number;
  played: number;
  won: number;
  discounts: number;
}
interface CampaignStats {
  opted_in: number;
  played: number;
  redeemed: number;
  campaign_score: number;
  top_customers: TopCustomerRow[];
  per_game: PerGameStats[];
}

const EMPTY_STATS: CampaignStats = {
  opted_in: 0,
  played: 0,
  redeemed: 0,
  campaign_score: 0,
  top_customers: [],
  per_game: [],
};

const WIZARD_STEPS = [
  { id: 1, label: "Roster" },
  { id: 2, label: "Schedule" },
  { id: 3, label: "Games" },
  { id: 4, label: "Prizes" },
  { id: 5, label: "Review" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function cloneDefaultTrivia(): TriviaConfig {
  return { ...DEFAULT_TRIVIA, choices: { ...DEFAULT_TRIVIA.choices } };
}

// Opt-in expiry time is stored as 24h "HH:MM" (restaurant-local); the UI edits it
// as hour / minute / AM-PM selects.
function from24h(t: string | null | undefined): { hour: string; minute: string; ampm: string } {
  if (!t) return { hour: "11", minute: "00", ampm: "PM" };
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return { hour: String(h), minute: (mStr ?? "00").padStart(2, "0"), ampm };
}
function to24h(hour: string, minute: string, ampm: string): string {
  let h = parseInt(hour, 10) % 12;
  if (ampm === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

// Default (server-provided, else fallback) message set for a game type.
function seedMessages(
  type: GameType,
  defaults: CampaignMessageDefaults | null,
): Required<GameMessages> {
  return {
    game: defaults?.game_messages?.[type] ?? FALLBACK_GAME_MESSAGES[type],
    winner: defaults?.winner_messages?.[type] ?? FALLBACK_WINNER_MESSAGE,
    loser: defaults?.loser_messages?.[type] ?? FALLBACK_LOSER_MESSAGE,
  };
}

function buildDefaultGames(
  days: ScheduleDay[],
  times: Record<string, string>,
  defaults: CampaignMessageDefaults | null,
): GameConfig[] {
  return days.map((day, i) => {
    const type = DEFAULT_GAME_ORDER[i % DEFAULT_GAME_ORDER.length];
    return {
      type,
      day,
      time: times[day] ?? "12:00 PM",
      messages: seedMessages(type, defaults),
      ...(type === "trivia" ? { trivia: cloneDefaultTrivia() } : {}),
    };
  });
}

function buildDefaultPrizes(count: number): PrizeConfig[] {
  return Array.from({ length: count }, () => ({
    type: "percent-off" as PrizeType,
  }));
}

// Substitute {placeholder}s the way the backend renderer does (.replace, not
// format, so stray braces in owner text are harmless).
function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.split(`{${key}}`).join(value),
    template,
  );
}

function buildPrizeLabel(prize?: PrizeConfig): string {
  if (!prize) return "your prize";
  if (prize.type === "free-item") return `Free ${prize.itemName ?? "item"}`;
  return prize.percent ? `${prize.percent}% off your order` : "your prize";
}

function aggregatePerGame(
  perGame: PerGameStats[],
  gameType: GameType,
): PerGameStats {
  return perGame
    .filter((p) => p.game_type === gameType)
    .reduce(
      (acc, p) => ({
        game_type: gameType,
        sent: acc.sent + p.sent,
        played: acc.played + p.played,
        won: acc.won + p.won,
        discounts: acc.discounts + p.discounts,
      }),
      { game_type: gameType, sent: 0, played: 0, won: 0, discounts: 0 },
    );
}

// ── Component ──────────────────────────────────────────────────────────────

export function GamifiedMarketingTab() {
  const { restaurantId } = useAuth();

  // Phase
  const [pagePhase, setPagePhase] = useState<"setup" | "active" | "paused">(
    "setup",
  );
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1 — Roster
  const [optedInCustomers, setOptedInCustomers] = useState<MockCustomer[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(
    new Set(),
  );
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterSearch, setRosterSearch] = useState("");

  // Step 2 — Schedule
  const [restaurantTimezone, setRestaurantTimezone] =
    useState<string>("America/Chicago");
  const [selectedDays, setSelectedDays] = useState<ScheduleDay[]>([]);
  const [dayHours, setDayHours] = useState<Record<string, string>>({});
  const [dayMinutes, setDayMinutes] = useState<Record<string, string>>({});
  const [dayAmPm, setDayAmPm] = useState<Record<string, string>>({});
  const [runIndefinitely, setRunIndefinitely] = useState(true);
  const [endDate, setEndDate] = useState("");

  // Step 3 — Games
  const [games, setGames] = useState<GameConfig[]>([]);
  const [openGamePicker, setOpenGamePicker] = useState<number | null>(null);

  // Step 4 — Prizes
  const [prizes, setPrizes] = useState<PrizeConfig[]>([]);
  const [loserDiscount, setLoserDiscount] = useState(10);
  const [loserDiscountCap, setLoserDiscountCap] = useState(50);
  const [menuItems, setMenuItems] = useState<MarketingMenuItem[]>([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);
  const [menuItemSearch, setMenuItemSearch] = useState("");
  const [openMenuDropdown, setOpenMenuDropdown] = useState<number | null>(null);

  // Dashboard
  const [launchedConfig, setLaunchedConfig] = useState<CampaignConfig | null>(
    null,
  );
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [stats, setStats] = useState<CampaignStats>(EMPTY_STATS);

  // Opt-in blast management
  const [optinStatus, setOptinStatus] = useState<OptinStatus | null>(null);
  const [scanResult, setScanResult] = useState<{ new_customers: number } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [blastLoading, setBlastLoading] = useState(false);
  const [blastToast, setBlastToast] = useState<string | null>(null);
  const [optinRefreshing, setOptinRefreshing] = useState(false);

  // Opt-in blast config (message, discount, coupon expiry)
  const [optinConfigOpen, setOptinConfigOpen] = useState(false);
  const [optinMessage, setOptinMessage] = useState("");
  const [optinDiscount, setOptinDiscount] = useState(10);
  const [optinRestaurantName, setOptinRestaurantName] = useState("");
  const [optinExpiryDays, setOptinExpiryDays] = useState(1);
  const [optinExpiryHour, setOptinExpiryHour] = useState("11");
  const [optinExpiryMinute, setOptinExpiryMinute] = useState("00");
  const [optinExpiryAmPm, setOptinExpiryAmPm] = useState("PM");

  // Campaign message config (per-slot editable copy + coupon expiry)
  const [campaignDefaults, setCampaignDefaults] =
    useState<CampaignMessageDefaults | null>(null);
  const [openMessageEditor, setOpenMessageEditor] = useState<number | null>(
    null,
  );
  const [copiedAllToast, setCopiedAllToast] = useState(false);
  const [showReplyPreviews, setShowReplyPreviews] = useState(false);
  const [campaignExpiryDays, setCampaignExpiryDays] = useState(1);
  const [campaignExpiryHour, setCampaignExpiryHour] = useState("11");
  const [campaignExpiryMinute, setCampaignExpiryMinute] = useState("00");
  const [campaignExpiryAmPm, setCampaignExpiryAmPm] = useState("PM");

  // Test sends (opt-in widget + per-slot campaign widget)
  const [optinTestPhone, setOptinTestPhone] = useState("");
  const [optinTestSending, setOptinTestSending] = useState(false);
  const [optinTestStatus, setOptinTestStatus] = useState<string | null>(null);
  const [campaignTestPhone, setCampaignTestPhone] = useState("");
  const [campaignTestClover, setCampaignTestClover] = useState(false);
  const [campaignTestSendingSlot, setCampaignTestSendingSlot] = useState<
    number | null
  >(null);
  const [campaignTestResult, setCampaignTestResult] = useState<{
    slot: number;
    winningAnswer: string;
  } | null>(null);
  const [campaignTestError, setCampaignTestError] = useState<string | null>(
    null,
  );

  const refreshOptinStatus = (id: string) => {
    setOptinRefreshing(true);
    marketingApiFetch<OptinStatus>(
      `/api/marketing/optin-status?restaurant_id=${id}`,
    )
      .then((d) => setOptinStatus(d))
      .catch(() => {})
      .finally(() => setOptinRefreshing(false));
  };

  const getDayTime = (day: string) =>
    `${dayHours[day] ?? "12"}:${dayMinutes[day] ?? "00"} ${dayAmPm[day] ?? "PM"}`;

  // Fetch opted-in customers and menu items on mount
  useEffect(() => {
    // New owners who just finished onboarding have no restaurant_id yet — Belan
    // staff provisions their restaurant afterward. Until then we must NOT fetch
    // anything, otherwise this component would surface another restaurant's data.
    if (!restaurantId) {
      setRosterLoading(false);
      return;
    }
    const id = restaurantId;

    // Opted-in customers
    marketingApiFetch<{ customers: MockCustomer[]; timezone?: string }>(
      `/api/marketing/opted-in-customers?restaurant_id=${id}`,
    )
      .then((d) => {
        const customers = d.customers ?? [];
        setOptedInCustomers(customers);
        setSelectedCustomerIds(
          new Set(customers.map((c: MockCustomer) => c.id)),
        );
        if (d.timezone) setRestaurantTimezone(d.timezone);
      })
      .catch(() => setOptedInCustomers([]))
      .finally(() => setRosterLoading(false));

    // Menu items for prize selection
    setMenuItemsLoading(true);
    const params = new URLSearchParams({ restaurant_id: id, limit: "100" });
    marketingApiFetch<{ items: MarketingMenuItem[] }>(`/api/marketing/items?${params}`)
      .then((d) => setMenuItems(d.items ?? []))
      .catch(() => setMenuItems([]))
      .finally(() => setMenuItemsLoading(false));

    // Opt-in status
    refreshOptinStatus(id);

    // Opt-in blast config — prefill the "Configure message & offer" form
    getOptinConfig(id)
      .then((c) => {
        setOptinMessage(c.message ?? "");
        setOptinDiscount(c.discount_percent ?? 10);
        setOptinRestaurantName(c.restaurant_name ?? "");
        if (c.expiry_days) setOptinExpiryDays(c.expiry_days);
        const t = from24h(c.expiry_time);
        setOptinExpiryHour(t.hour);
        setOptinExpiryMinute(t.minute);
        setOptinExpiryAmPm(t.ampm);
      })
      .catch(() => {});

    // Campaign message config — prefill the wizard's per-game message editors
    // and the coupon-expiry control. On failure the FALLBACK_* templates in
    // games.ts keep the editors usable.
    getCampaignConfig(id)
      .then((c) => {
        setCampaignDefaults(c);
        if (c.expiry_days) setCampaignExpiryDays(c.expiry_days);
        const t = from24h(c.expiry_time);
        setCampaignExpiryHour(t.hour);
        setCampaignExpiryMinute(t.minute);
        setCampaignExpiryAmPm(t.ampm);
      })
      .catch(() => {});

    // Restore an existing active/paused campaign so a page refresh
    // doesn't lose dashboard state.
    marketingApiFetch<{
      campaign: {
        id: string;
        status: "active" | "paused";
        config: CampaignConfig;
      } | null;
    }>(`/api/marketing/campaigns?restaurant_id=${id}`)
      .then((d) => {
        if (d.campaign) {
          setCampaignId(d.campaign.id);
          setLaunchedConfig(d.campaign.config);
          setPagePhase(d.campaign.status === "paused" ? "paused" : "active");
        }
      })
      .catch(() => {});
  }, [restaurantId]);

  // Load real campaign stats whenever we have a campaign
  useEffect(() => {
    if (!campaignId) return;
    marketingApiFetch<CampaignStats>(`/api/marketing/campaigns/${campaignId}/stats`)
      .then((d) =>
        setStats({
          opted_in: d.opted_in ?? 0,
          played: d.played ?? 0,
          redeemed: d.redeemed ?? 0,
          campaign_score: d.campaign_score ?? 0,
          top_customers: d.top_customers ?? [],
          per_game: d.per_game ?? [],
        }),
      )
      .catch(() => setStats(EMPTY_STATS));
  }, [campaignId]);

  const rid = restaurantId;

  const handleScanClover = async () => {
    if (!rid) return;
    setScanLoading(true);
    setScanResult(null);
    setScanError(null);
    try {
      const data = await marketingApiFetch<{ new_customers?: number }>(
        "/api/marketing/scan-clover",
        {
          method: "POST",
          body: JSON.stringify({ restaurant_id: rid }),
        },
      );
      setScanResult({ new_customers: data.new_customers ?? 0 });
    } catch {
      // Surface the failure instead of masking it as "0 new customers /
      // already contacted" — marketingApiFetch throws on any non-OK response.
      setScanError("Scan failed. Check the Clover connection and try again.");
    } finally {
      setScanLoading(false);
    }
  };

  const handleSendBlast = async () => {
    if (!rid) return;
    if (!scanResult || scanResult.new_customers === 0) return;
    setBlastLoading(true);
    try {
      const data = await marketingApiFetch<{ queued?: number }>(
        "/api/marketing/send-optin-blast",
        {
          method: "POST",
          body: JSON.stringify({
            restaurant_id: rid,
            message: optinMessage,
            discount_percent: optinDiscount,
            expiry_days: optinExpiryDays,
            expiry_time: to24h(optinExpiryHour, optinExpiryMinute, optinExpiryAmPm),
          }),
        },
      );
      const queued = data.queued ?? 0;
      setBlastToast(`Queued ${queued} customer${queued !== 1 ? "s" : ""} — texts are sending now.`);
      setScanResult(null);
      // Refresh status
      refreshOptinStatus(rid);
      setTimeout(() => setBlastToast(null), 4000);
    } catch {
      setBlastToast("Something went wrong. Please try again.");
      setTimeout(() => setBlastToast(null), 4000);
    } finally {
      setBlastLoading(false);
    }
  };

  // Rebuild games + prizes when selected days change
  useEffect(() => {
    if (selectedDays.length === 0) {
      setGames([]);
      setPrizes([]);
      return;
    }
    const times: Record<string, string> = {};
    selectedDays.forEach((day) => {
      times[day] = getDayTime(day);
    });
    setGames(buildDefaultGames(selectedDays, times, campaignDefaults));
    setPrizes(buildDefaultPrizes(selectedDays.length));
  }, [selectedDays]); // eslint-disable-line react-hooks/exhaustive-deps

  // If the campaign-config prefill resolves after games were already built,
  // re-seed each slot's messages — but only fields the user hasn't edited
  // (i.e. still equal to the offline fallback they were seeded with).
  useEffect(() => {
    if (!campaignDefaults) return;
    setGames((prev) =>
      prev.map((g) => {
        const fallback = seedMessages(g.type, null);
        const seeded = seedMessages(g.type, campaignDefaults);
        const m = g.messages ?? {};
        return {
          ...g,
          messages: {
            game: !m.game || m.game === fallback.game ? seeded.game : m.game,
            winner:
              !m.winner || m.winner === fallback.winner
                ? seeded.winner
                : m.winner,
            loser:
              !m.loser || m.loser === fallback.loser ? seeded.loser : m.loser,
          },
        };
      }),
    );
  }, [campaignDefaults]);

  const handleDayToggle = (day: ScheduleDay) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      if (prev.length < 2) return [...prev, day];
      return [...prev.slice(1), day];
    });
  };

  const updateGame = (index: number, type: GameType) => {
    setGames((prev) =>
      prev.map((g, i) => {
        if (i !== index) return g;
        // Re-seed messages for the new game type, but keep any the user has
        // edited (no longer equal to the old type's seeds).
        const oldSeed = seedMessages(g.type, campaignDefaults);
        const newSeed = seedMessages(type, campaignDefaults);
        const m = g.messages ?? {};
        const next: GameConfig = {
          ...g,
          type,
          messages: {
            game: !m.game || m.game === oldSeed.game ? newSeed.game : m.game,
            winner:
              !m.winner || m.winner === oldSeed.winner
                ? newSeed.winner
                : m.winner,
            loser:
              !m.loser || m.loser === oldSeed.loser ? newSeed.loser : m.loser,
          },
        };
        // Seed a customizable trivia config the first time a game becomes trivia.
        if (type === "trivia" && !next.trivia) next.trivia = cloneDefaultTrivia();
        return next;
      }),
    );
  };

  const updateGameMessage = (
    index: number,
    key: keyof GameMessages,
    value: string,
  ) => {
    setGames((prev) =>
      prev.map((g, i) =>
        i === index
          ? { ...g, messages: { ...(g.messages ?? {}), [key]: value } }
          : g,
      ),
    );
  };

  // "Copy to all": winner/loser replies copy verbatim; the game text only
  // copies to slots of the SAME game type (a pick-number script would read
  // wrong on trivia) — other types re-seed their own default.
  const copyMessagesToAll = () => {
    setGames((prev) => {
      const first = prev[0];
      if (!first) return prev;
      const fm = { ...seedMessages(first.type, campaignDefaults), ...first.messages };
      return prev.map((g, i) => {
        if (i === 0) return g;
        const seed = seedMessages(g.type, campaignDefaults);
        return {
          ...g,
          messages: {
            game: g.type === first.type ? fm.game : seed.game,
            winner: fm.winner,
            loser: fm.loser,
          },
        };
      });
    });
    setCopiedAllToast(true);
    setTimeout(() => setCopiedAllToast(false), 2500);
  };

  const handleSendTestOptin = async () => {
    if (!restaurantId || !optinTestPhone.trim()) return;
    setOptinTestSending(true);
    setOptinTestStatus(null);
    try {
      await sendTestOptin({
        restaurantId,
        phone: optinTestPhone,
        message: optinMessage,
        discountPercent: optinDiscount,
        expiryDays: optinExpiryDays,
        expiryTime: to24h(optinExpiryHour, optinExpiryMinute, optinExpiryAmPm),
      });
      setOptinTestStatus("Sent! Check your phone — reply YES to get the coupon.");
    } catch {
      setOptinTestStatus("Test failed. Check the number and try again.");
    } finally {
      setOptinTestSending(false);
    }
  };

  const handleSendTestCampaign = async (index: number) => {
    if (!restaurantId || !campaignTestPhone.trim()) return;
    const game = games[index];
    if (!game) return;
    setCampaignTestSendingSlot(index);
    setCampaignTestResult(null);
    setCampaignTestError(null);
    try {
      const res = await sendTestCampaign({
        restaurantId,
        phone: campaignTestPhone,
        gameType: game.type,
        trivia: game.trivia,
        prizeConfig: prizes[index] ?? { type: "percent-off", percent: 10 },
        loserDiscount,
        messages: slotMessages(game),
        expiryDays: campaignExpiryDays,
        expiryTime: to24h(
          campaignExpiryHour,
          campaignExpiryMinute,
          campaignExpiryAmPm,
        ),
        createCloverCoupon: campaignTestClover,
      });
      setCampaignTestResult({ slot: index, winningAnswer: res.winning_answer });
    } catch {
      setCampaignTestError("Test failed. Check the number and try again.");
    } finally {
      setCampaignTestSendingSlot(null);
    }
  };

  const updateTrivia = (
    index: number,
    patch: Partial<Pick<TriviaConfig, "question" | "answer">> & {
      choices?: Partial<TriviaConfig["choices"]>;
    },
  ) => {
    setGames((prev) =>
      prev.map((g, i) => {
        if (i !== index) return g;
        const base = g.trivia ?? cloneDefaultTrivia();
        return {
          ...g,
          trivia: {
            ...base,
            ...patch,
            choices: { ...base.choices, ...(patch.choices ?? {}) },
          },
        };
      }),
    );
  };

  const updatePrizeType = (index: number, type: PrizeType) => {
    setPrizes((prev) => prev.map((p, i) => (i === index ? { type } : p)));
    if (type === "free-item") setOpenMenuDropdown(index);
    else {
      setOpenMenuDropdown(null);
      setMenuItemSearch("");
    }
  };

  const updatePrizePercent = (index: number, value: number) => {
    setPrizes((prev) =>
      prev.map((p, i) => (i === index ? { ...p, percent: value } : p)),
    );
  };

  const selectFreeItem = (index: number, itemName: string) => {
    setPrizes((prev) =>
      prev.map((p, i) => (i === index ? { ...p, itemName } : p)),
    );
    setOpenMenuDropdown(null);
    setMenuItemSearch("");
  };

  const handleNext = () => {
    if (wizardStep < 5)
      setWizardStep((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5);
  };

  const handleBack = () => {
    if (wizardStep > 1)
      setWizardStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5);
  };

  const handleLaunch = async () => {
    if (!restaurantId) return;
    const config: CampaignConfig = {
      selectedDays,
      dayTimes: Object.fromEntries(selectedDays.map((d) => [d, getDayTime(d)])),
      endDate: runIndefinitely ? null : endDate,
      games,
      prizes,
      loserDiscount,
      loserDiscountCap,
      couponExpiryDays: campaignExpiryDays,
      couponExpiryTime: to24h(
        campaignExpiryHour,
        campaignExpiryMinute,
        campaignExpiryAmPm,
      ),
      optedInCount: selectedCustomerIds.size,
      targetCustomerIds: Array.from(selectedCustomerIds),
    };
    setLaunchedConfig(config);
    setPagePhase("active");

    // Persist campaign to backend
    const rid = restaurantId;
    marketingApiFetch<{ campaign_id?: string }>("/api/marketing/campaigns", {
      method: "POST",
      body: JSON.stringify({ restaurant_id: rid, config }),
    })
      .then((d) => {
        if (d.campaign_id) setCampaignId(d.campaign_id);
      })
      .catch((err) => console.error("Failed to persist campaign:", err));
  };

  const filteredRoster = rosterSearch
    ? optedInCustomers.filter(
        (c) =>
          c.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
          c.phone.includes(rosterSearch),
      )
    : optedInCustomers;

  const filteredMenuItems = menuItemSearch
    ? menuItems.filter((m) =>
        m.name.toLowerCase().includes(menuItemSearch.toLowerCase()),
      )
    : menuItems;

  const today = new Date().toISOString().split("T")[0];

  const canProceed = (() => {
    switch (wizardStep) {
      case 2:
        return selectedDays.length >= 1;
      case 4:
        return (
          prizes.every((p) =>
            p.type === "free-item" ? !!p.itemName : (p.percent ?? 0) > 0,
          ) &&
          loserDiscount > 0 &&
          loserDiscountCap > 0
        );
      default:
        return true;
    }
  })();

  // ── Campaign message preview helpers ─────────────────────────────────────
  // Previews and segment counts are computed on the RENDERED message
  // (placeholders substituted), so they match what actually sends.
  const campaignRestaurantName =
    campaignDefaults?.restaurant_name || optinRestaurantName || "Your Restaurant";
  const campaignExpiryText = `valid for ${campaignExpiryDays} day${campaignExpiryDays !== 1 ? "s" : ""}`;

  const gamePreviewVars = (
    g: GameConfig,
    prize?: PrizeConfig,
  ): Record<string, string> => {
    const trivia = g.trivia ?? campaignDefaults?.default_trivia ?? DEFAULT_TRIVIA;
    return {
      restaurant_name: campaignRestaurantName,
      prize: buildPrizeLabel(prize),
      question: trivia.question,
      choices: buildTriviaChoices(trivia),
    };
  };

  const replyPreviewVars = (prize?: PrizeConfig): Record<string, string> => ({
    first_name: "Alex",
    prize: buildPrizeLabel(prize),
    discount: String(loserDiscount),
    code: "WIN-7GK2QX",
    link: "https://belan.tech/prize/WIN-7GK2QX",
    expiry: campaignExpiryText,
  });

  const slotMessages = (g: GameConfig): Required<GameMessages> => ({
    ...seedMessages(g.type, campaignDefaults),
    ...Object.fromEntries(
      Object.entries(g.messages ?? {}).filter(([, v]) => v != null),
    ),
  });

  const renderMessageEditor = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    vars: Record<string, string>,
    placeholders: string,
  ) => {
    const seg = countSegments(renderTemplate(value, vars));
    return (
      <div>
        <p className="section-label mb-1">{label}</p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full bg-slate-50 border border-capy-border rounded-xl px-3 py-2 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green resize-none"
        />
        <div className="flex items-center justify-between gap-2 text-[11px] text-capy-muted mt-1">
          <span className="shrink-0">
            {seg.chars} char{seg.chars !== 1 ? "s" : ""} · {seg.segments} SMS
            segment{seg.segments !== 1 ? "s" : ""} · {seg.encoding}
          </span>
          <span className="font-mono truncate">{placeholders}</span>
        </div>
      </div>
    );
  };

  /* ── Opt-In card ──────────────────────────────────────────────────────────
     Rendered identically on the dashboard and inside the setup wizard, so it
     lives in one helper. Before any blast has gone out it's a scan/send call to
     action; once we've texted anyone (blast_sent > 0) it flips into a progress
     tracker (Sent → Opted In + funnel), with scan/send demoted to a secondary
     "send to new customers" action. */
  const renderOptInCard = (wrapperClassName = "") => {
    const hasBlasted = (optinStatus?.blast_sent ?? 0) > 0;
    const conversion =
      optinStatus && optinStatus.blast_sent > 0
        ? Math.round(
            (optinStatus.blast_opted_in / optinStatus.blast_sent) * 100,
          )
        : 0;
    const newCustomers = scanResult?.new_customers ?? 0;

    // Segment count is computed on the RENDERED message (placeholders substituted),
    // so it matches what actually sends.
    const renderedOptinMessage = optinMessage
      .replace(/\{restaurant_name\}/g, optinRestaurantName)
      .replace(/\{discount\}/g, String(optinDiscount));
    const seg = countSegments(renderedOptinMessage);

    return (
      <div
        className={`bg-white rounded-2xl border border-capy-border shadow-sm p-4 space-y-3 ${wrapperClassName}`}
      >
        {hasBlasted && optinStatus ? (
          /* ── Progress tracker ── */
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="card-heading text-sm">Opt-In Progress</p>
                <p className="text-xs text-capy-muted mt-0.5">
                  How your opt-in blast is converting
                </p>
              </div>
              <button
                onClick={() => rid && refreshOptinStatus(rid)}
                disabled={optinRefreshing}
                title="Refresh"
                className="p-1.5 rounded-lg text-capy-muted hover:text-capy-text hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <svg
                  className={`w-4 h-4 ${optinRefreshing ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>

            {/* Headline stats */}
            <div className="flex items-end justify-between">
              <div>
                <p className="section-label">Sent</p>
                <p
                  className="text-2xl font-bold text-capy-text mt-0.5"
                  style={{ fontFamily: "Tektur, sans-serif" }}
                >
                  {optinStatus.blast_sent.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="section-label">Opted In</p>
                <p
                  className="text-2xl font-bold text-capy-green-dark mt-0.5"
                  style={{ fontFamily: "Tektur, sans-serif" }}
                >
                  {optinStatus.blast_opted_in.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Conversion progress bar */}
            <div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-capy-green rounded-full transition-all"
                  style={{ width: `${conversion}%` }}
                />
              </div>
              <p className="text-xs text-capy-muted mt-1">
                {conversion}% opted in
              </p>
            </div>

            {/* Funnel legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-capy-green" />
                <span className="font-semibold text-capy-text">
                  {optinStatus.blast_opted_in}
                </span>
                <span className="text-capy-muted">opted in</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="font-semibold text-capy-text">
                  {optinStatus.blast_pending}
                </span>
                <span className="text-capy-muted">awaiting reply</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="font-semibold text-capy-text">
                  {optinStatus.blast_opted_out}
                </span>
                <span className="text-capy-muted">declined</span>
              </span>
            </div>
          </>
        ) : (
          /* ── Pre-blast call to action ── */
          <div className="flex items-center justify-between">
            <div>
              <p className="card-heading text-sm">Opt-In Your Customer List</p>
              <p className="text-xs text-capy-muted mt-0.5">
                Send a compliant opt-in invite to your Clover contacts
              </p>
            </div>
            {optinStatus && (
              <div className="flex gap-3 text-xs text-right">
                <div>
                  <p className="font-semibold text-capy-green-dark">
                    {optinStatus.opted_in}
                  </p>
                  <p className="text-capy-muted">opted in</p>
                </div>
                <div>
                  <p className="font-semibold text-amber-600">
                    {optinStatus.pending}
                  </p>
                  <p className="text-capy-muted">pending</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-400">
                    {optinStatus.opted_out}
                  </p>
                  <p className="text-capy-muted">opted out</p>
                </div>
              </div>
            )}
          </div>
        )}

        {optinStatus?.last_scan_at && !scanResult && (
          <p className="text-xs text-capy-muted">
            Last scan:{" "}
            {new Date(optinStatus.last_scan_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        )}
        {scanError && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <span className="font-semibold">!</span>
            <span>{scanError}</span>
          </div>
        )}
        {scanResult !== null && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-capy-green-dark font-semibold">✓</span>
            {newCustomers > 0 ? (
              <span className="text-capy-text">
                {newCustomers} new customer{newCustomers !== 1 ? "s" : ""} ready
                to receive opt-in
              </span>
            ) : (
              <span className="text-capy-muted">
                All Clover customers have already been contacted
              </span>
            )}
          </div>
        )}
        {blastToast && (
          <div className="bg-capy-green-light text-capy-green-dark text-xs font-semibold px-3 py-2 rounded-xl">
            {blastToast}
          </div>
        )}
        {/* ── Configure message & offer ── */}
        <div className="border-t border-capy-border pt-3">
          <button
            onClick={() => setOptinConfigOpen((o) => !o)}
            className="flex items-center justify-between w-full text-xs font-semibold text-capy-text"
          >
            <span>⚙ Configure message &amp; offer</span>
            <svg
              className={`w-3.5 h-3.5 text-capy-muted transition-transform ${optinConfigOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {optinConfigOpen && (
            <div className="space-y-3 mt-3">
              {/* Message */}
              <div>
                <p className="section-label mb-1">Opt-in message</p>
                <textarea
                  value={optinMessage}
                  onChange={(e) => setOptinMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-capy-border rounded-xl px-3 py-2 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green resize-none"
                />
                <div className="flex items-center justify-between text-[11px] text-capy-muted mt-1">
                  <span>
                    {seg.chars} char{seg.chars !== 1 ? "s" : ""} · {seg.segments} SMS
                    segment{seg.segments !== 1 ? "s" : ""} · {seg.encoding}
                  </span>
                  <span className="font-mono">{"{discount}"} {"{restaurant_name}"}</span>
                </div>
              </div>

              {/* Discount */}
              <div className="flex items-center gap-3">
                <p className="section-label">Discount</p>
                <div className="relative w-24">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={optinDiscount}
                    onChange={(e) => setOptinDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-capy-text text-xs focus:outline-none focus:ring-2 focus:ring-capy-green pr-7"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-capy-muted text-xs">
                    %
                  </span>
                </div>
              </div>

              {/* Expiry: N days after opt-in, at a local time */}
              <div>
                <p className="section-label mb-1">Coupon expires</p>
                <div className="flex items-center gap-1.5 flex-wrap text-xs text-capy-text">
                  <select
                    value={optinExpiryDays}
                    onChange={(e) => setOptinExpiryDays(Number(e.target.value))}
                    className="bg-white border border-capy-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-capy-green"
                  >
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span className="text-capy-muted">
                    day{optinExpiryDays !== 1 ? "s" : ""} after opt-in, at
                  </span>
                  <select
                    value={optinExpiryHour}
                    onChange={(e) => setOptinExpiryHour(e.target.value)}
                    className="bg-white border border-capy-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-capy-green"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <option key={h} value={String(h)}>{h}</option>
                    ))}
                  </select>
                  <span className="text-capy-muted">:</span>
                  <select
                    value={optinExpiryMinute}
                    onChange={(e) => setOptinExpiryMinute(e.target.value)}
                    className="bg-white border border-capy-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-capy-green"
                  >
                    {["00", "15", "30", "45"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={optinExpiryAmPm}
                    onChange={(e) => setOptinExpiryAmPm(e.target.value)}
                    className="bg-white border border-capy-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-capy-green"
                  >
                    <option>AM</option>
                    <option>PM</option>
                  </select>
                </div>
              </div>

              {/* Send a test text */}
              <div className="border-t border-capy-border pt-3 space-y-2">
                <p className="section-label">Send a test text</p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={optinTestPhone}
                    onChange={(e) => setOptinTestPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                  />
                  <button
                    onClick={handleSendTestOptin}
                    disabled={optinTestSending || !optinTestPhone.trim()}
                    className="px-4 py-2 rounded-xl bg-capy-text text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
                  >
                    {optinTestSending ? "Sending…" : "Send test"}
                  </button>
                </div>
                <p className="text-[11px] text-capy-muted">
                  Runs the real opt-in flow with the settings above and resets
                  this number&apos;s opt-in state first — use a number you
                  control. Reply YES to get the coupon.
                </p>
                {optinTestStatus && (
                  <div
                    className={`text-xs px-3 py-2 rounded-xl ${
                      optinTestStatus.startsWith("Sent")
                        ? "bg-capy-green-light text-capy-green-dark"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {optinTestStatus}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleScanClover}
            disabled={scanLoading || blastLoading}
            className="flex-1 py-2 px-3 rounded-xl border border-capy-border text-xs font-semibold text-capy-text hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {scanLoading ? "Scanning…" : "Scan Clover"}
          </button>
          {newCustomers > 0 && (
            <button
              onClick={handleSendBlast}
              disabled={blastLoading}
              className="flex-1 py-2 px-3 rounded-xl bg-capy-green text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {blastLoading
                ? "Sending…"
                : hasBlasted
                  ? `Send opt-in to ${newCustomers} new`
                  : `Send ${optinDiscount}% Off Opt-In to ${newCustomers} Customer${newCustomers !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────

  /* ── SETTING UP (no restaurant provisioned yet) ─────────────────────────
     Owners land here right after onboarding, before Belan staff connects
     their restaurant. They have no restaurant_id, so there is nothing to
     show — and we must never fall back to another restaurant's data. */
  if (!restaurantId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md text-center flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-capy-green-light flex items-center justify-center">
            <svg className="w-7 h-7 text-capy-green-dark animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="text-capy-text text-xl font-semibold">We&apos;re setting up your page</h2>
          <p className="text-capy-muted text-sm leading-relaxed">
            Thanks for completing onboarding! Our team is provisioning your restaurant&apos;s
            marketing dashboard and RCS number. This usually takes 1–2 business days — we&apos;ll
            reach out as soon as it&apos;s ready.
          </p>
        </div>
      </div>
    );
  }

  if (pagePhase !== "setup") {
    /* ── DASHBOARD ─────────────────────────────────────────────────── */
    return (
      <div className="p-4 space-y-4">

        {/* Opt-In card (also visible on dashboard) */}
        {renderOptInCard()}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="card-heading text-base">Gamified Campaign</p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  pagePhase === "active"
                    ? "bg-capy-green-light text-capy-green-dark"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {pagePhase === "active" ? "● Active" : "⏸ Paused"}
              </span>
              {launchedConfig && (
                <span className="text-xs text-capy-muted">
                  {launchedConfig.selectedDays.join(", ")} ·{" "}
                  {launchedConfig.optedInCount} opted in
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              const next = pagePhase === "active" ? "paused" : "active";
              setPagePhase(next);
              if (campaignId) {
                marketingApiFetch(`/api/marketing/campaigns/${campaignId}`, {
                  method: "PATCH",
                  body: JSON.stringify({ status: next }),
                }).catch((err) =>
                  console.error("Failed to update campaign status:", err),
                );
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              pagePhase === "active"
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-capy-green text-white hover:opacity-90"
            }`}
            style={{ fontFamily: "Tektur, sans-serif" }}
          >
            {pagePhase === "active" ? "Pause" : "Resume"}
          </button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Opted In", value: stats.opted_in },
            { label: "Played", value: stats.played },
            { label: "Redeemed", value: stats.redeemed },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-capy-border shadow-sm p-4"
            >
              <p className="section-label">{stat.label}</p>
              <p
                className="text-2xl font-bold text-capy-text mt-1"
                style={{ fontFamily: "Tektur, sans-serif" }}
              >
                {stat.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Score card */}
        <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-capy-green-light border-4 border-capy-green flex items-center justify-center shrink-0">
            <span
              className="text-xl font-bold text-capy-green-dark"
              style={{ fontFamily: "Tektur, sans-serif" }}
            >
              {stats.campaign_score}
            </span>
          </div>
          <div className="flex-1">
            <p className="card-heading">Campaign Score</p>
            <p className="text-xs text-capy-muted mt-0.5">
              Redemption rate × return visits
            </p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full bg-capy-green rounded-full"
                style={{ width: `${stats.campaign_score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Top 5 Returning Customers */}
        <div className="bg-white rounded-2xl border border-capy-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-capy-border">
            <p className="card-heading">Top 5 Returning Customers</p>
            <p className="text-xs text-capy-muted mt-0.5">
              Returned within 30 days of redeeming
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {["Rank", "Customer", "Played", "Redeemed", "Returns"].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-4 py-2.5 text-left section-label"
                      >
                        {col}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-capy-border/60">
                {stats.top_customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-xs text-capy-muted"
                    >
                      No plays yet — stats appear after your first game round.
                    </td>
                  </tr>
                ) : (
                  stats.top_customers.map((row) => (
                    <tr
                      key={row.rank}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-2.5">
                        <span
                          className="w-5 h-5 rounded-full bg-capy-text text-white text-xs font-bold flex items-center justify-center"
                          style={{ fontFamily: "Tektur, sans-serif" }}
                        >
                          {row.rank}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-capy-text font-mono">
                        {row.phone}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-capy-text">
                        {row.games_played}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-capy-text">
                        {row.redeemed}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-capy-text">—</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Game Breakdown */}
        <div>
          <p className="card-heading mb-3">Per-Game Breakdown</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(launchedConfig?.games ?? []).map((game, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-capy-border shadow-sm p-4"
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-xl">
                    {GAME_DEFINITIONS[game.type].emoji}
                  </span>
                  <div>
                    <p className="card-heading text-xs">
                      {GAME_DEFINITIONS[game.type].label}
                    </p>
                    <p className="text-xs text-capy-muted">
                      {game.day} at {game.time}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {(() => {
                    const g = aggregatePerGame(stats.per_game, game.type);
                    return [
                      { label: "Sent", value: g.sent },
                      { label: "Played", value: g.played },
                      { label: "Won", value: g.won },
                      { label: "Discounts", value: g.discounts },
                    ];
                  })().map((s) => (
                    <div key={s.label}>
                      <p className="section-label">{s.label}</p>
                      <p
                        className="text-lg font-bold text-capy-text mt-0.5"
                        style={{ fontFamily: "Tektur, sans-serif" }}
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

        {/* Collapsible Settings */}
        <div className="bg-white rounded-2xl border border-capy-border shadow-sm overflow-hidden">
          <button
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
          >
            <p className="card-heading">Campaign Settings</p>
            <svg
              className={`w-4 h-4 text-capy-muted transition-transform duration-200 ${isSettingsExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {isSettingsExpanded && launchedConfig && (
            <div className="px-4 pb-4 border-t border-capy-border space-y-3 pt-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="section-label mb-1.5">Schedule</p>
                {launchedConfig.selectedDays.map((day) => (
                  <p key={day} className="text-xs text-capy-text">
                    {day} at {launchedConfig.dayTimes[day]}
                  </p>
                ))}
                <p className="text-xs text-capy-muted mt-1">
                  {launchedConfig.endDate
                    ? `Ends ${launchedConfig.endDate}`
                    : "Runs indefinitely"}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="section-label mb-1.5">Games & Prizes</p>
                {launchedConfig.games.map((g, i) => (
                  <p key={i} className="text-xs text-capy-text">
                    {GAME_DEFINITIONS[g.type].emoji} {g.day} —{" "}
                    {GAME_DEFINITIONS[g.type].label}
                    <span className="text-capy-muted">
                      {" "}
                      ·{" "}
                      {launchedConfig.prizes[i]?.type === "free-item"
                        ? `Free ${launchedConfig.prizes[i]?.itemName}`
                        : `${launchedConfig.prizes[i]?.percent}% off`}
                    </span>
                  </p>
                ))}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="section-label mb-1">Loser&apos;s Discount</p>
                <p className="text-xs text-capy-text">
                  {launchedConfig.loserDiscount}% off · Cap:{" "}
                  {launchedConfig.loserDiscountCap}
                </p>
              </div>
              <p className="text-xs text-capy-muted italic">
                Settings cannot be edited while a campaign is running.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── SETUP WIZARD ───────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col">

      {/* ── Opt-In card ── */}
      {renderOptInCard("flex-shrink-0 mx-4 mt-4")}

      {/* Wizard header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-capy-border">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="card-heading">Gamified SMS Campaign</p>
            <p className="text-xs text-capy-muted mt-0.5">
              Set up your automated game-based marketing
            </p>
          </div>
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
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      done
                        ? "bg-capy-green text-white"
                        : active
                          ? "bg-capy-text text-white"
                          : "bg-slate-100 text-capy-muted"
                    }`}
                    style={{ fontFamily: "Tektur, sans-serif" }}
                  >
                    {done ? (
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 hidden sm:block ${
                      done
                        ? "text-capy-green-dark"
                        : active
                          ? "text-capy-text font-semibold"
                          : "text-capy-muted"
                    }`}
                    style={{ fontFamily: "Tektur, sans-serif" }}
                  >
                    {step.label}
                  </span>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`h-px flex-1 mx-1.5 mb-3 ${index < wizardStep - 1 ? "bg-capy-green" : "bg-slate-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content — grows with the page (page scrolls at the section level) */}
      <div className="px-4 py-4">
        {/* ── Step 1: Roster ── */}
        {wizardStep === 1 && (
          <div className="space-y-4">
            {/* Opted In */}
            <div className="bg-white rounded-2xl border border-capy-border shadow-sm overflow-hidden">
              {/* Header: title + selected count */}
              <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-capy-border">
                <p className="card-heading">Opted In</p>
                <span className="text-xs font-semibold text-capy-green-dark bg-capy-green-light px-2.5 py-1 rounded-full">
                  {selectedCustomerIds.size} / {optedInCustomers.length}{" "}
                  selected
                </span>
              </div>

              {/* Select all / Deselect all */}
              {!rosterLoading && optedInCustomers.length > 0 && (
                <div
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-capy-border cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    const allSelected =
                      selectedCustomerIds.size === optedInCustomers.length;
                    setSelectedCustomerIds(
                      allSelected
                        ? new Set()
                        : new Set(optedInCustomers.map((c) => c.id)),
                    );
                  }}
                >
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                      selectedCustomerIds.size === optedInCustomers.length
                        ? "bg-capy-green border-capy-green"
                        : selectedCustomerIds.size > 0
                          ? "bg-capy-green/30 border-capy-green"
                          : "border-capy-border bg-white"
                    }`}
                  >
                    {selectedCustomerIds.size === optedInCustomers.length ? (
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : selectedCustomerIds.size > 0 ? (
                      <div className="w-2 h-0.5 bg-capy-green rounded" />
                    ) : null}
                  </div>
                  <span className="text-sm font-medium text-capy-text">
                    {selectedCustomerIds.size === optedInCustomers.length
                      ? "Deselect all"
                      : "Select all"}
                  </span>
                </div>
              )}

              {/* Search */}
              <div className="px-4 py-2.5 border-b border-capy-border">
                <div className="flex items-center gap-2 bg-slate-50 border border-capy-border rounded-xl px-3 py-2">
                  <svg
                    className="w-3.5 h-3.5 text-capy-muted flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="flex-1 bg-transparent text-sm text-capy-text placeholder:text-capy-muted outline-none"
                  />
                </div>
              </div>

              {/* Customer list */}
              <div className="max-h-52 overflow-y-auto">
                {rosterLoading ? (
                  <p className="text-xs text-capy-muted text-center py-6">
                    Loading customers…
                  </p>
                ) : filteredRoster.length === 0 ? (
                  <p className="text-xs text-capy-muted text-center py-6">
                    {rosterSearch
                      ? `No results for "${rosterSearch}"`
                      : "No opted-in customers yet"}
                  </p>
                ) : (
                  filteredRoster.map((customer) => {
                    const isChecked = selectedCustomerIds.has(customer.id);
                    return (
                      <div
                        key={customer.id}
                        className="flex items-center gap-3 px-4 py-3 border-b border-capy-border/60 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() =>
                          setSelectedCustomerIds((prev) => {
                            const next = new Set(prev);
                            isChecked
                              ? next.delete(customer.id)
                              : next.add(customer.id);
                            return next;
                          })
                        }
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isChecked
                              ? "bg-capy-green border-capy-green"
                              : "border-capy-border bg-white"
                          }`}
                        >
                          {isChecked && (
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-capy-text truncate">
                            {customer.name}
                          </p>
                          <p className="text-xs text-capy-muted font-mono">
                            {customer.phone}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {selectedCustomerIds.size === 0 && !rosterLoading && (
              <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                <svg
                  className="w-4 h-4 text-amber-600 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                <p className="text-sm text-amber-700">
                  No opted-in customers yet — you can still launch.
                </p>
              </div>
            )}

            {/* Not Opted In */}
            <div className="bg-white rounded-2xl border border-capy-border shadow-sm px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="card-heading text-capy-muted">Not Opted In</p>
                <p className="text-xs text-capy-muted mt-0.5">
                  Will receive an opt-in SMS automatically
                </p>
              </div>
              <span className="text-xs font-semibold text-capy-muted bg-slate-100 px-2.5 py-1 rounded-full">
                {optinStatus?.pending ?? 0} customers
              </span>
            </div>
          </div>
        )}

        {/* ── Step 2: Schedule ── */}
        {wizardStep === 2 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4">
              <p className="section-label mb-3">Send Days (max 2)</p>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => handleDayToggle(day)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                        isSelected
                          ? "border-capy-green bg-capy-green-light text-capy-green-dark"
                          : "border-capy-border text-capy-muted hover:border-capy-green hover:text-capy-green-dark"
                      }`}
                      style={{ fontFamily: "Tektur, sans-serif" }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
              {selectedDays.length === 2 && (
                <p className="text-xs text-capy-muted mt-2">
                  Selecting another replaces the first
                </p>
              )}
            </div>

            {selectedDays.length > 0 && (
              <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="section-label">Send Times</p>
                  <span className="text-xs text-capy-muted bg-slate-100 px-2.5 py-1 rounded-full">
                    🕐{" "}
                    {(() => {
                      try {
                        const abbr =
                          new Intl.DateTimeFormat("en-US", {
                            timeZone: restaurantTimezone,
                            timeZoneName: "short",
                          })
                            .formatToParts(new Date())
                            .find((p) => p.type === "timeZoneName")?.value ??
                          restaurantTimezone;
                        return `${abbr} · ${restaurantTimezone}`;
                      } catch {
                        return restaurantTimezone;
                      }
                    })()}
                  </span>
                </div>
                {selectedDays.map((day) => (
                  <div
                    key={day}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                  >
                    <span
                      className="w-8 text-xs font-bold text-capy-text"
                      style={{ fontFamily: "Tektur, sans-serif" }}
                    >
                      {day}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={dayHours[day] ?? "12"}
                        onChange={(e) =>
                          setDayHours((prev) => ({
                            ...prev,
                            [day]: e.target.value,
                          }))
                        }
                        className="bg-white border border-capy-border rounded-lg px-2 py-1 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (h) => (
                            <option key={h} value={String(h)}>
                              {h}
                            </option>
                          ),
                        )}
                      </select>
                      <span className="text-xs text-capy-muted">:</span>
                      <select
                        value={dayMinutes[day] ?? "00"}
                        onChange={(e) =>
                          setDayMinutes((prev) => ({
                            ...prev,
                            [day]: e.target.value,
                          }))
                        }
                        className="bg-white border border-capy-border rounded-lg px-2 py-1 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                      >
                        {Array.from({ length: 60 }, (_, i) =>
                          String(i).padStart(2, "0"),
                        ).map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <select
                        value={dayAmPm[day] ?? "PM"}
                        onChange={(e) =>
                          setDayAmPm((prev) => ({
                            ...prev,
                            [day]: e.target.value,
                          }))
                        }
                        className="bg-white border border-capy-border rounded-lg px-2 py-1 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                      >
                        <option>AM</option>
                        <option>PM</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4">
              <p className="section-label mb-3">Duration</p>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                {["Run indefinitely", "Set end date"].map((opt, i) => {
                  const active = i === 0 ? runIndefinitely : !runIndefinitely;
                  return (
                    <button
                      key={opt}
                      onClick={() => setRunIndefinitely(i === 0)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        active
                          ? "bg-white text-capy-text shadow-sm"
                          : "text-capy-muted"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {!runIndefinitely && (
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={today}
                  className="mt-3 px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                />
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Games ── */}
        {wizardStep === 3 && (
          <div className="space-y-3">
            <p className="text-xs text-capy-muted">
              One game per send day — swap any you&apos;d like
            </p>
            {games.length === 0 ? (
              <p className="text-xs text-capy-muted py-6 text-center">
                Go back and select at least one send day
              </p>
            ) : (
              games.map((game, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-capy-border shadow-sm overflow-hidden"
                >
                  <div className="flex items-start justify-between p-4">
                    <div className="flex-1 min-w-0">
                      <p className="section-label mb-1.5">
                        Game {i + 1} — {game.day} at {getDayTime(game.day)}
                      </p>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xl">
                          {GAME_DEFINITIONS[game.type].emoji}
                        </span>
                        <span
                          className="font-semibold text-capy-text text-sm"
                          style={{ fontFamily: "Tektur, sans-serif" }}
                        >
                          {GAME_DEFINITIONS[game.type].label}
                        </span>
                      </div>
                      <p className="text-xs text-capy-muted italic leading-relaxed whitespace-pre-line">
                        &ldquo;
                        {renderTemplate(
                          slotMessages(game).game,
                          gamePreviewVars(game, prizes[i]),
                        )}
                        &rdquo;
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setOpenGamePicker(openGamePicker === i ? null : i)
                      }
                      className="ml-3 px-3 py-1.5 text-xs font-medium rounded-lg border border-capy-border text-capy-muted hover:border-capy-green hover:text-capy-green-dark transition-all shrink-0"
                    >
                      Change
                    </button>
                  </div>
                  {openGamePicker === i && (
                    <div className="px-4 pb-4 border-t border-capy-border pt-3">
                      <p className="text-xs text-capy-muted mb-2 font-medium">
                        Select a game type:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(GAME_DEFINITIONS) as GameType[]).map(
                          (type) => (
                            <button
                              key={type}
                              onClick={() => {
                                updateGame(i, type);
                                setOpenGamePicker(null);
                              }}
                              className={`p-3 rounded-xl border-2 text-left transition-all ${
                                game.type === type
                                  ? "border-capy-green bg-capy-green-light"
                                  : "border-capy-border hover:border-capy-green"
                              }`}
                            >
                              <span className="text-lg">
                                {GAME_DEFINITIONS[type].emoji}
                              </span>
                              <p
                                className="text-xs font-semibold text-capy-text mt-1"
                                style={{ fontFamily: "Tektur, sans-serif" }}
                              >
                                {GAME_DEFINITIONS[type].label}
                              </p>
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                  {game.type === "trivia" && (
                    <div className="px-4 pb-4 border-t border-capy-border pt-3 space-y-2">
                      <p className="section-label">Customize Trivia</p>
                      <input
                        type="text"
                        value={(game.trivia ?? DEFAULT_TRIVIA).question}
                        onChange={(e) =>
                          updateTrivia(i, { question: e.target.value })
                        }
                        placeholder="Trivia question"
                        className="w-full px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                      />
                      {(["A", "B", "C"] as const).map((letter) => (
                        <div key={letter} className="flex items-center gap-2">
                          <span className="w-4 text-xs font-semibold text-capy-muted shrink-0">
                            {letter})
                          </span>
                          <input
                            type="text"
                            value={
                              (game.trivia ?? DEFAULT_TRIVIA).choices[letter]
                            }
                            onChange={(e) =>
                              updateTrivia(i, {
                                choices: { [letter]: e.target.value },
                              })
                            }
                            placeholder={`Choice ${letter}`}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                          />
                        </div>
                      ))}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs font-medium text-capy-text">
                          Winning answer:
                        </span>
                        {(["A", "B", "C"] as const).map((letter) => (
                          <button
                            key={letter}
                            onClick={() => updateTrivia(i, { answer: letter })}
                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                              (game.trivia ?? DEFAULT_TRIVIA).answer === letter
                                ? "bg-capy-green text-white"
                                : "border border-capy-border text-capy-muted hover:border-capy-green hover:text-capy-green-dark"
                            }`}
                          >
                            {letter}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* ── Customize messages (game text + winner/loser replies) ── */}
                  <div className="px-4 pb-4 border-t border-capy-border pt-3">
                    <button
                      onClick={() =>
                        setOpenMessageEditor(openMessageEditor === i ? null : i)
                      }
                      className="flex items-center justify-between w-full text-xs font-semibold text-capy-text"
                    >
                      <span>⚙ Customize messages</span>
                      <svg
                        className={`w-3.5 h-3.5 text-capy-muted transition-transform ${openMessageEditor === i ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {openMessageEditor === i && (
                      <div className="space-y-3 mt-3">
                        {renderMessageEditor(
                          "Game text",
                          slotMessages(game).game,
                          (v) => updateGameMessage(i, "game", v),
                          gamePreviewVars(game, prizes[i]),
                          game.type === "trivia"
                            ? "{restaurant_name} {prize} {question} {choices}"
                            : "{restaurant_name} {prize}",
                        )}
                        {renderMessageEditor(
                          "Winner reply",
                          slotMessages(game).winner,
                          (v) => updateGameMessage(i, "winner", v),
                          replyPreviewVars(prizes[i]),
                          "{first_name} {prize} {code} {link} {expiry}",
                        )}
                        {renderMessageEditor(
                          "Loser reply",
                          slotMessages(game).loser,
                          (v) => updateGameMessage(i, "loser", v),
                          replyPreviewVars(prizes[i]),
                          "{first_name} {discount} {code} {link} {expiry}",
                        )}
                        {i === 0 && games.length > 1 && (
                          <button
                            onClick={copyMessagesToAll}
                            className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                              copiedAllToast
                                ? "border-capy-green/30 bg-capy-green-light text-capy-green-dark"
                                : "border-capy-border text-capy-text hover:bg-slate-50"
                            }`}
                          >
                            {copiedAllToast
                              ? "Applied to all games ✓"
                              : "Copy these messages to all games"}
                          </button>
                        )}

                        {/* Send a test round */}
                        <div className="border-t border-capy-border pt-3 space-y-2">
                          <p className="section-label">Send a test round</p>
                          <div className="flex gap-2">
                            <input
                              type="tel"
                              value={campaignTestPhone}
                              onChange={(e) => setCampaignTestPhone(e.target.value)}
                              placeholder="(555) 123-4567"
                              className="flex-1 px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                            />
                            <button
                              onClick={() => handleSendTestCampaign(i)}
                              disabled={
                                campaignTestSendingSlot !== null ||
                                !campaignTestPhone.trim()
                              }
                              className="px-4 py-2 rounded-xl bg-capy-text text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
                            >
                              {campaignTestSendingSlot === i
                                ? "Sending…"
                                : "Send test"}
                            </button>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-capy-text">
                            <input
                              type="checkbox"
                              checked={campaignTestClover}
                              onChange={(e) =>
                                setCampaignTestClover(e.target.checked)
                              }
                              className="w-3.5 h-3.5 accent-capy-green"
                            />
                            Create real coupon in Clover when redeemed
                          </label>
                          <p className="text-[11px] text-capy-muted">
                            Texts you this game for real — reply to get the
                            winner or loser message with a working coupon (test
                            coupons last 3 minutes).
                          </p>
                          {campaignTestResult?.slot === i && (
                            <div className="bg-capy-green-light text-capy-green-dark text-xs px-3 py-2 rounded-xl">
                              Sent! Winning answer:{" "}
                              <span className="font-bold">
                                {campaignTestResult.winningAnswer}
                              </span>{" "}
                              — reply with it to test the winner text; anything
                              else gets the loser text.
                            </div>
                          )}
                          {campaignTestError && (
                            <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl">
                              {campaignTestError}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Step 4: Prizes ── */}
        {wizardStep === 4 && (
          <div className="space-y-3">
            <p className="text-xs text-capy-muted">
              One prize per game, plus a consolation for everyone else
            </p>
            {prizes.map((prize, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-capy-border shadow-sm p-4"
              >
                <p className="section-label mb-3">
                  Game {i + 1} Prize — {games[i]?.day ?? ""}
                </p>
                <div className="flex items-center gap-4 mb-3">
                  {(["percent-off", "free-item"] as PrizeType[]).map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={prize.type === type}
                        onChange={() => updatePrizeType(i, type)}
                        className="w-3.5 h-3.5 accent-capy-green"
                      />
                      <span className="text-xs text-capy-text font-medium">
                        {type === "percent-off" ? "% Off" : "Free Item"}
                      </span>
                    </label>
                  ))}
                </div>
                {prize.type === "percent-off" ? (
                  <div className="relative w-32">
                    <input
                      type="number"
                      value={prize.percent ?? ""}
                      onChange={(e) =>
                        updatePrizePercent(i, Number(e.target.value))
                      }
                      min={1}
                      max={100}
                      placeholder="20"
                      className="w-full px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-capy-text text-xs focus:outline-none focus:ring-2 focus:ring-capy-green pr-7"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-capy-muted text-xs">
                      %
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={openMenuDropdown === i ? menuItemSearch : ""}
                      onChange={(e) => {
                        setMenuItemSearch(e.target.value);
                        setOpenMenuDropdown(i);
                      }}
                      onFocus={() => {
                        if (!prize.itemName) setOpenMenuDropdown(i);
                      }}
                      placeholder={prize.itemName || "Search menu items..."}
                      className="w-full px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-capy-text text-xs focus:outline-none focus:ring-2 focus:ring-capy-green"
                    />
                    {prize.itemName && openMenuDropdown !== i && (
                      <div className="flex items-center justify-between mt-1.5 px-3 py-1.5 bg-capy-green-light border border-capy-green/30 rounded-lg">
                        <span className="text-xs text-capy-green-dark font-medium">
                          {prize.itemName}
                        </span>
                        <button
                          onClick={() =>
                            setPrizes((prev) =>
                              prev.map((p, idx) =>
                                idx === i ? { ...p, itemName: undefined } : p,
                              ),
                            )
                          }
                        >
                          <svg
                            className="w-3 h-3 text-capy-green-dark"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                    {openMenuDropdown === i && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-capy-border rounded-xl shadow-lg z-10 max-h-36 overflow-y-auto">
                        {menuItemsLoading ? (
                          <p className="p-3 text-center text-xs text-capy-muted">
                            Loading...
                          </p>
                        ) : filteredMenuItems.length === 0 ? (
                          <p className="p-3 text-center text-xs text-capy-muted">
                            No items found
                          </p>
                        ) : (
                          filteredMenuItems.slice(0, 20).map((item) => (
                            <button
                              key={item.clover_id}
                              onClick={() => selectFreeItem(i, item.name)}
                              className="w-full text-left px-3 py-2 text-xs text-capy-text hover:bg-capy-green-light border-b border-capy-border/60 last:border-0 transition-colors"
                            >
                              <span className="font-medium">{item.name}</span>
                              {item.category && (
                                <span className="text-capy-muted ml-1.5">
                                  {item.category}
                                </span>
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
            <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4">
              <p className="card-heading mb-0.5">Loser&apos;s Discount</p>
              <p className="text-xs text-capy-muted mb-3">
                Given to every non-winner. After the cap, losers get a
                &ldquo;Sorry&rdquo; message.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="section-label mb-1.5">Discount</p>
                  <div className="relative">
                    <input
                      type="number"
                      value={loserDiscount}
                      onChange={(e) => setLoserDiscount(Number(e.target.value))}
                      min={1}
                      max={100}
                      className="w-full px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-capy-text text-xs focus:outline-none focus:ring-2 focus:ring-capy-green pr-7"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-capy-muted text-xs">
                      %
                    </span>
                  </div>
                </div>
                <div>
                  <p className="section-label mb-1.5">Max Redemptions</p>
                  <input
                    type="number"
                    value={loserDiscountCap}
                    onChange={(e) =>
                      setLoserDiscountCap(Number(e.target.value))
                    }
                    min={1}
                    className="w-full px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-capy-text text-xs focus:outline-none focus:ring-2 focus:ring-capy-green"
                  />
                </div>
              </div>
            </div>

            {/* Coupon Expiry */}
            <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4">
              <p className="card-heading mb-0.5">Coupon Expiry</p>
              <p className="text-xs text-capy-muted mb-3">
                Applies to winner and loser coupons — restaurant local time.
              </p>
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-capy-text">
                <select
                  value={campaignExpiryDays}
                  onChange={(e) => setCampaignExpiryDays(Number(e.target.value))}
                  className="bg-white border border-capy-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-capy-green"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <span className="text-capy-muted">
                  day{campaignExpiryDays !== 1 ? "s" : ""} after playing, at
                </span>
                <select
                  value={campaignExpiryHour}
                  onChange={(e) => setCampaignExpiryHour(e.target.value)}
                  className="bg-white border border-capy-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-capy-green"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={String(h)}>{h}</option>
                  ))}
                </select>
                <span className="text-capy-muted">:</span>
                <select
                  value={campaignExpiryMinute}
                  onChange={(e) => setCampaignExpiryMinute(e.target.value)}
                  className="bg-white border border-capy-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-capy-green"
                >
                  {["00", "15", "30", "45"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={campaignExpiryAmPm}
                  onChange={(e) => setCampaignExpiryAmPm(e.target.value)}
                  className="bg-white border border-capy-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-capy-green"
                >
                  <option>AM</option>
                  <option>PM</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Review ── */}
        {wizardStep === 5 && (
          <div className="space-y-3">
            <p className="text-xs text-capy-muted">
              Review your settings before going live
            </p>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-capy-border">
              <p className="section-label mb-1.5">Schedule</p>
              {selectedDays.map((day) => (
                <p key={day} className="text-xs text-capy-text">
                  {day} at {getDayTime(day)}
                </p>
              ))}
              <p className="text-xs text-capy-muted mt-1">
                {runIndefinitely
                  ? "Runs indefinitely"
                  : `Ends ${endDate || "—"}`}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-capy-border">
              <p className="section-label mb-1.5">Games</p>
              {games.map((g, i) => (
                <p key={i} className="text-xs text-capy-text">
                  {GAME_DEFINITIONS[g.type].emoji} {g.day} —{" "}
                  {GAME_DEFINITIONS[g.type].label}
                </p>
              ))}
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-capy-border">
              <p className="section-label mb-1.5">Prizes</p>
              {prizes.map((p, i) => (
                <p key={i} className="text-xs text-capy-text">
                  Game {i + 1}:{" "}
                  {p.type === "free-item"
                    ? `Free ${p.itemName}`
                    : `${p.percent}% off`}
                </p>
              ))}
              <p className="text-xs text-capy-muted mt-1">
                Loser&apos;s discount: {loserDiscount}% off (cap:{" "}
                {loserDiscountCap})
              </p>
              <p className="text-xs text-capy-muted mt-1">
                Coupons expire {campaignExpiryDays} day
                {campaignExpiryDays !== 1 ? "s" : ""} after playing at{" "}
                {campaignExpiryHour}:{campaignExpiryMinute} {campaignExpiryAmPm}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-capy-border">
              <p className="section-label mb-1">Customers</p>
              <p className="text-xs text-capy-text">
                {selectedCustomerIds.size} of {optedInCustomers.length} opted-in
                customers selected
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-capy-border">
              <p className="section-label mb-1.5">Message Preview</p>
              <p className="text-xs text-capy-muted mb-3">
                This is the first message your customers will receive once the
                campaign starts. Each week&apos;s game and prize may vary.
              </p>
              <div className="space-y-3">
                {games.map((g, i) => {
                  const preview = renderTemplate(
                    slotMessages(g).game,
                    gamePreviewVars(g, prizes[i]),
                  );
                  return (
                    <div
                      key={i}
                      style={{
                        animation: `fadeInUp 0.3s ease-out ${i * 0.08}s both`,
                      }}
                    >
                      <p className="section-label text-capy-muted mb-1.5">
                        {g.day} · {getDayTime(g.day)}
                      </p>
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-capy-green flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span
                            className="text-white text-xs font-bold"
                            style={{ fontFamily: "Tektur, sans-serif" }}
                          >
                            T
                          </span>
                        </div>
                        <div className="bg-white border border-capy-border rounded-2xl rounded-tl-sm px-3 py-2.5 max-w-[85%] shadow-sm">
                          <p className="text-xs text-capy-text leading-relaxed whitespace-pre-line">
                            {preview}
                          </p>
                        </div>
                      </div>
                      {showReplyPreviews && (
                        <div className="mt-2 ml-9 space-y-1.5">
                          {(["winner", "loser"] as const).map((kind) => (
                            <div key={kind} className="flex items-start gap-2">
                              <span className="section-label text-capy-muted w-11 shrink-0 mt-1.5">
                                {kind === "winner" ? "Win" : "Lose"}
                              </span>
                              <div className="bg-white border border-capy-border rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%] shadow-sm">
                                <p className="text-xs text-capy-text leading-relaxed whitespace-pre-line">
                                  {renderTemplate(
                                    slotMessages(g)[kind],
                                    replyPreviewVars(prizes[i]),
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setShowReplyPreviews((s) => !s)}
                className="mt-3 text-xs font-semibold text-capy-green-dark hover:underline"
              >
                {showReplyPreviews
                  ? "Hide reply previews"
                  : "Show win/lose reply previews"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wizard footer navigation */}
      <div className="sticky bottom-0 z-10 px-4 py-4 border-t border-capy-border flex items-center justify-between bg-white">
        <button
          onClick={handleBack}
          disabled={wizardStep === 1}
          className="px-4 py-2 text-sm text-capy-muted hover:text-capy-text transition-colors font-medium disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        {wizardStep < 5 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="px-5 py-2.5 bg-capy-text text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ fontFamily: "Tektur, sans-serif" }}
          >
            Continue
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleLaunch}
            className="px-5 py-2.5 bg-capy-green hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity flex items-center gap-2"
            style={{ fontFamily: "Tektur, sans-serif" }}
          >
            🚀 Launch Campaign
          </button>
        )}
      </div>
    </div>
  );
}
