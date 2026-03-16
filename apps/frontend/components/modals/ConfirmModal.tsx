'use client';

import { useRef, useEffect } from 'react';
import Modal from '../ui/Modal';
import { ButtonLoader } from '../ui/Loader';

interface WarningItem {
  label: string;
  value: string | number;
  icon?: string;
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  warningItems?: WarningItem[];
  showDetailedWarning?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'info',
  warningItems = [],
  showDetailedWarning = false,
}: ConfirmModalProps) {
  const variantStyles = {
    danger: {
      icon: '⚠️',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    warning: {
      icon: '⚡',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    },
    info: {
      icon: 'ℹ️',
      iconBg: 'bg-navy-100',
      iconColor: 'text-navy-600',
      button: 'bg-navy-600 hover:bg-navy-700 focus:ring-navy-500',
    },
    success: {
      icon: '✅',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    },
  };

  const style = variantStyles[variant];

  // Focus management: focus the cancel button when modal opens (safer default)
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      // Small delay to ensure modal animation completes
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={showDetailedWarning ? "md" : "sm"}>
      <div className={showDetailedWarning ? "" : "text-center"}>
        <div className={`mx-auto flex items-center justify-center h-14 w-14 rounded-full ${style.iconBg} mb-4`}>
          <span className="text-3xl">{style.icon}</span>
        </div>

        <p className={`text-sm sm:text-base text-stone-700 mb-4 break-words ${showDetailedWarning ? 'text-left' : ''}`}>{message}</p>

        {/* Detailed Warning Section */}
        {showDetailedWarning && warningItems.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2 mb-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900 mb-2">This project contains important data that will be permanently deleted:</h4>
                <ul className="space-y-2">
                  {warningItems.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-amber-800">
                      <span className="text-base">{item.icon || '•'}</span>
                      <span className="font-medium">{item.label}:</span>
                      <span className="font-semibold">{item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-amber-200">
              <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                All related data (payments, invoices, files, comments) will be permanently deleted.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
          <button
            ref={cancelButtonRef}
            onClick={onClose}
            disabled={isLoading}
            className="w-full px-5 py-2.5 text-sm font-medium transition-colors rounded-lg text-stone-800 bg-stone-200 hover:bg-stone-300 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${style.button} min-w-0 sm:min-w-[100px] flex items-center justify-center`}
          >
            {isLoading ? <ButtonLoader /> : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
