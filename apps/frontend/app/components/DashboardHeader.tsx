'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileMenu } from './hooks/useProfileMenu';

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
}: DashboardHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isOpen: showProfileMenu, toggle: toggleProfileMenu, close: closeProfileMenu, menuRef } = useProfileMenu();

  if (!user) return null;

  return (
    <header className="bg-navy-900 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button
                onClick={() => router.push(backUrl)}
                className="rounded-lg bg-navy-800 p-2 text-white hover:bg-navy-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
                title="Back"
                aria-label="Go back to previous page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {title}
            </h1>
          </div>

          {/* Additional content (buttons, etc.) */}
          {children && (
            <div className="flex-1 flex justify-center">
              {children}
            </div>
          )}

          {/* Right Section: Notifications + Profile */}
          <div className="flex items-center gap-4">
            <NotificationBell />

            {/* Profile Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={toggleProfileMenu}
                className="flex items-center gap-3 rounded-lg bg-navy-800 px-4 py-2 text-sm font-medium text-white hover:bg-navy-700 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-navy-900 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center text-navy-900 font-bold text-sm">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <span className="text-gold-400">{user.firstName} {user.lastName}</span>
                <svg
                  className={`w-4 h-4 text-gold-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-xl border border-stone-200 py-2 z-20 animate-slideDown">
                  <a
                    href="/dashboard/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-navy-900 hover:bg-stone-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-navy-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">My Profile</span>
                  </a>
                  <div className="border-t border-stone-200 my-1" />
                  <button
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
