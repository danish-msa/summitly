"use client";

import FAQComponent, { type FaqItem } from "@/components/common/FAQ";

const tenantScreeningFaqs: FaqItem[] = [
  {
    id: "1",
    question: "What does tenant screening include?",
    answer:
      "Our tenant screening includes credit check, criminal background check, eviction history, and income verification. You get a single report with a recommended score to help you decide quickly and fairly.",
  },
  {
    id: "2",
    question: "How long does screening take?",
    answer:
      "Most reports are ready within minutes. Applicants complete the process online; you receive the results in your dashboard so you can accept, review, and approve applications without delay.",
  },
  {
    id: "3",
    question: "Is tenant screening compliant with fair housing?",
    answer:
      "Yes. We follow applicable fair housing and privacy laws. Screening criteria are applied consistently, and we provide tools to help you document your decisions and screen tenants fairly.",
  },
  {
    id: "4",
    question: "Who pays for the screening?",
    answer:
      "You can choose to pay for screening or have applicants pay a screening fee. Many landlords pass the cost to applicants; our platform supports both options so you can set your own policy.",
  },
  {
    id: "5",
    question: "Can I screen multiple applicants for one property?",
    answer:
      "Yes. You can invite multiple applicants to complete screening. Compare reports side by side and use the recommended score and details to select the best fit for your rental.",
  },
  {
    id: "6",
    question: "What if an applicant has a low credit score?",
    answer:
      "The report includes full context (income, history, recommendations). You decide your own criteria. Some landlords accept applicants with lower scores if income and rental history are strong; the report gives you the information to decide.",
  },
];

export default function FAQSection() {
  return (
    <section
      className="w-full py-12 sm:py-16 md:py-20 bg-background"
      aria-labelledby="tenant-screening-faq-heading"
    >
      <FAQComponent
        initialFaqs={tenantScreeningFaqs}
        heading="Frequently asked questions about tenant screening"
        subheading="FAQ"
        description="Answers to common questions from landlords and property managers."
        showLoadMore={false}
      />
    </section>
  );
}
