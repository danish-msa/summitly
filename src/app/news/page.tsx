"use client";

import BlogBannerLayout from "@/components/Blog/BlogBannerLayout";
import ThreeColumnLayout from "@/components/Blog/ThreeColumnLayout";
import TrendLayout from "@/components/Blog/TrendLayout";
import MediaAssetsGridLayout from "@/components/Blog/MediaAssetsGridLayout";
import EditorsPicksLayout from "@/components/Blog/EditorsPicksLayout";
import ColumnistsLayout from "@/components/Blog/ColumnistsLayout";
import NewsletterCTALayout from "@/components/Blog/NewsletterCTALayout";

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-white">
      <BlogBannerLayout />
      <ThreeColumnLayout />
      <TrendLayout />
      <MediaAssetsGridLayout />
      <EditorsPicksLayout />
      
      <ColumnistsLayout />
      <NewsletterCTALayout />
      <EditorsPicksLayout
        title="News & Trends"
        headingId="news-trends-heading"
      />
      <EditorsPicksLayout
        title="News & Trends"
        headingId="news-trends-heading"
      />
      <EditorsPicksLayout
        title="Unique Homes"
        headingId="unique-homes-heading"
      />
    </div>
  );
}
