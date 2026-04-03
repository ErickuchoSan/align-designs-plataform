'use client';

import { memo } from 'react';
import { TableRowSkeleton } from '@/components/ui/Loader';
import Pagination from '@/components/ui/Pagination';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { formatDate } from '@/lib/utils/date.utils';
import {
  UsersListProps,
  ResendEmailButton,
  TableActionButtons,
} from './shared';

function UsersTable({
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
  const renderTableBody = () => {
    if (isLoading && users.length === 0) {
      return <>{[1, 2, 3].map((i) => <TableRowSkeleton key={i} />)}</>;
    }
    if (users.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="px-6 py-12 text-center text-[#6B6A65] text-sm">
            No {activeTab} found.
          </td>
        </tr>
      );
    }
    return users.map((usr) => (
      <tr key={usr.id} className="hover:bg-[#FAF9F5] transition-colors">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="font-semibold text-[#1B1C1A] text-sm">{usr.firstName} {usr.lastName}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6A65]">{usr.email}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6A65]">{usr.phone || '-'}</td>
        <td className="px-6 py-4 whitespace-nowrap">
          <ToggleSwitch
            isActive={usr.isActive}
            disabled={togglingUserId === usr.id}
            onToggle={() => onToggleStatus(usr)}
            ariaLabel={`${usr.isActive ? 'Deactivate' : 'Activate'} user ${usr.firstName} ${usr.lastName}`}
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6A65]">{formatDate(usr.createdAt)}</td>
        <td className="px-6 py-4 whitespace-nowrap text-center">
          <ResendEmailButton user={usr} isResending={resendingUserId === usr.id} onResend={onResendEmail} size="md" />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <TableActionButtons user={usr} isDeleting={deletingUserId === usr.id} onEdit={onEdit} onDelete={onDelete} />
        </td>
      </tr>
    ));
  };

  return (
    <div className="hidden md:block bg-white rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-[#F5F4F0] sticky top-0">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[#6B6A65]">User</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[#6B6A65]">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[#6B6A65]">Phone</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[#6B6A65]">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[#6B6A65]">Created</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-widest text-[#6B6A65]">Resend</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-widest text-[#6B6A65]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D0C5B2]/15">
            {renderTableBody()}
          </tbody>
        </table>
      </div>

      {totalPages > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      )}
    </div>
  );
}

export default memo(UsersTable);
