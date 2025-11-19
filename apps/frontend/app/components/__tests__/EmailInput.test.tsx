import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailInput from '../EmailInput';

describe('EmailInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders correctly', () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
  });

  it('handles custom placeholder', () => {
    render(<EmailInput value="" onChange={mockOnChange} placeholder="Work email" />);
    
    expect(screen.getByPlaceholderText('Work email')).toBeInTheDocument();
  });

  it('handles required validation', () => {
    render(<EmailInput value="" onChange={mockOnChange} required />);
    
    expect(screen.getByPlaceholderText('Email address')).toBeRequired();
  });

  it('validates basic email format', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'invalid-email' } });
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates correct email formats', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Email address');
    
    // Valid emails
    fireEvent.change(input, { target: { value: 'user@example.com' } });
    await waitFor(() => {
      expect(screen.getByText('Email address is valid')).toBeInTheDocument();
    });
    
    fireEvent.change(input, { target: { value: 'john.doe@company.org' } });
    await waitFor(() => {
      expect(screen.getByText('Email address is valid')).toBeInTheDocument();
    });
  });

  it('rejects emails without @ symbol', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'userexample.com' } });
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('rejects emails without domain', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'user@' } });
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('rejects emails that start with dot', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: '.user@example.com' } });
    
    await waitFor(() => {
      expect(screen.getByText('Username cannot start or end with a dot')).toBeInTheDocument();
    });
  });

  it('rejects emails that end with dot', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'user.@example.com' } });
    
    await waitFor(() => {
      expect(screen.getByText('Username cannot start or end with a dot')).toBeInTheDocument();
    });
  });

  it('rejects emails with consecutive dots', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'user..name@example.com' } });
    
    await waitFor(() => {
      expect(screen.getByText('Username cannot contain consecutive dots')).toBeInTheDocument();
    });
  });

  it('rejects temporary email domains', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'user@tempmail.com' } });
    
    await waitFor(() => {
      expect(screen.getByText('Temporary email addresses are not allowed')).toBeInTheDocument();
    });
  });

  it('rejects emails with invalid characters', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'user space@example.com' } });
    
    await waitFor(() => {
      expect(screen.getByText('Invalid characters in username')).toBeInTheDocument();
    });
  });

  it('shows warning for business emails', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'user@microsoft.com' } });
    
    await waitFor(() => {
      expect(screen.getByText('Business email detected - please ensure this is your email')).toBeInTheDocument();
    });
  });

  it('shows loading state during validation', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Email address');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    // Should show loading spinner briefly
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('validates after 3 characters', async () => {
    render(<EmailInput value="" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Email address');
    
    // Should not validate with less than 3 characters
    fireEvent.change(input, { target: { value: 'us' } });
    await waitFor(() => {
      expect(screen.queryByText('Email address is valid')).not.toBeInTheDocument();
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });
    
    // Should validate with 3 or more characters
    fireEvent.change(input, { target: { value: 'user@example.com' } });
    await waitFor(() => {
      expect(screen.getByText('Email address is valid')).toBeInTheDocument();
    });
  });
});