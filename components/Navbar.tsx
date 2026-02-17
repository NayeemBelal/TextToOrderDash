'use client';

import { useState } from 'react';
import { useTheme } from '@/lib/useTheme';
import { SideMenu } from './SideMenu';

interface NavbarProps {
  onSignOut?: () => void;
}

export function Navbar({ onSignOut }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo (Mobile Only) */}
            <div className="flex items-center lg:hidden">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  TextToOrder
                </h1>
              </div>
            </div>

            {/* Right side - Hamburger Menu (Mobile Only) */}
            <div className="flex items-center lg:hidden">
              {/* Hamburger Menu */}
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                aria-label="Open menu"
              >
                <svg
                  className="h-6 w-6 text-gray-600 dark:text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Side Menu */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
