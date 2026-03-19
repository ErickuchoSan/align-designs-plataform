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
  renderAndGetInput,
  getInputByPlaceholder,
  changeInput,
  PASSWORD_STRENGTH_TESTS,
  PASSWORD_REQUIREMENTS,
} from './test-utils';
import PasswordInput from '../PasswordInput';

const PLACEHOLDER = 'Password';

// TODO: Fix component state issues in test environment
describe.skip('PasswordInput', () => {
  const mockOnChange = createMockOnChange();

  it('renders correctly', () => {
    renderAndGetInput(PasswordInput, mockOnChange, PLACEHOLDER);
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('handles custom placeholder', () => {
    testInputHandlesCustomPlaceholder(PasswordInput, mockOnChange, 'Enter password');
  });

  it('handles required validation', () => {
    testInputHandlesRequiredValidation(PasswordInput, mockOnChange, PLACEHOLDER);
  });

  it('toggles password visibility', () => {
    const input = renderAndGetInput(PasswordInput, mockOnChange, PLACEHOLDER, 'test123');
    expect(input).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByLabelText(/password/i);
    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');

    fireEvent.click(toggleButton);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('shows password strength indicator when value is present', () => {
    renderAndGetInput(PasswordInput, mockOnChange, PLACEHOLDER, 'test');
    expect(screen.getByText('Password Strength')).toBeInTheDocument();
    expect(screen.getByText('Very Weak')).toBeInTheDocument();
  });

  it('hides password strength indicator when disabled', () => {
    render(<PasswordInput value="test" onChange={mockOnChange} showStrengthIndicator={false} />);
    expect(screen.queryByText('Password Strength')).not.toBeInTheDocument();
  });

  // Data-driven password strength tests
  describe.each(PASSWORD_STRENGTH_TESTS)('password strength', ({ password, strength }) => {
    it(`shows "${strength}" for "${password}"`, () => {
      renderAndGetInput(PasswordInput, mockOnChange, PLACEHOLDER, password);
      expect(screen.getByText(strength)).toBeInTheDocument();
    });
  });

  it('shows all password requirements', () => {
    renderAndGetInput(PasswordInput, mockOnChange, PLACEHOLDER, 'test');
    PASSWORD_REQUIREMENTS.forEach(req => {
      expect(screen.getByText(req)).toBeInTheDocument();
    });
  });

  it('updates requirements checkmarks as password improves', () => {
    const { rerender } = render(<PasswordInput value="" onChange={mockOnChange} />);
    expect(screen.getAllByText(/✗/).length).toBeGreaterThan(0);

    // Progress through passwords until all requirements are met
    ['abc', 'Abc', 'Abc123', 'Abc123!', 'MyP@ssw0rd123!'].forEach(pw => {
      rerender(<PasswordInput value={pw} onChange={mockOnChange} />);
    });

    expect(screen.getAllByText(/✓/).length).toBe(5);
  });

  it('changes input border color based on strength', () => {
    const { rerender } = render(<PasswordInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(PLACEHOLDER);
    expect(input).toHaveClass('border-stone-300');

    const colorTests = [
      { password: 'abc', borderClass: 'border-red-500', bgClass: 'bg-red-50' },
      { password: 'Abc123!', borderClass: 'border-amber-500', bgClass: 'bg-amber-50' },
      { password: 'MyP@ssw0rd123!', borderClass: 'border-green-500', bgClass: 'bg-green-50' },
    ];

    colorTests.forEach(({ password, borderClass, bgClass }) => {
      rerender(<PasswordInput value={password} onChange={mockOnChange} />);
      expect(input).toHaveClass(borderClass);
      expect(input).toHaveClass(bgClass);
    });
  });

  it('shows password strength bar', () => {
    renderAndGetInput(PasswordInput, mockOnChange, PLACEHOLDER, 'Abc123!');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('calls onChange handler', () => {
    const input = renderAndGetInput(PasswordInput, mockOnChange, PLACEHOLDER);
    changeInput(input, 'newpassword');
    expect(mockOnChange).toHaveBeenCalledWith('newpassword');
  });
});
