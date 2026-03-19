import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../Pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalItems: 50,
    itemsPerPage: 10,
    onPageChange: vi.fn(),
    onItemsPerPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pagination navigation', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('shows items range', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText('1-10 of 50')).toBeInTheDocument();
  });

  it('shows correct range for different pages', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    expect(screen.getByText('21-30 of 50')).toBeInTheDocument();
  });

  it('shows items per page selector', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByLabelText('Items per page')).toBeInTheDocument();
  });

  it('calls onItemsPerPageChange when select changes', () => {
    const handleChange = vi.fn();
    // Use higher totalItems to have more options available
    render(<Pagination {...defaultProps} totalItems={100} onItemsPerPageChange={handleChange} />);

    const select = screen.getByLabelText('Items per page');
    // Change to a value that exists in the select options
    fireEvent.change(select, { target: { value: '10' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows page numbers', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
  });

  it('highlights current page', () => {
    render(<Pagination {...defaultProps} currentPage={2} />);
    const currentPageButton = screen.getByRole('button', { name: 'Go to page 2' });
    expect(currentPageButton).toHaveAttribute('aria-current', 'page');
  });

  it('calls onPageChange when page button is clicked', () => {
    const handlePageChange = vi.fn();
    render(<Pagination {...defaultProps} onPageChange={handlePageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Go to page 3' }));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('has previous button when on page > 1', () => {
    render(<Pagination {...defaultProps} currentPage={2} />);
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeInTheDocument();
  });

  it('has next button when not on last page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
  });

  it('calls onPageChange when previous button is clicked', () => {
    const handlePageChange = vi.fn();
    render(<Pagination {...defaultProps} currentPage={3} onPageChange={handlePageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Go to previous page' }));
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when next button is clicked', () => {
    const handlePageChange = vi.fn();
    render(<Pagination {...defaultProps} currentPage={3} onPageChange={handlePageChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(handlePageChange).toHaveBeenCalledWith(4);
  });

  it('shows ellipsis for many pages', () => {
    render(<Pagination {...defaultProps} totalPages={10} currentPage={5} />);
    const ellipsis = screen.getAllByText('...');
    expect(ellipsis.length).toBeGreaterThan(0);
  });

  it('has screen reader announcement for current page', () => {
    render(<Pagination {...defaultProps} currentPage={3} />);
    expect(screen.getByText('Page 3 of 5')).toBeInTheDocument();
  });

  it('does not show navigation arrows when only 1 page', () => {
    render(<Pagination {...defaultProps} totalPages={1} totalItems={5} />);
    expect(screen.queryByRole('button', { name: 'Go to previous page' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Go to next page' })).not.toBeInTheDocument();
  });
});
