// Helper functions for trends page

export const unslugifyCityName = (slug: string): string => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(1)}M`;
  }
  return `$${(price / 1000).toFixed(0)}K`;
};

export const formatFullPrice = (price: number): string => {
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const calculateAvgPrice = (props: { listPrice?: number }[]): number => {
  if (props.length === 0) return 0;
  const total = props.reduce((sum, p) => sum + (p.listPrice || 0), 0);
  return Math.round(total / props.length);
};

export const getDateRanges = (_years?: number) => {
  const now = new Date();
  
  // For Stats Overview, always show the most recent period (last 28 days / 4 weeks)
  // The year range affects historical data in charts, but overview stats show current period
  // This ensures the date range display updates when year range changes (for consistency)
  const currentEnd = new Date(now);
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - 28); // 4 weeks ago
  
  const pastEnd = new Date(currentStart);
  pastEnd.setDate(pastEnd.getDate() - 1);
  const pastStart = new Date(pastEnd);
  pastStart.setDate(pastStart.getDate() - 28); // 4 weeks before that

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  return {
    current: `${formatDate(currentStart)} - ${formatDate(currentEnd)}`,
    past: `${formatDate(pastStart)} - ${formatDate(pastEnd)}`
  };
};

export const getGreaterArea = (cityName: string): string => {
  const cityLower = cityName.toLowerCase();
  // Check if city is in GTA regions
  if (cityLower.includes('toronto') || cityLower.includes('mississauga') || cityLower.includes('brampton') ||
      cityLower.includes('markham') || cityLower.includes('vaughan') || cityLower.includes('richmond hill') ||
      cityLower.includes('oakville') || cityLower.includes('burlington') || cityLower.includes('ajax') ||
      cityLower.includes('pickering') || cityLower.includes('whitby') || cityLower.includes('oshawa') ||
      cityLower.includes('aurora') || cityLower.includes('milton') || cityLower.includes('caledon')) {
    return 'GTA';
  }
  // Default to GTA for now, can be expanded for other regions
  return 'GTA';
};

// Convert city name to URL slug (with -real-estate suffix)
export const cityNameToSlug = (cityName: string): string => {
  return cityName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-real-estate';
};

