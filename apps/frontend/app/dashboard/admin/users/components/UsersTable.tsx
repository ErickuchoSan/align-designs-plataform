'use client';

import { memo } from 'react';
import { TableRowSkeleton } from '@/components/ui/Loader';
import Pagination from '@/components/ui/Pagination';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import { formatDate } from '@/lib/utils/date.utils';
import { User } from '@/types';
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
  const renderLoadingRows = () => (
    <>
      {[1, 2, 3].map((i) => (
        <TableRowSkeleton key={i} />
      ))}
    </>
  );

  const renderEmptyRow = () => (
    <tr>
      <td colSpan={7} className="px-6 py-12 text-center text-stone-500">
        No {activeTab} found.
      </td>
    </tr>
  );

  const renderTableBody = () => {
    if (isLoading && users.length === 0) return renderLoadingRows();
    if (users.length === 0) return renderEmptyRow();
    return users.map((usr) => renderUserRow(usr));
  };

  const renderUserRow = (usr: User) => (
    <tr key={usr.id} className="hover:bg-stone-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-semibold text-navy-900">
          {usr.firstName} {usr.lastName}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
        {usr.email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
        {usr.phone || '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <ToggleSwitch
          isActive={usr.isActive}
          disabled={togglingUserId === usr.id}
          onToggle={() => onToggleStatus(usr)}
          ariaLabel={`${usr.isActive ? 'Deactivate' : 'Activate'} user ${usr.firstName} ${usr.lastName}`}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
        {formatDate(usr.createdAt)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <ResendEmailButton
          user={usr}
          isResending={resendingUserId === usr.id}
          onResend={onResendEmail}
          size="md"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <TableActionButtons
          user={usr}
          isDeleting={deletingUserId === usr.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );

  return (
    <div className="hidden md:block bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 animate-slideUp">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-gradient-to-r from-navy-50 to-stone-100">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">User</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Phone</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Created At</th>
              <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-navy-900 uppercase tracking-wider">Resend Email</th>
              <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-navy-900 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-stone-200">
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
