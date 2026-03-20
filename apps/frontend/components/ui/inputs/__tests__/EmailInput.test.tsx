import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailInput from '../EmailInput';

// Helper to reduce test duplication
const renderEmailInput = (props: { value?: string; placeholder?: string; required?: boolean } = {}) => {
  const mockOnChange = vi.fn();
  const result = render(
    <EmailInput value={props.value ?? ''} onChange={mockOnChange} placeholder={props.placeholder} required={props.required} />
  );
  return { ...result, mockOnChange, input: screen.getByPlaceholderText(props.placeholder ?? 'Email address') };
};

const typeAndExpectMessage = async (input: HTMLElement, email: string, expectedMessage: string) => {
  fireEvent.change(input, { target: { value: email } });
  await waitFor(() => {
    expect(screen.getByText(expectedMessage)).toBeInTheDocument();
  }, { timeout: 500 });
};

describe('EmailInput', () => {
  describe('rendering', () => {
    it('renders with default placeholder', () => {
      renderEmailInput();
      expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      renderEmailInput({ placeholder: 'Work email' });
      expect(screen.getByPlaceholderText('Work email')).toBeInTheDocument();
    });

    it('handles required attribute', () => {
      const { input } = renderEmailInput({ required: true });
      expect(input).toBeRequired();
    });
  });

  describe('onChange behavior', () => {
    it('calls onChange on input', () => {
      const { input, mockOnChange } = renderEmailInput();
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      expect(mockOnChange).toHaveBeenCalledWith('test@example.com');
    });

    it('shows spinner during validation', () => {
      const { input } = renderEmailInput();
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('email validation', () => {
    it('accepts valid email', async () => {
      const { input } = renderEmailInput({ value: 'user@example.com' });
      await typeAndExpectMessage(input, 'user@example.com', 'Email address is valid');
    });

    it('rejects invalid format', async () => {
      const { input } = renderEmailInput();
      await typeAndExpectMessage(input, 'invalid-email', 'Please enter a valid email address');
    });

    it('rejects email starting with dot', async () => {
      const { input } = renderEmailInput();
      await typeAndExpectMessage(input, '.user@example.com', 'Username cannot start or end with a dot');
    });

    it('rejects email with consecutive dots', async () => {
      const { input } = renderEmailInput();
      await typeAndExpectMessage(input, 'user..name@example.com', 'Username cannot contain consecutive dots');
    });

    it('skips validation for short inputs', async () => {
      const { input } = renderEmailInput();
      fireEvent.change(input, { target: { value: 'us' } });
      await waitFor(() => {
        expect(screen.queryByText('Email address is valid')).not.toBeInTheDocument();
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      }, { timeout: 100 });
    });
  });
});
