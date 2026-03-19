import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRef } from 'react';
import { useClickOutside } from '../useClickOutside';

// Test component that uses the hook
function TestComponent({
  onClickOutside,
  enabled = true,
}: {
  onClickOutside: () => void;
  enabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClickOutside, enabled);

  return (
    <div>
      <div ref={ref} data-testid="inside">
        Inside Element
        <button data-testid="inside-button">Inside Button</button>
      </div>
      <div data-testid="outside">Outside Element</div>
    </div>
  );
}

describe('useClickOutside', () => {
  let mockHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockHandler = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('mousedown events', () => {
    it('should call handler when clicking outside the element', () => {
      render(<TestComponent onClickOutside={mockHandler} />);

      const outsideElement = screen.getByTestId('outside');
      fireEvent.mouseDown(outsideElement);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should not call handler when clicking inside the element', () => {
      render(<TestComponent onClickOutside={mockHandler} />);

      const insideElement = screen.getByTestId('inside');
      fireEvent.mouseDown(insideElement);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should not call handler when clicking on child elements', () => {
      render(<TestComponent onClickOutside={mockHandler} />);

      const insideButton = screen.getByTestId('inside-button');
      fireEvent.mouseDown(insideButton);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should call handler when clicking on document body', () => {
      render(<TestComponent onClickOutside={mockHandler} />);

      fireEvent.mouseDown(document.body);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('touchstart events', () => {
    it('should call handler when touching outside the element', () => {
      render(<TestComponent onClickOutside={mockHandler} />);

      const outsideElement = screen.getByTestId('outside');
      fireEvent.touchStart(outsideElement);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it('should not call handler when touching inside the element', () => {
      render(<TestComponent onClickOutside={mockHandler} />);

      const insideElement = screen.getByTestId('inside');
      fireEvent.touchStart(insideElement);

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('enabled prop', () => {
    it('should not call handler when disabled', () => {
      render(<TestComponent onClickOutside={mockHandler} enabled={false} />);

      const outsideElement = screen.getByTestId('outside');
      fireEvent.mouseDown(outsideElement);

      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should call handler when re-enabled', () => {
      const { rerender } = render(
        <TestComponent onClickOutside={mockHandler} enabled={false} />
      );

      const outsideElement = screen.getByTestId('outside');
      fireEvent.mouseDown(outsideElement);

      expect(mockHandler).not.toHaveBeenCalled();

      rerender(<TestComponent onClickOutside={mockHandler} enabled={true} />);

      fireEvent.mouseDown(outsideElement);

      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = render(<TestComponent onClickOutside={mockHandler} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });

  describe('multiple clicks', () => {
    it('should call handler for each click outside', () => {
      render(<TestComponent onClickOutside={mockHandler} />);

      const outsideElement = screen.getByTestId('outside');

      fireEvent.mouseDown(outsideElement);
      fireEvent.mouseDown(outsideElement);
      fireEvent.mouseDown(outsideElement);

      expect(mockHandler).toHaveBeenCalledTimes(3);
    });
  });
});
