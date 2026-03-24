import { Text, Section, Link } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, Button, styles, colors } from './components';

interface PasswordResetEmailProps {
  userName: string;
  resetLink: string;
}

const linkTextStyles = {
  fontSize: '12px',
  color: colors.textMuted,
  wordBreak: 'break-all' as const,
  marginTop: '20px',
};

/**
 * Password reset email with reset link
 */
export function PasswordResetEmail({
  userName,
  resetLink,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout
      preview="Reset your Align Designs password"
      title="Password Recovery"
      warningMessage="If you did not request this change, please ignore this message and your password will remain unchanged."
    >
      <Text style={styles.message}>
        Hello {userName},
        <br />
        We received a request to reset your password.
      </Text>

      <Section style={{ margin: '30px 0', textAlign: 'center' }}>
        <Button href={resetLink}>Reset Password</Button>
      </Section>

      <Text style={styles.message}>
        This link will expire in <strong>1 hour</strong>.
      </Text>

      <Section style={linkTextStyles}>
        <Text style={{ margin: 0, color: colors.textMuted, fontSize: '12px' }}>
          If the button doesn&apos;t work, copy and paste this link into your
          browser:
        </Text>
        <Link
          href={resetLink}
          style={{ color: colors.textMuted, fontSize: '12px' }}
        >
          {resetLink}
        </Link>
      </Section>
    </EmailLayout>
  );
}

export default PasswordResetEmail;
