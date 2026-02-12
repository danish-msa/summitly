/**
 * Zipcode / postal code detection and formatting for URL segments.
 * Used by buy, rent, and pre-con routes when the first segment may be a zipcode.
 */

/** Canadian postal code: A1A1A1 or A1A-1A1 (letter-digit-letter digit-letter-digit) */
const CANADIAN_POSTAL = /^[A-Za-z]\d[A-Za-z][-]?\d[A-Za-z]\d$/;
/** US ZIP: 5 digits or 5+4 */
const US_ZIP = /^\d{5}(-\d{4})?$/;

/**
 * Returns true if the segment looks like a zipcode/postal code (Canadian or US).
 * Canadian: M5H2N2, M5H-2N2, K1A0B1
 * US: 90210, 12345-6789
 */
export function isZipcodeSegment(segment: string): boolean {
  if (!segment || typeof segment !== 'string') return false;
  const normalized = segment.replace(/\s/g, '').trim();
  if (CANADIAN_POSTAL.test(normalized)) return true;
  if (US_ZIP.test(normalized)) return true;
  return false;
}

/**
 * Normalize zipcode for API: remove spaces and hyphens for Canadian (M5H2N2),
 * keep US as-is (90210 or 12345-6789).
 * Repliers may expect zip without space for Canadian.
 */
export function normalizeZipcodeForApi(segment: string): string {
  if (!segment) return '';
  const s = segment.trim().replace(/\s/g, '');
  if (CANADIAN_POSTAL.test(s)) return s.replace(/-/g, '').toUpperCase();
  if (US_ZIP.test(s)) return s;
  return s;
}

/**
 * Format zipcode for display: Canadian "A1A 1A1", US "12345" or "12345-6789"
 */
export function formatZipcodeForDisplay(segment: string): string {
  if (!segment) return '';
  const s = segment.trim().replace(/\s/g, '').replace(/-/g, '');
  if (CANADIAN_POSTAL.test(s)) {
    const upper = s.toUpperCase();
    return upper.length === 6 ? `${upper.slice(0, 3)} ${upper.slice(3)}` : upper;
  }
  if (US_ZIP.test(segment.trim())) return segment.trim();
  return segment;
}
