import { Transform } from 'class-transformer';

/**
 * Sanitizes HTML input to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 */
export function Sanitize() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    // Remove HTML tags
    let sanitized = value.replace(/<[^>]*>/g, '');

    // Remove script content
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      '',
    );

    // Remove dangerous characters and encode special chars
    sanitized = sanitized
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '');

    return sanitized.trim();
  });
}
