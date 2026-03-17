import {
  describe,
  it,
  expect,
  screen,
  createMockOnChange,
  testInputHandlesCustomPlaceholder,
  testInputHandlesRequiredValidation,
  renderAndGetInput,
  changeInput,
  testAsyncValidationMessage,
} from './test-utils';
import EmailInput from '../EmailInput';

const PLACEHOLDER = 'Email address';

// Common test data
const VALIDATION_TESTS = [
  { input: 'invalid-email', message: 'Please enter a valid email address' },
  { input: 'userexample.com', message: 'Please enter a valid email address' },
  { input: 'user@', message: 'Please enter a valid email address' },
  { input: '.user@example.com', message: 'Username cannot start or end with a dot' },
  { input: 'user.@example.com', message: 'Username cannot start or end with a dot' },
  { input: 'user..name@example.com', message: 'Username cannot contain consecutive dots' },
  { input: 'user@tempmail.com', message: 'Temporary email addresses are not allowed' },
  { input: 'user space@example.com', message: 'Invalid characters in username' },
] as const;

describe('EmailInput', () => {
  const mockOnChange = createMockOnChange();

  it('renders correctly', () => {
    renderAndGetInput(EmailInput, mockOnChange, PLACEHOLDER);
  });

  it('handles custom placeholder', () => {
    testInputHandlesCustomPlaceholder(EmailInput, mockOnChange, 'Work email');
  });

  it('handles required validation', () => {
    testInputHandlesRequiredValidation(EmailInput, mockOnChange, PLACEHOLDER);
  });

  // Data-driven validation tests
  describe.each(VALIDATION_TESTS)('email validation', ({ input, message }) => {
    it(`rejects "${input}"`, async () => {
      await testAsyncValidationMessage(EmailInput, mockOnChange, PLACEHOLDER, input, message);
    });
  });

  it('validates correct email formats', async () => {
    await testAsyncValidationMessage(EmailInput, mockOnChange, PLACEHOLDER, 'user@example.com', 'Email address is valid');
  });

  it('shows warning for business emails', async () => {
    await testAsyncValidationMessage(EmailInput, mockOnChange, PLACEHOLDER, 'user@microsoft.com', 'Business email detected - please ensure this is your email');
  });

  it('shows loading state during validation', () => {
    const input = renderAndGetInput(EmailInput, mockOnChange, PLACEHOLDER);
    changeInput(input, 'test@example.com');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not validate with less than 3 characters', async () => {
    const { waitFor } = await import('@testing-library/react');
    const input = renderAndGetInput(EmailInput, mockOnChange, PLACEHOLDER);
    changeInput(input, 'us');
    await waitFor(() => {
      expect(screen.queryByText('Email address is valid')).not.toBeInTheDocument();
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });
  });
});
