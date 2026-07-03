'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { VoiceRevenueCard } from "@/components/voice/VoiceRevenueCard";
import { IncomingCallsCard } from "@/components/voice/IncomingCallsCard";
import { VoiceAnalyticsTab } from "@/components/voice/VoiceAnalyticsTab";
import { GamifiedMarketingTab } from "@/components/voice/GamifiedMarketingTab";
import { SalesAITab } from "@/components/voice/SalesAITab";
import { useAuth } from '@/lib/auth-context';
import { type SubscriptionKey } from '@/lib/subscriptions';

const SUB_TABS = [
  { key: 'manage', label: 'Manage' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'sales-ai', label: 'Sales AI' },
  { key: 'marketing', label: 'Marketing' },
] as const;

type TabKey = typeof SUB_TABS[number]['key'];

// Which subscription each sub-tab requires.
const TAB_SUBSCRIPTION: Record<TabKey, SubscriptionKey> = {
  manage: 'ordering',
  analytics: 'ordering',
  'sales-ai': 'ordering',
  marketing: 'marketing',
};

type SubTab = typeof SUB_TABS[number];

function SubNav({ tabs, activeTab, setActiveTab }: { tabs: readonly SubTab[]; activeTab: TabKey; setActiveTab: (t: TabKey) => void }) {
  const [hoverState, setHoverState] = useState<Record<string, 'hovering' | 'leaving' | null>>({});

  return (
    <div className="flex items-center gap-1 flex-shrink-0 px-4">
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        const hover = hoverState[tab.key];
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            onMouseEnter={() => setHoverState((s) => ({ ...s, [tab.key]: 'hovering' }))}
            onMouseLeave={() => setHoverState((s) => ({ ...s, [tab.key]: 'leaving' }))}
            className={`nav-tab-bar relative px-4 pt-2 pb-1.5 text-sm transition-colors duration-150 -mb-px ${
              active
                ? 'nav-tab-active text-capy-text font-semibold'
                : hover === 'hovering'
                ? 'nav-tab-hovering text-capy-text'
                : hover === 'leaving'
                ? 'nav-tab-leaving text-capy-muted'
                : 'text-capy-muted'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function HomePageInner() {
  const searchParams = useSearchParams();
  const { subscriptions, isLoading } = useAuth();

  const allowedTabs = SUB_TABS.filter((t) =>
    subscriptions.includes(TAB_SUBSCRIPTION[t.key]),
  );

  const requestedTab = searchParams.get('tab') as TabKey | null;
  const [selectedTab, setSelectedTab] = useState<TabKey | null>(requestedTab);

  // The active tab must always be one the user is allowed to see: honor the
  // selection (from ?tab= or a click) only if allowed, else the first allowed.
  const activeTab: TabKey | null =
    selectedTab && allowedTabs.some((t) => t.key === selectedTab)
      ? selectedTab
      : allowedTabs[0]?.key ?? null;

  if (isLoading) return <div className="h-full" />;

  if (allowedTabs.length === 0 || activeTab === null) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h2 className="text-capy-text text-xl font-semibold mb-2">No active subscriptions</h2>
          <p className="text-capy-muted text-sm leading-relaxed">
            Your account doesn&apos;t have any active products yet. Contact the Belan
            team to get set up with ordering or marketing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <SubNav tabs={allowedTabs} activeTab={activeTab} setActiveTab={setSelectedTab} />

      {activeTab === 'manage' && (
        <div className="flex-1 min-h-0 p-4 gap-3 flex flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          <div className="h-[60vh] flex-shrink-0 md:h-auto md:flex-1 md:min-h-0">
            <VoiceRevenueCard />
          </div>
          <div className="h-[60vh] flex-shrink-0 md:h-auto md:w-[380px] md:flex-shrink-0 md:min-h-0">
            <IncomingCallsCard />
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <VoiceAnalyticsTab />
        </div>
      )}

      {activeTab === 'sales-ai' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <SalesAITab />
        </div>
      )}

      {activeTab === 'marketing' && (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <GamifiedMarketingTab />
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomePageInner />
    </Suspense>
  );
}
