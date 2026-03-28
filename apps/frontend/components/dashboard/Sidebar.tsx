'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);
const GridIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const EmployeesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);
const ClientsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const InvoiceIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);
const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <GridIcon /> },
  { label: 'Projects', href: '/dashboard/projects', icon: <FolderIcon /> },
  { label: 'Clients', href: '/dashboard/admin/users', icon: <ClientsIcon />, roles: [Role.ADMIN] },
  { label: 'Employees', href: '/dashboard/admin/employees', icon: <EmployeesIcon />, roles: [Role.ADMIN] },
  { label: 'Invoices', href: '/dashboard/admin/invoices', icon: <InvoiceIcon />, roles: [Role.ADMIN] },
  { label: 'Invoices', href: '/dashboard/client/invoices', icon: <InvoiceIcon />, roles: [Role.CLIENT] },
];

function NavLink({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick?: () => void }) {
  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'text-[#C9A84C] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:bg-[#C9A84C] before:rounded-r-full'
          : 'text-[#8A8A84] hover:text-[#C9A84C] hover:bg-white/5'
      }`}
    >
      <span className={isActive ? 'text-[#C9A84C]' : 'text-[#5A5A54]'}>{item.icon}</span>
      {item.label}
    </Link>
  );
}

interface SidebarContentProps {
  visibleNavItems: NavItem[];
  pathname: string;
  onMobileClose: () => void;
  onLogout: () => void;
  userInitials: string;
  userFullName: string;
  userRoleLabel: string;
}

function SidebarContent({
  visibleNavItems,
  pathname,
  onMobileClose,
  onLogout,
  userInitials,
  userFullName,
  userRoleLabel,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full bg-[#0F0F0D]">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#755B00] to-[#C9A84C] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-xs tracking-tight">AD</span>
        </div>
        <span className="text-white font-bold text-sm tracking-wide">Align Designs</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#3A3A34]">Menu</p>
        {visibleNavItems.map(item => (
          <NavLink key={item.href + item.label} item={item} pathname={pathname} onClick={onMobileClose} />
        ))}
      </nav>

      {/* Bottom: Profile + Logout */}
      <div className="border-t border-white/5 p-3 space-y-0.5">
        <NavLink
          item={{ label: 'My Profile', href: '/dashboard/profile', icon: <ProfileIcon /> }}
          pathname={pathname}
          onClick={onMobileClose}
        />
        <button
          onClick={onLogout}
          className="w-full relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#8A8A84] hover:text-red-400 hover:bg-white/5 transition-colors"
        >
          <span className="text-[#5A5A54]"><LogoutIcon /></span>
          Log out
        </button>

        {/* User info */}
        <div className="mt-3 px-3 py-2.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#755B00] to-[#C9A84C] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="text-[#C9C9C4] text-xs font-medium truncate">{userFullName}</p>
            <p className="text-[#3A3A34] text-[10px] uppercase tracking-widest">{userRoleLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();

  if (!user) return null;

  const visibleNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user.role);
  });

  const handleLogout = async () => {
    onMobileClose();
    await logout();
    router.push('/login');
  };

  const contentProps: SidebarContentProps = {
    visibleNavItems,
    pathname,
    onMobileClose,
    onLogout: handleLogout,
    userInitials: `${user.firstName[0]}${user.lastName[0]}`,
    userFullName: `${user.firstName} ${user.lastName}`,
    userRoleLabel: isAdmin ? 'Admin' : user.role.toLowerCase(),
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0 h-screen sticky top-0">
        <SidebarContent {...contentProps} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-[#0F0F0D]/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onMobileClose}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-[240px] z-50 lg:hidden flex flex-col shadow-2xl">
            <SidebarContent {...contentProps} />
          </aside>
        </>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-[#6B6A65] hover:bg-[#F5F4F0] transition-colors"
      aria-label="Open menu"
    >
      <MenuIcon />
    </button>
  );
}
