import { BadRequestException } from '@nestjs/common';

interface FileSignature {
  mimeType: string;
  extensions: string[];
  signatures: number[][];
}

const FILE_SIGNATURES: FileSignature[] = [
  // Images
  {
    mimeType: 'image/jpeg',
    extensions: ['jpg', 'jpeg'],
    signatures: [[0xff, 0xd8, 0xff]],
  },
  {
    mimeType: 'image/png',
    extensions: ['png'],
    signatures: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  },
  {
    mimeType: 'image/gif',
    extensions: ['gif'],
    signatures: [[0x47, 0x49, 0x46, 0x38]],
  },
  {
    mimeType: 'image/webp',
    extensions: ['webp'],
    signatures: [[0x52, 0x49, 0x46, 0x46]],
  },
  {
    mimeType: 'image/svg+xml',
    extensions: ['svg'],
    // SVG files are XML-based, start with < or <?xml
    signatures: [
      [0x3c, 0x3f, 0x78, 0x6d, 0x6c], // <?xml
      [0x3c, 0x73, 0x76, 0x67], // <svg
    ],
  },
  {
    mimeType: 'image/vnd.adobe.photoshop',
    extensions: ['psd'],
    signatures: [[0x38, 0x42, 0x50, 0x53]], // 8BPS
  },
  {
    mimeType: 'application/postscript',
    extensions: ['ai', 'eps'],
    signatures: [[0x25, 0x21, 0x50, 0x53]], // %!PS
  },
  // PDF
  {
    mimeType: 'application/pdf',
    extensions: ['pdf'],
    signatures: [[0x25, 0x50, 0x44, 0x46]],
  },
  // Documents
  {
    mimeType: 'application/msword',
    extensions: ['doc'],
    signatures: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  },
  {
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['docx'],
    signatures: [[0x50, 0x4b, 0x03, 0x04]],
  },
  {
    mimeType: 'application/vnd.ms-excel',
    extensions: ['xls'],
    signatures: [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]],
  },
  {
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['xlsx'],
    signatures: [[0x50, 0x4b, 0x03, 0x04]],
  },
  // ZIP
  {
    mimeType: 'application/zip',
    extensions: ['zip'],
    signatures: [[0x50, 0x4b, 0x03, 0x04]],
  },
  // RAR
  {
    mimeType: 'application/x-rar-compressed',
    extensions: ['rar'],
    signatures: [
      [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00], // Rar! (RAR 1.5+)
      [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00], // Rar! (RAR 5.0+)
    ],
  },
  // 7Z
  {
    mimeType: 'application/x-7z-compressed',
    extensions: ['7z'],
    signatures: [[0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]], // 7z¼¯'
  },
  // Video - MOV/QuickTime
  {
    mimeType: 'video/quicktime',
    extensions: ['mov', 'qt'],
    // MOV files have 'ftyp' at offset 4
    signatures: [
      [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], // ....ftyp
      [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ....ftyp
      [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70], // ....ftyp
      [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // ... ftyp
    ],
  },
  // Text
  {
    mimeType: 'text/plain',
    extensions: ['txt'],
    signatures: [], // Text files don't have a specific signature
  },
];

export class FileMagicNumberValidator {
  static validateFileSignature(
    fileBuffer: Buffer,
    claimedMimeType: string,
  ): boolean {
    const signature = FILE_SIGNATURES.find(
      (sig) => sig.mimeType === claimedMimeType,
    );

    if (!signature) {
      // If we don't have a signature for this type, allow it
      return true;
    }

    if (signature.signatures.length === 0) {
      // For types without signatures (like text/plain), allow them
      return true;
    }

    // Check if file matches any of the known signatures
    for (const sigPattern of signature.signatures) {
      if (this.matchesSignature(fileBuffer, sigPattern)) {
        // Additional validation for SVG files (XSS protection)
        if (claimedMimeType === 'image/svg+xml') {
          return this.validateSvgContent(fileBuffer);
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Validates SVG content for potentially malicious scripts
   * Rejects SVG files containing <script>, on* event handlers, or javascript: URLs
   */
  private static validateSvgContent(fileBuffer: Buffer): boolean {
    const content = fileBuffer.toString('utf-8');

    // Check for script tags (case-insensitive)
    if (/<script[\s>]/i.test(content)) {
      throw new BadRequestException(
        'SVG files with <script> tags are not allowed for security reasons',
      );
    }

    // Check for event handlers (onclick, onload, etc.)
    if (/\son\w+\s*=/i.test(content)) {
      throw new BadRequestException(
        'SVG files with event handlers (onclick, onload, etc.) are not allowed for security reasons',
      );
    }

    // Check for javascript: URLs
    if (/javascript:/i.test(content)) {
      throw new BadRequestException(
        'SVG files with javascript: URLs are not allowed for security reasons',
      );
    }

    // Check for data: URLs with text/html or application/javascript
    if (/data:(?:text\/html|application\/(?:java|ecma)script)/i.test(content)) {
      throw new BadRequestException(
        'SVG files with executable data URLs are not allowed for security reasons',
      );
    }

    return true;
  }

  private static matchesSignature(
    fileBuffer: Buffer,
    signature: number[],
  ): boolean {
    if (fileBuffer.length < signature.length) {
      return false;
    }

    for (let i = 0; i < signature.length; i++) {
      if (fileBuffer[i] !== signature[i]) {
        return false;
      }
    }

    return true;
  }

  static getExpectedTypes(mimeType: string): string[] {
    const signature = FILE_SIGNATURES.find((sig) => sig.mimeType === mimeType);
    return signature?.extensions || [];
  }
}
