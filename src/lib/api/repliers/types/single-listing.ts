/**
 * Single Property Listing API Response Types
 * 
 * Comprehensive type definitions matching the full Repliers API response
 * for a single property listing endpoint
 */

// ============================================================================
// CORE LISTING INTERFACE
// ============================================================================

export interface SinglePropertyListingResponse {
  mlsNumber: string;
  resource: string;
  status: string;
  class: string;
  type: string;
  listPrice: number;
  listDate: string;
  lastStatus: string;
  soldPrice: number | null;
  soldDate: string | null;
  originalPrice: number;
  assignment: string | null;
  
  address: PropertyAddress;
  map: PropertyMap;
  permissions: PropertyPermissions;
  images: string[];
  photoCount: number;
  details: PropertyDetails;
  daysOnMarket: number;
  occupancy: string | null;
  updatedOn: string;
  
  condominium: CondominiumInfo | null;
  coopCompensation: unknown | null;
  lot: LotInfo;
  nearby: NearbyInfo;
  office: OfficeInfo;
  openHouse: OpenHouse[];
  rooms: Room[];
  taxes: TaxInfo;
  timestamps: Timestamps;
  agents: Agent[];
  history: ListingHistory[];
  comparables: ComparableListing[];
  estimate: PropertyEstimate;
  imageInsights: ImageInsights;
  simpleDaysOnMarket: number;
  standardStatus: string;
  boardId: number;
}

// ============================================================================
// NESTED INTERFACES
// ============================================================================

export interface PropertyAddress {
  area: string | null;
  city: string | null;
  country: string | null;
  district: string | null;
  majorIntersection: string | null;
  neighborhood: string | null;
  streetDirection: string | null;
  streetName: string | null;
  streetNumber: string | null;
  streetSuffix: string | null;
  unitNumber: string | null;
  zip: string | null;
  state: string | null;
  communityCode: string | null;
  streetDirectionPrefix: string | null;
  addressKey: string | null;
}

export interface PropertyMap {
  latitude: number;
  longitude: number;
  point: string;
}

export interface PropertyPermissions {
  displayAddressOnInternet: string;
  displayPublic: string;
  displayInternetEntireListing: string;
}

export interface PropertyDetails {
  airConditioning: string | null;
  basement1: string | null;
  basement2: string | null;
  centralVac: string | null;
  den: string | null;
  description: string | null;
  elevator: string | null;
  exteriorConstruction1: string | null;
  exteriorConstruction2: string | null;
  extras: string | null;
  furnished: string | null;
  garage: string | null;
  heating: string | null;
  numBathrooms: number | null;
  numBathroomsPlus: number | null;
  numBedrooms: number | null;
  numBedroomsPlus: number | null;
  numFireplaces: number | null;
  numGarageSpaces: number | null;
  numParkingSpaces: number | null;
  numRooms: number | null;
  numRoomsPlus: number | null;
  patio: string | null;
  propertyType: string | null;
  sqft: string | null;
  minSqft?: string | null;
  maxSqft?: string | null;
  style: string | null;
  swimmingPool: string | null;
  virtualTourUrl: string | null;
  yearBuilt: string | null;
  landAccessType: string | null;
  landSewer: string | null;
  viewType: string | null;
  zoningDescription: string | null;
  analyticsClick: string | null;
  moreInformationLink: string | null;
  alternateURLVideoLink: string | null;
  flooringType: string | null;
  foundationType: string | null;
  landscapeFeatures: string | null;
  fireProtection: string | null;
  roofMaterial: string | null;
  farmType: string | null;
  zoningType: string | null;
  businessType: string | null;
  businessSubType: string | null;
  landDisposition: string | null;
  storageType: string | null;
  constructionStyleSplitLevel: string | null;
  constructionStatus: string | null;
  loadingType: string | null;
  ceilingType: string | null;
  liveStreamEventURL: string | null;
  energuideRating: string | null;
  amperage: string | null;
  sewer: string | null;
  familyRoom: string | null;
  zoning: string | null;
  driveway: string | null;
  leaseTerms: string | null;
  centralAirConditioning: string | null;
  certificationLevel: string | null;
  energyCertification: string | null;
  parkCostMonthly: string | null;
  commonElementsIncluded: string | null;
  greenPropertyInformationStatement: string | null;
  handicappedEquipped: string | null;
  laundryLevel: string | null;
  balcony: string | null;
  numKitchens: number | null;
  numKitchensPlus: number | null;
  sqftRange: string | null;
  numDrivewaySpaces: number | null;
  HOAFee: string | null;
  HOAFee2: string | null;
  HOAFee3: string | null;
  waterSource: string | null;
  livingAreaMeasurement: string | null;
  waterfront: string | null;
  bathrooms: unknown[];
  numBathroomsHalf: number | null;
}

export interface CondominiumInfo {
  buildingInsurance: string | null;
  condoCorp: string | null;
  condoCorpNum: string | null;
  exposure: string | null;
  lockerNumber: string | null;
  locker: string | null;
  parkingType: string | null;
  pets: string | null;
  propertyMgr: string | null;
  stories: string | null;
  fees: CondominiumFees;
  lockerUnitNumber: string | null;
  ensuiteLaundry: string | null;
  sharesPercentage: string | null;
  lockerLevel: string | null;
  unitNumber: string | null;
  amenities: string[];
}

export interface CondominiumFees {
  cableInlc: string | null;
  heatIncl: string | null;
  hydroIncl: string | null;
  maintenance: number | null;
  parkingIncl: string | null;
  taxesIncl: string | null;
  waterIncl: string | null;
}

export interface LotInfo {
  acres: number | null;
  depth: number | string | null;
  irregular: number | string | null;
  legalDescription: string | null;
  measurement: string | null;
  width: number | null;
  size: string | null;
  source: string | null;
  dimensionsSource: string | null;
  dimensions: string | null;
  squareFeet: number | null;
  features: string | null;
  taxLot: string | null;
}

export interface NearbyInfo {
  amenities: string[];
}

export interface OfficeInfo {
  brokerageName: string;
}

export interface OpenHouse {
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
}

export interface Room {
  description: string;
  features: string | null;
  features2: string | null;
  features3: string | null;
  length: number | string | null;
  width: number | string | null;
  level: string;
}

export interface TaxInfo {
  annualAmount: number | null;
  assessmentYear: string | null;
}

export interface Timestamps {
  idxUpdated: string | null;
  listingUpdated: string | null;
  photosUpdated: string | null;
  conditionalExpiryDate: string | null;
  terminatedDate: string | null;
  suspendedDate: string | null;
  listingEntryDate: string | null;
  closedDate: string | null;
  unavailableDate: string | null;
  expiryDate: string | null;
  extensionEntryDate: string | null;
  possessionDate: string | null;
  repliersUpdatedOn: string | null;
  imageInsightsUpdatedOn: string | null;
}

export interface Agent {
  agentId: string;
  boardAgentId: string;
  officeId: string;
  updatedOn: string;
  name: string;
  board: string | null;
  boardOfficeId: string;
  position: string;
  email: string;
  phones: string[];
  social: unknown[];
  website: string | null;
  photo: AgentPhoto;
  brokerage: BrokerageInfo;
}

export interface AgentPhoto {
  small: string | null;
  large: string | null;
  updatedOn: string | null;
}

export interface BrokerageInfo {
  name: string;
  address: BrokerageAddress;
}

export interface BrokerageAddress {
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  postal: string;
  country: string | null;
}

export interface ListingHistory {
  mlsNumber: string;
  type: string;
  listPrice: number;
  listDate: string;
  lastStatus: string;
  soldPrice: number | null;
  soldDate: string | null;
  images: string[];
  photoCount: number;
  office: OfficeInfo;
  timestamps: Timestamps;
}

export interface ComparableListing {
  mlsNumber: string;
  type: string;
  listPrice: number;
  listDate: string;
  lastStatus: string;
  soldPrice: number | null;
  soldDate: string | null;
  address: PropertyAddress;
  details: PropertyDetails;
  condominium: CondominiumInfo | null;
  images: string[];
  timestamps: Timestamps;
  distance: number;
}

export interface PropertyEstimate {
  date: string;
  high: number;
  low: number;
  confidence: number;
  history: EstimateHistory;
  value: number;
}

export interface EstimateHistory {
  mth: Record<string, { value: number }>;
}

export interface ImageInsights {
  summary: ImageInsightsSummary;
  images: ImageInsight[];
}

export interface ImageInsightsSummary {
  quality: ImageQualitySummary;
}

export interface ImageQualitySummary {
  qualitative: QualitativeQuality;
  quantitative: QuantitativeQuality;
}

export interface QualitativeQuality {
  features: QualityFeatures;
  overall: string;
}

export interface QuantitativeQuality {
  features: QualityFeaturesNumeric;
  overall: number;
}

export interface QualityFeatures {
  livingRoom: string;
  frontOfStructure: string;
  kitchen: string;
  diningRoom: string;
  bathroom: string;
  bedroom: string;
}

export interface QualityFeaturesNumeric {
  livingRoom: number;
  frontOfStructure: number;
  kitchen: number;
  diningRoom: number;
  bathroom: number;
  bedroom: number;
}

export interface ImageInsight {
  image: string;
  classification: ImageClassification;
  quality: ImageQuality | null;
}

export interface ImageClassification {
  imageOf: string;
  prediction: number;
}

export interface ImageQuality {
  qualitative: string;
  quantitative: number;
}

