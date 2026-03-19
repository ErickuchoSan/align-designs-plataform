import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailInput from '../EmailInput';

describe('EmailInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with placeholder', () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<EmailInput value="" onChange={mockOnChange} placeholder="Work email" />);
    expect(screen.getByPlaceholderText('Work email')).toBeInTheDocument();
  });

  it('handles required attribute', () => {
    render(<EmailInput value="" onChange={mockOnChange} required />);
    expect(screen.getByPlaceholderText('Email address')).toBeRequired();
  });

  it('calls onChange on input', () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    expect(mockOnChange).toHaveBeenCalledWith('test@example.com');
  });

  it('shows spinner during validation', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'test@example.com' } });

    // Should show spinner (svg with animate-spin class)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('validates correct email format', async () => {
    render(<EmailInput value="user@example.com" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'user@example.com' } });

    await waitFor(() => {
      expect(screen.getByText('Email address is valid')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('validates invalid email format', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'invalid-email' } });

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('validates email with dot issues', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: '.user@example.com' } });

    await waitFor(() => {
      expect(screen.getByText('Username cannot start or end with a dot')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('validates email with consecutive dots', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'user..name@example.com' } });

    await waitFor(() => {
      expect(screen.getByText('Username cannot contain consecutive dots')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('does not validate short inputs', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'us' } });

    // Wait and verify no validation message appears
    await waitFor(() => {
      expect(screen.queryByText('Email address is valid')).not.toBeInTheDocument();
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    }, { timeout: 100 });
  });
});
