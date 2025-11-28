import React from 'react';
import { ContactSection } from '@/components/common/ContactSection';
import type { PageType } from '../types';

interface ContactSectionProps {
  pageType: PageType;
  displayTitle: string;
}

export const PreConContactSection: React.FC<ContactSectionProps> = ({ pageType, displayTitle }) => {
  const getTitle = () => {
    if (pageType === 'city') {
      return `Connect with Us About Pre-Construction in ${displayTitle}`;
    } else if (pageType === 'status') {
      return `Connect with Us About ${displayTitle}`;
    } else if (pageType === 'propertyType' || pageType === 'subPropertyType') {
      return `Connect with Us About ${displayTitle}`;
    } else if (pageType === 'completionYear') {
      return `Connect with Us About Projects Completing in ${displayTitle}`;
    }
    return "Connect with Us Today";
  };

  const getDescription = () => {
    if (pageType === 'city') {
      return `Reach out to our team for any inquiries about pre-construction projects in ${displayTitle}. Whether you're looking for your dream home, need guidance on the buying process, or have questions about specific developments, we're here to help. Let's make your real estate journey seamless and enjoyable.`;
    } else if (pageType === 'status') {
      return `Reach out to our team for any inquiries about ${displayTitle.toLowerCase()} pre-construction projects. Whether you're looking for your dream home, need guidance on the buying process, or have questions about specific developments, we're here to help. Let's make your real estate journey seamless and enjoyable.`;
    } else if (pageType === 'propertyType' || pageType === 'subPropertyType') {
      return `Reach out to our team for any inquiries about ${displayTitle.toLowerCase()}. Whether you're looking for your dream home, need guidance on the buying process, or have questions about specific developments, we're here to help. Let's make your real estate journey seamless and enjoyable.`;
    } else if (pageType === 'completionYear') {
      return `Reach out to our team for any inquiries about pre-construction projects completing in ${displayTitle}. Whether you're looking for your dream home, need guidance on the buying process, or have questions about specific developments, we're here to help. Let's make your real estate journey seamless and enjoyable.`;
    }
    return "Reach out to our team for any inquiries or assistance you may need. Whether you're looking for your dream home, need guidance on the buying process, or have any other questions, we're here to help. Let's make your real estate journey seamless and enjoyable.";
  };

  return (
    <ContactSection
      title={getTitle()}
      description={getDescription()}
    />
  );
};

