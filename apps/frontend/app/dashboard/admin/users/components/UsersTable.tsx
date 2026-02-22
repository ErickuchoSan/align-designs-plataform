'use client';

import { memo } from 'react';
import { TableRowSkeleton } from '@/components/ui/Loader';
import Pagination from '@/components/ui/Pagination';
import { formatDate } from '@/lib/utils/date.utils';
import { User } from '@/types';

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  activeTab: 'clients' | 'employees';
  togglingUserId: string | null;
  deletingUserId: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onToggleStatus: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}

function UsersTable({
  users,
  isLoading,
  activeTab,
  togglingUserId,
  deletingUserId,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onToggleStatus,
  onEdit,
  onDelete,
  onPageChange,
  onItemsPerPageChange,
}: UsersTableProps) {
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
              <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-navy-900 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-stone-200">
            {isLoading && users.length === 0 ? (
              <>
                {[1, 2, 3].map((i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-stone-500">
                  No {activeTab} found.
                </td>
              </tr>
            ) : (
              users.map((usr) => (
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-700">
                    {formatDate(usr.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(usr)}
                        className="text-navy-600 hover:text-navy-900 transition-colors p-2 rounded-full hover:bg-navy-50"
                        aria-label={`Edit user ${usr.firstName} ${usr.lastName}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(usr)}
                        disabled={deletingUserId === usr.id}
                        className="text-red-600 hover:text-red-900 transition-colors p-2 rounded-full hover:bg-red-50"
                        aria-label={`Delete user ${usr.firstName} ${usr.lastName}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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
