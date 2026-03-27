'use client';

import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/notifications/NotificationBell';

interface DashboardHeaderProps {
  title: string;
  showBackButton?: boolean;
  backUrl?: string;
  children?: React.ReactNode;
}

export default function DashboardHeader({
  title,
  showBackButton = false,
  backUrl = '/dashboard',
  children
}: Readonly<DashboardHeaderProps>) {
  const router = useRouter();

  return (
    <header className="bg-white border-b border-[#D0C5B2]/20 px-6 py-4 flex items-center gap-4">
      {/* Left: back button + title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {showBackButton && (
          <button
            onClick={() => router.push(backUrl)}
            className="p-1.5 rounded-lg text-[#6B6A65] hover:bg-[#F5F4F0] transition-colors flex-shrink-0"
            aria-label="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-bold tracking-tight text-[#1B1C1A] truncate">{title}</h1>
      </div>

      {/* Center: extra content (optional) */}
      {children && (
        <div className="flex-1 flex justify-center hidden lg:flex">
          {children}
        </div>
      )}

      {/* Right: notifications */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <NotificationBell />
      </div>
    </header>
  );
}