/**
 * Design tokens — "Silent Monolith" design system
 * Single source of truth for all UI styles.
 * Import and use these instead of writing raw Tailwind classes.
 */

// =============================================================================
// COLOR PALETTE (hex values — for inline styles or arbitrary Tailwind values)
// =============================================================================

export const DS = {
  // Backgrounds
  pageBg:       '#F5F4F0', // surface-container-low
  cardBg:       '#FFFFFF', // surface-container-lowest
  sidebarBg:    '#0F0F0D', // obsidian

  // Text
  textPrimary:  '#1B1C1A', // on-surface
  textMuted:    '#6B6A65', // on-surface-variant
  textPlaceholder: '#A09B90',

  // Gold (primary accent)
  goldLight:    '#C9A84C', // primary-container
  goldDark:     '#755B00', // primary

  // Borders / dividers
  borderLight:  '#D0C5B2',

  // Surfaces
  surfaceHover: '#FAF9F5',
  surfaceActive:'#F5F4F0',

  // Semantic
  success:      '#D1E7DD',
  successText:  '#2D6A4F',
  error:        '#FFDAD6',
  errorText:    '#BA1A1A',
} as const;

// =============================================================================
// INPUT STYLES — bottom-border style (design system rule)
// =============================================================================

/** Standard text input — bottom-border only, no box */
export const INPUT_BASE =
  'w-full bg-[#F5F4F0] border-b-2 border-[#D0C5B2] focus:border-[#C9A84C] outline-none px-0 py-2 text-[#1B1C1A] placeholder:text-[#A09B90] transition-colors duration-200';

export const INPUT_VARIANTS = {
  default: '',
  error:   'border-[#BA1A1A] focus:border-[#BA1A1A]',
  success: 'border-[#2D6A4F] focus:border-[#2D6A4F]',
} as const;

export const INPUT_SIZES = {
  sm: 'text-sm py-1.5',
  md: 'py-2',
  lg: 'text-base py-2.5',
} as const;

export const TEXTAREA_BASE = `${INPUT_BASE} resize-none`;

// =============================================================================
// LABEL STYLES
// =============================================================================

/** Small uppercase label above inputs */
export const FORM_LABEL =
  'block text-xs font-semibold uppercase tracking-widest text-[#6B6A65] mb-2';

export const FORM_ERROR = 'text-xs text-[#BA1A1A] mt-1 flex items-center gap-1';
export const FORM_HINT  = 'text-xs text-[#6B6A65] mt-1';
export const FORM_GROUP = 'space-y-1';

// =============================================================================
// BUTTON STYLES
// =============================================================================

export const BUTTON_BASE =
  'font-semibold rounded-lg transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';

export const BUTTON_VARIANTS = {
  /** Gold gradient — main CTA */
  primary:   'bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white hover:brightness-95',
  /** Warm grey — secondary/cancel */
  secondary: 'bg-[#E3E2DF] text-[#1B1C1A] hover:bg-[#D9D8D5]',
  /** Destructive */
  danger:    'bg-red-600 text-white hover:bg-red-700',
  /** Subtle / ghost */
  ghost:     'text-[#6B6A65] hover:text-[#1B1C1A] hover:bg-[#F5F4F0]',
} as const;

export const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 text-xs min-w-[80px]',
  md: 'px-5 py-2.5 text-sm min-w-[100px]',
  lg: 'px-6 py-3 text-base min-w-[120px]',
} as const;

// =============================================================================
// BADGE / STATUS STYLES
// =============================================================================

export const BADGE_BASE =
  'inline-flex items-center text-xs font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full';

export const BADGE_VARIANTS = {
  default: 'rounded-full px-2.5 py-0.5 text-xs',
  pill:    'rounded-full px-3 py-1 text-xs',
  square:  'rounded px-2 py-0.5 text-xs',
} as const;

export const BADGE_COLORS = {
  gray:   'bg-[#E5E2DE] text-[#656461]',
  yellow: 'bg-[#C9A84C] text-[#503D00]',
  green:  'bg-[#D1E7DD] text-[#2D6A4F]',
  blue:   'bg-[#DDE1FF] text-[#2E3B77]',
  red:    'bg-[#FFDAD6]/50 text-[#BA1A1A]',
  amber:  'bg-[#C9A84C]/20 text-[#755B00]',
  orange: 'bg-orange-100 text-orange-800',
} as const;

// =============================================================================
// CARD STYLES
// =============================================================================

export const CARD_BASE = 'bg-white rounded-xl transition-colors';

export const CARD_VARIANTS = {
  /** Default card — hover changes bg */
  default:   'hover:bg-[#F5F4F0]',
  /** Static card — no hover effect */
  static:    '',
  /** Modal-style card with shadow */
  elevated:  'shadow-[0_20px_40px_-10px_rgba(27,28,26,0.06)]',
} as const;

// =============================================================================
// MODAL STYLES
// =============================================================================

export const MODAL_BACKDROP =
  'fixed inset-0 z-50 bg-[#0F0F0D]/50 backdrop-blur-sm';

export const MODAL_CONTAINER =
  'fixed inset-0 z-50 flex items-center justify-center p-4';

export const MODAL_CONTENT =
  'relative bg-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(27,28,26,0.12)] max-h-[90vh] flex flex-col';

export const MODAL_SIZES = {
  sm:  'w-full max-w-md',
  md:  'w-full max-w-lg',
  lg:  'w-full max-w-2xl',
  xl:  'w-full max-w-4xl',
  '2xl': 'w-full max-w-6xl',
} as const;

export const MODAL_HEADER =
  'flex items-center justify-between flex-shrink-0 p-6 border-b border-[#D0C5B2]/20';

export const MODAL_TITLE = 'text-lg font-bold text-[#1B1C1A]';

export const MODAL_BODY = 'flex-1 overflow-y-auto p-6';

// =============================================================================
// TABLE STYLES
// =============================================================================

export const TABLE_WRAPPER = 'bg-white rounded-lg overflow-hidden';

export const TABLE_HEADER_ROW = 'bg-[#F5F4F0] sticky top-0';

export const TABLE_TH =
  'px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[#6B6A65]';

export const TABLE_TBODY = 'divide-y divide-[#D0C5B2]/15';

export const TABLE_TR = 'hover:bg-[#FAF9F5] transition-colors';

export const TABLE_TD = 'px-6 py-4 whitespace-nowrap text-sm text-[#6B6A65]';

// =============================================================================
// ICON BUTTON STYLES
// =============================================================================

export const ICON_BUTTON_BASE =
  'p-1.5 rounded-lg transition-colors focus:outline-none';

export const ICON_BUTTON_VARIANTS = {
  default: 'text-[#6B6A65] hover:text-[#1B1C1A] hover:bg-[#F5F4F0]',
  primary: 'text-[#C9A84C] hover:text-[#755B00] hover:bg-[#F5F4F0]',
  danger:  'text-[#6B6A65] hover:text-red-500 hover:bg-red-50',
} as const;

// =============================================================================
// DROPDOWN STYLES
// =============================================================================

export const DROPDOWN_PANEL =
  'absolute right-0 mt-2 rounded-lg bg-white shadow-[0_8px_24px_-4px_rgba(27,28,26,0.10)] border border-[#D0C5B2]/30 py-1.5 z-50';

export const DROPDOWN_ITEM =
  'flex items-center gap-3 px-4 py-2.5 text-sm text-[#1B1C1A] transition-colors hover:bg-[#F5F4F0]';

// =============================================================================
// SIDEBAR STYLES
// =============================================================================

export const SIDEBAR_NAV_ITEM =
  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors';

export const SIDEBAR_NAV_ITEM_ACTIVE =
  'text-[#C9A84C] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:bg-[#C9A84C] before:rounded-r-full';

export const SIDEBAR_NAV_ITEM_INACTIVE =
  'text-[#8A8A84] hover:text-[#C9A84C] hover:bg-white/5';

// =============================================================================
// CHECKBOX
// =============================================================================

export const CHECKBOX_BASE =
  'h-4 w-4 rounded border-[#D0C5B2] text-[#C9A84C] focus:ring-[#C9A84C] focus:ring-offset-0';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type InputVariant    = keyof typeof INPUT_VARIANTS;
export type InputSize       = keyof typeof INPUT_SIZES;
export type ButtonVariant   = keyof typeof BUTTON_VARIANTS;
export type ButtonSize      = keyof typeof BUTTON_SIZES;
export type BadgeVariant    = keyof typeof BADGE_VARIANTS;
export type BadgeColor      = keyof typeof BADGE_COLORS;
export type CardVariant     = keyof typeof CARD_VARIANTS;
export type ModalSize       = keyof typeof MODAL_SIZES;
