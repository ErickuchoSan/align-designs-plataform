'use client';

import { memo, ReactNode, FormEvent } from 'react';
import Modal from '@/components/ui/Modal';
import { ButtonLoader } from '@/components/ui/Loader';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: (e: FormEvent) => void;
  isSubmitting?: boolean;
  submitText?: string;
  cancelText?: string;
  error?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function FormModal({
  isOpen,
  onClose,
  title,
  onSubmit,
  isSubmitting = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  error,
  children,
  size = 'md',
}: Readonly<FormModalProps>) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div
            className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg text-sm font-medium shadow-sm"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {children}

        <div className="flex gap-3 justify-end pt-4 border-t border-[#D0C5B2]/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-medium text-[#1B1C1A] bg-[#F5F4F0] rounded-lg hover:bg-[#F5F4F0]/80 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-[#755B00] to-[#C9A84C] rounded-lg hover:brightness-95 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-w-[120px] flex items-center justify-center shadow-sm"
          >
            {isSubmitting ? <ButtonLoader /> : submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default memo(FormModal);
