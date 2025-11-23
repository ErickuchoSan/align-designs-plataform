import { useEffect, useRef, useState } from 'react';
import { MESSAGE_DURATION } from '@/lib/constants/ui.constants';

/**
 * Custom hook to automatically reset a message after a specified duration
 *
 * @param message - The current message to display
 * @param setMessage - Function to update the message
 * @param duration - Duration in milliseconds before resetting (default: MESSAGE_DURATION.SUCCESS)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [success, setSuccess] = useState('');
 *   useAutoResetMessage(success, setSuccess);
 *
 *   const handleAction = () => {
 *     setSuccess('Operation successful!');
 *     // Message will auto-clear after MESSAGE_DURATION.SUCCESS
 *   };
 * }
 * ```
 */
export function useAutoResetMessage(
  message: string,
  setMessage: (message: string) => void,
  duration: number = MESSAGE_DURATION.SUCCESS,
): void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef(duration);

  // Update duration ref when it changes
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // If there's a message, set timeout to clear it
    if (message) {
      timeoutRef.current = setTimeout(() => {
        setMessage('');
        timeoutRef.current = null;
      }, durationRef.current);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [message, setMessage]);
}

/**
 * Hook for managing both success and error messages with auto-reset
 *
 * @param duration - Duration in milliseconds before resetting messages
 * @returns Object with success/error state and setters
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { success, setSuccess, error, setError } = useMessages();
 *
 *   const handleAction = async () => {
 *     try {
 *       await someAction();
 *       setSuccess('Action completed successfully!');
 *     } catch (err) {
 *       setError(getErrorMessage(err, 'Action failed'));
 *     }
 *   };
 *
 *   return (
 *     <>
 *       {success && <Alert type="success">{success}</Alert>}
 *       {error && <Alert type="error">{error}</Alert>}
 *     </>
 *   );
 * }
 * ```
 */
export function useMessages(duration?: number) {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useAutoResetMessage(success, setSuccess, duration);
  useAutoResetMessage(error, setError, duration);

  return {
    success,
    setSuccess,
    error,
    setError,
  };
}
