import React from 'react';
import BlogSection from '@/components/common/BlogSection';
import type { PageType } from '../types';

interface BlogSectionWrapperProps {
  pageType: PageType;
  displayTitle: string;
  province: string;
  slug: string;
}

export const BlogSectionWrapper: React.FC<BlogSectionWrapperProps> = ({
  pageType,
  displayTitle,
  province,
  slug,
}) => {
  const getHeading = () => {
    if (pageType === 'by-location') {
      return `Latest News and Insight in ${displayTitle}`;
    } else if (pageType === 'status') {
      return `Latest News and Insights for ${displayTitle}`;
    } else if (pageType === 'propertyType' || pageType === 'subPropertyType' || pageType === 'completionYear') {
      return `Latest News and Insights for ${displayTitle}`;
    }
    return 'Latest Pre-Construction News and Insights';
  };

  const getDescription = () => {
    if (pageType === 'by-location') {
      return `Discover the latest news, market insights, and expert advice about pre-construction properties in ${displayTitle}, ${province}. Stay ahead with Summitly's comprehensive coverage of the real estate market.`;
    } else if (pageType === 'status') {
      return `Stay updated with the latest news, market trends, and expert insights about ${displayTitle.toLowerCase()}. Get valuable information to help you make informed decisions with Summitly.`;
    } else if (pageType === 'propertyType' || pageType === 'subPropertyType' || pageType === 'completionYear') {
      return `Explore the latest news, market insights, and expert advice about ${displayTitle.toLowerCase()}. Stay informed with Summitly's comprehensive coverage of pre-construction real estate.`;
    }
    return 'Discover the latest news, market insights, and expert advice about pre-construction properties. Stay ahead with Summitly\'s comprehensive coverage of the real estate market.';
  };

  const getViewAllLink = () => {
    if (pageType === 'by-location') {
      return `/news?category=Pre-construction&search=${encodeURIComponent(displayTitle)}`;
    } else if (pageType === 'status') {
      const statusSlug = slug.toLowerCase();
      return `/news?category=Pre-construction&search=${encodeURIComponent(statusSlug)}`;
    } else if (pageType === 'propertyType' || pageType === 'subPropertyType' || pageType === 'completionYear') {
      return `/news?category=Pre-construction&search=${encodeURIComponent(displayTitle)}`;
    }
    return '/news?category=Pre-construction';
  };

  return (
    <section>
      <BlogSection
        category="Pre-construction"
        heading={getHeading()}
        subheading="Stay Informed"
        description={getDescription()}
        limit={3}
        viewAllLink={getViewAllLink()}
      />
    </section>
  );
};

