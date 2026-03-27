'use client';

import { memo } from 'react';

type TabType = 'clients' | 'employees';

interface UsersTabsProps {
  activeTab: TabType;
  clientCount: number;
  employeeCount: number;
  onTabChange: (tab: TabType) => void;
  onCreateUser: () => void;
}

function UsersTabs({
  activeTab,
  clientCount,
  employeeCount,
  onTabChange,
  onCreateUser,
}: Readonly<UsersTabsProps>) {
  return (
    <div className="mb-6 flex items-center justify-between border-b border-[#D0C5B2]/20">
      <nav className="-mb-px flex space-x-6" aria-label="Tabs">
        <button
          onClick={() => onTabChange('clients')}
          className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
            activeTab === 'clients'
              ? 'border-[#C9A84C] text-[#C9A84C]'
              : 'border-transparent text-[#6B6A65] hover:text-[#1B1C1A] hover:border-[#D0C5B2]'
          }`}
        >
          Clients ({clientCount})
        </button>
        <button
          onClick={() => onTabChange('employees')}
          className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
            activeTab === 'employees'
              ? 'border-[#C9A84C] text-[#C9A84C]'
              : 'border-transparent text-[#6B6A65] hover:text-[#1B1C1A] hover:border-[#D0C5B2]'
          }`}
        >
          Employees ({employeeCount})
        </button>
      </nav>

      <div className="py-2">
        <button
          onClick={onCreateUser}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white text-sm font-semibold hover:brightness-95 transition-all"
        >
          + New {activeTab === 'clients' ? 'Client' : 'Employee'}
        </button>
        <button
          onClick={onCreateUser}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white hover:brightness-95 transition-all"
          aria-label={`New ${activeTab === 'clients' ? 'Client' : 'Employee'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(UsersTabs);
