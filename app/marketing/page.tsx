'use client';

import { useState } from 'react';
import { Navbar, Sidebar } from '@/components';

type CampaignStep = 'select-item' | 'details' | 'discount' | 'targeting' | 'review';

interface Campaign {
  id: string;
  itemName: string;
  description: string;
  discount?: number;
  targeting: 'all' | 'targeted';
  sent: number;
  orders: number;
  readRate: number;
  status: 'active' | 'completed' | 'draft';
  createdAt: Date;
}

// Mock data for existing campaigns
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    itemName: 'Classic Cheeseburger',
    description: 'Our signature burger with fresh ingredients',
    discount: 15,
    targeting: 'targeted',
    sent: 342,
    orders: 127,
    readRate: 78,
    status: 'completed',
    createdAt: new Date('2026-02-10'),
  },
  {
    id: '2',
    itemName: 'BBQ Bacon Burger',
    description: 'Smoky BBQ sauce with crispy bacon',
    discount: 20,
    targeting: 'all',
    sent: 856,
    orders: 234,
    readRate: 65,
    status: 'active',
    createdAt: new Date('2026-02-14'),
  },
];

export default function MarketingPage() {
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [currentStep, setCurrentStep] = useState<CampaignStep>('select-item');
  const [selectedItem, setSelectedItem] = useState('');
  const [description, setDescription] = useState('');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState('');
  const [targeting, setTargeting] = useState<'all' | 'targeted'>('all');

  const handleSignOut = () => {
    console.log('Sign out clicked');
  };

  const menuItems = [
    'Classic Cheeseburger',
    'Bacon Deluxe Burger',
    'Crispy French Fries',
    'BBQ Bacon Burger',
    'Chocolate Milkshake',
  ];

  const steps: { id: CampaignStep; label: string }[] = [
    { id: 'select-item', label: 'Select Item' },
    { id: 'details', label: 'Details' },
    { id: 'discount', label: 'Discount' },
    { id: 'targeting', label: 'Targeting' },
    { id: 'review', label: 'Review' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleLaunchCampaign = () => {
    // TODO: Implement campaign launch
    console.log('Launching campaign...');
    setShowCreateFlow(false);
    // Reset form
    setCurrentStep('select-item');
    setSelectedItem('');
    setDescription('');
    setHasDiscount(false);
    setDiscountValue('');
    setTargeting('all');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar onSignOut={handleSignOut} />
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pb-32">
          {!showCreateFlow ? (
            <>
              {/* Header */}
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Marketing Campaigns
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Create targeted SMS campaigns to promote your menu items
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateFlow(true)}
                  className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-all shadow-sm"
                >
                  Create Campaign
                </button>
              </div>

              {/* Campaigns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockCampaigns.map((campaign, index) => (
                  <div
                    key={campaign.id}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-all duration-300"
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                    }}
                  >
                    {/* Campaign Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {campaign.itemName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {campaign.description}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          campaign.status === 'active'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : campaign.status === 'completed'
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>

                    {/* Discount Badge */}
                    {campaign.discount && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium mb-4">
                        {campaign.discount}% off
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Sent</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                          {campaign.sent}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Orders</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                          {campaign.orders}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Read Rate</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                          {campaign.readRate}%
                        </p>
                      </div>
                    </div>

                    {/* Targeting Info */}
                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {campaign.targeting === 'all' ? 'All customers' : 'Targeted audience'}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Create Campaign Flow */
            <div className="max-w-3xl mx-auto">
              {/* Progress Steps */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setShowCreateFlow(false)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Create Campaign
                  </h2>
                  <div className="w-5" /> {/* Spacer */}
                </div>

                {/* Step Indicators */}
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                            index <= currentStepIndex
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="text-xs mt-2 text-gray-600 dark:text-gray-400 hidden sm:block">
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mx-2 transition-all duration-300 ${
                            index < currentStepIndex
                              ? 'bg-gray-900 dark:bg-white'
                              : 'bg-gray-200 dark:bg-gray-800'
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Content */}
              <div
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 min-h-[400px]"
                style={{
                  animation: 'fadeInScale 0.3s ease-out',
                }}
              >
                {currentStep === 'select-item' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Select an item to promote
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Choose which menu item you want to create a campaign for
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {menuItems.map((item, index) => (
                        <button
                          key={item}
                          onClick={() => setSelectedItem(item)}
                          className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                            selectedItem === item
                              ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                              : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                          style={{
                            animation: `fadeInRight 0.3s ease-out ${index * 0.05}s both`,
                          }}
                        >
                          <span className="text-gray-900 dark:text-white font-medium">{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 'details' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Campaign details
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Add a description to make your campaign more appealing
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="e.g., Our juiciest burger with fresh ingredients and special sauce"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700 transition-all resize-none"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 'discount' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Discount settings
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Offer a discount to increase conversion
                      </p>
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasDiscount}
                          onChange={(e) => setHasDiscount(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 dark:border-gray-700"
                        />
                        <span className="text-gray-900 dark:text-white font-medium">
                          Include a discount
                        </span>
                      </label>

                      {hasDiscount && (
                        <div
                          style={{
                            animation: 'fadeInScale 0.3s ease-out',
                          }}
                        >
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Discount percentage
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={discountValue}
                              onChange={(e) => setDiscountValue(e.target.value)}
                              placeholder="15"
                              min="0"
                              max="100"
                              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700 transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                              %
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 'targeting' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Target audience
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Choose who should receive this campaign
                      </p>
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => setTargeting('all')}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          targeting === 'all'
                            ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                            : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">All customers</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Send to everyone in your customer base
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => setTargeting('targeted')}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          targeting === 'targeted'
                            ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-800'
                            : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <svg className="w-5 h-5 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Targeted audience</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              AI will select customers likely to enjoy this item
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {currentStep === 'review' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Review campaign
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Make sure everything looks good before launching
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Item</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedItem}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                        <p className="text-gray-900 dark:text-white">{description || 'No description'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Discount</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {hasDiscount && discountValue ? `${discountValue}% off` : 'No discount'}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Targeting</p>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">{targeting} customers</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={handleBack}
                  disabled={currentStepIndex === 0}
                  className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  Back
                </button>

                {currentStepIndex < steps.length - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={
                      (currentStep === 'select-item' && !selectedItem) ||
                      (currentStep === 'details' && !description)
                    }
                    className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleLaunchCampaign}
                    className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:opacity-90 transition-all shadow-sm"
                  >
                    Launch Campaign
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
