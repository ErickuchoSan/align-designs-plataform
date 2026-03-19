import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoadingButton from '../LoadingButton';

describe('LoadingButton', () => {
  it('renders children', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<LoadingButton onClick={handleClick}>Click</LoadingButton>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<LoadingButton isLoading>Submit</LoadingButton>);
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('shows loading text when provided', () => {
    render(<LoadingButton isLoading loadingText="Loading...">Submit</LoadingButton>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('hides children when loading', () => {
    render(<LoadingButton isLoading>Submit</LoadingButton>);
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<LoadingButton disabled>Disabled</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when loading', () => {
    render(<LoadingButton isLoading>Loading</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not trigger click when disabled', () => {
    const handleClick = vi.fn();
    render(<LoadingButton disabled onClick={handleClick}>Click</LoadingButton>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not trigger click when loading', () => {
    const handleClick = vi.fn();
    render(<LoadingButton isLoading onClick={handleClick}>Click</LoadingButton>);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies variant styles', () => {
    const { rerender } = render(<LoadingButton variant="primary">Primary</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-navy-800');

    rerender(<LoadingButton variant="danger">Danger</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');

    rerender(<LoadingButton variant="secondary">Secondary</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-stone-200');
  });

  it('applies size styles', () => {
    const { rerender } = render(<LoadingButton size="sm">Small</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('text-xs');

    rerender(<LoadingButton size="lg">Large</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('text-base');
  });

  it('applies full width when specified', () => {
    render(<LoadingButton fullWidth>Full Width</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('applies custom className', () => {
    render(<LoadingButton className="custom-class">Custom</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('has aria-live attribute for accessibility', () => {
    render(<LoadingButton>Accessible</LoadingButton>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-live', 'polite');
  });
});
