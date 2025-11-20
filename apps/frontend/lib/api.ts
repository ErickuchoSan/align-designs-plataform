import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from './storage';
import { env } from './env-validator';
import { LOADING_DELAY } from './constants/ui.constants';

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
  try {
    const response = await axios.get(`${API_URL}/auth/csrf-token`, {
      withCredentials: true,
    });
    csrfToken = response.headers['x-csrf-token'];
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
}

// Export function to manually refresh CSRF token (e.g., after logout)
export async function refreshCsrfToken(): Promise<void> {
  await fetchCsrfToken();
}

// Initialize CSRF token on client-side
if (typeof window !== 'undefined') {
  fetchCsrfToken();
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

// Interceptor to add JWT token and CSRF token to each request
// Note: JWT is now sent via httpOnly cookies automatically (withCredentials: true)
// Keeping fallback support for Authorization header for backward compatibility
api.interceptors.request.use(
  async (config) => {
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      const token = storage.getItem('access_token');
      if (token) {
        // Fallback: If token exists in localStorage, send it via Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      }
      // JWT will be sent via cookie automatically due to withCredentials: true

      // Add CSRF token for state-changing requests
      const method = config.method?.toUpperCase();
      if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        // If CSRF token is not available, fetch it
        if (!csrfToken) {
          await fetchCsrfToken();
        }
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle authentication errors and retry logic
api.interceptors.response.use(
  (response) => {
    // Update CSRF token if present in response headers
    const newCsrfToken = response.headers['x-csrf-token'];
    if (newCsrfToken) {
      csrfToken = newCsrfToken;
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { retryCount?: number; csrfRetry?: boolean };

    // Handle 401 authentication errors
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const errorMessage = (error.response?.data as { message?: string })?.message || '';

      // If CSRF token is invalid, fetch a new one and retry once
      if (errorMessage.includes('CSRF') && !config?.csrfRetry) {
        await fetchCsrfToken();
        if (config && csrfToken) {
          config.csrfRetry = true;
          config.headers['X-CSRF-Token'] = csrfToken;
          return api(config);
        }
      }

      // Don't redirect on endpoints that handle their own validation errors
      const url = config?.url || '';
      const shouldNotRedirect =
        url.includes('/auth/change-password') ||
        url.includes('/auth/reset-password') ||
        window.location.pathname.includes('/login');

      if (!shouldNotRedirect) {
        // Expired or invalid token - redirect to login
        storage.removeItem('access_token');
        storage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Retry logic for network errors and 5xx errors
    if (config && shouldRetry(error)) {
      config.retryCount = config.retryCount || 0;

      if (config.retryCount < MAX_RETRIES) {
        config.retryCount += 1;
        const delay = getRetryDelay(config.retryCount - 1);

        // Log retry attempts only in development
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `Retrying request (${config.retryCount}/${MAX_RETRIES}) after ${delay}ms: ${config.url}`
          );
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry the request
        return api(config);
      }

      // Log max retries only in development
      if (process.env.NODE_ENV === 'development') {
        console.error(
          `Max retries (${MAX_RETRIES}) reached for request: ${config.url}`
        );
      }
    }

    return Promise.reject(error);
  }
);

// Export as default for backward compatibility (to be phased out)
export default api;
