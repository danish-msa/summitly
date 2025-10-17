/**
 * Email validation
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Phone number validation (basic)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Password validation
 */
export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * URL validation
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Price validation
 */
export const isValidPrice = (price: number): boolean => {
  return price > 0 && price < 1000000000; // Reasonable price range
};

/**
 * Property size validation
 */
export const isValidPropertySize = (sqft: number): boolean => {
  return sqft > 0 && sqft < 100000; // Reasonable size range
};

/**
 * Required field validation
 */
export const isRequired = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'number') {
    return !isNaN(value);
  }
  return value !== null && value !== undefined;
};

/**
 * Form validation helper
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => boolean | string;
}

export const validateField = (value: unknown, rules: ValidationRule): string | null => {
  // Required validation
  if (rules.required && !isRequired(value)) {
    return 'This field is required';
  }

  // Skip other validations if value is empty and not required
  if (!isRequired(value)) {
    return null;
  }

  // String length validations
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `Minimum length is ${rules.minLength} characters`;
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Maximum length is ${rules.maxLength} characters`;
    }
  }

  // Pattern validation
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    return 'Invalid format';
  }

  // Custom validation
  if (rules.custom) {
    const result = rules.custom(value);
    if (typeof result === 'string') {
      return result;
    }
    if (result === false) {
      return 'Invalid value';
    }
  }

  return null;
};
