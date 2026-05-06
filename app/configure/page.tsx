'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch, type RestaurantConfig } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AIGreetingCard } from '@/components/voice/AIGreetingCard';
import { BrandSnapshotCard } from '@/components/voice/BrandSnapshotCard';
import { FAQEditor } from '@/components/voice/FAQEditor';
import { UpsellRuleEditor } from '@/components/voice/UpsellRuleEditor';
import { ForwardingCard } from '@/components/voice/ForwardingCard';
import { TextToOrderCard } from '@/components/voice/TextToOrderCard';
import { MenuItemsCard } from '@/components/voice/MenuItemsCard';

const SUB_TABS = [
  { key: 'configure', label: 'Configure' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'upsells', label: 'Upsells' },
] as const;

type TabKey = typeof SUB_TABS[number]['key'];

function SubNav({ activeTab, setActiveTab }: { activeTab: TabKey; setActiveTab: (t: TabKey) => void }) {
  const [hoverState, setHoverState] = useState<Record<string, 'hovering' | 'leaving' | null>>({});

  return (
    <div className="flex items-center gap-1 flex-shrink-0 px-4">
      {SUB_TABS.map((tab) => {
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

export default function ConfigurePage() {
  const { restaurantId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('configure');
  const [config, setConfig] = useState<RestaurantConfig | null>(null);

  const fetchConfig = useCallback(() => {
    if (!restaurantId) return;
    apiFetch<RestaurantConfig>(`/api/restaurant?restaurant_id=${restaurantId}`)
      .then(setConfig)
      .catch(() => {});
  }, [restaurantId]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleBrandSave = async (data: { name?: string; description?: string; address?: string; website?: string }) => {
    await apiFetch(`/api/restaurant/brand?restaurant_id=${restaurantId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    fetchConfig();
  };

  const handleGreetingSave = async (data: { aiGreeting?: string; aiVoiceId?: string }) => {
    await apiFetch(`/api/restaurant/greeting?restaurant_id=${restaurantId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    fetchConfig();
  };

  const handleForwardingSave = async (data: { forwardingNumber: string }) => {
    await apiFetch(`/api/restaurant/forwarding?restaurant_id=${restaurantId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    fetchConfig();
  };

  const handleSmsToggle = async (enabled: boolean) => {
    await apiFetch(`/api/restaurant/sms-toggle?restaurant_id=${restaurantId}`, {
      method: 'PATCH',
      body: JSON.stringify({ smsOrderingEnabled: enabled }),
    });
    fetchConfig();
  };

  return (
    <div className="h-full flex flex-col">
      <SubNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'configure' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3">
          {/* Menu Items + Brand & AI Greeting: side-by-side on md+, stacked on mobile */}
          <div className="flex flex-col md:flex-row gap-3 flex-shrink-0 md:h-[75vh]">
            <div className="h-[75vh] md:h-full md:flex-1 md:min-w-0">
              <MenuItemsCard />
            </div>
            <div className="md:flex-1 md:min-w-0 flex flex-col gap-3">
              <div className="md:flex-1 md:min-h-0">
                <BrandSnapshotCard config={config} onSave={handleBrandSave} />
              </div>
              <div className="md:flex-1 md:min-h-0">
                <AIGreetingCard config={config} onSave={handleGreetingSave} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ForwardingCard config={config} onSave={handleForwardingSave} />
            <TextToOrderCard
              initialEnabled={config?.smsOrderingEnabled ?? true}
              onToggle={handleSmsToggle}
            />
          </div>
        </div>
      )}

      {activeTab === 'faqs' && (
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <FAQEditor />
        </div>
      )}

      {activeTab === 'upsells' && (
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <UpsellRuleEditor />
        </div>
      )}
    </div>
  );
}
