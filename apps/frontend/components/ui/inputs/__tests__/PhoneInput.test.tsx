import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhoneInput from '../PhoneInput';

describe('PhoneInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with placeholder', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    expect(screen.getByPlaceholderText('Phone number')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<PhoneInput value="" onChange={mockOnChange} placeholder="Mobile number" />);
    expect(screen.getByPlaceholderText('Mobile number')).toBeInTheDocument();
  });

  it('handles required attribute', () => {
    render(<PhoneInput value="" onChange={mockOnChange} required />);
    expect(screen.getByPlaceholderText('Phone number')).toBeRequired();
  });

  it('allows only numeric input', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Phone number');
    fireEvent.change(input, { target: { value: 'abc123def456' } });
    // Should call onChange with only digits (default country code +1)
    expect(mockOnChange).toHaveBeenCalledWith('+1123456');
  });

  it('limits input to 10 digits', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Phone number');
    fireEvent.change(input, { target: { value: '12345678901234' } });
    expect(mockOnChange).toHaveBeenCalledWith('+11234567890');
  });

  it('formats display value for complete numbers', async () => {
    render(<PhoneInput value="+15551234567" onChange={mockOnChange} />);
    // Wait for async state update
    await waitFor(() => {
      const input = screen.getByPlaceholderText('Phone number');
      expect(input).toHaveValue('(555) 123-4567');
    });
  });

  it('shows validation message for incomplete numbers', async () => {
    render(<PhoneInput value="+1123" onChange={mockOnChange} />);
    await waitFor(() => {
      expect(screen.getByText('7 digits remaining')).toBeInTheDocument();
    });
  });

  it('shows success message for complete numbers', async () => {
    render(<PhoneInput value="+15551234567" onChange={mockOnChange} />);
    await waitFor(() => {
      expect(screen.getByText('Valid phone number')).toBeInTheDocument();
    });
  });

  it('renders country code selector', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    // The selector shows the dial code
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('opens country selector on click', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    fireEvent.click(screen.getByText('+1'));
    // Search input should appear
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });
});
