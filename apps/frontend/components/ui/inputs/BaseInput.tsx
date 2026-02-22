'use client';

import { forwardRef } from 'react';
import { cn, INPUT_BASE, INPUT_VARIANTS, INPUT_SIZES, type InputVariant, type InputSize } from '@/lib/styles';

export interface BaseInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  inputSize?: InputSize;
  fullWidth?: boolean;
}

export const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(
  ({ variant = 'default', inputSize = 'md', fullWidth = true, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          INPUT_BASE,
          INPUT_VARIANTS[variant],
          INPUT_SIZES[inputSize],
          !fullWidth && 'w-auto',
          className
        )}
        {...props}
      />
    );
  }
);

BaseInput.displayName = 'BaseInput';
