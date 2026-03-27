'use client';

import { useState } from 'react';
import Sidebar, { MobileMenuButton } from '@/components/dashboard/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F5F4F0] overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile top strip */}
        <div className="lg:hidden flex items-center px-4 py-3 bg-[#0F0F0D]">
          <MobileMenuButton onClick={() => setMobileOpen(true)} />
          <div className="ml-3 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-[#755B00] to-[#C9A84C] flex items-center justify-center">
              <span className="text-white font-black text-[8px]">AD</span>
            </div>
            <span className="text-white font-bold text-sm">Align Designs</span>
          </div>
        </div>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}