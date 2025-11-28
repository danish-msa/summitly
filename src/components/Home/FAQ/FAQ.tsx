"use client";

import { 
  Home, 
  DollarSign, 
  Users, 
  MapPin, 
  FileText, 
  Phone, 
  Shield, 
  HelpCircle 
} from "lucide-react";
import FAQComponent, { type FaqItem } from "@/components/common/FAQ";

const initialFaqs: FaqItem[] = [
  {
    id: "1",
    question: "How do I start searching for properties?",
    answer: "Simply enter your desired location in our search bar, select your property type (buy, rent, or sell), and set your budget range. Our advanced filters will help you find exactly what you're looking for.",
    icon: <Home className="w-5 h-5" />,
  },
  {
    id: "2",
    question: "What are the typical closing costs?",
    answer: "Closing costs typically range from 2-5% of the home's purchase price. This includes legal fees, land transfer tax, title insurance, and other associated costs. Our mortgage calculator can help estimate these costs.",
    icon: <DollarSign className="w-5 h-5" />,
  },
  {
    id: "3",
    question: "How do I find a real estate agent?",
    answer: "You can browse our directory of qualified real estate agents, read their profiles and reviews, and contact them directly. All our agents are licensed professionals with local market expertise.",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "4",
    question: "Can I get a home value estimate?",
    answer: "Yes! Our home estimation tool provides a free, instant estimate of your property's value based on recent sales data, market trends, and property characteristics in your area.",
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    id: "5",
    question: "What documents do I need to buy a home?",
    answer: "You'll need proof of income, bank statements, employment verification, credit report, and a pre-approval letter from your lender. Our checklist tool can help you organize all required documents.",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: "6",
    question: "How can I contact support?",
    answer: "You can reach our support team via phone, email, or live chat. We're available Monday-Friday 9AM-6PM and Saturday 10AM-4PM. Visit our contact page for all contact information.",
    icon: <Phone className="w-5 h-5" />,
  },
];

const additionalFaqs: FaqItem[] = [
  {
    id: "7",
    question: "Is my personal information secure?",
    answer: "Absolutely. We use bank-level encryption to protect your personal and financial information. We never share your data with third parties without your explicit consent.",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: "8",
    question: "Do you offer mortgage services?",
    answer: "While we don't directly provide mortgages, we partner with trusted lenders and can connect you with mortgage specialists who can help you find the best rates and terms for your situation.",
    icon: <HelpCircle className="w-5 h-5" />,
  },
];

export function FAQ() {
  return (
    <FAQComponent
      initialFaqs={initialFaqs}
      additionalFaqs={additionalFaqs}
      heading="Frequently asked questions"
      subheading="FAQ"
      description="Find answers to common questions about buying, selling, and renting properties with Summitly."
    />
  );
}

export default FAQ;
