"use client";

import FAQ, { type FaqItem } from "@/components/common/FAQ";

const leaseAgreementsFaqs: FaqItem[] = [
  {
    id: "1",
    question: "Are the lease agreement templates legally reviewed?",
    answer:
      "Yes. Our rental lease templates are created in partnership with law firms versed in local law. You get a solid starting point that you can customize for your property and jurisdiction.",
  },
  {
    id: "2",
    question: "Can I upload my own lease agreement?",
    answer:
      "Yes. You can upload any rental lease to Rental Manager, use dynamic fields to update key details digitally, and send it for e-signature. You can also store existing leases for later use.",
  },
  {
    id: "3",
    question: "How does electronic lease signing work?",
    answer:
      "You send the lease to your renter by email. They review and sign electronically from any device. Once signed, the agreement is stored in your dashboard so you can access it anytime.",
  },
  {
    id: "4",
    question: "In which states are lease templates available?",
    answer:
      "Our lease builder and templates are currently available in multiple states, with more added over time. Check the lease builder section for the current list and your state.",
  },
  {
    id: "5",
    question: "Can I customize the lease after choosing a template?",
    answer:
      "Yes. You can add or edit clauses, update property details, rent, dates, and other terms. The templates give you a legally reviewed base; you tailor it to your property and needs.",
  },
  {
    id: "6",
    question: "Where are my signed leases stored?",
    answer:
      "Signed leases are stored in Rental Manager. When you need to collect payments, message tenants, or renew, we use key info from your rental agreement to save you time and keep everything in one place.",
  },
];

export default function FAQSection() {
  return (
    <section
      className="w-full py-12 sm:py-16 md:py-20 bg-white"
      aria-labelledby="lease-agreements-faq-heading"
    >
      <FAQ
        initialFaqs={leaseAgreementsFaqs}
        heading="Frequently asked questions about lease agreements"
        subheading="FAQ"
        description="Answers to common questions about creating, signing, and storing rental leases."
        showLoadMore={false}
      />
    </section>
  );
}
