'use client';

import { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { PAGINATION } from '@/lib/constants/ui.constants';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  // Ref to track the pagination component position
  const paginationRef = useRef<HTMLElement>(null);
  const previousPageRef = useRef<number>(currentPage);

  // Store latest callbacks in refs to avoid recreating handlers
  // This prevents infinite loops when parent doesn't memoize callbacks
  const onPageChangeRef = useRef(onPageChange);
  const onItemsPerPageChangeRef = useRef(onItemsPerPageChange);

  // Update refs when callbacks change
  useEffect(() => {
    onPageChangeRef.current = onPageChange;
    onItemsPerPageChangeRef.current = onItemsPerPageChange;
  }, [onPageChange, onItemsPerPageChange]);

  // Scroll to pagination when page changes (but not on initial render)
  useEffect(() => {
    if (previousPageRef.current !== currentPage && paginationRef.current) {
      // Scroll to the top of the content area (above pagination)
      // We scroll to the pagination component itself so user sees the new content
      const scrollTarget = paginationRef.current.parentElement;
      if (scrollTarget) {
        scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    previousPageRef.current = currentPage;
  }, [currentPage]);
  // Calculate available limits based on total items - memoized
  const availableLimits = useMemo(
    () => PAGINATION.PAGE_SIZE_OPTIONS.filter((limit) => limit <= Math.max(totalItems, PAGINATION.DEFAULT_PAGE_SIZE)),
    [totalItems]
  );

  // Generate page numbers to display - memoized
  const pageNumbers = useMemo(() => {
    if (totalPages <= PAGINATION.ELLIPSIS_THRESHOLD) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];

    if (currentPage <= 3) {
      // Near the beginning: 1 2 3 4 ... totalPages
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      // Near the end: 1 ... (totalPages-3) (totalPages-2) (totalPages-1) totalPages
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      // In the middle: 1 ... (current-1) current (current+1) ... totalPages
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }

    return pages;
  }, [currentPage, totalPages]);

  const handlePrevious = useCallback(() => {
    if (currentPage > PAGINATION.MIN_PAGE) {
      onPageChangeRef.current(currentPage - 1);
    }
  }, [currentPage]);

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChangeRef.current(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const handlePageClick = useCallback((page: number | string) => {
    if (typeof page === 'number') {
      onPageChangeRef.current(page);
    }
  }, []);

  // Memoize item range calculations
  const startItem = useMemo(() => (currentPage - 1) * itemsPerPage + 1, [currentPage, itemsPerPage]);
  const endItem = useMemo(() => Math.min(currentPage * itemsPerPage, totalItems), [currentPage, itemsPerPage, totalItems]);

  return (
    <nav ref={paginationRef} className="mt-6 bg-white rounded-xl border border-stone-200 shadow-lg" aria-label="Pagination">
      {/* Screen reader announcement for page changes */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6">
        {/* Items per page selector */}
        <div className="flex items-center gap-3">
          <label htmlFor="items-per-page" className="text-sm font-medium text-navy-900">
            Show:
          </label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChangeRef.current(Number(e.target.value))}
            className="px-4 py-2 border border-stone-300 rounded-lg bg-white text-sm font-medium text-navy-900 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all hover:border-gold-400 cursor-pointer shadow-sm"
            aria-label="Items per page"
          >
            {availableLimits.map((limit) => (
              <option key={limit} value={limit}>
                {limit}
              </option>
            ))}
          </select>
          <span className="text-sm text-stone-700 font-medium" aria-live="polite" aria-atomic="true">
            {startItem}-{endItem} of {totalItems}
          </span>
        </div>

        {/* Page navigation - always show page numbers, hide arrows if only 1 page */}
        <div className="flex items-center gap-2">
          {/* Previous button - only show if more than 1 page */}
          {totalPages > 1 && (
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`p-2.5 rounded-lg border-2 transition-all font-medium ${
                currentPage === 1
                  ? 'border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed'
                  : 'border-navy-300 bg-white text-navy-700 hover:bg-gradient-to-r hover:from-gold-500 hover:to-gold-600 hover:text-navy-900 hover:border-gold-600 shadow-sm hover:shadow-lg transform hover:scale-105'
              }`}
              aria-label="Go to previous page"
              aria-disabled={currentPage === 1}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Page numbers - always show */}
          {pageNumbers.map((page) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${String(page)}-${Math.random()}`} className="px-3 py-2 text-stone-500 font-bold text-lg" aria-hidden="true">
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={`min-w-[44px] px-4 py-2.5 rounded-lg border-2 text-sm font-bold transition-all transform ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-gold-500 to-gold-600 border-gold-600 text-navy-900 shadow-lg scale-105'
                    : 'border-navy-300 bg-white text-navy-700 hover:bg-navy-50 hover:border-navy-500 hover:scale-105 shadow-sm hover:shadow-md'
                }`}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}

          {/* Next button - only show if more than 1 page */}
          {totalPages > 1 && (
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`p-2.5 rounded-lg border-2 transition-all font-medium ${
                currentPage === totalPages
                  ? 'border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed'
                  : 'border-navy-300 bg-white text-navy-700 hover:bg-gradient-to-r hover:from-gold-500 hover:to-gold-600 hover:text-navy-900 hover:border-gold-600 shadow-sm hover:shadow-lg transform hover:scale-105'
              }`}
              aria-label="Go to next page"
              aria-disabled={currentPage === totalPages}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default memo(Pagination);
