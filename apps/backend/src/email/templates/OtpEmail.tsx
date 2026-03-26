import { Text } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, OtpCode, styles } from './components';

type OtpType = 'login' | 'new_user' | 'password_recovery';

interface OtpEmailProps {
  userName: string;
  otpCode: string;
  type: OtpType;
}

/**
 * Get email content based on OTP type
 */
function getOtpContent(type: OtpType) {
  switch (type) {
    case 'new_user':
      return {
        title: 'Account Verification',
        preview: 'Verify your Align Designs account',
        message:
          'Welcome to Align Designs! Use this code to verify your account and create your password:',
        warning: 'If you did not create this account, please ignore this message.',
      };
    case 'password_recovery':
      return {
        title: 'Password Recovery Code',
        preview: 'Your password recovery code',
        message: 'Use this code to reset your password:',
        warning:
          'If you did not request this password reset, please ignore this message.',
      };
    case 'login':
    default:
      return {
        title: 'Verification Code',
        preview: 'Your login verification code',
        message: 'Use the following code to log in:',
        warning: 'If you did not request this code, please ignore this message.',
      };
  }
}

/**
 * OTP email for verification codes (login, new user, password recovery)
 */
export function OtpEmail({ userName, otpCode, type }: Readonly<OtpEmailProps>) {
  const content = getOtpContent(type);

  return (
    <EmailLayout
      preview={content.preview}
      title={content.title}
      warningMessage={content.warning}
    >
      <Text style={styles.message}>
        Hello {userName},
        <br />
        {content.message}
      </Text>

      <OtpCode code={otpCode} />

      <Text style={styles.message}>
        This code will expire in <strong>10 minutes</strong>.
      </Text>
    </EmailLayout>
  );
}

export default OtpEmail;
