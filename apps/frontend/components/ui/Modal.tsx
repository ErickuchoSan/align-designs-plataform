'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cn, MODAL_CONTAINER, MODAL_CONTENT, MODAL_SIZES, MODAL_HEADER, MODAL_TITLE, MODAL_BODY } from '@/lib/styles';
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

export default function Modal({ isOpen, onClose, title, children, size = 'md', footer }: ModalProps) {
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
    if (!isOpen) {
      // Reset initial focus flag when modal closes
      hasSetInitialFocus.current = false;
      return;
    }

    // Store currently focused element to restore later (only once)
    if (!hasSetInitialFocus.current) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

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

    // Add keyboard listener for focus trap
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup: restore scroll and remove event listener
    return () => {
      document.body.style.overflow = 'unset';
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

  if (!isOpen) return null;

  return (
    <div
      className={cn(MODAL_CONTAINER, 'animate-fadeIn')}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop - Using opacity instead of blur for better performance */}
      <div
        className="absolute inset-0 transition-opacity bg-black/60"
        onClick={onClose}
        aria-hidden="true"
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
    </div>
  );
}
