'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Mock AI responses based on common queries
const generateAIResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('sales') || lowerMessage.includes('sold')) {
    if (lowerMessage.includes('fatty') || lowerMessage.includes('patty') || lowerMessage.includes('patties')) {
      return `Based on the data from the past 3 days, Fatty Patties had approximately 127 orders with total revenue of $1,905. There's been a 8.4% increase compared to the previous period. Peak sales occurred during lunch hours (12-2pm).`;
    }
    if (lowerMessage.includes('burger') || lowerMessage.includes('cheeseburger')) {
      return `Your Classic Cheeseburger is performing excellently with 342 orders generating $4,104 in revenue. It's trending up by 12.5%.`;
    }
    return `Sales are looking strong. Your top performers are the Classic Cheeseburger (342 orders, $4,104) and Crispy French Fries (456 orders, $2,052). Overall revenue is trending upward.`;
  }

  if (lowerMessage.includes('stock') || lowerMessage.includes('inventory') || lowerMessage.includes('cheese')) {
    if (lowerMessage.includes('cheese')) {
      return `For Tuesday's discounted sale, I recommend stocking up on:\n\nCheese: ~50-60 lbs (expect 30-40% increase in cheeseburger orders)\nBurger buns: 200-250 units\nLettuce & tomatoes: Double your usual Tuesday amount\n\nBased on historical data, discount days typically see a 35% spike in orders.`;
    }
    return `Based on current sales velocity, here are my stocking recommendations:\n\nHigh priority: Burger patties (65% of orders), cheese (60% of items), fries\nMedium priority: Bacon, BBQ sauce, lettuce\nConsider: Milkshake supplies are trending up 6.7%`;
  }

  if (lowerMessage.includes('trend') || lowerMessage.includes('growing') || lowerMessage.includes('popular')) {
    return `Trending items:\n\nGrowing:\nCrispy French Fries (+15.2%)\nClassic Cheeseburger (+12.5%)\nChocolate Milkshake (+6.7%)\n\nDeclining:\nBBQ Bacon Burger (-3.1%)\n\nConsider promoting the BBQ Bacon Burger or running a combo deal to boost its performance.`;
  }

  if (lowerMessage.includes('revenue') || lowerMessage.includes('money') || lowerMessage.includes('earning')) {
    return `Your revenue is strong with an average order value of $52.80. This represents a 8.7% increase from the previous period.`;
  }

  if (lowerMessage.includes('busy') || lowerMessage.includes('peak') || lowerMessage.includes('hour')) {
    return `Peak hours:\n\nBusiest: 12:00 PM - 2:00 PM (lunch rush)\nSecond peak: 6:00 PM - 8:00 PM (dinner)\nQuietest: 2:00 PM - 5:00 PM\n\nAverage orders per hour during peak: ~25-30 orders`;
  }

  return `I can help you analyze your restaurant data. Try asking:\n\n"What are my best-selling items?"\n"How much inventory should I stock for the weekend?"\n"What are my peak hours?"\n"Show me revenue trends"\n"Which items are declining in sales?"`;
};

const recommendations = [
  "What are my best-selling items?",
  "How much inventory should I stock for the weekend?",
  "What are my peak hours?",
  "Show me revenue trends"
];

export function FloatingChatbot({ restaurantName = "Burger Palace" }: { restaurantName?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [searchBarFadingOut, setSearchBarFadingOut] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isExpanded && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isTyping, isExpanded]);

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

    // Fade out search bar first
    setSearchBarFadingOut(true);

    setTimeout(() => {
      setShowSearchBar(false);
      setSearchBarFadingOut(false);
    }, 300); // Match fade animation duration

    // Wait for fade out animation before expanding
    setTimeout(() => {
      setIsExpanded(true);

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setIsTyping(true);

      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: generateAIResponse(text),
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 600 + Math.random() * 400);
    }, showRecommendations ? 200 : 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    // Wait for animation to complete before hiding
    setTimeout(() => {
      setIsExpanded(false);
      setIsClosing(false);
      // Fade in search bar after overlay closes
      setTimeout(() => {
        setShowSearchBar(true);
      }, 100);
    }, 400); // Match animation duration
  };

  const handleInputFocus = () => {
    if (!isExpanded) {
      setShowRecommendations(true);
    }
  };

  const handleInputBlur = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setShowRecommendations(false);
      setIsAnimatingOut(false);
    }, 300);
  };

  const handleRecommendationClick = (question: string) => {
    setShowRecommendations(false);
    setIsAnimatingOut(false);

    // Fade out search bar first
    setSearchBarFadingOut(true);

    setTimeout(() => {
      setShowSearchBar(false);
      setSearchBarFadingOut(false);
    }, 300);

    setTimeout(() => {
      setIsExpanded(true);

      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: question,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);

      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: generateAIResponse(question),
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 600 + Math.random() * 400);
    }, 200);
  };

  return (
    <>
      {/* Full-screen overlay when expanded */}
      {isExpanded && (
        <>
          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div
              className={`w-full max-w-3xl h-[80vh] bg-white dark:bg-gray-900 rounded-3xl pointer-events-auto ${
                isClosing ? 'animate-shrinkToBottom' : 'animate-slideUp'
              }`}
              style={{
                boxShadow: '0 0 40px rgba(0, 0, 0, 0.2), 0 0 80px rgba(0, 0, 0, 0.1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/30 dark:border-white/5">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Data Assistant
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-full transition-all"
                  aria-label="Close chat"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="h-[calc(100%-180px)] overflow-y-auto p-6 space-y-4">
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

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }} />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1s' }} />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-6 border-t border-gray-200/30 dark:border-white/5">
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Ask me anything about ${restaurantName}`}
                    disabled={isTyping}
                    className="w-full h-14 pl-5 pr-14 bg-gray-50/50 dark:bg-gray-800/50 border-0 rounded-xl text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-700 transition-all disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Floating search bar at bottom */}
      <AnimatePresence>
        {!isExpanded && !isDismissed && (showSearchBar || searchBarFadingOut) && (
          <motion.div
            key="searchbar"
            className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: '30vw', scale: 0.15, transition: { duration: 0.4, ease: [0.32, 0, 0.67, 0] } }}
          >
          <div className="w-full max-w-2xl pointer-events-auto">
            <div className="relative">
              {/* Recommendations */}
              {(showRecommendations || isAnimatingOut) && (
                <div
                  className={`absolute bottom-full left-0 right-0 mb-3 z-10 transition-all duration-300 ease-in-out ${
                    isAnimatingOut ? 'animate-slideDown' : 'animate-slideUp'
                  }`}
                >
                  <div className="flex gap-2 flex-wrap">
                    {recommendations.map((rec, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecommendationClick(rec)}
                        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                        style={{ boxShadow: '0 0 15px rgba(0, 0, 0, 0.1)' }}
                      >
                        {rec}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search input */}
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
                  className="w-full h-14 pl-5 pr-28 bg-white dark:bg-gray-800 text-[15px] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all"
                  style={{ boxShadow: '0 0 30px rgba(0, 0, 0, 0.25), 0 0 60px rgba(0, 0, 0, 0.15)' }}
                />
                {/* Send button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
                {/* Dismiss button */}
                <button
                  onClick={() => setIsDismissed(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  aria-label="Dismiss chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed circle bubble */}
      <AnimatePresence>
        {isDismissed && !isExpanded && (
          <motion.button
            key="bubble"
            onClick={() => setIsDismissed(false)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 20, delay: 0.25 } }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }}
            aria-label="Open chat"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
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

        @keyframes shrinkToBottom {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(40vh) scale(0.1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-fadeOut {
          animation: fadeOut 0.3s ease-out forwards;
        }

        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }

        .animate-shrinkToBottom {
          animation: shrinkToBottom 0.4s cubic-bezier(0.32, 0, 0.67, 0) forwards;
        }

        .animate-fadeInSearch {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .animate-fadeOutSearch {
          animation: fadeOut 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}
