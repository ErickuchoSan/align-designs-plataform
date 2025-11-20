import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizes HTML input to prevent XSS attacks
 * Uses sanitize-html library with strict configuration
 * Removes all HTML tags, scripts, and dangerous content
 */
export function Sanitize() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    // Use sanitize-html with strict configuration
    // This removes all HTML tags, scripts, and dangerous content
    const sanitized = sanitizeHtml(value, {
      allowedTags: [], // No HTML tags allowed
      allowedAttributes: {}, // No attributes allowed
      disallowedTagsMode: 'discard', // Remove disallowed tags completely
      // Additional security options
      allowProtocolRelative: false,
      enforceHtmlBoundary: true,
    });

    return sanitized.trim();
  });
}
