'use client';

import { memo } from 'react';
import { User } from '@/types';

/**
 * Common props interface shared between UsersTable and UsersCards
 */
export interface UsersListProps {
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

/**
 * Resend welcome email button with loading spinner
 */
interface ResendEmailButtonProps {
  user: User;
  isResending: boolean;
  onResend: (user: User) => void;
  size?: 'sm' | 'md';
}

export const ResendEmailButton = memo(function ResendEmailButton({
  user,
  isResending,
  onResend,
  size = 'md',
}: ResendEmailButtonProps) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  if (user.hasPassword) {
    return (
      <span className={`inline-flex items-center gap-1 text-stone-400 ${textSize}`} title="Password already set">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconSize}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <span className={size === 'md' ? 'hidden lg:inline' : ''}>{size === 'sm' ? 'Password set' : 'Registered'}</span>
      </span>
    );
  }

  return (
    <button
      onClick={() => onResend(user)}
      disabled={isResending}
      className={`inline-flex items-center gap-1 text-gold-600 hover:text-gold-800 transition-colors ${textSize} font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
      title="Resend welcome email"
    >
      {isResending ? (
        <svg className={`animate-spin ${iconSize}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={iconSize}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
      )}
      <span className={size === 'md' ? 'hidden lg:inline' : ''}>{size === 'sm' ? 'Resend welcome email' : 'Resend'}</span>
    </button>
  );
});

/**
 * Edit button icon
 */
export const EditIcon = memo(function EditIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
});

/**
 * Delete button icon
 */
export const DeleteIcon = memo(function DeleteIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
});

/**
 * Table-style action buttons (icon only)
 */
interface TableActionButtonsProps {
  user: User;
  isDeleting: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export const TableActionButtons = memo(function TableActionButtons({
  user,
  isDeleting,
  onEdit,
  onDelete,
}: TableActionButtonsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => onEdit(user)}
        className="text-navy-600 hover:text-navy-900 transition-colors p-2 rounded-full hover:bg-navy-50"
        aria-label={`Edit user ${user.firstName} ${user.lastName}`}
      >
        <EditIcon />
      </button>
      <button
        onClick={() => onDelete(user)}
        disabled={isDeleting}
        className="text-red-600 hover:text-red-900 transition-colors p-2 rounded-full hover:bg-red-50"
        aria-label={`Delete user ${user.firstName} ${user.lastName}`}
      >
        <DeleteIcon />
      </button>
    </div>
  );
});

/**
 * Card-style action buttons (with text labels)
 */
interface CardActionButtonsProps {
  user: User;
  isDeleting: boolean;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

export const CardActionButtons = memo(function CardActionButtons({
  user,
  isDeleting,
  onEdit,
  onDelete,
}: CardActionButtonsProps) {
  return (
    <div className="flex items-center gap-2 pt-3 border-t border-stone-200">
      <button
        onClick={() => onEdit(user)}
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-navy-600 hover:text-navy-900 hover:bg-navy-50 rounded-lg transition-colors border border-navy-200"
      >
        <EditIcon className="w-4 h-4" />
        <span className="text-sm font-medium">Edit</span>
      </button>
      <button
        onClick={() => onDelete(user)}
        disabled={isDeleting}
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors border border-red-200 disabled:opacity-50"
      >
        <DeleteIcon className="w-4 h-4" />
        <span className="text-sm font-medium">Delete</span>
      </button>
    </div>
  );
});
