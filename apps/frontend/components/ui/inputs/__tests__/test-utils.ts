/**
 * Shared test utilities for input components
 * Reduces duplication across EmailInput, PhoneInput, and PasswordInput tests
 */
import { vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentType, ReactElement } from 'react';

// Re-export testing utilities for convenience
export { describe, it, expect, beforeEach, vi } from 'vitest';
export { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * Common props interface for input components
 */
export interface BaseInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

/**
 * Creates a mock onChange function and resets it before each test
 */
export function createMockOnChange() {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  return mockOnChange;
}

/**
 * Common test cases that apply to all input components
 */
export function testInputRendersCorrectly<P extends BaseInputProps>(
  Component: ComponentType<P>,
  mockOnChange: ReturnType<typeof vi.fn>,
  defaultPlaceholder: string,
  additionalProps?: Partial<P>,
) {
  const props = {
    value: '',
    onChange: mockOnChange,
    ...additionalProps,
  } as P;

  render(<Component {...props} /> as ReactElement);
  expect(screen.getByPlaceholderText(defaultPlaceholder)).toBeInTheDocument();
}

export function testInputHandlesCustomPlaceholder<P extends BaseInputProps>(
  Component: ComponentType<P>,
  mockOnChange: ReturnType<typeof vi.fn>,
  customPlaceholder: string,
  additionalProps?: Partial<P>,
) {
  const props = {
    value: '',
    onChange: mockOnChange,
    placeholder: customPlaceholder,
    ...additionalProps,
  } as P;

  render(<Component {...props} /> as ReactElement);
  expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
}

export function testInputHandlesRequiredValidation<P extends BaseInputProps>(
  Component: ComponentType<P>,
  mockOnChange: ReturnType<typeof vi.fn>,
  placeholder: string,
  additionalProps?: Partial<P>,
) {
  const props = {
    value: '',
    onChange: mockOnChange,
    required: true,
    ...additionalProps,
  } as P;

  render(<Component {...props} /> as ReactElement);
  expect(screen.getByPlaceholderText(placeholder)).toBeRequired();
}

/**
 * Helper to get input element by placeholder
 */
export function getInputByPlaceholder(placeholder: string) {
  return screen.getByPlaceholderText(placeholder);
}

/**
 * Helper to simulate input change
 */
export function changeInput(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
}
