import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('renders as span element', () => {
    render(<Badge>Badge</Badge>);
    const badge = screen.getByText('Badge');
    expect(badge.tagName).toBe('SPAN');
  });

  it('applies default variant styles', () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('rounded-full');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    const badge = screen.getByText('Custom');
    expect(badge).toHaveClass('custom-class');
  });

  it('applies border when withBorder is true', () => {
    render(<Badge withBorder>Bordered</Badge>);
    const badge = screen.getByText('Bordered');
    expect(badge).toHaveClass('border');
  });

  it('does not apply border by default', () => {
    render(<Badge>No Border</Badge>);
    const badge = screen.getByText('No Border');
    expect(badge).not.toHaveClass('border');
  });

  it('renders with different colors', () => {
    const { rerender } = render(<Badge color="green">Green</Badge>);
    expect(screen.getByText('Green')).toBeInTheDocument();

    rerender(<Badge color="red">Red</Badge>);
    expect(screen.getByText('Red')).toBeInTheDocument();

    rerender(<Badge color="blue">Blue</Badge>);
    expect(screen.getByText('Blue')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Badge variant="default">Default</Badge>);
    expect(screen.getByText('Default')).toBeInTheDocument();

    rerender(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText('Outline')).toBeInTheDocument();
  });
});
