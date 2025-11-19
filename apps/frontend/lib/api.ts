import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from './storage';
import { env } from './env-validator';
import { LOADING_DELAY } from './constants/ui.constants';

const API_URL = env.API_URL;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

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

// Interceptor to add JWT token to each request
// Note: JWT is now sent via httpOnly cookies automatically (withCredentials: true)
// Keeping fallback support for Authorization header for backward compatibility
api.interceptors.request.use(
  (config) => {
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      const token = storage.getItem('access_token');
      if (token) {
        // Fallback: If token exists in localStorage, send it via Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      }
      // JWT will be sent via cookie automatically due to withCredentials: true
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle authentication errors and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { retryCount?: number };

    // Handle 401 authentication errors
    if (typeof window !== 'undefined' && error.response?.status === 401) {
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

export default api;
