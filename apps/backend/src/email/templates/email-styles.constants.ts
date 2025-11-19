/**
 * Centralized email template styles
 * Extracted from inline styles for better maintainability
 */

export const EMAIL_STYLES = {
  // Color palette
  colors: {
    primary: '#2563eb',
    danger: '#dc2626',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    background: '#f9fafb',
    border: '#e5e7eb',
    white: '#ffffff',
  },

  // Common styles
  body: `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `,

  container: `
    background-color: #f9fafb;
    border-radius: 8px;
    padding: 40px;
    text-align: center;
  `,

  logo: `
    font-size: 24px;
    font-weight: bold;
    color: #2563eb;
    margin-bottom: 30px;
  `,

  logoDanger: `
    font-size: 24px;
    font-weight: bold;
    color: #dc2626;
    margin-bottom: 30px;
  `,

  otpCode: `
    font-size: 36px;
    font-weight: bold;
    color: #1f2937;
    background-color: #fff;
    padding: 20px 40px;
    border-radius: 8px;
    letter-spacing: 8px;
    margin: 30px 0;
    display: inline-block;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  `,

  button: `
    display: inline-block;
    background-color: #2563eb;
    color: #ffffff;
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 8px;
    font-weight: 600;
    margin: 30px 0;
  `,

  message: `
    color: #6b7280;
    margin: 20px 0;
  `,

  warning: `
    color: #dc2626;
    font-size: 14px;
    margin-top: 30px;
  `,

  footer: `
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
    color: #9ca3af;
    font-size: 12px;
  `,

  linkText: `
    font-size: 12px;
    color: #9ca3af;
    word-break: break-all;
    margin-top: 20px;
  `,
} as const;

/**
 * Email content constants
 */
export const EMAIL_CONTENT = {
  companyName: 'Align Designs',
  supportMessage: 'This is an automated message, please do not reply.',
  getCurrentYear: () => new Date().getFullYear(),
} as const;
