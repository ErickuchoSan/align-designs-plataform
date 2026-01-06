'use client';

import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Combined effect for body overflow and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Handle escape key to close modal
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);

    // Cleanup: restore scroll and remove event listener
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'w-full max-w-md',
    md: 'w-full max-w-lg',
    lg: 'w-full max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      {/* Backdrop - Using opacity instead of blur for better performance */}
      <div
        className="absolute inset-0 transition-opacity bg-black/60"
        onClick={onClose}
      />

      {/* Modal - with max-height and scroll */}
      <div className={`relative bg-white rounded-lg shadow-2xl ${sizeClasses[size]} max-h-[95vh] flex flex-col animate-slideUp sm:rounded-2xl sm:max-h-[90vh]`}>
        {/* Header - fixed */}
        <div className="flex items-center justify-between flex-shrink-0 p-4 border-b border-gray-200 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 transition-colors rounded-lg hover:text-gray-700 hover:bg-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-grow p-4 overflow-y-auto sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
