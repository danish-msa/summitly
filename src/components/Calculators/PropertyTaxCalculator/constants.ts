import { Home, Building, TreePine } from "lucide-react";

// 2025 Property Tax Rates for Toronto (from official source)
export const TORONTO_TAX_RATES = {
  residential: {
    cityRate: 0.592653,
    educationRate: 0.153000,
    cityBuildingFund: 0.008434,
    totalRate: 0.754087
  },
  multiResidential: {
    cityRate: 1.036734,
    educationRate: 0.153000,
    cityBuildingFund: 0.007571,
    totalRate: 1.197305
  },
  newMultiResidential: {
    cityRate: 0.592653,
    educationRate: 0.153000,
    cityBuildingFund: 0.008434,
    totalRate: 0.754087
  },
  commercial: {
    cityRate: 1.385397,
    educationRate: 0.880000,
    cityBuildingFund: 0.010081,
    totalRate: 2.275478
  },
  industrial: {
    cityRate: 1.483217,
    educationRate: 0.880000,
    cityBuildingFund: 0.021086,
    totalRate: 2.384303
  },
  farmlands: {
    cityRate: 0.148163,
    educationRate: 0.038250,
    cityBuildingFund: 0.002109,
    totalRate: 0.188522
  },
  managedForests: {
    cityRate: 0.148163,
    educationRate: 0.038250,
    cityBuildingFund: 0.002109,
    totalRate: 0.188522
  }
};

// Major Ontario municipalities with estimated tax rates (relative to Toronto)
export const MUNICIPALITIES = {
  "Toronto, ON": { multiplier: 1.0, name: "Toronto" },
  "Mississauga, ON": { multiplier: 0.85, name: "Mississauga" },
  "Brampton, ON": { multiplier: 0.82, name: "Brampton" },
  "Hamilton, ON": { multiplier: 0.78, name: "Hamilton" },
  "London, ON": { multiplier: 0.75, name: "London" },
  "Markham, ON": { multiplier: 0.88, name: "Markham" },
  "Vaughan, ON": { multiplier: 0.90, name: "Vaughan" },
  "Kitchener, ON": { multiplier: 0.80, name: "Kitchener" },
  "Windsor, ON": { multiplier: 0.72, name: "Windsor" },
  "Ottawa, ON": { multiplier: 0.95, name: "Ottawa" }
};

// Detailed City Tax Breakdown by Service Category (based on Toronto's 2025 structure)
export const CITY_TAX_BREAKDOWN = {
  transit: { percentage: 19.58905092, description: "Public transit operations and infrastructure" },
  police: { percentage: 17.26876205, description: "Police services and law enforcement" },
  capitalInvestments: { percentage: 12.42697027, description: "Capital investments & corporate financing" },
  socialPrograms: { percentage: 11.29160849, description: "Cost shared social programs" },
  fireParamedic: { percentage: 9.589725851, description: "Fire and paramedic services" },
  otherOperations: { percentage: 9.18202488, description: "Other city operations" },
  otherAgencies: { percentage: 8.981232679, description: "Other agencies and boards" },
  governance: { percentage: 8.92323073, description: "Governance and corporate services" },
  transportation: { percentage: 4.170445582, description: "Transportation infrastructure" }
};

export const PROPERTY_TYPES = [
  { value: "residential", label: "Residential", icon: Home, description: "Single-family homes, townhouses" },
  { value: "multiResidential", label: "Multi-Residential", icon: Building, description: "Apartment buildings, rental properties" },
  { value: "newMultiResidential", label: "New Multi-Residential", icon: Building, description: "New rental properties (15% reduction)" },
  { value: "commercial", label: "Commercial", icon: Building, description: "Office buildings, retail spaces" },
  { value: "industrial", label: "Industrial", icon: Building, description: "Manufacturing, warehouses" },
  { value: "farmlands", label: "Farmlands", icon: TreePine, description: "Agricultural properties" },
  { value: "managedForests", label: "Managed Forests", icon: TreePine, description: "Forest management properties" }
];

export const PAYMENT_SCHEDULES = [
  { value: "monthly", label: "Monthly (12 payments)", multiplier: 1/12 },
  { value: "quarterly", label: "Quarterly (4 payments)", multiplier: 1/4 },
  { value: "semi-annually", label: "Semi-annually (2 payments)", multiplier: 1/2 },
  { value: "annually", label: "Annually (1 payment)", multiplier: 1 }
];

