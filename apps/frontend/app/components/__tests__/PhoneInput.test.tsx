import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PhoneInput from '../PhoneInput';

describe('PhoneInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders correctly', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    
    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Phone number')).toBeInTheDocument();
  });

  it('allows only numeric input', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Phone number');
    fireEvent.change(input, { target: { value: 'abc123def456' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('+1 123456');
  });

  it('limits input to 10 digits', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Phone number');
    fireEvent.change(input, { target: { value: '1234567890123456' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('+1 1234567890');
  });

  it('formats US phone numbers correctly', () => {
    render(<PhoneInput value="+1 5551234567" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Phone number');
    expect(input).toHaveValue('(555) 123-4567');
  });

  it('shows validation message for incomplete numbers', () => {
    render(<PhoneInput value="+1 123" onChange={mockOnChange} />);
    
    expect(screen.getByText('7 digits remaining')).toBeInTheDocument();
  });

  it('shows success message for complete numbers', () => {
    render(<PhoneInput value="+1 5551234567" onChange={mockOnChange} />);
    
    expect(screen.getByText('Valid phone number')).toBeInTheDocument();
  });

  it('allows country code selection', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    
    const countrySelector = screen.getByText('+1');
    fireEvent.click(countrySelector);
    
    expect(screen.getByPlaceholderText('Search by country name or code...')).toBeInTheDocument();
    
    const mexicoOption = screen.getByText('Mexico');
    fireEvent.click(mexicoOption);
    
    expect(mockOnChange).toHaveBeenCalledWith('+52 ');
  });

  it('filters countries by search term', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    
    const countrySelector = screen.getByText('+1');
    fireEvent.click(countrySelector);
    
    const searchInput = screen.getByPlaceholderText('Search by country name or code...');
    fireEvent.change(searchInput, { target: { value: 'Mexico' } });
    
    expect(screen.getByText('Mexico')).toBeInTheDocument();
    expect(screen.queryByText('Canada')).not.toBeInTheDocument();
  });

  it('handles required validation', () => {
    render(<PhoneInput value="" onChange={mockOnChange} required />);
    
    const input = screen.getByPlaceholderText('Phone number');
    expect(input).toBeRequired();
  });

  it('handles custom placeholder', () => {
    render(<PhoneInput value="" onChange={mockOnChange} placeholder="Mobile number" />);
    
    expect(screen.getByPlaceholderText('Mobile number')).toBeInTheDocument();
  });

  it('handles initial value with country code', () => {
    render(<PhoneInput value="+52 5551234567" onChange={mockOnChange} />);
    
    expect(screen.getByText('🇲🇽')).toBeInTheDocument();
    expect(screen.getByText('+52')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Phone number');
    expect(input).toHaveValue('5551234567');
  });
});