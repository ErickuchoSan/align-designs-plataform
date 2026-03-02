'use client';

import { memo } from 'react';
import Pagination from '@/components/ui/Pagination';
import { formatDate } from '@/lib/utils/date.utils';
import { User } from '@/types';

interface UsersCardsProps {
  users: User[];
  isLoading: boolean;
  activeTab: 'clients' | 'employees';
  togglingUserId: string | null;
  deletingUserId: string | null;
  resendingUserId: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onToggleStatus: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onResendEmail: (user: User) => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

function UsersCards({
  users,
  isLoading,
  activeTab,
  togglingUserId,
  deletingUserId,
  resendingUserId,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onToggleStatus,
  onEdit,
  onDelete,
  onResendEmail,
  onPageChange,
  onItemsPerPageChange,
}: UsersCardsProps) {
  return (
    <div className="md:hidden space-y-4 animate-slideUp">
      {isLoading && users.length === 0 ? (
        <>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-xl border border-stone-200 p-4 animate-pulse">
              <div className="h-4 bg-stone-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-stone-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-stone-200 rounded w-2/3"></div>
            </div>
          ))}
        </>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-6 text-center text-stone-500">
          No {activeTab} found.
        </div>
      ) : (
        users.map((usr) => (
          <div key={usr.id} className="bg-white rounded-2xl shadow-xl border border-stone-200 p-4 hover:shadow-2xl transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold text-navy-900 text-base">
                  {usr.firstName} {usr.lastName}
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  Created {formatDate(usr.createdAt)}
                </div>
              </div>
              <button
                onClick={() => onToggleStatus(usr)}
                disabled={togglingUserId === usr.id}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${usr.isActive ? 'bg-emerald-600' : 'bg-stone-300'}`}
                aria-label={`${usr.isActive ? 'Deactivate' : 'Activate'} user ${usr.firstName} ${usr.lastName}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${usr.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>

            <div className="space-y-2 text-sm mb-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-stone-700 break-all">{usr.email}</span>
              </div>
              {usr.phone && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-stone-700">{usr.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {usr.hasPassword ? (
                  <span className="inline-flex items-center gap-1 text-stone-400 text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Password set
                  </span>
                ) : (
                  <button
                    onClick={() => onResendEmail(usr)}
                    disabled={resendingUserId === usr.id}
                    className="inline-flex items-center gap-1 text-gold-600 hover:text-gold-800 transition-colors text-xs font-medium disabled:opacity-50"
                  >
                    {resendingUserId === usr.id ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    )}
                    Resend welcome email
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-stone-200">
              <button
                onClick={() => onEdit(usr)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors border border-navy-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                <span className="text-sm font-medium">Edit</span>
              </button>
              <button
                onClick={() => onDelete(usr)}
                disabled={deletingUserId === usr.id}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors border border-red-200 disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                <span className="text-sm font-medium">Delete</span>
              </button>
            </div>
          </div>
        ))
      )}

      {totalPages > 0 && (
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={onPageChange}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default memo(UsersCards);
