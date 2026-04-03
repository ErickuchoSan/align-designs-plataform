'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import BottomTabNav from '@/components/dashboard/BottomTabNav';

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen bg-[#F5F4F0] overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar mobileOpen={false} onMobileClose={() => {}} />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <main id="main-content" className="flex-1 overflow-y-auto lg:pb-0 pb-16">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab navigation */}
      <BottomTabNav />
    </div>
  );
}