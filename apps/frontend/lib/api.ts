import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from './env-validator';
import { LOADING_DELAY } from './constants/ui.constants';
import { logger } from './logger';
import { AuthStorage } from './auth-storage';
import { errorModalManager } from './error-modal-manager';

// API Configuration
// The backend uses URI versioning (e.g., /api/v1/endpoint)
// Default version is v1, automatically applied to all endpoints
const API_URL = env.API_URL;
const API_VERSION = '1';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// CSRF token storage (in-memory)
let csrfToken: string | null = null;
let csrfTokenPromise: Promise<void> | null = null; // Prevent concurrent fetches

// Request deduplication - prevents duplicate simultaneous requests
// Only for GET requests to avoid race conditions with mutations
const pendingRequests = new Map<string, { promise: Promise<any>; timestamp: number }>();
const REQUEST_DEDUP_TTL = 100; // 100ms window for deduplication

// Helper to generate cache key for requests
function getRequestKey(config: InternalAxiosRequestConfig): string {
  const { method, url, params } = config;
  // Only use method, url, and params (not data) for GET requests
  return `${method}:${url}:${JSON.stringify(params || {})}`;
}

// Helper to create deduplicatable request wrapper
function createDedupedRequest(config: InternalAxiosRequestConfig): Promise<any> {
  const requestKey = getRequestKey(config);
  const now = Date.now();

  // Check if there's a recent pending request
  const pending = pendingRequests.get(requestKey);
  if (pending && (now - pending.timestamp) < REQUEST_DEDUP_TTL) {
    logger.debug('Deduplicating request', { url: config.url });
    return pending.promise;
  }

  // Create new request promise
  const requestPromise = new Promise((resolve, reject) => {
    // Store original adapter call
    const originalAdapter = config.adapter || axios.defaults.adapter;
    if (typeof originalAdapter === 'function') {
      originalAdapter(config).then(resolve, reject);
    } else {
      reject(new Error('No adapter available'));
    }
  });

  // Store in map
  pendingRequests.set(requestKey, {
    promise: requestPromise,
    timestamp: now,
  });

  // Clean up after completion
  requestPromise.finally(() => {
    const current = pendingRequests.get(requestKey);
    if (current?.timestamp === now) {
      pendingRequests.delete(requestKey);
    }
  });

  return requestPromise;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Set timeout to prevent hanging requests (30 seconds)
  timeout: LOADING_DELAY.TIMEOUT,
  // Enable sending cookies with requests (required for httpOnly cookies)
  withCredentials: true,
});

// Function to fetch CSRF token
async function fetchCsrfToken(): Promise<void> {
  // If already fetching, wait for that promise
  if (csrfTokenPromise) {
    logger.debug('CSRF token fetch already in progress, waiting...');
    return csrfTokenPromise;
  }

  // Start new fetch
  csrfTokenPromise = (async () => {
    try {
      logger.debug('Fetching new CSRF token from server...');
      const response = await axios.get(`${API_URL}/auth/csrf-token`, {
        withCredentials: true,
        timeout: LOADING_DELAY.TIMEOUT,
      });
      const newToken = response.headers['x-csrf-token'];
      if (newToken) {
        csrfToken = newToken;
        const preview = csrfToken ? csrfToken.substring(0, 20) + '...' : 'unknown';
        logger.debug('New CSRF token received', { tokenPreview: preview });
      } else {
        logger.error('No CSRF token in response headers', undefined, { headers: response.headers });
      }
    } catch (error) {
      logger.error('Failed to fetch CSRF token', error);
    } finally {
      // Clear promise so next call can fetch again
      csrfTokenPromise = null;
    }
  })();

  return csrfTokenPromise;
}

// Export function to manually refresh CSRF token (e.g., after logout)
export async function refreshCsrfToken(): Promise<void> {
  await fetchCsrfToken();
}

// Initialize CSRF token on client-side
// Note: This runs asynchronously in the background. CSRF token will be
// available for subsequent requests after initial fetch completes.
if (typeof globalThis !== 'undefined') {
  void (async () => {
    try {
      await fetchCsrfToken();
    } catch (error) {
      logger.error('Failed to initialize CSRF token on startup:', error);
    }
  })();
}

// Exponential backoff delay calculation
const getRetryDelay = (retryCount: number): number => {
  return RETRY_DELAY * Math.pow(2, retryCount);
};

// Determine if request should be retried
const shouldRetry = (error: AxiosError): boolean => {
  // Don't retry on 4xx errors (client errors)
  if (error.response && error.response.status >= 400 && error.response.status < 500) {
    return false;
  }

  // Retry on network errors, 5xx errors, or timeout
  return (
    !error.response || // Network error
    error.response.status >= 500 || // Server error
    error.code === 'ECONNABORTED' || // Timeout
    error.code === 'ERR_NETWORK' // Network error
  );
};

// Interceptor to add CSRF token and handle request deduplication
// NOTE: JWT authentication is handled exclusively via httpOnly cookies
// sent automatically with withCredentials: true
api.interceptors.request.use(
  async (config) => {
    // Request deduplication logic removed due to type incompatibility in interceptor
    // and incomplete implementation.

    const method = config.method?.toUpperCase();

    // Add CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
    if (typeof globalThis !== 'undefined') {
      if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        // If CSRF token is not available, fetch it
        if (!csrfToken) {
          logger.debug('No CSRF token available, fetching...');
          await fetchCsrfToken();
        }
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
          logger.debug('Sending request with CSRF token', {
            method,
            url: config.url,
            tokenPreview: csrfToken.substring(0, 20) + '...'
          });
        } else {
          logger.warn('No CSRF token available for request', { method, url: config.url });
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Check if dev mode is enabled
function isDevModeEnabled(): boolean {
  return typeof globalThis !== 'undefined' && globalThis.localStorage.getItem('devMode') === 'true';
}

// Build error details from error data
function buildErrorDetails(errorData: any): string[] {
  if (errorData?.errors && Array.isArray(errorData.errors)) {
    return errorData.errors.map((err: any) =>
      `${err.field || err.property || 'Field'}: ${err.message || err.error}`
    );
  }
  if (errorData?.details) {
    return [JSON.stringify(errorData.details)];
  }
  return [];
}

// Helper function to show error modal to user
function showErrorModal(error: AxiosError, config?: InternalAxiosRequestConfig, willRedirect = false): void {
  if (typeof window === 'undefined') return;

  // Only show detailed error modal in developer mode
  // Regular users will see simple error messages inline
  // Exception: Always show modal if redirecting (auth errors)
  if (!isDevModeEnabled() && !willRedirect) {
    return;
  }

  const errorData = error.response?.data as any;
  const errorMessage = errorData?.message || errorData?.error || error.message || 'Unknown error occurred';
  const statusCode = error.response?.status || 'N/A';
  const url = config?.url || 'Unknown';
  const method = config?.method?.toUpperCase() || 'UNKNOWN';
  const details = buildErrorDetails(errorData);

  logger.apiError(url, statusCode as number, errorData, { method, message: errorMessage });

  errorModalManager.show({
    title: `Request Failed (${statusCode})`,
    message: errorMessage,
    details: details.length > 0 ? details : undefined,
    endpoint: url,
    method,
    statusCode,
    willRedirect,
    errorObject: error,
    requestConfig: config,
    responseData: error.response?.data,
    stackTrace: error.stack,
    errorCode: error.code,
    onClose: willRedirect ? () => {
      AuthStorage.clearAuthData();
      globalThis.location.href = '/login';
    } : undefined,
  });
}

// Extended config type for retry tracking
type ExtendedConfig = InternalAxiosRequestConfig & {
  retryCount?: number;
  csrfRetry?: boolean;
  _errorShown?: boolean;
};

// Check if URL should skip redirect on 401
function shouldSkipAuthRedirect(url: string): boolean {
  return (
    url.includes('/auth/change-password') ||
    url.includes('/auth/reset-password') ||
    url.includes('/auth/logout') ||
    (typeof globalThis !== 'undefined' && globalThis.location.pathname.includes('/login'))
  );
}

// Handle CSRF error retry
async function handleCsrfRetry(config: ExtendedConfig, errorMessage: string): Promise<any | null> {
  const isCsrfError = errorMessage.toLowerCase().includes('csrf');

  if (isCsrfError && !config.csrfRetry) {
    logger.debug('CSRF token invalid, fetching new token and retrying...');
    await fetchCsrfToken();
    if (csrfToken) {
      config.csrfRetry = true;
      config.headers['X-CSRF-Token'] = csrfToken;
      logger.debug('Retrying request with new CSRF token', { tokenPreview: csrfToken.substring(0, 20) + '...' });
      return api(config);
    }
    logger.error('Failed to fetch new CSRF token');
  } else if (isCsrfError && config.csrfRetry) {
    logger.error('CSRF retry already attempted, giving up');
  }
  return null;
}

// Show authentication error modal and handle redirect
function showAuthErrorModal(url: string, errorMessage: string, method?: string): void {
  const errorDetails = errorMessage || 'Your session has expired or the authentication token is invalid.';

  errorModalManager.show({
    title: 'Authentication Error (401)',
    message: errorDetails,
    endpoint: url,
    method: method?.toUpperCase(),
    statusCode: 401,
    willRedirect: true,
    onClose: () => {
      AuthStorage.clearAuthData();
      globalThis.location.href = '/login';
    },
  });
}

// Handle 401 authentication errors
async function handle401Error(error: AxiosError, config: ExtendedConfig): Promise<any> {
  const errorMessage = (error.response?.data as { message?: string })?.message || '';
  const url = config?.url || '';

  logger.warn('401 Unauthorized', { url, message: errorMessage, method: config?.method });

  // Try CSRF retry if applicable
  const csrfRetryResult = await handleCsrfRetry(config, errorMessage);
  if (csrfRetryResult) return csrfRetryResult;

  // Handle redirect for auth errors
  if (!shouldSkipAuthRedirect(url)) {
    logger.error('Authentication Error - Session expired', undefined, { url, message: errorMessage });
    showAuthErrorModal(url, errorMessage, config?.method);
  }

  throw error;
}

// Handle 4xx client errors (excluding 401 and 409)
function handle4xxError(error: AxiosError, config: ExtendedConfig): void {
  const status = error.response?.status;
  if (!status || status < 400 || status >= 500 || status === 401 || status === 409) return;
  if (config?._errorShown) return;

  if (config) config._errorShown = true;
  showErrorModal(error, config);
}

// Handle 5xx server errors
function handle5xxError(error: AxiosError, config: ExtendedConfig): void {
  const status = error.response?.status;
  if (!status || status < 500 || config?._errorShown) return;

  const willRetry = (config?.retryCount || 0) < MAX_RETRIES;
  const serverMessage = (error.response?.data as any)?.message || 'The server encountered an error.';

  logger.error('Server Error (5xx)', undefined, { status, url: config?.url, data: error.response?.data });

  if (!willRetry) {
    errorModalManager.show({
      title: `Server Error (${status})`,
      message: serverMessage,
      details: ['Max retries reached. Please try again later.'],
      endpoint: config?.url,
      method: config?.method?.toUpperCase(),
      statusCode: status,
    });
  }

  if (config) config._errorShown = true;
}

// Handle network errors (no response)
function handleNetworkError(error: AxiosError, config: ExtendedConfig): void {
  if (error.response || config?._errorShown) return;

  logger.error('Network Error - Cannot connect to server', error, { url: config?.url, code: error.code });

  errorModalManager.show({
    title: 'Network Error',
    message: 'Could not connect to the server. Please check your internet connection and try again.',
    details: [error.message || 'Unknown network error'],
  });

  if (config) config._errorShown = true;
}

// Execute retry logic
async function executeRetry(error: AxiosError, config: ExtendedConfig): Promise<any | null> {
  if (!shouldRetry(error)) return null;

  config.retryCount = config.retryCount || 0;
  if (config.retryCount >= MAX_RETRIES) return null;

  config.retryCount += 1;
  const delay = getRetryDelay(config.retryCount - 1);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return api(config);
}

// Interceptor to handle authentication errors and retry logic
api.interceptors.response.use(
  (response) => {
    // Clean up pending request from deduplication map
    if (response.config?.method?.toUpperCase() === 'GET') {
      pendingRequests.delete(getRequestKey(response.config as InternalAxiosRequestConfig));
    }

    // Update CSRF token if present and we don't have one yet
    const newCsrfToken = response.headers['x-csrf-token'];
    if (newCsrfToken && !csrfToken) {
      csrfToken = newCsrfToken;
      logger.debug('CSRF token auto-updated from response', { tokenPreview: newCsrfToken.substring(0, 20) + '...' });
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as ExtendedConfig;
    const isClientSide = typeof globalThis !== 'undefined';

    // Handle 401 authentication errors
    if (isClientSide && error.response?.status === 401) {
      return handle401Error(error, config);
    }

    // Handle other errors on client side
    if (isClientSide) {
      handle4xxError(error, config);
      handle5xxError(error, config);
      handleNetworkError(error, config);
    }

    // Retry logic
    if (config) {
      const retryResult = await executeRetry(error, config);
      if (retryResult) return retryResult;

      // Clean up deduplication map on error
      if (config.method?.toUpperCase() === 'GET') {
        pendingRequests.delete(getRequestKey(config));
      }
    }

    throw error;
  }
);

// Export as default for backward compatibility (to be phased out)
export default api;
