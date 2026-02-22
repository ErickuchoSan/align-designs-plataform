'use client';

import { useId } from 'react';
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
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const describedBy = errorId || hintId;

  return (
    <div
      className={cn(FORM_GROUP, className)}
      data-error-id={errorId}
      data-hint-id={hintId}
      data-described-by={describedBy}
    >
      {label && (
        <label htmlFor={htmlFor} className={FORM_LABEL}>
          {label} {required && <span className="text-red-500" aria-hidden="true">*</span>}
          {required && <span className="sr-only">(required)</span>}
        </label>
      )}
      {children}
      {error && (
        <p id={errorId} className={FORM_ERROR} role="alert" aria-live="polite">
          <ErrorCircleIcon size="sm" aria-hidden="true" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className={FORM_HINT}>
          {hint}
        </p>
      )}
    </div>
  );
}
