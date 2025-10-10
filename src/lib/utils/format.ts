/**
 * Format currency values
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format large numbers with commas
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Format date to relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

/**
 * Format property size (sqft)
 */
export const formatPropertySize = (sqft: number | string): string => {
  const size = typeof sqft === 'string' ? parseInt(sqft) || 0 : sqft;
  return `${formatNumber(size)} sqft`;
};

/**
 * Format address components into a readable string
 */
export const formatAddress = (address: {
  streetNumber?: string | null;
  streetName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): string => {
  const parts = [
    address.streetNumber,
    address.streetName,
    address.city,
    address.state,
    address.zip
  ].filter(Boolean);
  
  return parts.join(', ') || 'Address not available';
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Capitalize first letter of each word
 */
export const capitalizeWords = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};
