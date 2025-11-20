'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (limit: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  // Calculate available limits based on total items
  const availableLimits = [10, 20, 50, 100, 500, 1000].filter(
    (limit) => limit <= Math.max(totalItems, 10)
  );

  // Generate page numbers to display
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
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
  };

  const pageNumbers = getPageNumbers();

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number') {
      onPageChange(page);
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="mt-6 bg-white rounded-xl border border-stone-200 shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6">
        {/* Items per page selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-navy-900">Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-4 py-2 border border-stone-300 rounded-lg bg-white text-sm font-medium text-navy-900 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all hover:border-gold-400 cursor-pointer shadow-sm"
          >
            {availableLimits.map((limit) => (
              <option key={limit} value={limit}>
                {limit}
              </option>
            ))}
          </select>
          <span className="text-sm text-stone-700 font-medium">
            {startItem}-{endItem} of {totalItems}
          </span>
        </div>

        {/* Page navigation - only show if more than 1 page */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            {/* Previous button */}
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`p-2.5 rounded-lg border-2 transition-all font-medium ${
                currentPage === 1
                  ? 'border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed'
                  : 'border-navy-300 bg-white text-navy-700 hover:bg-gradient-to-r hover:from-gold-500 hover:to-gold-600 hover:text-navy-900 hover:border-gold-600 shadow-sm hover:shadow-lg transform hover:scale-105'
              }`}
              aria-label="Previous page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page numbers */}
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-stone-500 font-bold text-lg">
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
                >
                  {page}
                </button>
              );
            })}

            {/* Next button */}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`p-2.5 rounded-lg border-2 transition-all font-medium ${
                currentPage === totalPages
                  ? 'border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed'
                  : 'border-navy-300 bg-white text-navy-700 hover:bg-gradient-to-r hover:from-gold-500 hover:to-gold-600 hover:text-navy-900 hover:border-gold-600 shadow-sm hover:shadow-lg transform hover:scale-105'
              }`}
              aria-label="Next page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
