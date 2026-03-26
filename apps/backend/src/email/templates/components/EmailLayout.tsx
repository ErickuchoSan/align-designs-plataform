import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Preview,
  Section,
} from '@react-email/components';
import * as React from 'react';

/**
 * Email color palette - matches existing brand colors
 */
export const colors = {
  primary: '#2563eb',
  danger: '#dc2626',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  background: '#f9fafb',
  border: '#e5e7eb',
  white: '#ffffff',
} as const;

/**
 * Common styles for email components
 */
export const styles = {
  body: {
    backgroundColor: colors.white,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    margin: '0',
    padding: '20px',
  },
  container: {
    backgroundColor: colors.background,
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center' as const,
    maxWidth: '600px',
    margin: '0 auto',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: colors.primary,
    marginBottom: '30px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
    margin: '0 0 20px 0',
  },
  message: {
    color: colors.textSecondary,
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '20px 0',
  },
  warning: {
    color: colors.danger,
    fontSize: '14px',
    marginTop: '30px',
  },
  footer: {
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: `1px solid ${colors.border}`,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: '12px',
    margin: '0',
  },
} as const;

interface EmailLayoutProps {
  /**
   * Preview text shown in email client inbox
   */
  preview?: string;
  /**
   * Main title/heading
   */
  title: string;
  /**
   * Email body content
   */
  children: React.ReactNode;
  /**
   * Optional warning message (e.g., "If you didn't request this...")
   */
  warningMessage?: string;
  /**
   * Custom footer text (defaults to automated message disclaimer)
   */
  footerText?: string;
}

/**
 * Base layout component for all Align Designs emails
 */
export function EmailLayout({
  preview,
  title,
  children,
  warningMessage,
  footerText = 'This is an automated message, please do not reply.',
}: Readonly<EmailLayoutProps>) {
  const currentYear = new Date().getFullYear();

  return (
    <Html>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.logo}>Align Designs</Text>

          <Text style={styles.title}>{title}</Text>

          {children}

          {warningMessage && (
            <Text style={styles.warning}>{warningMessage}</Text>
          )}

          <Section style={styles.footer}>
            <Text style={styles.footerText}>{footerText}</Text>
            <Text style={styles.footerText}>
              &copy; {currentYear} Align Designs. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default EmailLayout;
