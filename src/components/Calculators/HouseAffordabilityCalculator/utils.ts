// Helper functions for number formatting
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const parseNumberFromString = (value: string): number => {
  const cleaned = value.replace(/[^\d.]/g, '');
  return Number(cleaned) || 0;
};

