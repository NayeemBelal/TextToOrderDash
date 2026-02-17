'use client';

import { useState, useRef, useEffect } from 'react';
import { TimeFilterValue } from './RevenueDashboard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIDataChatbotProps {
  activeFilter: TimeFilterValue;
  isLoading?: boolean;
  restaurantName?: string;
}

// Mock AI responses based on common queries
const generateAIResponse = (userMessage: string, filter: TimeFilterValue): string => {
  const lowerMessage = userMessage.toLowerCase();

  // Sales queries
  if (lowerMessage.includes('sales') || lowerMessage.includes('sold')) {
    if (lowerMessage.includes('fatty') || lowerMessage.includes('patty') || lowerMessage.includes('patties')) {
      return `Based on the data from the past 3 days, Fatty Patties had approximately 127 orders with total revenue of $1,905. There's been a 8.4% increase compared to the previous period. Peak sales occurred during lunch hours (12-2pm).`;
    }
    if (lowerMessage.includes('burger') || lowerMessage.includes('cheeseburger')) {
      return `Your Classic Cheeseburger is performing excellently with 342 orders generating $4,104 in revenue ${getTimePeriodText(filter)}. It's trending up by 12.5%.`;
    }
    return `Sales are looking strong ${getTimePeriodText(filter)}. Your top performers are the Classic Cheeseburger (342 orders, $4,104) and Crispy French Fries (456 orders, $2,052). Overall revenue is trending upward.`;
  }

  // Inventory/stocking queries
  if (lowerMessage.includes('stock') || lowerMessage.includes('inventory') || lowerMessage.includes('cheese')) {
    if (lowerMessage.includes('cheese')) {
      return `For Tuesday's discounted sale, I recommend stocking up on:\n\nCheese: ~50-60 lbs (expect 30-40% increase in cheeseburger orders)\nBurger buns: 200-250 units\nLettuce & tomatoes: Double your usual Tuesday amount\n\nBased on historical data, discount days typically see a 35% spike in orders. Your cheese-heavy items (Classic Cheeseburger, Bacon Deluxe) account for 60% of sales.`;
    }
    return `Based on current sales velocity, here are my stocking recommendations:\n\nHigh priority: Burger patties (65% of orders), cheese (60% of items), fries\nMedium priority: Bacon, BBQ sauce, lettuce\nConsider: Milkshake supplies are trending up 6.7%`;
  }

  // Trend queries
  if (lowerMessage.includes('trend') || lowerMessage.includes('growing') || lowerMessage.includes('popular')) {
    return `Trending items ${getTimePeriodText(filter)}:\n\nGrowing:\nCrispy French Fries (+15.2%)\nClassic Cheeseburger (+12.5%)\nChocolate Milkshake (+6.7%)\n\nDeclining:\nBBQ Bacon Burger (-3.1%)\n\nConsider promoting the BBQ Bacon Burger or running a combo deal to boost its performance.`;
  }

  // Revenue queries
  if (lowerMessage.includes('revenue') || lowerMessage.includes('money') || lowerMessage.includes('earning')) {
    return `Your revenue ${getTimePeriodText(filter)} is $${formatNumber(calculateTotalRevenue(filter))} with an average order value of $52.80. This represents a 8.7% increase from the previous period.`;
  }

  // Time-saving queries
  if (lowerMessage.includes('time') || lowerMessage.includes('save') || lowerMessage.includes('productivity')) {
    const timeSaved = calculateTimeSaved(filter);
    return `The AI order system has saved approximately ${timeSaved} of phone time ${getTimePeriodText(filter)}. That's time your staff can spend on food quality, customer service, and other high-value tasks.`;
  }

  // Peak hours
  if (lowerMessage.includes('busy') || lowerMessage.includes('peak') || lowerMessage.includes('hour')) {
    return `Peak hours ${getTimePeriodText(filter)}:\n\nBusiest: 12:00 PM - 2:00 PM (lunch rush)\nSecond peak: 6:00 PM - 8:00 PM (dinner)\nQuietest: 2:00 PM - 5:00 PM\n\nAverage orders per hour during peak: ~25-30 orders`;
  }

  // Default helpful response
  return `I can help you analyze your restaurant data. Try asking:\n\n"What are my best-selling items?"\n"How much inventory should I stock for the weekend?"\n"What are my peak hours?"\n"Show me revenue trends"\n"Which items are declining in sales?"`;
};

const getTimePeriodText = (filter: TimeFilterValue): string => {
  switch (filter) {
    case '1h': return 'in the past hour';
    case '24h': return 'today';
    case '1w': return 'this week';
    case '1m': return 'this month';
    default: return 'this period';
  }
};

const calculateTotalRevenue = (filter: TimeFilterValue): number => {
  switch (filter) {
    case '1h': return 890;
    case '24h': return 14238;
    case '1w': return 89562;
    case '1m': return 342850;
    default: return 14238;
  }
};

const calculateTimeSaved = (filter: TimeFilterValue): string => {
  switch (filter) {
    case '1h': return '48 minutes';
    case '24h': return '5.7 hours';
    case '1w': return '39.7 hours';
    case '1m': return '170 hours';
    default: return '5.7 hours';
  }
};

const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

export function AIDataChatbot({ activeFilter, isLoading = false, restaurantName = "your data" }: AIDataChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Scroll page to chat input when first expanded
  useEffect(() => {
    if (isExpanded && containerRef.current) {
      // Smooth scroll the container into view so user can see the input
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isExpanded]);

  // Scroll chat messages internally (not the page)
  useEffect(() => {
    if (isExpanded && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text) return;

    // Hide recommendations with animation
    if (showRecommendations) {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setShowRecommendations(false);
        setIsAnimatingOut(false);
      }, 300);
    }

    // Wait for fade out animation before expanding
    setTimeout(() => {
      // Expand on first message
      if (!isExpanded) {
        setIsExpanded(true);
      }

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);

      // Simulate AI thinking delay
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: generateAIResponse(text, activeFilter),
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 600 + Math.random() * 400);
    }, 200); // Wait for recommendations to fade out
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMinimize = () => {
    setIsExpanded(false);
  };

  const handleInputFocus = () => {
    if (!isExpanded) {
      setShowRecommendations(true);
    }
  };

  const handleInputBlur = () => {
    // Trigger exit animation
    setIsAnimatingOut(true);
    // Remove after animation completes
    setTimeout(() => {
      setShowRecommendations(false);
      setIsAnimatingOut(false);
    }, 300); // Match animation duration
  };

  const handleRecommendationClick = (question: string) => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setShowRecommendations(false);
      setIsAnimatingOut(false);
    }, 300);

    // Wait for fade out animation before expanding
    setTimeout(() => {
      if (!isExpanded) {
        setIsExpanded(true);
      }

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: question,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);

      // Simulate AI thinking delay
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: generateAIResponse(question, activeFilter),
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 600 + Math.random() * 400);
    }, 200);
  };

  if (isLoading) {
    return (
      <div className="w-full mt-6">
        <div className="h-14 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  const recommendations = [
    "What are my best-selling items?",
    "How much inventory should I stock for the weekend?",
    "What are my peak hours?",
    "Show me revenue trends"
  ];

  return (
    <div
      ref={containerRef}
      className="w-full mt-6 relative transition-all duration-500 ease-in-out"
      style={{
        maxHeight: isExpanded ? '600px' : '60px',
      }}
    >
      {/* Recommendations - appears above input when focused */}
      {(showRecommendations || isAnimatingOut) && !isExpanded && (
        <div
          className={`absolute bottom-full left-0 right-0 mb-3 transition-all duration-300 ease-in-out ${
            isAnimatingOut ? 'animate-slideDown' : 'animate-slideUp'
          }`}
        >
          <div className="flex gap-2 flex-wrap">
            {recommendations.map((rec, index) => (
              <button
                key={index}
                onClick={() => handleRecommendationClick(rec)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                style={{
                  boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)'
                }}
              >
                {rec}
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(10px);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>

      <div
        className={`transition-all duration-500 ease-in-out ${
          isExpanded
            ? 'bg-white dark:bg-gray-900 rounded-2xl'
            : 'bg-transparent'
        }`}
        style={isExpanded ? {
          boxShadow: '0 0 30px rgba(0, 0, 0, 0.15), 0 0 60px rgba(0, 0, 0, 0.08)'
        } : undefined}
      >
        {/* Messages - Only visible when expanded */}
        <div
          className="overflow-hidden transition-all duration-500 ease-in-out"
          style={{
            maxHeight: isExpanded ? '480px' : '0px',
            opacity: isExpanded ? 1 : 0,
          }}
        >
          {/* Minimize button - appears when expanded */}
          {isExpanded && (
            <div className="flex justify-end p-3 pb-0">
              <button
                onClick={handleMinimize}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-full"
                aria-label="Minimize chat"
                title="Minimize"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}

          <div ref={messagesContainerRef} className="h-[440px] overflow-y-auto px-6 pb-6 pt-2 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                      : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100'
                  }`}
                >
                  <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl px-4 py-3">
                  <div className="flex gap-1.5">
                    <div
                      className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms', animationDuration: '1s' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: '200ms', animationDuration: '1s' }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: '400ms', animationDuration: '1s' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`${isExpanded ? 'border-t border-gray-200/30 dark:border-white/5' : ''} transition-all duration-500 ease-in-out`}>
          <div className="p-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={`Ask me anything about ${restaurantName}`}
                disabled={isTyping}
                className={`w-full h-12 pl-5 pr-12 text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all disabled:opacity-50 ${
                  isExpanded
                    ? 'bg-gray-50/50 dark:bg-gray-800/50 border-0 rounded-xl focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700'
                    : 'bg-white dark:bg-gray-800 border-0 rounded-full focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600'
                }`}
                style={!isExpanded ? {
                  boxShadow: '0 0 20px rgba(0, 0, 0, 0.2), 0 0 40px rgba(0, 0, 0, 0.12)'
                } : undefined}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                aria-label="Send message"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
