'use client';

import { memo } from 'react';
import Modal from '@/components/ui/Modal';
import { CheckIcon } from '@/components/ui/icons';

interface PasswordSuccessModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

function PasswordSuccessModal({ isOpen, onConfirm }: Readonly<PasswordSuccessModalProps>) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Password Updated"
      size="sm"
    >
      <div className="text-center py-4">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#D1E7DD] mb-4">
          <CheckIcon className="w-8 h-8 text-[#2D6A4F]" />
        </div>
        <h3 className="text-lg font-semibold text-[#1B1C1A] mb-2">
          Password updated successfully
        </h3>
        <p className="text-sm text-[#6B6A65] mb-6">
          For security, we will log you out. You will need to log in again with your new password.
        </p>
        <button
          onClick={onConfirm}
          className="w-full px-5 py-3 text-sm font-semibold text-white bg-gradient-to-br from-[#755B00] to-[#C9A84C] rounded-lg hover:brightness-95 transition-all"
        >
          Accept
        </button>
      </div>
    </Modal>
  );
}

export default memo(PasswordSuccessModal);
