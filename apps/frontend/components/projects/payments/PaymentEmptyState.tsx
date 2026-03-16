import { memo, ReactNode } from 'react';

interface PaymentEmptyStateProps {
  icon: ReactNode;
  message: string;
  hint?: string;
}

function PaymentEmptyState({ icon, message, hint }: Readonly<PaymentEmptyStateProps>) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto text-stone-300 mb-3" aria-hidden="true">
        {icon}
      </div>
      <p className="text-stone-600">{message}</p>
      {hint && <p className="text-sm text-stone-500 mt-2">{hint}</p>}
    </div>
  );
}

export default memo(PaymentEmptyState);
