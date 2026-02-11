import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Shield, Zap, Search, TrendingUp, Lock, Award } from "lucide-react";
import SectionHeading from '@/components/Helper/SectionHeading';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  colorClass: string;
  iconColorClass: string;
}

const features: Feature[] = [
  {
    icon: Shield,
    title: "Secure & Protected",
    description: "Your data is encrypted end-to-end with industry-leading security protocols. We never share your information with third parties.",
    colorClass: "feature-bg-1 border",
    iconColorClass: "text-blue-600",
  },
  {
    icon: Zap,
    title: "Lightning Fast Process",
    description: "Experience instant results with our optimized workflow. Complete your real estate transactions in minutes, not hours or days.",
    colorClass: "feature-bg-2 border",
    iconColorClass: "text-rose-600",
  },
  {
    icon: Search,
    title: "Smart Property Discovery",
    description: "Advanced algorithms help you find exactly the property you're looking for. Get personalized recommendations tailored to your needs.",
    colorClass: "feature-bg-3 border",
    iconColorClass: "text-emerald-600",
  },
  {
    icon: TrendingUp,
    title: "Proven Market Results",
    description: "Join thousands of satisfied clients who have achieved their real estate goals. Our track record speaks for itself with measurable outcomes.",
    colorClass: "feature-bg-4 border",
    iconColorClass: "text-amber-600",
  },
  {
    icon: Lock,
    title: "Transparent Pricing",
    description: "No hidden fees or surprises. What you see is what you get—simple, straightforward, and honest real estate services.",
    colorClass: "feature-bg-5 border",
    iconColorClass: "text-blue-600",
  },
  {
    icon: Award,
    title: "Expert Support",
    description: "Get professional assistance from our dedicated real estate team. We're available to help you succeed every step of the way.",
    colorClass: "feature-bg-6 border",
    iconColorClass: "text-rose-600",
  },
];

export default function FeatureGrid() {
  return (
    <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-[1300px] mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <SectionHeading heading='Everything You Need To Succeed' subheading='Everything You Need To Succeed' description='Discover the comprehensive real estate services that make us the trusted choice for buyers, sellers, and investors across Canada.' />
        </motion.div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`${feature.colorClass} border rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-lg group`}
            >
              {/* Icon Container */}
              <motion.div 
                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 w-fit mb-6 shadow-sm border border-white/50 group-hover:shadow-md group-hover:bg-white transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <feature.icon className={`w-6 h-6 ${feature.iconColorClass}`} />
              </motion.div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
