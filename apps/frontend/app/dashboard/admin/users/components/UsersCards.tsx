'use client';

import { memo } from 'react';
import Pagination from '@/components/ui/Pagination';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { formatDate } from '@/lib/utils/date.utils';
import {
  UsersListProps,
  ResendEmailButton,
  CardActionButtons,
} from './shared';

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
}: Readonly<UsersListProps>) {
  const renderContent = () => {
    if (isLoading && users.length === 0) {
      return (
        <>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-[#E3E2DF] rounded w-3/4 mb-3" />
              <div className="h-3 bg-[#E3E2DF] rounded w-1/2 mb-2" />
              <div className="h-3 bg-[#E3E2DF] rounded w-2/3" />
            </div>
          ))}
        </>
      );
    }
    if (users.length === 0) {
      return (
        <div className="bg-white rounded-lg p-6 text-center text-sm text-[#6B6A65]">
          No {activeTab} found.
        </div>
      );
    }
    return users.map((usr) => (
      <div key={usr.id} className="bg-white rounded-lg p-4 hover:bg-[#F5F4F0] transition-colors">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-semibold text-[#1B1C1A] text-sm">{usr.firstName} {usr.lastName}</div>
            <div className="text-xs text-[#6B6A65] mt-0.5">Created {formatDate(usr.createdAt)}</div>
          </div>
          <ToggleSwitch
            isActive={usr.isActive}
            disabled={togglingUserId === usr.id}
            onToggle={() => onToggleStatus(usr)}
            ariaLabel={`${usr.isActive ? 'Deactivate' : 'Activate'} user ${usr.firstName} ${usr.lastName}`}
          />
        </div>

        <div className="space-y-1.5 text-sm mb-3">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[#6B6A65] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-[#6B6A65] break-all">{usr.email}</span>
          </div>
          {usr.phone && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#6B6A65] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-[#6B6A65]">{usr.phone}</span>
            </div>
          )}
          <div>
            <ResendEmailButton user={usr} isResending={resendingUserId === usr.id} onResend={onResendEmail} size="sm" />
          </div>
        </div>

        <CardActionButtons user={usr} isDeleting={deletingUserId === usr.id} onEdit={onEdit} onDelete={onDelete} />
      </div>
    ));
  };

  return (
    <div className="md:hidden space-y-3">
      {renderContent()}
      {totalPages > 0 && (
        <div className="bg-white rounded-lg p-4">
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
