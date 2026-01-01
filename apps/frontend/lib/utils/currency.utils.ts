/**
 * Cached Currency Formatters
 * Creates and caches Intl.NumberFormat instances to avoid recreation on every call
 * This significantly improves performance when formatting many values
 */
const currencyFormatters = new Map<string, Intl.NumberFormat>();

/**
 * Get or create a cached currency formatter
 */
function getFormatter(currency: string, locale: string = 'en-US'): Intl.NumberFormat {
    const key = `${locale}-${currency}`;

    if (!currencyFormatters.has(key)) {
        currencyFormatters.set(key, new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
        }));
    }

    return currencyFormatters.get(key)!;
}

/**
 * Format a number or string as currency with caching
 * @param amount - Number or string to format
 * @param currency - Currency code (USD, MXN, etc.)
 * @param locale - Locale string (en-US, es-MX, etc.)
 */
export const formatCurrency = (amount: number | string, currency: string = 'USD', locale: string = 'en-US'): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return getFormatter(currency, locale).format(numericAmount);
};

/**
 * Format as Mexican Pesos (convenience function)
 */
export const formatMXN = (amount: number | string): string => {
    return formatCurrency(amount, 'MXN', 'es-MX');
};
