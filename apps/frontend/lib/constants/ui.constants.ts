/**
 * UI/UX Constants
 * Centralized values for timeouts, delays, and UI behavior
 */

// Toast/Message Timeouts (in milliseconds)
export const MESSAGE_DURATION = {
  SUCCESS: 5000, // 5 seconds - increased from 3s for better readability
  ERROR: 7000, // 7 seconds - errors need more time to read
  INFO: 4000, // 4 seconds
  WARNING: 6000, // 6 seconds
} as const;

// Animation Delays
export const ANIMATION_DELAY = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Debounce/Throttle Delays
export const INPUT_DELAY = {
  SEARCH: 300, // 300ms debounce for search inputs
  AUTOCOMPLETE: 200, // 200ms for autocomplete
  VALIDATION: 500, // 500ms for validation feedback
} as const;

// Loading States
export const LOADING_DELAY = {
  MIN_DISPLAY: 300, // Minimum time to show loading spinner (prevents flashing)
  TIMEOUT: 30000, // 30 seconds - max time before showing error
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

// File Upload Configuration
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 15000, // 15GB in MB
  MAX_SIZE_BYTES: 15 * 1024 * 1024 * 1024, // 15GB in bytes
} as const;

// OTP Configuration
export const OTP = {
  LENGTH: 8, // OTP code length (matches backend)
  DISPLAY_LENGTH: 8, // Display length for user input (matches backend)
} as const;
