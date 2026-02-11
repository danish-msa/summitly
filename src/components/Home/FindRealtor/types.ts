export type UserType = 'buyer' | 'seller' | 'both' | null;
export type Step = 'userType' | 'location' | 'propertyType' | 'budget' | 'mortgage' | 'final';

export interface FormData {
  location: string;
  propertyType: string;
  budget: string;
  priceRange: { min: number; max: number };
  mortgage: boolean;
}