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
  changeInput,
} from './test-utils';
import PhoneInput from '../PhoneInput';

const PLACEHOLDER = 'Phone number';

describe('PhoneInput', () => {
  const mockOnChange = createMockOnChange();

  it('renders correctly', () => {
    renderAndGetInput(PhoneInput, mockOnChange, PLACEHOLDER);
    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('handles custom placeholder', () => {
    testInputHandlesCustomPlaceholder(PhoneInput, mockOnChange, 'Mobile number');
  });

  it('handles required validation', () => {
    testInputHandlesRequiredValidation(PhoneInput, mockOnChange, PLACEHOLDER);
  });

  it('allows only numeric input', () => {
    const input = renderAndGetInput(PhoneInput, mockOnChange, PLACEHOLDER);
    changeInput(input, 'abc123def456');
    expect(mockOnChange).toHaveBeenCalledWith('+1 123456');
  });

  it('limits input to 10 digits', () => {
    const input = renderAndGetInput(PhoneInput, mockOnChange, PLACEHOLDER);
    changeInput(input, '1234567890123456');
    expect(mockOnChange).toHaveBeenCalledWith('+1 1234567890');
  });

  it('formats US phone numbers correctly', () => {
    const input = renderAndGetInput(PhoneInput, mockOnChange, PLACEHOLDER, '+1 5551234567');
    expect(input).toHaveValue('(555) 123-4567');
  });

  it('shows validation message for incomplete numbers', () => {
    renderAndGetInput(PhoneInput, mockOnChange, PLACEHOLDER, '+1 123');
    expect(screen.getByText('7 digits remaining')).toBeInTheDocument();
  });

  it('shows success message for complete numbers', () => {
    renderAndGetInput(PhoneInput, mockOnChange, PLACEHOLDER, '+1 5551234567');
    expect(screen.getByText('Valid phone number')).toBeInTheDocument();
  });

  it('allows country code selection', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    fireEvent.click(screen.getByText('+1'));
    expect(screen.getByPlaceholderText('Search by country name or code...')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Mexico'));
    expect(mockOnChange).toHaveBeenCalledWith('+52 ');
  });

  it('filters countries by search term', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    fireEvent.click(screen.getByText('+1'));

    changeInput(screen.getByPlaceholderText('Search by country name or code...'), 'Mexico');
    expect(screen.getByText('Mexico')).toBeInTheDocument();
    expect(screen.queryByText('Canada')).not.toBeInTheDocument();
  });

  it('handles initial value with country code', () => {
    const input = renderAndGetInput(PhoneInput, mockOnChange, PLACEHOLDER, '+52 5551234567');
    expect(screen.getByText('🇲🇽')).toBeInTheDocument();
    expect(screen.getByText('+52')).toBeInTheDocument();
    expect(input).toHaveValue('5551234567');
  });
});
