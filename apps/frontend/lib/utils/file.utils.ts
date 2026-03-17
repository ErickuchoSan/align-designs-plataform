/**
 * File utility functions
 * Pure functions for file operations and formatting
 */

/**
 * Format bytes to human-readable file size
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 * @param filename - Full filename with extension
 * @returns File extension in lowercase (without dot)
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.at(-1)!.toLowerCase() : '';
}

/**
 * Get MIME type from file extension
 * @param extension - File extension (without dot)
 * @returns MIME type string
 */
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',

    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    // Text
    txt: 'text/plain',
    csv: 'text/csv',

    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',

    // Video
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',

    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Check if file is an image based on extension
 * @param filename - Full filename with extension
 * @returns True if file is an image
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const ext = getFileExtension(filename);
  return imageExtensions.includes(ext);
}

/**
 * Check if file is a document based on extension
 * @param filename - Full filename with extension
 * @returns True if file is a document
 */
export function isDocumentFile(filename: string): boolean {
  const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
  const ext = getFileExtension(filename);
  return docExtensions.includes(ext);
}

/**
 * Validate file size
 * @param bytes - File size in bytes
 * @param maxBytes - Maximum allowed file size in bytes
 * @returns True if file size is valid
 */
export function isValidFileSize(bytes: number, maxBytes: number): boolean {
  return bytes > 0 && bytes <= maxBytes;
}

/**
 * Sanitize filename for safe storage
 * @param filename - Original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove any path components
  const basename = filename.replace(/^.*[\\/]/, '');

  // Replace unsafe characters
  return basename.replaceAll(/[^a-zA-Z0-9._-]/g, '_');
}
