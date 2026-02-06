import React from "react";
import { ContactSection as CommonContactSection } from "@/components/common/ContactSection";
import type { PropertyPageType } from "../types";

interface PropertyContactSectionProps {
  pageType: PropertyPageType;
  displayTitle: string;
}

export const PropertyContactSection: React.FC<PropertyContactSectionProps> = ({
  pageType,
  displayTitle,
}) => {
  const getTitle = () => {
    if (pageType === "by-location") {
      return `Connect with Us About Properties in ${displayTitle}`;
    }
    return `Connect with Us About ${displayTitle}`;
  };

  const getDescription = () => {
    if (pageType === "by-location") {
      return `Reach out to our team for any inquiries about properties in ${displayTitle}. Whether you're looking for your dream home, need guidance on the buying process, or have questions about specific listings, we're here to help.`;
    }
    return `Reach out to our team for any inquiries about ${displayTitle.toLowerCase()}. Whether you're looking for your dream home, need guidance on the buying process, or have questions about listings, we're here to help.`;
  };

  return (
    <CommonContactSection
      title={getTitle()}
      description={getDescription()}
    />
  );
};
