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
export function PaymentProgressBar({ required, paid, pendingAmount = 0, className = '' }: PaymentProgressBarProps & { pendingAmount?: number }) {
  const effectivePaid = paid;
  const effectivePending = pendingAmount;
  const remaining = Math.max(0, required - effectivePaid - effectivePending);

  const paidPercentage = Math.min(100, (effectivePaid / required) * 100);
  const pendingPercentage = Math.min(100 - paidPercentage, (effectivePending / required) * 100);

  const isFullyCovered = (effectivePaid + effectivePending) >= required;
  const isPaidComplete = effectivePaid >= required;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <div className="flex flex-col">
          <span className="text-gray-600">
            Pagado: <span className="font-semibold text-gray-900">${effectivePaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </span>
          {effectivePending > 0 && (
            <span className="text-amber-600 text-xs">
              (+${effectivePending.toLocaleString('es-MX', { minimumFractionDigits: 2 })} en revisión)
            </span>
          )}
        </div>
        <div className="text-right">
          <span className="text-gray-600 block">
            Requerido: <span className="font-semibold text-gray-900">${required.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 flex overflow-hidden">
        {/* Paid segment */}
        <div
          className={`h-full transition-all duration-300 ${isPaidComplete ? 'bg-green-600' : 'bg-blue-600'}`}
          style={{ width: `${paidPercentage}%` }}
        />
        {/* Pending segment */}
        {pendingPercentage > 0 && (
          <div
            className="h-full bg-amber-400 transition-all duration-300 striped-bar"
            style={{ width: `${pendingPercentage}%` }}
            title="Waiting for approval"
          />
        )}
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <div className="flex gap-2">
          <span>{Math.round(paidPercentage + pendingPercentage)}% completado</span>
        </div>

        {!isFullyCovered && <span>Restante: ${remaining.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>}

        {isPaidComplete ? (
          <span className="text-green-600 font-medium">✓ Completado</span>
        ) : isFullyCovered ? (
          <span className="text-amber-600 font-medium">⏳ Esperando Aprobación</span>
        ) : null}
      </div>
    </div>
  );
}
