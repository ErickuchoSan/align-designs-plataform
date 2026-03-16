import { PaymentMethod, PAYMENT_METHOD_LABELS } from '../../types/payments';

interface PaymentMethodSelectProps {
    value: PaymentMethod;
    onChange: (method: PaymentMethod) => void;
    disabled?: boolean;
}

export function PaymentMethodSelect({ value, onChange, disabled }: Readonly<PaymentMethodSelectProps>) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                <button
                    key={method}
                    type="button"
                    onClick={() => onChange(method)}
                    disabled={disabled}
                    className={`
            relative flex items-center justify-center px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all
            ${value === method
                            ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500 ring-offset-2'
                            : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                        }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
                >
                    {PAYMENT_METHOD_LABELS[method]}
                </button>
            ))}
        </div>
    );
}
