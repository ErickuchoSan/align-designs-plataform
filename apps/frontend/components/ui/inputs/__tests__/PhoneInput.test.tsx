import {
  describe,
  it,
  expect,
  render,
  screen,
  fireEvent,
  createMockOnChange,
  testInputRendersCorrectly,
  testInputHandlesCustomPlaceholder,
  testInputHandlesRequiredValidation,
  getInputByPlaceholder,
  changeInput,
} from './test-utils';
import PhoneInput from '../PhoneInput';

const DEFAULT_PLACEHOLDER = 'Phone number';

describe('PhoneInput', () => {
  const mockOnChange = createMockOnChange();

  it('renders correctly', () => {
    testInputRendersCorrectly(PhoneInput, mockOnChange, DEFAULT_PLACEHOLDER);
    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('handles custom placeholder', () => {
    testInputHandlesCustomPlaceholder(PhoneInput, mockOnChange, 'Mobile number');
  });

  it('handles required validation', () => {
    testInputHandlesRequiredValidation(PhoneInput, mockOnChange, DEFAULT_PLACEHOLDER);
  });

  it('allows only numeric input', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    changeInput(input, 'abc123def456');
    expect(mockOnChange).toHaveBeenCalledWith('+1 123456');
  });

  it('limits input to 10 digits', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    changeInput(input, '1234567890123456');
    expect(mockOnChange).toHaveBeenCalledWith('+1 1234567890');
  });

  it('formats US phone numbers correctly', () => {
    render(<PhoneInput value="+1 5551234567" onChange={mockOnChange} />);
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
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
    changeInput(searchInput, 'Mexico');
    expect(screen.getByText('Mexico')).toBeInTheDocument();
    expect(screen.queryByText('Canada')).not.toBeInTheDocument();
  });

  it('handles initial value with country code', () => {
    render(<PhoneInput value="+52 5551234567" onChange={mockOnChange} />);
    expect(screen.getByText('🇲🇽')).toBeInTheDocument();
    expect(screen.getByText('+52')).toBeInTheDocument();
    const input = getInputByPlaceholder(DEFAULT_PLACEHOLDER);
    expect(input).toHaveValue('5551234567');
  });
});
