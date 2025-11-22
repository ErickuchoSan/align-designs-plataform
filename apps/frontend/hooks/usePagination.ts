import { useState, useCallback } from 'react';

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationActions {
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (limit: number) => void;
  setTotalItems: (total: number) => void;
  setTotalPages: (pages: number) => void;
  handlePageChange: (page: number) => void;
  handleItemsPerPageChange: (limit: number) => void;
  resetPagination: () => void;
}

export interface UsePaginationReturn extends PaginationState, PaginationActions {}

interface UsePaginationOptions {
  /** Initial page number (default: 1) */
  initialPage?: number;
  /** Initial items per page (default: 10) */
  initialItemsPerPage?: number;
}

/**
 * Reusable pagination hook
 * Centralizes pagination state and handlers to avoid duplication
 * Used by useProjectsList, useUsers, and useProjectFiles
 *
 * @param options - Configuration options for pagination
 * @returns Pagination state and handlers
 *
 * @example
 * function MyComponent() {
 *   const {
 *     currentPage,
 *     itemsPerPage,
 *     totalPages,
 *     handlePageChange,
 *     handleItemsPerPageChange,
 *     setTotalItems,
 *     setTotalPages
 *   } = usePagination();
 *
 *   // Fetch data when pagination changes
 *   useEffect(() => {
 *     fetchData(currentPage, itemsPerPage).then(response => {
 *       setTotalItems(response.meta.total);
 *       setTotalPages(response.meta.totalPages);
 *     });
 *   }, [currentPage, itemsPerPage]);
 *
 *   return (
 *     <Pagination
 *       currentPage={currentPage}
 *       totalPages={totalPages}
 *       onPageChange={handlePageChange}
 *       onItemsPerPageChange={handleItemsPerPageChange}
 *     />
 *   );
 * }
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialItemsPerPage = 10,
  } = options;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Handler for page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Handler for items per page change
  // Resets to first page when changing items per page
  const handleItemsPerPageChange = useCallback((limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Reset pagination to initial state
  const resetPagination = useCallback(() => {
    setCurrentPage(initialPage);
    setItemsPerPage(initialItemsPerPage);
    setTotalItems(0);
    setTotalPages(0);
  }, [initialPage, initialItemsPerPage]);

  return {
    // State
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    // Setters
    setCurrentPage,
    setItemsPerPage,
    setTotalItems,
    setTotalPages,
    // Handlers
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination,
  };
}
