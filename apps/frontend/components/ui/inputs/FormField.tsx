'use client';

import { cn, FORM_LABEL, FORM_ERROR, FORM_HINT, FORM_GROUP } from '@/lib/styles';
import { ErrorCircleIcon } from '../icons';

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  hint,
  required,
  htmlFor,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn(FORM_GROUP, className)}>
      {label && (
        <label htmlFor={htmlFor} className={FORM_LABEL}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className={FORM_ERROR} role="alert" aria-live="polite">
          <ErrorCircleIcon size="sm" aria-hidden="true" />
          {error}
        </p>
      )}
      {hint && !error && <p className={FORM_HINT}>{hint}</p>}
    </div>
  );
}
