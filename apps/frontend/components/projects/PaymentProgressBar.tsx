'use client';

interface PaymentProgressBarProps {
  required: number;
  paid: number;
  className?: string;
}

/**
 * PaymentProgressBar Component
 *
 * Displays payment progress with a visual progress bar
 * Shows: paid amount, required amount, remaining, and percentage
 */
export function PaymentProgressBar({ required, paid, className = '' }: PaymentProgressBarProps) {
  const remaining = Math.max(0, required - paid);
  const percentage = Math.min(100, Math.round((paid / required) * 100));
  const isComplete = paid >= required;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">
          Pagado: <span className="font-semibold text-gray-900">${paid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </span>
        <span className="text-gray-600">
          Requerido: <span className="font-semibold text-gray-900">${required.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${isComplete ? 'bg-green-600' : 'bg-blue-600'
            }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{percentage}% completado</span>
        {!isComplete && <span>Restante: ${remaining.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>}
        {isComplete && <span className="text-green-600 font-medium">✓ Completado</span>}
      </div>
    </div>
  );
}
