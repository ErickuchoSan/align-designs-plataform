import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModal, useModalWithData } from '../useModal';

describe('useModal', () => {
  describe('initial state', () => {
    it('should be closed by default', () => {
      const { result } = renderHook(() => useModal());

      expect(result.current.isOpen).toBe(false);
    });

    it('should accept initial open state', () => {
      const { result } = renderHook(() => useModal(true));

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('open', () => {
    it('should open the modal', () => {
      const { result } = renderHook(() => useModal());

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should remain open when called multiple times', () => {
      const { result } = renderHook(() => useModal());

      act(() => {
        result.current.open();
        result.current.open();
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('close', () => {
    it('should close the modal', () => {
      const { result } = renderHook(() => useModal(true));

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should remain closed when called multiple times', () => {
      const { result } = renderHook(() => useModal());

      act(() => {
        result.current.close();
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('toggle', () => {
    it('should toggle from closed to open', () => {
      const { result } = renderHook(() => useModal());

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should toggle from open to closed', () => {
      const { result } = renderHook(() => useModal(true));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should toggle multiple times', () => {
      const { result } = renderHook(() => useModal());

      act(() => result.current.toggle());
      expect(result.current.isOpen).toBe(true);

      act(() => result.current.toggle());
      expect(result.current.isOpen).toBe(false);

      act(() => result.current.toggle());
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('handler stability', () => {
    it('should maintain handler references across renders', () => {
      const { result, rerender } = renderHook(() => useModal());

      const initialHandlers = {
        open: result.current.open,
        close: result.current.close,
        toggle: result.current.toggle,
      };

      rerender();

      expect(result.current.open).toBe(initialHandlers.open);
      expect(result.current.close).toBe(initialHandlers.close);
      expect(result.current.toggle).toBe(initialHandlers.toggle);
    });
  });
});

describe('useModalWithData', () => {
  interface TestData {
    id: number;
    name: string;
  }

  describe('initial state', () => {
    it('should have null data and be closed by default', () => {
      const { result } = renderHook(() => useModalWithData<TestData>());

      expect(result.current.data).toBeNull();
      expect(result.current.isOpen).toBe(false);
    });
  });

  describe('open', () => {
    it('should open modal with data', () => {
      const { result } = renderHook(() => useModalWithData<TestData>());
      const testData: TestData = { id: 1, name: 'Test' };

      act(() => {
        result.current.open(testData);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toEqual(testData);
    });

    it('should open modal without data', () => {
      const { result } = renderHook(() => useModalWithData<TestData>());

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toBeNull();
    });

    it('should replace existing data when opened again', () => {
      const { result } = renderHook(() => useModalWithData<TestData>());
      const data1: TestData = { id: 1, name: 'First' };
      const data2: TestData = { id: 2, name: 'Second' };

      act(() => {
        result.current.open(data1);
      });

      expect(result.current.data).toEqual(data1);

      act(() => {
        result.current.open(data2);
      });

      expect(result.current.data).toEqual(data2);
    });
  });

  describe('close', () => {
    it('should close modal and clear data', () => {
      const { result } = renderHook(() => useModalWithData<TestData>());
      const testData: TestData = { id: 1, name: 'Test' };

      act(() => {
        result.current.open(testData);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toEqual(testData);

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.data).toBeNull();
    });
  });

  describe('handler stability', () => {
    it('should maintain handler references across renders', () => {
      const { result, rerender } = renderHook(() => useModalWithData<TestData>());

      const initialHandlers = {
        open: result.current.open,
        close: result.current.close,
      };

      rerender();

      expect(result.current.open).toBe(initialHandlers.open);
      expect(result.current.close).toBe(initialHandlers.close);
    });
  });

  describe('type safety', () => {
    it('should work with different data types', () => {
      const { result: stringResult } = renderHook(() => useModalWithData<string>());
      const { result: numberResult } = renderHook(() => useModalWithData<number>());
      const { result: arrayResult } = renderHook(() => useModalWithData<number[]>());

      act(() => {
        stringResult.current.open('test');
        numberResult.current.open(42);
        arrayResult.current.open([1, 2, 3]);
      });

      expect(stringResult.current.data).toBe('test');
      expect(numberResult.current.data).toBe(42);
      expect(arrayResult.current.data).toEqual([1, 2, 3]);
    });
  });
});
