/**
 * Format date string to readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit' 
  });
};

/**
 * Calculate time ago string (e.g., "2 hours ago", "3 days ago")
 */
export const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffYears = Math.floor(diffDays / 365);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  } else {
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  }
};

/**
 * Calculate days on market
 */
export const getDaysOnMarket = (dateStart: string, dateEnd: string): number => {
  const start = new Date(dateStart);
  const end = new Date(dateEnd);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Format currency value
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format Y-axis value for chart
 */
export const formatYAxis = (value: number): string => {
  return `$${(value / 1000).toFixed(0)}K`;
};

/**
 * Get property address string
 */
export const getPropertyAddress = (property?: { address?: { location?: string; streetNumber?: string | null; streetName?: string | null; streetSuffix?: string | null } }): string => {
  if (property?.address?.location) {
    return property.address.location;
  }
  
  if (property?.address?.streetNumber && property?.address?.streetName) {
    return `${property.address.streetNumber} ${property.address.streetName}${property.address.streetSuffix ? ' ' + property.address.streetSuffix : ''}`;
  }
  
  return 'Property Address';
};

