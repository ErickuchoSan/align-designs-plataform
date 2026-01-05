'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import PaymentHistoryTable from './PaymentHistoryTable';
import { Payment } from '@/types/payments';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  payments: Payment[];
  isLoading: boolean;
  onViewReceipt?: (payment: Payment) => void;
  isAdmin?: boolean;
  projectName?: string;
  amountPaid?: number;
  amountRequired?: number;
}

export default function PaymentHistoryModal({
  isOpen,
  onClose,
  payments,
  isLoading,
  onViewReceipt,
  isAdmin,
  projectName,
  amountPaid,
  amountRequired,
}: PaymentHistoryModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gradient-to-r from-navy-800 to-navy-900 px-4 sm:px-6 py-4 flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <Dialog.Title as="h3" className="text-base sm:text-xl font-bold text-white break-words">
                      Payment History{projectName ? ` - ${projectName}` : ''}
                    </Dialog.Title>
                    {amountPaid !== undefined && amountRequired !== undefined && (
                      <p className="text-xs sm:text-sm text-gray-300 mt-1 break-words">
                        Amount Paid: <span className="font-semibold text-green-300">${Number(amountPaid).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        {' '} of ${Number(amountRequired).toLocaleString('en-US', { minimumFractionDigits: 2 })} required
                      </p>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-300 hover:text-white transition-colors flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
                  <PaymentHistoryTable
                    payments={payments}
                    isLoading={isLoading}
                    onViewReceipt={onViewReceipt}
                    isAdmin={isAdmin}
                  />
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-end border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
