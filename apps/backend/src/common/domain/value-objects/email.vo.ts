import { BadRequestException } from '@nestjs/common';

/**
 * Email Value Object
 * Represents an immutable, validated email address
 * Encapsulates email validation logic
 */
export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email;
  }

  /**
   * Factory method to create Email value object
   * Validates email format before creation
   */
  static create(email: string): Email {
    const normalized = email.toLowerCase().trim();

    if (!normalized) {
      throw new BadRequestException('Email cannot be empty');
    }

    // RFC 5322 compliant email regex (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      throw new BadRequestException('Invalid email format');
    }

    return new Email(normalized);
  }

  /**
   * Get email value
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Get email domain
   */
  getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * Check if emails are equal
   */
  equals(other: Email): boolean {
    return this.value === other.value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value;
  }
}
