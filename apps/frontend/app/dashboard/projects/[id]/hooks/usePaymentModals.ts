import { useState, useCallback } from 'react';

export function usePaymentModals() {
    const [showGenerateInvoiceModal, setShowGenerateInvoiceModal] = useState(false);
    const [showPayEmployeeModal, setShowPayEmployeeModal] = useState(false);
    const [showUploadPaymentProofModal, setShowUploadPaymentProofModal] = useState(false);

    const openGenerateInvoiceModal = useCallback(() => setShowGenerateInvoiceModal(true), []);
    const closeGenerateInvoiceModal = useCallback(() => setShowGenerateInvoiceModal(false), []);

    const openPayEmployeeModal = useCallback(() => setShowPayEmployeeModal(true), []);
    const closePayEmployeeModal = useCallback(() => setShowPayEmployeeModal(false), []);

    const openUploadPaymentProofModal = useCallback(() => setShowUploadPaymentProofModal(true), []);
    const closeUploadPaymentProofModal = useCallback(() => setShowUploadPaymentProofModal(false), []);

    return {
        showGenerateInvoiceModal,
        openGenerateInvoiceModal,
        closeGenerateInvoiceModal,
        showPayEmployeeModal,
        openPayEmployeeModal,
        closePayEmployeeModal,
        showUploadPaymentProofModal,
        openUploadPaymentProofModal,
        closeUploadPaymentProofModal,
    };
}
