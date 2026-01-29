export interface HomeImprovementScenario {
  id: string;
  label: string;
  description?: string;
  costRange: string;
  /** Fixed estimated added value when no sq.ft. input */
  estimatedAddedValue: number;
  /** When true, show sq.ft. input when selected and use valuePerSqFt for value */
  hasSqFt?: boolean;
  /** Default sq.ft. when selected */
  defaultSqFt?: number;
  /** When set with hasSqFt, value = sqft * valuePerSqFt */
  valuePerSqFt?: number;
}

export const HOME_IMPROVEMENT_SCENARIOS: HomeImprovementScenario[] = [
  {
    id: "add-bedroom",
    label: "Add a bedroom",
    description:
      "Adding a bedroom without increasing the square footage of the house can add value to properties in some areas.",
    costRange: "$1,600 - $4,000",
    estimatedAddedValue: 2562,
    hasSqFt: true,
    defaultSqFt: 20,
    valuePerSqFt: 128,
  },
  {
    id: "add-bathroom",
    label: "Add a bathroom",
    description:
      "Adjust the square footage to see the value it adds to the home.",
    costRange: "$50,000 - $90,000",
    estimatedAddedValue: 9723,
    hasSqFt: true,
    defaultSqFt: 10,
    valuePerSqFt: 972,
  },
  {
    id: "add-sqft",
    label: "Add square footage",
    description:
      "Adding livable square footage typically increases home value. Adjust the square footage below.",
    costRange: "Varies by size",
    estimatedAddedValue: 12500,
    hasSqFt: true,
    defaultSqFt: 100,
    valuePerSqFt: 125,
  },
  {
    id: "add-pool",
    label: "Add a pool",
    costRange: "Contact for quote",
    estimatedAddedValue: 0,
  },
  {
    id: "kitchen-remodel",
    label: "Kitchen remodel",
    costRange: "$25,000 - $60,000",
    estimatedAddedValue: 15200,
  },
  {
    id: "bathroom-remodel",
    label: "Bathroom remodel",
    costRange: "$15,000 - $35,000",
    estimatedAddedValue: 9800,
  },
];
