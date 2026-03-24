// Email templates
export { WelcomeEmail } from './WelcomeEmail';
export { OtpEmail } from './OtpEmail';
export { PasswordResetEmail } from './PasswordResetEmail';
export { NotificationEmail } from './NotificationEmail';
export { InvoiceEmail } from './InvoiceEmail';

// Components
export { EmailLayout, Button, OtpCode, colors, styles } from './components';

// Legacy exports for backward compatibility (to be removed)
export {
  getBaseEmailTemplate,
  getOtpCodeHtml,
  escapeHtml,
} from './base-email.template';
