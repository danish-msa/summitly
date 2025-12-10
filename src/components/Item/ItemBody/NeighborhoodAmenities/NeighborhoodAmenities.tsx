import { NeighborhoodAmenitiesProps } from './types';
import { AmenitiesSection } from '@/components/common/amenities';

const CATEGORIES = [
  { id: "schools", label: "Schools" },
  { id: "parks", label: "Parks" },
  { id: "safety", label: "Safety Zones" },
  { id: "transit", label: "Transit Stops" },
];

export const NeighborhoodAmenities = ({ 
  address = "80 Esther Lorrie Drive",
  latitude,
  longitude 
}: NeighborhoodAmenitiesProps) => {
  return (
    <AmenitiesSection
      address={address}
      latitude={latitude}
      longitude={longitude}
      categories={CATEGORIES}
      apiEndpoint="/api/neighborhood-amenities"
      descriptionText="Find out information about nearby public amenities for"
      showDirections={true}
    />
  );
};

