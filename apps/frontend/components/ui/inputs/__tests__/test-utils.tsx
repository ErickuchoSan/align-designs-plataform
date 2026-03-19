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

/**
 * Render component and return input element - reduces render + getInput pattern
 */
export function renderAndGetInput<P extends BaseInputProps>(
  Component: ComponentType<P>,
  mockOnChange: ReturnType<typeof vi.fn>,
  placeholder: string,
  value = '',
  additionalProps?: Partial<P>,
) {
  const props = { value, onChange: mockOnChange, ...additionalProps } as P;
  render(<Component {...props} /> as ReactElement);
  return getInputByPlaceholder(placeholder);
}

/**
 * Test async validation - common pattern for email validation tests
 * Renders component, changes input, waits for expected message
 */
export async function testAsyncValidationMessage<P extends BaseInputProps>(
  Component: ComponentType<P>,
  mockOnChange: ReturnType<typeof vi.fn>,
  placeholder: string,
  inputValue: string,
  expectedMessage: string,
) {
  const { waitFor } = await import('@testing-library/react');
  const input = renderAndGetInput(Component, mockOnChange, placeholder);
  changeInput(input, inputValue);
  await waitFor(() => {
    expect(screen.getByText(expectedMessage)).toBeInTheDocument();
  });
}

/**
 * Test that a message does NOT appear after input
 */
export async function testAsyncValidationNoMessage<P extends BaseInputProps>(
  Component: ComponentType<P>,
  mockOnChange: ReturnType<typeof vi.fn>,
  placeholder: string,
  inputValue: string,
  unexpectedMessage: string,
) {
  const { waitFor } = await import('@testing-library/react');
  const input = renderAndGetInput(Component, mockOnChange, placeholder);
  changeInput(input, inputValue);
  await waitFor(() => {
    expect(screen.queryByText(unexpectedMessage)).not.toBeInTheDocument();
  });
}

/**
 * Password strength test data - NOT real credentials, just test fixtures
 * for validating the password strength indicator component
 */
// NOSONAR: These are test fixtures for password strength validation, not real credentials
export const PASSWORD_STRENGTH_TESTS = [
  { password: 'abc', strength: 'Very Weak' },
  { password: 'Abc123', strength: 'Weak' },
  { password: 'Abc123!', strength: 'Fair' },
  { password: 'Abc123!@', strength: 'Good' },
  { password: 'MyP@ssw0rd123!', strength: 'Strong' }, // NOSONAR
] as const;

export const PASSWORD_REQUIREMENTS = [
  'At least 12 characters',
  'One uppercase letter',
  'One lowercase letter',
  'One number',
  'One special character',
] as const;
