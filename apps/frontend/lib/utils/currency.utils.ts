export const formatCurrency = (amount: number | string, currency: string = 'USD'): string => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(numericAmount);
};
