"use client";

import FAQComponent, { type FaqItem } from "@/components/common/FAQ";

const initialFaqs: FaqItem[] = [
  {
    id: "1",
    question: "How should I price my rental?",
    answer:
      "To determine your rent price, consider local rent control laws, the rental rates of homes in your area (rental comps), the features of your home, and changes in your local market. How much you charge for rent is ultimately up to you, but to get a quick starting point, try our free Rent Zestimate® tool. To learn more about pricing your rental, check out this article.",
  },
  {
    id: "2",
    question: "What is my Rent Zestimate® calculated?",
    answer:
      "We use public records, recent comparable rentals, and local market trends to estimate rent. The more data we have for your area, the more accurate the estimate.",
  },
  {
    id: "3",
    question: "How can I advertise my rental?",
    answer:
      "You can list your rental on Summitly to reach renters looking in your area. Create a listing with photos, details, and availability. Our tools help you screen applicants and manage showings.",
  },
  {
    id: "4",
    question: "What should I include in my rental listing?",
    answer:
      "Include clear photos, an accurate description, rent amount, lease terms, and key features (parking, laundry, pets). Good listings get more qualified interest and help you set the right price.",
  },
  {
    id: "5",
    question: "When should I lower & raise my rental price?",
    answer:
      "Consider lowering if the property sits vacant or demand drops. Consider raising when market rents rise, you make improvements, or demand is high. Our market insights help you decide.",
  },
  {
    id: "6",
    question: "Can I get estimates for multiple properties?",
    answer:
      "Yes. You can request a Rent Zestimate® for each property you own or manage. Sign in or create an account to save and compare estimates.",
  },
];

const additionalFaqs: FaqItem[] = [
  {
    id: "7",
    question: "How often does the Rent Zestimate® update?",
    answer:
      "Rent Zestimates® are updated regularly as we receive new data. Market conditions and comparable rentals in your area can cause the estimate to change over time.",
  },
  {
    id: "8",
    question: "What if my property is unique or in a niche market?",
    answer:
      "The Rent Zestimate® is a starting point. For unique properties or niche markets, we recommend also reviewing comparable listings and consulting local rental data we provide after you receive your estimate.",
  },
];

export function PriceMyRentalFAQ() {
  return (
    <section
      className="w-full py-12 sm:py-16 bg-gradient-to-b from-secondary via-secondary to-[#2563EB]"
      aria-label="Common questions about renting your home"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 md:p-10">
          <FAQComponent
            initialFaqs={initialFaqs}
            additionalFaqs={additionalFaqs}
            heading="Common questions about renting your home"
            subheading=""
            description=""
            className="!bg-transparent !p-0 !py-0 !px-0"
            showLoadMore={true}
          />
        </div>
      </div>
    </section>
  );
}

export default PriceMyRentalFAQ;
