'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cn, MODAL_CONTENT, MODAL_SIZES, MODAL_HEADER, MODAL_TITLE, MODAL_BODY } from '@/lib/styles';
import { CloseIcon } from './icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  footer?: React.ReactNode;
}

// Selectors for focusable elements within the modal
const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }: Readonly<ModalProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const hasSetInitialFocus = useRef(false);

  // Get all focusable elements within the modal
  const getFocusableElements = useCallback(() => {
    if (!modalRef.current) return [];
    return Array.from(modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
  }, []);

  // Store onClose in a ref to avoid recreating handleKeyDown
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Focus trap: cycle focus within modal - stable function that doesn't change
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCloseRef.current();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Shift+Tab on first element: go to last
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
    // Tab on last element: go to first
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, [getFocusableElements]);

  // Combined effect for body overflow, focus management, and keyboard handling
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!isOpen) {
      // Reset initial focus flag when modal closes
      hasSetInitialFocus.current = false;
      if (dialog.open) {
        dialog.close();
      }
      return;
    }

    // Store currently focused element to restore later (only once)
    if (!hasSetInitialFocus.current) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    // Show dialog using native method
    if (!dialog.open) {
      dialog.showModal();
    }

    // Focus the first focusable element after modal opens (only once)
    if (!hasSetInitialFocus.current) {
      hasSetInitialFocus.current = true;
      requestAnimationFrame(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          // If no focusable elements, focus the modal container
          modalRef.current?.focus();
        }
      });
    }

    // Handle native cancel event (Escape key)
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onCloseRef.current();
    };
    dialog.addEventListener('cancel', handleCancel);

    // Add keyboard listener for focus trap
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: remove event listeners
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, getFocusableElements, handleKeyDown]);

  // Separate effect for restoring focus when modal closes
  useEffect(() => {
    // When modal closes, restore focus to the previously focused element
    if (!isOpen && previousActiveElement.current?.focus) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto p-0 bg-transparent animate-fadeIn backdrop:bg-black/60 backdrop:transition-opacity open:flex open:items-center open:justify-center"
      aria-labelledby="modal-title"
    >
      {/* Invisible backdrop button for accessibility */}
      <button
        type="button"
        className="fixed inset-0 w-full h-full cursor-default bg-transparent -z-10"
        onClick={onClose}
        aria-label="Close modal"
        tabIndex={-1}
      />
      {/* Modal - with max-height and scroll */}
      <div
        ref={modalRef}
        className={cn(MODAL_CONTENT, MODAL_SIZES[size], 'animate-slideUp')}
        tabIndex={-1}
      >
        {/* Header - fixed */}
        <div className={MODAL_HEADER}>
          <h3 id="modal-title" className={MODAL_TITLE}>{title}</h3>
          <button
            onClick={onClose}
            className="p-1 transition-colors rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-200"
            aria-label="Close dialog"
          >
            <CloseIcon size="lg" aria-hidden="true" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className={MODAL_BODY}>{children}</div>

        {/* Footer - optional */}
        {footer && (
          <div className="flex-shrink-0 p-4 border-t border-stone-200 sm:p-6">{footer}</div>
        )}
      </div>
    </dialog>
  );
}
