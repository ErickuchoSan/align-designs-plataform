/**
 * Base email template with consistent styling
 * Provides reusable HTML structure for all email types
 */

export interface BaseEmailParams {
  /**
   * Main heading text
   */
  title: string;

  /**
   * Personalized greeting name
   */
  userName: string;

  /**
   * Message displayed before the main content
   */
  preMessage?: string;

  /**
   * Main body content (HTML allowed)
   */
  bodyContent: string;

  /**
   * Message displayed after the main content
   */
  postMessage?: string;

  /**
   * Warning message (e.g., "If you didn't request this...")
   */
  warningMessage?: string;

  /**
   * Optional footer text (defaults to standard automated message)
   */
  footerText?: string;
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Generate base email template
 */
export function getBaseEmailTemplate(params: BaseEmailParams): string {
  const {
    title,
    userName,
    preMessage,
    bodyContent,
    postMessage,
    warningMessage,
    footerText,
  } = params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 30px;
        }
        .otp-code {
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
        }
        .message {
          color: #6b7280;
          margin: 20px 0;
        }
        .warning {
          color: #dc2626;
          font-size: 14px;
          margin-top: 30px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #9ca3af;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Align Designs</div>

        <h1>${escapeHtml(title)}</h1>

        ${preMessage ? `<p class="message">${preMessage.replace('{userName}', escapeHtml(userName))}</p>` : ''}

        ${bodyContent}

        ${postMessage ? `<p class="message">${postMessage}</p>` : ''}

        ${warningMessage ? `<p class="warning">⚠️ ${warningMessage}</p>` : ''}

        <div class="footer">
          <p>${footerText || 'This is an automated message, please do not reply.'}</p>
          <p>&copy; ${new Date().getFullYear()} Align Designs. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate OTP code display HTML
 */
export function getOtpCodeHtml(otpCode: string): string {
  return `<div class="otp-code">${escapeHtml(otpCode)}</div>`;
}
