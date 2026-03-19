import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PasswordInput from '../PasswordInput';

describe('PasswordInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with placeholder', () => {
    render(<PasswordInput value="" onChange={mockOnChange} />);
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders with custom placeholder', () => {
    render(<PasswordInput value="" onChange={mockOnChange} placeholder="Enter password" />);
    expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
  });

  it('handles required attribute', () => {
    render(<PasswordInput value="" onChange={mockOnChange} required />);
    expect(screen.getByPlaceholderText('Password')).toBeRequired();
  });

  it('starts with password hidden', () => {
    render(<PasswordInput value="test123" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles password visibility', () => {
    render(<PasswordInput value="test123" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Password');
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    // Initially hidden
    expect(input).toHaveAttribute('type', 'password');

    // Click to show
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');

    // Click to hide again
    fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('calls onChange on input', () => {
    render(<PasswordInput value="" onChange={mockOnChange} />);
    const input = screen.getByPlaceholderText('Password');
    fireEvent.change(input, { target: { value: 'newpassword' } });
    expect(mockOnChange).toHaveBeenCalledWith('newpassword');
  });

  it('shows strength indicator when value is present', () => {
    render(<PasswordInput value="test" onChange={mockOnChange} />);
    expect(screen.getByText('Password Strength')).toBeInTheDocument();
  });

  it('hides strength indicator when disabled', () => {
    render(<PasswordInput value="test" onChange={mockOnChange} showStrengthIndicator={false} />);
    expect(screen.queryByText('Password Strength')).not.toBeInTheDocument();
  });

  // Password strength tests based on actual algorithm:
  // score = count of: length>=12, uppercase, lowercase, number, symbol
  // 0-1: Very Weak, 2: Weak, 3: Fair, 4: Good, 5: Strong

  it('shows Very Weak for simple passwords', () => {
    // "abc" = lowercase only = score 1 = Very Weak
    render(<PasswordInput value="abc" onChange={mockOnChange} />);
    expect(screen.getByText('Very Weak')).toBeInTheDocument();
  });

  it('shows Fair for passwords with mixed case and numbers', () => {
    // "Abc123" = uppercase + lowercase + number = score 3 = Fair
    render(<PasswordInput value="Abc123" onChange={mockOnChange} />);
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('shows Good for passwords with special chars', () => {
    // "Abc123!" = uppercase + lowercase + number + symbol = score 4 = Good
    render(<PasswordInput value="Abc123!" onChange={mockOnChange} />);
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('shows Strong for complete passwords', () => {
    // "MyP@ssw0rd123!" = length>=12 + all requirements = score 5 = Strong
    render(<PasswordInput value="MyP@ssw0rd123!" onChange={mockOnChange} />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });

  it('shows password requirements', () => {
    render(<PasswordInput value="test" onChange={mockOnChange} />);
    expect(screen.getByText('At least 12 characters')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('One lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('One number')).toBeInTheDocument();
    expect(screen.getByText('One special character')).toBeInTheDocument();
  });

  it('does not show strength indicator for empty value', () => {
    render(<PasswordInput value="" onChange={mockOnChange} />);
    expect(screen.queryByText('Password Strength')).not.toBeInTheDocument();
  });
});
