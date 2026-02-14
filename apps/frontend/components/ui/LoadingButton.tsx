'use client';

import { ButtonLoader } from './Loader';

export interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

/**
 * Standardized button component with loading state
 * Prevents layout shift during loading and provides consistent styling
 */
export default function LoadingButton({
  isLoading = false,
  loadingText,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}: LoadingButtonProps) {
  const baseStyles =
    'font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';

  const variantStyles = {
    primary:
      'bg-navy-800 hover:bg-navy-700 text-white focus:ring-gold-500 transform hover:scale-105 disabled:transform-none shadow-lg',
    secondary:
      'bg-stone-200 hover:bg-stone-300 text-navy-900 focus:ring-stone-400',
    danger:
      'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 transform hover:scale-105 disabled:transform-none',
    warning:
      'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500 transform hover:scale-105 disabled:transform-none',
    ghost:
      'bg-transparent hover:bg-stone-100 text-navy-900 focus:ring-stone-300',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs min-w-[80px]',
    md: 'px-5 py-2.5 text-sm min-w-[100px]',
    lg: 'px-6 py-3 text-base min-w-[120px]',
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`;

  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={combinedClassName}
      aria-busy={isLoading}
      aria-live="polite"
    >
      {isLoading ? (
        <>
          <ButtonLoader />
          {loadingText && <span className="ml-2">{loadingText}</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}
