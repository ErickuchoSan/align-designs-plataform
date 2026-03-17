import dynamic from 'next/dynamic';
import { memo } from 'react';

// Dynamic imports for heavy modals
const GenerateInvoiceModal = dynamic(() => import('@/components/modals/GenerateInvoiceModal'), {
    loading: () => null,
    ssr: false,
});

const PayEmployeeModal = dynamic(() => import('@/components/modals/PayEmployeeModal'), {
    loading: () => null,
    ssr: false,
});

const UploadPaymentProofModal = dynamic(() => import('@/components/modals/UploadPaymentProofModal'), {
    loading: () => null,
    ssr: false,
});

interface PaymentModalsGroupProps {
    projectId: string;
    userId: string;
    // Generate Invoice
    showGenerateInvoiceModal: boolean;
    onCloseGenerateInvoiceModal: () => void;
    // Pay Employee
    showPayEmployeeModal: boolean;
    onClosePayEmployeeModal: () => void;
    // Upload Payment Proof
    showUploadPaymentProofModal: boolean;
    onCloseUploadPaymentProofModal: () => void;
    // Common
    onSuccess: () => Promise<void>;
}

function PaymentModalsGroup({
    projectId,
    userId,
    showGenerateInvoiceModal,
    onCloseGenerateInvoiceModal,
    showPayEmployeeModal,
    onClosePayEmployeeModal,
    showUploadPaymentProofModal,
    onCloseUploadPaymentProofModal,
    onSuccess,
}: Readonly<PaymentModalsGroupProps>) {
    return (
        <>
            {showGenerateInvoiceModal && (
                <GenerateInvoiceModal
                    isOpen={showGenerateInvoiceModal}
                    onClose={onCloseGenerateInvoiceModal}
                    projectId={projectId}
                    onSuccess={onSuccess}
                />
            )}

            {showPayEmployeeModal && (
                <PayEmployeeModal
                    isOpen={showPayEmployeeModal}
                    onClose={onClosePayEmployeeModal}
                    projectId={projectId}
                    onSuccess={onSuccess}
                />
            )}

            {showUploadPaymentProofModal && (
                <UploadPaymentProofModal
                    isOpen={showUploadPaymentProofModal}
                    onClose={onCloseUploadPaymentProofModal}
                    projectId={projectId}
                    userId={userId}
                    onSuccess={onSuccess}
                />
            )}
        </>
    );
}

export default memo(PaymentModalsGroup);
