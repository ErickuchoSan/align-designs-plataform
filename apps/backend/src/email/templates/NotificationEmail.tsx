import { Text, Section } from '@react-email/components';
import * as React from 'react';
import { EmailLayout, Button, styles } from './components';

interface NotificationEmailProps {
  title: string;
  message: string;
  actionLink?: string;
  actionText?: string;
}

/**
 * Generic notification email with optional action button
 */
export function NotificationEmail({
  title,
  message,
  actionLink,
  actionText = 'View Details',
}: Readonly<NotificationEmailProps>) {
  return (
    <EmailLayout preview={title} title={title}>
      <Text style={styles.message}>{message}</Text>

      {actionLink && (
        <Section style={{ margin: '30px 0', textAlign: 'center' }}>
          <Button href={actionLink}>{actionText}</Button>
        </Section>
      )}
    </EmailLayout>
  );
}

export default NotificationEmail;
