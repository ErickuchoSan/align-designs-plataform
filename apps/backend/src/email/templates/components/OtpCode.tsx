import { Section, Text } from '@react-email/components';
import * as React from 'react';
import { colors } from './EmailLayout';

interface OtpCodeProps {
  code: string;
}

const otpStyles = {
  container: {
    textAlign: 'center' as const,
    margin: '30px 0',
  },
  code: {
    fontSize: '36px',
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    padding: '20px 40px',
    borderRadius: '8px',
    letterSpacing: '8px',
    display: 'inline-block',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    margin: '0',
  },
};

/**
 * Styled OTP code display component
 */
export function OtpCode({ code }: OtpCodeProps) {
  return (
    <Section style={otpStyles.container}>
      <Text style={otpStyles.code}>{code}</Text>
    </Section>
  );
}

export default OtpCode;
