import { Button as EmailButton } from '@react-email/components';
import * as React from 'react';
import { colors } from './EmailLayout';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'danger';
}

const buttonStyles = {
  primary: {
    backgroundColor: colors.primary,
    color: colors.white,
    padding: '14px 32px',
    borderRadius: '8px',
    fontWeight: '600' as const,
    textDecoration: 'none',
    display: 'inline-block',
    textAlign: 'center' as const,
  },
  danger: {
    backgroundColor: colors.danger,
    color: colors.white,
    padding: '14px 32px',
    borderRadius: '8px',
    fontWeight: '600' as const,
    textDecoration: 'none',
    display: 'inline-block',
    textAlign: 'center' as const,
  },
};

/**
 * Styled button component for CTAs in emails
 */
export function Button({ href, children, variant = 'primary' }: ButtonProps) {
  return (
    <EmailButton href={href} style={buttonStyles[variant]}>
      {children}
    </EmailButton>
  );
}

export default Button;
