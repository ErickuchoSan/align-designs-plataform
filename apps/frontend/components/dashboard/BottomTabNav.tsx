'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';

const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const FolderIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);
const InvoiceIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const ClientsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const ProfileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default function BottomTabNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === Role.ADMIN;

  const tabs = isAdmin
    ? [
        { label: 'Home', href: '/dashboard', icon: <HomeIcon /> },
        { label: 'Projects', href: '/dashboard/projects', icon: <FolderIcon /> },
        { label: 'Clients', href: '/dashboard/admin/clients', icon: <ClientsIcon /> },
        { label: 'Invoices', href: '/dashboard/admin/invoices', icon: <InvoiceIcon /> },
        { label: 'Profile', href: '/dashboard/profile', icon: <ProfileIcon /> },
      ]
    : [
        { label: 'Home', href: '/dashboard', icon: <HomeIcon /> },
        { label: 'Projects', href: '/dashboard/projects', icon: <FolderIcon /> },
        { label: 'Invoices', href: '/dashboard/client/invoices', icon: <InvoiceIcon /> },
        { label: 'Profile', href: '/dashboard/profile', icon: <ProfileIcon /> },
      ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#D0C5B2]/15 z-30 safe-area-pb">
      <div className="flex items-stretch">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                isActive ? 'text-[#C9A84C]' : 'text-[#8A8A84]'
              }`}
            >
              {tab.icon}
              <span className={`text-[9px] font-semibold uppercase tracking-widest ${isActive ? 'text-[#C9A84C]' : 'text-[#8A8A84]'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
