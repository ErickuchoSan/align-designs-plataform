import { memo, ReactNode } from 'react';

interface PaymentEmptyStateProps {
  icon: ReactNode;
  message: string;
  hint?: string;
}

function PaymentEmptyState({ icon, message, hint }: Readonly<PaymentEmptyStateProps>) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto text-[#D0C5B2] mb-3" aria-hidden="true">
        {icon}
      </div>
      <p className="text-[#6B6A65]">{message}</p>
      {hint && <p className="text-sm text-[#6B6A65] mt-2">{hint}</p>}
    </div>
  );
}

export default memo(PaymentEmptyState);
