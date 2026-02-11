import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Home, DollarSign, Key, Calculator, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionHeading from '@/components/Helper/SectionHeading';

interface ServiceFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  colorClass: string;
  iconColorClass: string;
}

interface ServiceData {
  id: string;
  name: string;
  icon: LucideIcon;
  features: ServiceFeature[];
}

const servicesData: ServiceData[] = [
  {
    id: 'buy',
    name: 'Buy',
    icon: Home,
    features: [
      {
        icon: Search,
        title: "Smart Property Search",
        description: "Find your perfect home with our advanced search filters and AI-powered recommendations tailored to your preferences.",
        colorClass: "border",
        iconColorClass: "text-blue-600",
      },
      {
        icon: DollarSign,
        title: "Competitive Pricing",
        description: "Get the best deals with our market analysis and negotiation expertise. We help you buy at the right price.",
        colorClass: "border",
        iconColorClass: "text-rose-600",
      },
      {
        icon: Key,
        title: "Seamless Process",
        description: "From viewing to closing, we guide you through every step with our streamlined buying process and expert support.",
        colorClass: "border",
        iconColorClass: "text-emerald-600",
      },
    ]
  },
  {
    id: 'sell',
    name: 'Sell',
    icon: DollarSign,
    features: [
      {
        icon: Search,
        title: "Market Analysis",
        description: "Get accurate property valuations and market insights to price your home competitively and sell faster.",
        colorClass: "border",
        iconColorClass: "text-amber-600",
      },
      {
        icon: Home,
        title: "Professional Marketing",
        description: "Showcase your property with professional photography, virtual tours, and targeted marketing campaigns.",
        colorClass: "border",
        iconColorClass: "text-blue-600",
      },
      {
        icon: Key,
        title: "Expert Negotiation",
        description: "Maximize your sale price with our experienced negotiators who work to get you the best possible deal.",
        colorClass: "border",
        iconColorClass: "text-rose-600",
      },
    ]
  },
  {
    id: 'rent',
    name: 'Rent',
    icon: Key,
    features: [
      {
        icon: Search,
        title: "Extensive Listings",
        description: "Browse thousands of rental properties with detailed photos, virtual tours, and comprehensive property information.",
        colorClass: "border",
        iconColorClass: "text-blue-600",
      },
      {
        icon: Home,
        title: "Verified Properties",
        description: "All our rental listings are verified for accuracy and quality, ensuring you find legitimate and well-maintained properties.",
        colorClass: "border",
        iconColorClass: "text-rose-600",
      },
      {
        icon: DollarSign,
        title: "Transparent Pricing",
        description: "No hidden fees or surprises. See all costs upfront including rent, deposits, and any additional charges.",
        colorClass: "border",
        iconColorClass: "text-emerald-600",
      },
    ]
  },
  {
    id: 'mortgage',
    name: 'Mortgage',
    icon: Calculator,
    features: [
      {
        icon: DollarSign,
        title: "Best Rates",
        description: "Compare mortgage rates from top lenders and secure the best deal with our network of trusted financial partners.",
        colorClass: "border",
        iconColorClass: "text-amber-600",
      },
      {
        icon: Calculator,
        title: "Mortgage Calculator",
        description: "Calculate your monthly payments, affordability, and total costs with our comprehensive mortgage calculator tools.",
        colorClass: "border",
        iconColorClass: "text-blue-600",
      },
      {
        icon: Key,
        title: "Pre-Approval Process",
        description: "Get pre-approved quickly with our streamlined application process and expert guidance through every step.",
        colorClass: "border",
        iconColorClass: "text-rose-600",
      },
    ]
  },
  {
    id: 'evaluation',
    name: 'Home Evaluation',
    icon: Search,
    features: [
      {
        icon: Home,
        title: "Instant Valuation",
        description: "Get an accurate home value estimate in minutes using our advanced AI-powered property valuation technology.",
        colorClass: "border",
        iconColorClass: "text-blue-600",
      },
      {
        icon: DollarSign,
        title: "Market Comparison",
        description: "Compare your property with similar homes in your area to understand your home's market position and value.",
        colorClass: "border",
        iconColorClass: "text-rose-600",
      },
      {
        icon: Search,
        title: "Detailed Report",
        description: "Receive a comprehensive valuation report with market trends, neighborhood insights, and property recommendations.",
        colorClass: "border",
        iconColorClass: "text-emerald-600",
      },
    ]
  }
];

export default function ServiceFeatures() {
  const [activeService, setActiveService] = useState('buy');

  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1300px] mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <SectionHeading 
            heading='Our Services' 
            subheading='Everything You Need' 
            description='Choose from our comprehensive range of real estate services designed to meet your specific needs and goals.' 
          />
        </motion.div>

        {/* Service Tabs */}
        <Tabs value={activeService} onValueChange={setActiveService} className="mt-8">
          <TabsList className="inline-flex md:grid md:grid-cols-5 h-auto ">
            {servicesData.map((service) => (
              <TabsTrigger
                key={service.id}
                value={service.id}
              >
                <service.icon className="w-4 h-4" />
                <span>{service.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {servicesData.map((service) => (
            <TabsContent
              key={service.id}
              value={service.id}
              className="transition-none"
              style={{ animation: 'none', transition: 'none' }}
            >
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                  {service.features.map((feature, index) => (
                    <div
                      key={`${service.id}-${index}`}
                      className="group"
                    >
                      <div>
                        {/* Content */}
                        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors duration-300 mb-2">
                          {feature.title}
                        </h3>
                      </div>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
