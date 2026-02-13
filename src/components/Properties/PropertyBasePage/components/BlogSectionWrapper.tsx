import React from "react";
import BlogSection from "@/components/common/BlogSection";
import type { PropertyPageType } from "../types";

interface BlogSectionWrapperProps {
  pageType: PropertyPageType;
  displayTitle: string;
  province: string;
  slug: string;
}

export const BlogSectionWrapper: React.FC<BlogSectionWrapperProps> = ({
  pageType,
  displayTitle,
  province,
  slug: _slug,
}) => {
  void _slug;
  const getHeading = () => {
    if (pageType === "by-location") {
      return "Latest News and Insight in " + displayTitle;
    }
    return "Latest News and Insights for " + displayTitle;
  };

  const getDescription = () => {
    if (pageType === "by-location") {
      return "Discover the latest news, market insights, and expert advice about properties in " + displayTitle + ", " + province + ". Stay ahead with Summitly.";
    }
    return "Explore the latest news, market insights, and expert advice about " + displayTitle + ". Stay informed with Summitly.";
  };

  const getViewAllLink = () => {
    return "/news?search=" + encodeURIComponent(displayTitle);
  };

  return (
    <section>
      <BlogSection
        heading={getHeading()}
        subheading="Stay Informed"
        description={getDescription()}
        limit={3}
        viewAllLink={getViewAllLink()}
      />
    </section>
  );
};
