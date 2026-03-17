import {
  describe,
  it,
  expect,
  render,
  screen,
  waitFor,
  createMockOnChange,
  testInputHandlesCustomPlaceholder,
  testInputHandlesRequiredValidation,
  getInputByPlaceholder,
  changeInput,
} from './test-utils';
import EmailInput from '../EmailInput';

const DEFAULT_PLACEHOLDER = 'Email address';

describe('EmailInput', () => {
  const mockOnChange = createMockOnChange();

  it('renders correctly', () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    expect(screen.getByPlaceholderText(DEFAULT_PLACEHOLDER)).toBeInTheDocument();
  });

  it('handles custom placeholder', () => {
    testInputHandlesCustomPlaceholder(EmailInput, mockOnChange, 'Work email');
  });

  it('handles required validation', () => {
    testInputHandlesRequiredValidation(EmailInput, mockOnChange, DEFAULT_PLACEHOLDER);
  });

  it('validates basic email format', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    changeInput(input, 'invalid-email');

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates correct email formats', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);

    changeInput(input, 'user@example.com');
    await waitFor(() => {
      expect(screen.getByText('Email address is valid')).toBeInTheDocument();
    });

    changeInput(input, 'john.doe@company.org');
    await waitFor(() => {
      expect(screen.getByText('Email address is valid')).toBeInTheDocument();
    });
  });

  it('rejects emails without @ symbol', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    changeInput(input, 'userexample.com');

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('rejects emails without domain', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    changeInput(input, 'user@');

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('rejects emails that start with dot', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    changeInput(input, '.user@example.com');

    await waitFor(() => {
      expect(screen.getByText('Username cannot start or end with a dot')).toBeInTheDocument();
    });
  });

  it('rejects emails that end with dot', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    changeInput(input, 'user.@example.com');

    await waitFor(() => {
      expect(screen.getByText('Username cannot start or end with a dot')).toBeInTheDocument();
    });
  });

  it('rejects emails with consecutive dots', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    changeInput(input, 'user..name@example.com');

    await waitFor(() => {
      expect(screen.getByText('Username cannot contain consecutive dots')).toBeInTheDocument();
    });
  });

  it('rejects temporary email domains', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    changeInput(input, 'user@tempmail.com');

    await waitFor(() => {
      expect(screen.getByText('Temporary email addresses are not allowed')).toBeInTheDocument();
    });
  });

  it('rejects emails with invalid characters', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    changeInput(input, 'user space@example.com');

    await waitFor(() => {
      expect(screen.getByText('Invalid characters in username')).toBeInTheDocument();
    });
  });

  it('shows warning for business emails', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    changeInput(input, 'user@microsoft.com');

    await waitFor(() => {
      expect(screen.getByText('Business email detected - please ensure this is your email')).toBeInTheDocument();
    });
  });

  it('shows loading state during validation', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    changeInput(input, 'test@example.com');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('validates after 3 characters', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);

    changeInput(input, 'us');
    await waitFor(() => {
      expect(screen.queryByText('Email address is valid')).not.toBeInTheDocument();
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });

    changeInput(input, 'user@example.com');
    await waitFor(() => {
      expect(screen.getByText('Email address is valid')).toBeInTheDocument();
    });
  });
});
