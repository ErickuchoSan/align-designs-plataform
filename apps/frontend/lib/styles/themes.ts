/**
 * Centralized theme styles for consistent theming across components
 * SSOT: All theme-related styles are defined here
 */

// =============================================================================
// SHARED STYLES (used by multiple themes)
// =============================================================================

const SHARED_STYLES = {
  // Error styles are consistent across all themes
  errorBg: 'bg-red-50',
  errorBorder: 'border-red-200',
  errorIcon: 'text-red-600',
  errorText: 'text-red-800',
  iconDeleteButton: 'text-red-600 hover:bg-red-50',
} as const;

// =============================================================================
// PROJECT THEME STYLES
// =============================================================================

export const PROJECT_THEMES = {
  navy: {
    // Alert/Message styles
    successBg: 'bg-forest-50',
    successBorder: 'border-forest-200',
    successIcon: 'text-forest-600',
    successText: 'text-forest-800',
    ...SHARED_STYLES,

    // Typography
    title: 'text-navy-900',
    subtitle: 'text-stone-700',

    // Buttons
    primaryButton: 'bg-navy-800 hover:bg-navy-700 text-white',
    secondaryButton: 'bg-steel-700 hover:bg-steel-600 text-white',
    cancelButton: 'text-navy-900 bg-stone-200 hover:bg-stone-300',
    editButton: 'bg-gold-600 hover:bg-gold-500 text-white',
    iconEditButton: 'text-navy-700 hover:bg-navy-50',

    // Card styles
    card: 'bg-white shadow-lg border border-stone-200 hover:shadow-2xl',
    cardBorder: 'border border-stone-200',
    avatar: 'bg-gradient-to-br from-navy-600 to-navy-800 text-gold-400',

    // Form styles
    input: 'text-navy-900 placeholder:text-stone-700',
    label: 'text-navy-900',
    focusRing: 'focus:ring-gold-500 focus:border-gold-500',

    // Badges
    badge: 'bg-gold-50 text-gold-700',

    // Empty state
    emptyIcon: 'bg-stone-100 text-stone-700',
    emptyTitle: 'text-navy-900',
    emptyText: 'text-stone-700',
  },
  blue: {
    // Alert/Message styles
    successBg: 'bg-green-50',
    successBorder: 'border-green-200',
    successIcon: 'text-green-600',
    successText: 'text-green-800',
    ...SHARED_STYLES,

    // Typography
    title: 'text-gray-900',
    subtitle: 'text-gray-700',

    // Buttons
    primaryButton: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
    secondaryButton: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white',
    cancelButton: 'text-gray-800 bg-gray-200 hover:bg-gray-300',
    editButton: 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white',
    iconEditButton: 'text-blue-600 hover:bg-blue-50',

    // Card styles
    card: 'bg-white shadow-md border border-gray-100 hover:shadow-2xl',
    cardBorder: '',
    avatar: 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white',

    // Form styles
    input: 'text-gray-900 placeholder:text-gray-700',
    label: 'text-gray-700',
    focusRing: 'focus:ring-blue-500 focus:border-blue-500',

    // Badges
    badge: 'bg-blue-50 text-blue-700',

    // Empty state
    emptyIcon: 'bg-gray-100 text-gray-700',
    emptyTitle: 'text-gray-700',
    emptyText: 'text-gray-700',
  },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ProjectTheme = keyof typeof PROJECT_THEMES;
export type ProjectThemeStyles = (typeof PROJECT_THEMES)[ProjectTheme];
