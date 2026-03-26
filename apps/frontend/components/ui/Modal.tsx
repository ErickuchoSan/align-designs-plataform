'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cn, MODAL_CONTENT, MODAL_SIZES, MODAL_HEADER, MODAL_TITLE, MODAL_BODY } from '@/lib/styles';
import { CloseIcon } from './icons';
import {
  MotionDiv,
  MotionButton,
  AnimatePresence,
  modalVariants,
  backdropVariants,
  useReducedMotion,
} from './motion';

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

  // Focus trap: cycle focus within modal
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

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }, [getFocusableElements]);

  // Focus management and keyboard handling
  useEffect(() => {
    if (!isOpen) {
      hasSetInitialFocus.current = false;
      // Restore focus when modal closes
      if (previousActiveElement.current?.focus) {
        previousActiveElement.current.focus();
        previousActiveElement.current = null;
      }
      return;
    }

    // Store currently focused element
    if (!hasSetInitialFocus.current) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    if (!hasSetInitialFocus.current) {
      hasSetInitialFocus.current = true;
      requestAnimationFrame(() => {
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current?.focus();
        }
      });
    }

    // Add keyboard listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, getFocusableElements, handleKeyDown]);

  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <dialog
          open
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent m-0 max-w-none max-h-none w-full h-full"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <MotionDiv
            className="absolute inset-0 bg-black/60"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal content */}
          <MotionDiv
            ref={modalRef}
            className={cn(MODAL_CONTENT, MODAL_SIZES[size], 'relative')}
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            tabIndex={-1}
          >
            {/* Header */}
            <div className={MODAL_HEADER}>
              <h3 id="modal-title" className={MODAL_TITLE}>{title}</h3>
              <MotionButton
                onClick={onClose}
                className="p-1 transition-colors rounded-lg text-stone-500 hover:text-stone-700 hover:bg-stone-200"
                aria-label="Close dialog"
                whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              >
                <CloseIcon size="lg" aria-hidden="true" />
              </MotionButton>
            </div>

            {/* Content */}
            <div className={MODAL_BODY}>{children}</div>

            {/* Footer */}
            {footer && (
              <div className="flex-shrink-0 p-4 border-t border-stone-200 sm:p-6">{footer}</div>
            )}
          </MotionDiv>
        </dialog>
      )}
    </AnimatePresence>
  );
}
