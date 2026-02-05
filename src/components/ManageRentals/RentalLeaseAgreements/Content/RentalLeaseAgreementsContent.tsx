import EverythingYouNeedSection from "./EverythingYouNeedSection";
import EditSignAnywhereSection from "./EditSignAnywhereSection";
import LeaseBuilderSection from "./LeaseBuilderSection";
import TestimonialsSection from "./TestimonialsSection";
import FAQSection from "./FAQSection";
import DoMoreSection from "./DoMoreSection";
import CtaBannerSection from "./CtaBannerSection";
import BlogSection from "@/components/common/BlogSection";

export function RentalLeaseAgreementsContent() {
  return (
    <>
      <EverythingYouNeedSection />
      <EditSignAnywhereSection />
      <LeaseBuilderSection />
      <TestimonialsSection />
      <FAQSection />
      <DoMoreSection />
      <CtaBannerSection />
      <BlogSection
        heading="From our blog"
        subheading="Latest news"
        description="Tips and updates for landlords and property managers."
        limit={3}
        viewAllLink="/blogs"
        showViewAll
      />
    </>
  );
}
