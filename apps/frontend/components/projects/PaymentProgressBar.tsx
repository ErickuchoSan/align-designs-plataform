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
export function PaymentProgressBar({ required, paid, pendingAmount = 0, className = '' }: Readonly<PaymentProgressBarProps & { pendingAmount?: number }>) {
  const effectivePaid = paid;
  const effectivePending = pendingAmount;
  const remaining = Math.max(0, required - effectivePaid - effectivePending);

  const paidPercentage = Math.min(100, (effectivePaid / required) * 100);
  const pendingPercentage = Math.min(100 - paidPercentage, (effectivePending / required) * 100);

  const isFullyCovered = (effectivePaid + effectivePending) >= required;
  const isPaidComplete = effectivePaid >= required;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:text-sm text-xs">
        <div className="flex flex-col">
          <span className="text-stone-600">
            Paid: <span className="font-semibold text-navy-900">${effectivePaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </span>
          {effectivePending > 0 && (
            <span className="text-amber-600 font-medium">
              (+${effectivePending.toLocaleString('en-US', { minimumFractionDigits: 2 })} pending review)
            </span>
          )}
        </div>
        <div className="text-left sm:text-right">
          <span className="text-stone-600 block">
            Required: <span className="font-semibold text-navy-900">${required.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-stone-200 rounded-full h-2.5 flex overflow-hidden">
        {/* Paid segment */}
        <div
          className={`h-full transition-all duration-300 ${isPaidComplete ? 'bg-green-600' : 'bg-navy-600'}`}
          style={{ width: `${paidPercentage}%` }}
        />
        {/* Pending segment */}
        {pendingPercentage > 0 && (
          <div
            className="h-full bg-amber-400 transition-all duration-300 relative overflow-hidden"
            style={{ width: `${pendingPercentage}%` }}
            title="Waiting for approval"
          >
            {/* Striped pattern overlay using Tailwind pattern if possible, or just solid for consistency if striped-bar was custom */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem]" />
          </div>
        )}
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <div className="flex gap-2">
          <span>{Math.round(paidPercentage + pendingPercentage)}% complete</span>
        </div>

        {!isFullyCovered && <span>Remaining: ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>}

        {isPaidComplete && (
          <span className="text-green-600 font-medium">✓ Complete</span>
        )}
        {!isPaidComplete && isFullyCovered && (
          <span className="text-amber-600 font-medium">⏳ Pending Approval</span>
        )}
      </div>
    </div>
  );
}
