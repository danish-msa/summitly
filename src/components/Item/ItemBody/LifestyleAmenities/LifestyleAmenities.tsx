import { LifestyleAmenitiesProps } from './types';
import { AmenitiesSection } from '@/components/common/amenities';

const CATEGORIES = [
  { id: "entertainment", label: "Entertainment" },
  { id: "shopping", label: "Shopping" },
  { id: "worship", label: "Worship" },
  { id: "sports", label: "Sports" },
  { id: "food", label: "Food" },
  { id: "miscellaneous", label: "Miscellaneous" },
];

export const LifestyleAmenities = ({ 
  address = "80 Esther Lorrie Drive",
  latitude,
  longitude 
}: LifestyleAmenitiesProps) => {
  return (
    <AmenitiesSection
      address={address}
      latitude={latitude}
      longitude={longitude}
      categories={CATEGORIES}
      apiEndpoint="/api/neighborhood-amenities"
      descriptionText="Discover lifestyle amenities and services near"
      showDirections={false}
    />
  );
};

