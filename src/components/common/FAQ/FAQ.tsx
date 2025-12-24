"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import SectionHeading from "@/components/Helper/SectionHeading";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQProps {
  initialFaqs: FaqItem[];
  additionalFaqs?: FaqItem[];
  heading?: string;
  subheading?: string;
  description?: string;
  className?: string;
  showLoadMore?: boolean;
  loadMoreText?: string;
}

export function FAQ({
  initialFaqs,
  additionalFaqs = [],
  heading = "Frequently asked questions",
  subheading = "FAQ",
  description = "Find answers to common questions.",
  className = "",
  showLoadMore = true,
  loadMoreText = "Load more",
}: FAQProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Split initialFaqs: first 6 shown initially, rest go to additional
  const initialDisplayFaqs = initialFaqs.slice(0, 6);
  const remainingInitialFaqs = initialFaqs.slice(6);
  const allAdditionalFaqs = [...remainingInitialFaqs, ...additionalFaqs];
  
  const displayedFaqs = showAll 
    ? [...initialFaqs, ...additionalFaqs] 
    : initialDisplayFaqs;

  const hasMoreFaqs = allAdditionalFaqs.length > 0;

  return (
    <section className={`w-full py-8 px-4 sm:px-6 lg:px-8 bg-background ${className}`}>
      <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading 
          heading={heading}
          subheading={subheading}
          description={description}
        />

        <Accordion type="single" collapsible className="w-full mt-12">
          <div className="grid grid-cols-1 gap-4 items-start">
            {displayedFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="border bg-white py-2 px-4 rounded-lg"
              >
                <AccordionTrigger className="hover:no-underline py-2 text-left group">
                  <div className="flex items-center gap-4 w-full">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base md:text-lg font-body font-medium text-foreground group-hover:text-primary transition-colors pr-4">
                        {faq.question}
                      </h3>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pr-8 pb-6 pt-2 text-xs sm:text-sm md:text-md text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </div>
        </Accordion>

        {showLoadMore && hasMoreFaqs && !showAll && (
          <div className="flex justify-center mt-12">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowAll(true)}
              className="px-8 rounded-lg border-border hover:bg-secondary"
            >
              {loadMoreText}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export default FAQ;

