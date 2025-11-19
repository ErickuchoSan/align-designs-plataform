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
        return true;
      }
    }

    return false;
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
