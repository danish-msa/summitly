import { z } from "zod"

export const propertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  propertyType: z.enum(["HOUSE", "APARTMENT", "CONDO", "TOWNHOUSE", "VILLA", "OFFICE", "COMMERCIAL", "LAND", "OTHER"]),
  
  // Address
  streetNumber: z.string().optional(),
  streetName: z.string().min(1, "Street name is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().optional(),
  country: z.string().default("US"),
  
  // Property Details
  bedrooms: z.number().min(0, "Bedrooms must be non-negative"),
  bathrooms: z.number().min(0, "Bathrooms must be non-negative"),
  squareFeet: z.number().min(0, "Square feet must be positive").optional(),
  lotSize: z.number().min(0, "Lot size must be positive").optional(),
  yearBuilt: z.number().min(1800, "Year built must be realistic").max(new Date().getFullYear(), "Year built cannot be in the future").optional(),
  
  // Coordinates
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  
  // Images
  images: z.array(z.string().url()).default([]),
  
  // Features
  features: z.array(z.string()).default([]),
})

export const propertySearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  propertyType: z.enum(["HOUSE", "APARTMENT", "CONDO", "TOWNHOUSE", "VILLA", "OFFICE", "COMMERCIAL", "LAND", "OTHER"]).optional(),
  sortBy: z.enum(["price", "date", "relevance"]).default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(12),
})

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  propertyId: z.string().optional(),
  type: z.enum(["GENERAL", "PROPERTY_INQUIRY", "AGENT_REQUEST", "SUPPORT"]).default("GENERAL"),
})

export type PropertyInput = z.infer<typeof propertySchema>
export type PropertySearchInput = z.infer<typeof propertySearchSchema>
export type ContactInput = z.infer<typeof contactSchema>
