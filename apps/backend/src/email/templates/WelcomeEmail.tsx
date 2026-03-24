import { Text, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, Button, styles, colors } from './components';

interface WelcomeEmailProps {
  userName: string;
  email: string;
  loginUrl: string;
}

const listStyles = {
  textAlign: 'left' as const,
  color: colors.textSecondary,
  fontSize: '16px',
  lineHeight: '1.8',
  margin: '20px 0',
  paddingLeft: '20px',
};

/**
 * Welcome email sent to new users when their account is created
 */
export function WelcomeEmail({ userName, email, loginUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview={`Welcome to Align Designs, ${userName}!`}
      title="Welcome to Align Designs!"
    >
      <Text style={styles.message}>
        Hello {userName},
        <br />
        Your account has been successfully created.
      </Text>

      <Text style={styles.message}>
        You can now log in to the platform using your email address:{' '}
        <strong>{email}</strong>
      </Text>

      <Section style={{ margin: '30px 0', textAlign: 'center' }}>
        <Button href={loginUrl}>Log In Now</Button>
      </Section>

      <Text
        style={{
          ...styles.message,
          fontWeight: 'bold',
          textAlign: 'left',
        }}
      >
        To set your password:
      </Text>

      <ol style={listStyles}>
        <li>Go to the login page.</li>
        <li>Enter your email and click &quot;Continue&quot;.</li>
        <li>You will receive a verification code via email.</li>
        <li>Enter the verification code.</li>
        <li>Create your secure password.</li>
      </ol>

      <Text style={styles.message}>We are excited to have you on board!</Text>
    </EmailLayout>
  );
}

export default WelcomeEmail;
