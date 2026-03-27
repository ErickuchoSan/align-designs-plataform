import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToggleSwitch from '../ToggleSwitch';

describe('ToggleSwitch', () => {
  const defaultProps = {
    isActive: false,
    onToggle: vi.fn(),
    ariaLabel: 'Toggle switch',
  };

  it('renders as a switch button', () => {
    render(<ToggleSwitch {...defaultProps} />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    render(<ToggleSwitch {...defaultProps} ariaLabel="Activate user" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-label', 'Activate user');
  });

  it('has aria-checked false when inactive', () => {
    render(<ToggleSwitch {...defaultProps} isActive={false} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('has aria-checked true when active', () => {
    render(<ToggleSwitch {...defaultProps} isActive={true} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onToggle when clicked', () => {
    const handleToggle = vi.fn();
    render(<ToggleSwitch {...defaultProps} onToggle={handleToggle} />);

    fireEvent.click(screen.getByRole('switch'));
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('applies active styles when isActive is true', () => {
    render(<ToggleSwitch {...defaultProps} isActive={true} />);
    expect(screen.getByRole('switch')).toHaveClass('bg-[#C9A84C]');
  });

  it('applies inactive styles when isActive is false', () => {
    render(<ToggleSwitch {...defaultProps} isActive={false} />);
    expect(screen.getByRole('switch')).toHaveClass('bg-[#D0C5B2]');
  });

  it('is disabled when disabled prop is true', () => {
    render(<ToggleSwitch {...defaultProps} disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('does not call onToggle when disabled', () => {
    const handleToggle = vi.fn();
    render(<ToggleSwitch {...defaultProps} onToggle={handleToggle} disabled />);

    fireEvent.click(screen.getByRole('switch'));
    expect(handleToggle).not.toHaveBeenCalled();
  });

  it('applies disabled styles', () => {
    render(<ToggleSwitch {...defaultProps} disabled />);
    expect(screen.getByRole('switch')).toHaveClass('disabled:opacity-50');
  });

  it('renders in small size', () => {
    render(<ToggleSwitch {...defaultProps} size="sm" />);
    expect(screen.getByRole('switch')).toHaveClass('h-5', 'w-9');
  });

  it('renders in medium size by default', () => {
    render(<ToggleSwitch {...defaultProps} />);
    expect(screen.getByRole('switch')).toHaveClass('h-6', 'w-11');
  });

  it('has focus ring for accessibility', () => {
    render(<ToggleSwitch {...defaultProps} />);
    expect(screen.getByRole('switch')).toHaveClass('focus:ring-2');
  });
});
