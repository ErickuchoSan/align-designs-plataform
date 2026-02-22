/**
 * Design tokens for consistent styling across components
 * These should be used via cn() utility for proper class merging
 */

// =============================================================================
// INPUT STYLES
// =============================================================================

export const INPUT_BASE =
  'w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:outline-none';

export const INPUT_VARIANTS = {
  default: 'border-stone-300 focus:border-gold-500 focus:ring-gold-500',
  error: 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500',
  warning: 'border-amber-500 bg-amber-50 focus:border-amber-500 focus:ring-amber-500',
  success: 'border-green-500 bg-green-50 focus:border-green-500 focus:ring-green-500',
} as const;

export const INPUT_SIZES = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
} as const;

// Textarea inherits INPUT_BASE but with resize control
export const TEXTAREA_BASE = `${INPUT_BASE} resize-none text-navy-900 placeholder:text-stone-700`;

// =============================================================================
// BUTTON STYLES
// =============================================================================

export const BUTTON_BASE =
  'font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';

export const BUTTON_VARIANTS = {
  primary:
    'bg-navy-800 hover:bg-navy-700 text-white focus:ring-gold-500 shadow-lg transform hover:scale-105 disabled:transform-none',
  secondary: 'bg-stone-200 hover:bg-stone-300 text-navy-900 focus:ring-stone-400',
  outline: 'border-2 border-navy-800 text-navy-800 hover:bg-navy-50 focus:ring-gold-500',
  danger:
    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 transform hover:scale-105 disabled:transform-none',
  warning:
    'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 transform hover:scale-105 disabled:transform-none',
  ghost: 'bg-transparent hover:bg-stone-100 text-navy-900 focus:ring-stone-300',
} as const;

export const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-xs min-w-[80px]',
  md: 'px-5 py-2.5 text-sm min-w-[100px]',
  lg: 'px-6 py-3 text-base min-w-[120px]',
} as const;

// =============================================================================
// BADGE STYLES
// =============================================================================

export const BADGE_BASE = 'inline-flex items-center font-medium';

export const BADGE_VARIANTS = {
  default: 'rounded-full px-2.5 py-0.5 text-xs',
  pill: 'rounded-full px-3 py-1 text-xs',
  square: 'rounded px-2 py-0.5 text-xs',
} as const;

export const BADGE_COLORS = {
  gray: 'bg-gray-100 text-gray-800 border-gray-300',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  green: 'bg-green-100 text-green-800 border-green-300',
  blue: 'bg-blue-100 text-blue-800 border-blue-300',
  red: 'bg-red-100 text-red-800 border-red-300',
  amber: 'bg-amber-100 text-amber-800 border-amber-300',
  orange: 'bg-orange-100 text-orange-800 border-orange-300',
} as const;

// =============================================================================
// CARD STYLES
// =============================================================================

export const CARD_BASE = 'bg-white overflow-hidden transition-all';

export const CARD_VARIANTS = {
  elevated: 'rounded-2xl shadow-lg hover:shadow-2xl',
  bordered: 'rounded-xl border-2 border-stone-200 hover:border-navy-300 hover:shadow-md',
  flat: 'rounded-lg border border-stone-200',
} as const;

// =============================================================================
// MODAL STYLES
// =============================================================================

export const MODAL_BACKDROP = 'fixed inset-0 z-50 bg-black/60';

export const MODAL_CONTAINER = 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4';

export const MODAL_CONTENT =
  'relative bg-white rounded-lg shadow-2xl max-h-[95vh] flex flex-col sm:rounded-2xl sm:max-h-[90vh]';

export const MODAL_SIZES = {
  sm: 'w-full max-w-md',
  md: 'w-full max-w-lg',
  lg: 'w-full max-w-2xl',
  xl: 'w-full max-w-4xl',
  '2xl': 'w-full max-w-6xl',
} as const;

export const MODAL_HEADER =
  'flex items-center justify-between flex-shrink-0 p-4 border-b border-stone-200 sm:p-6';

export const MODAL_TITLE = 'text-lg font-semibold text-stone-900 sm:text-xl';

export const MODAL_BODY = 'flex-1 overflow-y-auto p-4 sm:p-6';

// =============================================================================
// DROPDOWN STYLES
// =============================================================================

export const DROPDOWN_PANEL =
  'absolute right-0 mt-2 rounded-lg bg-white shadow-xl border border-stone-200 py-2 z-50 animate-slideDown';

export const DROPDOWN_ITEM =
  'flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-stone-50';

// =============================================================================
// FORM STYLES
// =============================================================================

export const FORM_LABEL = 'block text-sm font-medium text-stone-700 mb-1';

export const FORM_ERROR = 'text-xs text-red-600 mt-1 flex items-center gap-1';

export const FORM_HINT = 'text-xs text-stone-500 mt-1';

export const FORM_GROUP = 'space-y-1';

// =============================================================================
// ICON BUTTON STYLES
// =============================================================================

export const ICON_BUTTON_BASE =
  'p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

export const ICON_BUTTON_VARIANTS = {
  default: 'text-stone-500 hover:text-stone-700 hover:bg-stone-100 focus:ring-stone-400',
  primary: 'text-navy-600 hover:text-navy-800 hover:bg-navy-50 focus:ring-gold-500',
  danger: 'text-red-500 hover:text-red-700 hover:bg-red-50 focus:ring-red-500',
} as const;

// =============================================================================
// CHECKBOX STYLES
// =============================================================================

export const CHECKBOX_BASE = 'h-4 w-4 rounded border-stone-300 text-navy-600 focus:ring-navy-500';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type InputVariant = keyof typeof INPUT_VARIANTS;
export type InputSize = keyof typeof INPUT_SIZES;
export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;
export type BadgeVariant = keyof typeof BADGE_VARIANTS;
export type BadgeColor = keyof typeof BADGE_COLORS;
export type CardVariant = keyof typeof CARD_VARIANTS;
export type ModalSize = keyof typeof MODAL_SIZES;
