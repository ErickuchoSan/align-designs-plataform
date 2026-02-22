'use client';

import { memo } from 'react';
import Modal from '@/components/ui/Modal';
import { CheckIcon } from '@/components/ui/icons';

interface PasswordSuccessModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

function PasswordSuccessModal({ isOpen, onConfirm }: PasswordSuccessModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Password Updated"
      size="sm"
    >
      <div className="text-center py-4">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-forest-100 mb-4">
          <CheckIcon className="w-8 h-8 text-forest-600" />
        </div>
        <h3 className="text-lg font-semibold text-navy-900 mb-2">
          Password updated successfully
        </h3>
        <p className="text-sm text-stone-700 mb-6">
          For security, we will log you out. You will need to log in again with your new password.
        </p>
        <button
          onClick={onConfirm}
          className="w-full px-5 py-3 text-sm font-medium text-white bg-navy-800 rounded-lg hover:bg-navy-700 hover:shadow-lg transition-all"
        >
          Accept
        </button>
      </div>
    </Modal>
  );
}

export default memo(PasswordSuccessModal);
