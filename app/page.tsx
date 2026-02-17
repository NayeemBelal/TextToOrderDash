'use client';

import { Navbar, RevenueDashboard, Sidebar } from '@/components';

export default function Home() {
  const handleSignOut = () => {
    console.log('Sign out clicked');
    // TODO: Implement sign out logic
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar onSignOut={handleSignOut} />
        <main>
          <RevenueDashboard />
        </main>
      </div>
    </div>
  );
}
