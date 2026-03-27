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
}: Readonly<LoadingButtonProps>) {
  const baseStyles =
    'font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';

  const variantStyles = {
    primary:
      'bg-gradient-to-br from-[#755B00] to-[#C9A84C] hover:brightness-95 text-white focus:ring-[#C9A84C] transform hover:scale-105 disabled:transform-none shadow-sm',
    secondary:
      'bg-[#F5F4F0] hover:bg-[#F5F4F0]/80 text-[#1B1C1A] focus:ring-[#D0C5B2]',
    danger:
      'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 transform hover:scale-105 disabled:transform-none',
    warning:
      'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500 transform hover:scale-105 disabled:transform-none',
    ghost:
      'bg-transparent hover:bg-[#F5F4F0] text-[#1B1C1A] focus:ring-[#D0C5B2]',
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
