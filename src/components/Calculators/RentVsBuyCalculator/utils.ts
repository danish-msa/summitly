// Helper functions for number formatting with commas
export const formatNumberWithCommas = (value: number): string => {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const parseNumberFromString = (value: string): number => {
  const cleaned = value.replace(/[^\d.]/g, '');
  return Number(cleaned) || 0;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-CA', { 
    style: 'currency', 
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

export const formatYearsMonths = (years: number): string => {
  const wholeYears = Math.floor(years);
  const months = Math.round((years - wholeYears) * 12);
  if (months === 0) {
    return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}`;
  }
  if (wholeYears === 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  return `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'} and ${months} ${months === 1 ? 'month' : 'months'}`;
};

