import { PropertyListing } from '@/lib/types';

interface ExtendedPreCon {
  promotions?: string | null;
}

/**
 * Check if a pre-construction property has pricing data
 * @param property - The property listing to check
 * @returns true if pricing data exists (priceRange, startingPrice, or promotions)
 */
export const hasPricingData = (property: PropertyListing | null | undefined): boolean => {
  if (!property?.preCon) return false;
  const preCon = property.preCon;
  const hasPriceRange = !!(preCon.priceRange?.min || preCon.priceRange?.max);
  const hasStartingPrice = !!(preCon.startingPrice && preCon.startingPrice > 0);
  const extendedPreCon = preCon as ExtendedPreCon;
  const hasPromotions = !!(extendedPreCon.promotions && extendedPreCon.promotions.trim().length > 0);
  return hasPriceRange || hasStartingPrice || hasPromotions;
};

/**
 * Check if a pre-construction property has deposit structure data
 * @param property - The property listing to check
 * @returns true if deposit structure exists and is not empty
 */
export const hasDepositStructure = (property: PropertyListing | null | undefined): boolean => {
  if (!property?.preCon) return false;
  return !!(property.preCon.depositStructure && property.preCon.depositStructure.trim().length > 0);
};

/**
 * Check if a pre-construction property has documents
 * @param property - The property listing to check
 * @returns true if documents array exists and has items
 */
export const hasDocuments = (property: PropertyListing | null | undefined): boolean => {
  if (!property?.preCon) return false;
  const documents = property.preCon.documents || [];
  return Array.isArray(documents) && documents.length > 0;
};

/**
 * Check if a pre-construction property has available units
 * @param property - The property listing to check
 * @returns true if units array exists and has items
 */
export const hasAvailableUnits = (property: PropertyListing | null | undefined): boolean => {
  if (!property?.preCon) return false;
  const units = property.preCon.units || [];
  return Array.isArray(units) && units.length > 0;
};

