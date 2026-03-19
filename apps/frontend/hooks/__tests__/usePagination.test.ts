import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  describe('initial state', () => {
    it('should have default initial values', () => {
      const { result } = renderHook(() => usePagination());

      expect(result.current.currentPage).toBe(1);
      expect(result.current.itemsPerPage).toBe(10);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPages).toBe(0);
    });

    it('should accept custom initial page', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 5 }));

      expect(result.current.currentPage).toBe(5);
    });

    it('should accept custom initial items per page', () => {
      const { result } = renderHook(() => usePagination({ initialItemsPerPage: 25 }));

      expect(result.current.itemsPerPage).toBe(25);
    });

    it('should accept both custom initial values', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 3, initialItemsPerPage: 50 })
      );

      expect(result.current.currentPage).toBe(3);
      expect(result.current.itemsPerPage).toBe(50);
    });
  });

  describe('setters', () => {
    it('should update currentPage with setCurrentPage', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setCurrentPage(5);
      });

      expect(result.current.currentPage).toBe(5);
    });

    it('should update itemsPerPage with setItemsPerPage', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setItemsPerPage(25);
      });

      expect(result.current.itemsPerPage).toBe(25);
    });

    it('should update totalItems with setTotalItems', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setTotalItems(100);
      });

      expect(result.current.totalItems).toBe(100);
    });

    it('should update totalPages with setTotalPages', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.setTotalPages(10);
      });

      expect(result.current.totalPages).toBe(10);
    });
  });

  describe('handlers', () => {
    it('should change page with handlePageChange', () => {
      const { result } = renderHook(() => usePagination());

      act(() => {
        result.current.handlePageChange(3);
      });

      expect(result.current.currentPage).toBe(3);
    });

    it('should change items per page and reset to page 1', () => {
      const { result } = renderHook(() => usePagination({ initialPage: 5 }));

      expect(result.current.currentPage).toBe(5);

      act(() => {
        result.current.handleItemsPerPageChange(50);
      });

      expect(result.current.itemsPerPage).toBe(50);
      expect(result.current.currentPage).toBe(1); // Reset to first page
    });

    it('should reset all pagination state with resetPagination', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 1, initialItemsPerPage: 10 })
      );

      // Change state
      act(() => {
        result.current.setCurrentPage(5);
        result.current.setItemsPerPage(50);
        result.current.setTotalItems(500);
        result.current.setTotalPages(10);
      });

      expect(result.current.currentPage).toBe(5);
      expect(result.current.itemsPerPage).toBe(50);
      expect(result.current.totalItems).toBe(500);
      expect(result.current.totalPages).toBe(10);

      // Reset
      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.currentPage).toBe(1);
      expect(result.current.itemsPerPage).toBe(10);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPages).toBe(0);
    });

    it('should reset to custom initial values', () => {
      const { result } = renderHook(() =>
        usePagination({ initialPage: 2, initialItemsPerPage: 20 })
      );

      act(() => {
        result.current.setCurrentPage(10);
        result.current.setItemsPerPage(100);
      });

      act(() => {
        result.current.resetPagination();
      });

      expect(result.current.currentPage).toBe(2);
      expect(result.current.itemsPerPage).toBe(20);
    });
  });

  describe('handler stability', () => {
    it('should maintain handler references across renders', () => {
      const { result, rerender } = renderHook(() => usePagination());

      const initialHandlers = {
        handlePageChange: result.current.handlePageChange,
        handleItemsPerPageChange: result.current.handleItemsPerPageChange,
        resetPagination: result.current.resetPagination,
      };

      rerender();

      expect(result.current.handlePageChange).toBe(initialHandlers.handlePageChange);
      expect(result.current.handleItemsPerPageChange).toBe(
        initialHandlers.handleItemsPerPageChange
      );
      expect(result.current.resetPagination).toBe(initialHandlers.resetPagination);
    });
  });
});
