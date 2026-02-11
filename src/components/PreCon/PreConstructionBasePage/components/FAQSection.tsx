import React, { useMemo } from 'react';
import FAQComponent, { type FaqItem } from '@/components/common/FAQ';
import type { PageType } from '../types';

interface FAQSectionProps {
  pageType: PageType;
  displayTitle: string;
  customFaqs?: string | null;
}

const initialFaqs: FaqItem[] = [
  {
    id: "1",
    question: "What is a pre-construction project?",
    answer: "A pre-construction project is a new residential development that is sold before construction is completed. Buyers purchase units during the planning or early construction phase, often at lower prices than completed units. You'll receive a unit upon project completion, typically 1-3 years after purchase.",
  },
  {
    id: "2",
    question: "How do deposits work for pre-construction?",
    answer: "Deposits for pre-construction projects are typically structured in stages. You'll usually pay 5-10% on signing, followed by additional deposits at specific milestones (e.g., 5% at occupancy permit, 5% at closing). These deposits are held in trust by the developer's lawyer until closing.",
  },
  {
    id: "3",
    question: "What happens if the project is delayed?",
    answer: "Construction delays are common in pre-construction projects. Your purchase agreement will include a 'outside closing date' that allows for reasonable delays. If delays exceed the specified timeframe, you may have options to cancel and receive your deposits back, depending on your contract terms.",
  },
  {
    id: "4",
    question: "What are the risks of buying pre-construction?",
    answer: "Key risks include construction delays, potential changes to the final product, market value fluctuations, and developer bankruptcy. However, you also benefit from lower initial pricing, potential appreciation, and the ability to secure a brand-new home. Always work with reputable developers and review all contracts carefully.",
  },
  {
    id: "5",
    question: "When do I start making mortgage payments?",
    answer: "Mortgage payments begin only after you take possession of your completed unit, typically at the final closing date. During construction, you'll only make staged deposits. You'll need mortgage pre-approval closer to completion, usually 90-120 days before the expected closing date.",
  },
  {
    id: "6",
    question: "Can I customize my unit?",
    answer: "Customization options vary by developer and project phase. Early buyers often have more choices in finishes, fixtures, and layouts. Common customizable elements include flooring, kitchen cabinets, countertops, and bathroom fixtures. Options are typically presented during the design center appointment, which occurs after purchase.",
  },
];

const additionalFaqs: FaqItem[] = [
  {
    id: "7",
    question: "What warranties are included with pre-construction homes?",
    answer: "New homes in Canada come with Tarion warranty protection (in Ontario) or similar provincial warranty programs. This typically includes one-year coverage for defects, two-year coverage for water penetration, and seven-year coverage for major structural defects. Your developer will provide warranty details at closing.",
  },
  {
    id: "8",
    question: "What happens if the developer goes bankrupt?",
    answer: "If a developer declares bankruptcy, your deposits are typically protected if they were held in trust. However, the project may be delayed or cancelled. In some cases, another developer may take over the project. It's crucial to research developers' financial stability and track record before purchasing.",
  },
  {
    id: "9",
    question: "What documents do I need to review before purchasing?",
    answer: "Essential documents include the purchase agreement, disclosure statement, architectural plans, condo declaration (for condos), and developer's financial statements. Have a real estate lawyer review all documents before signing. Pay special attention to deposit structure, completion dates, and cancellation rights.",
  },
  {
    id: "10",
    question: "How long does it take from purchase to move-in?",
    answer: "Timeline varies by project, typically ranging from 12-36 months. Factors include project size, construction complexity, and market conditions. Your purchase agreement will include an estimated occupancy date, but this is subject to change. Stay in regular communication with your developer for updates.",
  },
  {
    id: "11",
    question: "Can I visit the construction site?",
    answer: "Site visits are usually allowed but must be scheduled with the developer for safety and insurance reasons. Many developers offer periodic site tours or provide progress updates through photos and videos. Always follow safety protocols and never visit the site without authorization.",
  },
  {
    id: "12",
    question: "What happens at the final inspection and closing?",
    answer: "Before closing, you'll conduct a pre-delivery inspection (PDI) to identify any defects or issues. These are documented and should be addressed by the developer. At closing, you'll pay the final balance, receive keys, and complete final paperwork. Your lawyer will handle the closing process and ensure all conditions are met.",
  },
];

export const FAQSection: React.FC<FAQSectionProps> = ({ pageType, displayTitle, customFaqs }) => {
  // Parse custom FAQs from JSON string
  const parsedCustomFaqs: FaqItem[] = useMemo(() => {
    if (!customFaqs) return [];
    try {
      const parsed = JSON.parse(customFaqs);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Error parsing custom FAQs:", e);
      return [];
    }
  }, [customFaqs]);

  // Merge custom FAQs with default FAQs
  // Custom FAQs will appear first, then default FAQs
  const mergedInitialFaqs = useMemo(() => {
    if (parsedCustomFaqs.length === 0) return initialFaqs;
    // Add custom FAQs first, then default FAQs
    // Ensure custom FAQs have unique IDs
    const customWithIds = parsedCustomFaqs.map((faq, index) => ({
      ...faq,
      id: `custom-${faq.id || index}`,
    }));
    return [...customWithIds, ...initialFaqs];
  }, [parsedCustomFaqs]);

  const getDescription = () => {
    if (pageType === 'by-location') {
      return `Find answers to common questions about pre-construction projects in ${displayTitle}. Get expert guidance on buying new homes with Summitly.`;
    } else if (pageType === 'status') {
      return `Find answers to common questions about ${displayTitle.toLowerCase()} pre-construction projects. Get expert guidance on buying new homes with Summitly.`;
    } else if (pageType === 'propertyType' || pageType === 'subPropertyType') {
      return `Find answers to common questions about ${displayTitle.toLowerCase()}. Get expert guidance on buying new homes with Summitly.`;
    } else if (pageType === 'completionYear') {
      return `Find answers to common questions about pre-construction projects completing in ${displayTitle}. Get expert guidance on buying new homes with Summitly.`;
    }
    return "Find answers to common questions about pre-construction projects";
  };

  return (
    <FAQComponent
      initialFaqs={mergedInitialFaqs}
      additionalFaqs={additionalFaqs}
      heading="Frequently asked questions"
      subheading="FAQ"
      description={getDescription()}
    />
  );
};

