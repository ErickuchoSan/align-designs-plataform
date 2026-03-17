import {
  describe,
  it,
  expect,
  render,
  screen,
  fireEvent,
  createMockOnChange,
  testInputHandlesCustomPlaceholder,
  testInputHandlesRequiredValidation,
  getInputByPlaceholder,
  changeInput,
} from './test-utils';
import PasswordInput from '../PasswordInput';

const DEFAULT_PLACEHOLDER = 'Password';

describe('PasswordInput', () => {
  const mockOnChange = createMockOnChange();

  it('renders correctly', () => {
    render(<PasswordInput value="" onChange={mockOnChange} />);
    expect(screen.getByPlaceholderText(DEFAULT_PLACEHOLDER)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('handles custom placeholder', () => {
    testInputHandlesCustomPlaceholder(PasswordInput, mockOnChange, 'Enter password');
  });

  it('handles required validation', () => {
    testInputHandlesRequiredValidation(PasswordInput, mockOnChange, DEFAULT_PLACEHOLDER);
  });

  it('toggles password visibility', () => {
    render(<PasswordInput value="test123" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    expect(input).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByLabelText(/password/i);
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('shows password strength indicator when value is present', () => {
    render(<PasswordInput value="test" onChange={mockOnChange} />);
    expect(screen.getByText('Password Strength')).toBeInTheDocument();
    expect(screen.getByText('Very Weak')).toBeInTheDocument();
  });

  it('hides password strength indicator when disabled', () => {
    render(<PasswordInput value="test" onChange={mockOnChange} showStrengthIndicator={false} />);
    expect(screen.queryByText('Password Strength')).not.toBeInTheDocument();
  });

  it('calculates password strength correctly', () => {
    const { rerender } = render(<PasswordInput value="" onChange={mockOnChange} />);

    // Very weak (1 requirement met)
    rerender(<PasswordInput value="abc" onChange={mockOnChange} />);
    expect(screen.getByText('Very Weak')).toBeInTheDocument();

    // Weak (2 requirements met)
    rerender(<PasswordInput value="Abc123" onChange={mockOnChange} />);
    expect(screen.getByText('Weak')).toBeInTheDocument();

    // Fair (3 requirements met)
    rerender(<PasswordInput value="Abc123!" onChange={mockOnChange} />);
    expect(screen.getByText('Fair')).toBeInTheDocument();

    // Good (4 requirements met)
    rerender(<PasswordInput value="Abc123!@" onChange={mockOnChange} />);
    expect(screen.getByText('Good')).toBeInTheDocument();

    // Strong (5 requirements met)
    rerender(<PasswordInput value="MyP@ssw0rd123!" onChange={mockOnChange} />);
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

  it('updates requirements checkmarks as password improves', () => {
    const { rerender } = render(<PasswordInput value="" onChange={mockOnChange} />);

    // Initially all requirements should be unchecked
    const uncheckedRequirements = screen.getAllByText(/✗/);
    expect(uncheckedRequirements.length).toBeGreaterThan(0);

    // Add lowercase
    rerender(<PasswordInput value="abc" onChange={mockOnChange} />);

    // Add uppercase
    rerender(<PasswordInput value="Abc" onChange={mockOnChange} />);

    // Add number
    rerender(<PasswordInput value="Abc123" onChange={mockOnChange} />);

    // Add special character
    rerender(<PasswordInput value="Abc123!" onChange={mockOnChange} />);

    // Add length
    rerender(<PasswordInput value="MyP@ssw0rd123!" onChange={mockOnChange} />);

    // All requirements should now be checked
    const checkedRequirements = screen.getAllByText(/✓/);
    expect(checkedRequirements.length).toBe(5);
  });

  it('changes input border color based on strength', () => {
    const { rerender } = render(<PasswordInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    expect(input).toHaveClass('border-stone-300');

    // Weak password
    rerender(<PasswordInput value="abc" onChange={mockOnChange} />);
    expect(input).toHaveClass('border-red-500');
    expect(input).toHaveClass('bg-red-50');

    // Fair password
    rerender(<PasswordInput value="Abc123!" onChange={mockOnChange} />);
    expect(input).toHaveClass('border-amber-500');
    expect(input).toHaveClass('bg-amber-50');

    // Strong password
    rerender(<PasswordInput value="MyP@ssw0rd123!" onChange={mockOnChange} />);
    expect(input).toHaveClass('border-green-500');
    expect(input).toHaveClass('bg-green-50');
  });

  it('shows password strength bar', () => {
    render(<PasswordInput value="Abc123!" onChange={mockOnChange} />);
    const strengthBar = screen.getByRole('progressbar');
    expect(strengthBar).toBeInTheDocument();
  });

  it('calls onChange handler', () => {
    render(<PasswordInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    changeInput(input, 'newpassword');
    expect(mockOnChange).toHaveBeenCalledWith('newpassword');
  });
});
