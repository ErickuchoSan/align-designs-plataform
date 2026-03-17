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
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between border-b border-stone-300">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => onTabChange('clients')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'clients'
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              }
            `}
          >
            Clients ({clientCount})
          </button>
          <button
            onClick={() => onTabChange('employees')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'employees'
                ? 'border-gold-500 text-gold-600'
                : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
              }
            `}
          >
            Employees ({employeeCount})
          </button>
        </nav>

        <div className="py-2">
          {/* Desktop Button */}
          <button
            onClick={onCreateUser}
            className="hidden md:flex rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 text-sm font-semibold text-navy-900 hover:from-gold-400 hover:to-gold-500 transition-all transform hover:scale-105 shadow-lg hover:shadow-gold-300/50"
          >
            + New {activeTab === 'clients' ? 'Client' : 'Employee'}
          </button>

          {/* Mobile Icon Button */}
          <button
            onClick={onCreateUser}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-gold-500 to-gold-600 text-navy-900 hover:from-gold-400 hover:to-gold-500 shadow-lg transition-transform hover:scale-105"
            aria-label={`New ${activeTab === 'clients' ? 'Client' : 'Employee'}`}
          >
            {activeTab === 'clients' ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(UsersTabs);
