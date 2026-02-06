"use client";

import React from "react";
import FAQ, { type FaqItem } from "@/components/common/FAQ";
import type { PropertyPageType } from "../types";

interface FAQSectionProps {
  pageType: PropertyPageType;
  displayTitle: string;
}

const propertyFaqs: FaqItem[] = [
  {
    id: "1",
    question: "How do I schedule a viewing for a property?",
    answer:
      "You can request a viewing directly from the listing page by clicking the 'Schedule Viewing' or 'Contact Agent' button. The listing agent will respond to arrange a convenient time. You can also call or email the agent listed on the property.",
  },
  {
    id: "2",
    question: "What is included in the listing price?",
    answer:
      "The listing price typically reflects the seller's asking price for the property. It may or may not include appliances, window coverings, or other items—these are usually specified in the listing details. Your offer and purchase agreement will outline what is included.",
  },
  {
    id: "3",
    question: "How long do properties stay on the market?",
    answer:
      "It varies by location, price range, and market conditions. Our listings are updated regularly. You can filter by listing date to see the newest properties and set up alerts to be notified when new listings match your criteria.",
  },
  {
    id: "4",
    question: "Can I make an offer below the asking price?",
    answer:
      "Yes. The asking price is the seller's initial price; you can submit an offer at any price. Your real estate agent can help you determine a competitive offer based on comparable sales, condition, and market conditions.",
  },
  {
    id: "5",
    question: "How do I know if a listing is still available?",
    answer:
      "Listings on our site are updated regularly from the MLS. Status (e.g. Active, Sold, Conditional) is shown on each listing. For the most current status, contact the listing agent before visiting or making an offer.",
  },
  {
    id: "6",
    question: "Do I need a real estate agent to buy?",
    answer:
      "You can browse and inquire without an agent, but most buyers use a registered real estate agent or broker to represent them. An agent can help with search, viewings, negotiations, and paperwork. Agent contact information is on each listing.",
  },
];

export const FAQSection: React.FC<FAQSectionProps> = ({
  pageType,
  displayTitle,
}) => {
  const heading =
    pageType === "by-location"
      ? `Frequently asked questions about buying in ${displayTitle}`
      : `Frequently asked questions about ${displayTitle}`;
  const description =
    pageType === "by-location"
      ? `Answers to common questions about properties and the buying process in ${displayTitle}.`
      : "Answers to common questions about property listings and the buying process.";

  return (
    <section
      className="w-full py-12 sm:py-16 md:py-20 bg-background"
      aria-labelledby="property-faq-heading"
    >
      <FAQ
        initialFaqs={propertyFaqs}
        heading={heading}
        subheading="FAQ"
        description={description}
        showLoadMore={false}
      />
    </section>
  );
};
