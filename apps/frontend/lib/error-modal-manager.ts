/**
 * Global Error Modal Manager
 * Manages showing error modals from anywhere in the app, including API interceptors
 */

interface ErrorModalData {
  title: string;
  message: string;
  details?: string[];
  endpoint?: string;
  method?: string;
  statusCode?: number | string;
  willRedirect?: boolean;
  onClose?: () => void;
  // Full error object for dev mode
  errorObject?: any;
  requestConfig?: any;
  responseData?: any;
  stackTrace?: string;
  errorCode?: string;
}

type ErrorModalCallback = (data: ErrorModalData | null) => void;

class ErrorModalManager {
  private listeners: Set<ErrorModalCallback> = new Set();
  private currentError: ErrorModalData | null = null;

  /**
   * Subscribe to error modal changes
   */
  subscribe(callback: ErrorModalCallback): () => void {
    this.listeners.add(callback);
    // Immediately call with current error if one exists
    if (this.currentError) {
      callback(this.currentError);
    }
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Show an error modal
   */
  show(data: ErrorModalData): void {
    this.currentError = data;
    this.notifyListeners();
  }

  /**
   * Hide the current error modal
   */
  hide(): void {
    const currentOnClose = this.currentError?.onClose;
    this.currentError = null;
    this.notifyListeners();

    // Call onClose callback if it exists
    if (currentOnClose) {
      currentOnClose();
    }
  }

  /**
   * Check if modal is currently shown
   */
  isShown(): boolean {
    return this.currentError !== null;
  }

  /**
   * Notify all listeners of the current state
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      callback(this.currentError);
    });
  }
}

// Export singleton instance
export const errorModalManager = new ErrorModalManager();
