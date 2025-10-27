import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ButtonColorful } from '@/components/ui/button-colorful';
import Image from 'next/image';
import { useLocationDetection } from '@/hooks/useLocationDetection';

interface PropertyCategory {
  id: number;
  title: string;
  count: number;
  image: string;
  href: string;
}

const propertyCategories: PropertyCategory[] = [
  {
    id: 1,
    title: "New Listings",
    count: 951,
    image: "/images/PropertyCategories/newlistings.jpeg",
    href: "/listings?type=new"
  },
  {
    id: 2,
    title: "Price Reduced",
    count: 754,
    image: "/images/propertycategories/pricereduced.jpeg",
    href: "/listings?type=reduced"
  },
  {
    id: 3,
    title: "Open Houses",
    count: 58,
    image: "/images/propertycategories/openhouses.jpeg",
    href: "/listings?type=open-houses"
  },
  {
    id: 4,
    title: "Recently Sold",
    count: 1287,
    image: "/images/propertycategories/recentlysold.jpeg",
    href: "/listings?type=sold"
  },
  {
    id: 5,
    title: "New Construction",
    count: 889,
    image: "/images/propertycategories/newconstruction.jpeg",
    href: "/listings?type=construction"
  },
  {
    id: 6,
    title: "New Home Communities",
    count: 72,
    image: "/images/propertycategories/newhomecommunities.jpeg",
    href: "/listings?type=communities"
  },
  {
    id: 7,
    title: "Land",
    count: 142,
    image: "/images/propertycategories/land.jpeg",
    href: "/listings?type=land"
  },
  {
    id: 8,
    title: "Foreclosures",
    count: 13,
    image: "/images/propertycategories/foreclosures.jpeg",
    href: "/listings?type=foreclosures"
  }
];

const PropertyCategories = () => {
  const { location } = useLocationDetection();
  
  // Get display location - use detected location or fallback to Henderson, NV
  const displayLocation = location ? location.fullLocation : "Henderson, NV";

  return (
    <section className="py-16 bg-background">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className=" mb-12"
        >
          <h2 className="text-3xl sm:text-3xl lg:text-3xl font-bold text-foreground mb-4">
            Browse homes in <span className="text-primary">{displayLocation}</span>
          </h2>
        </motion.div>

        {/* Property Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {propertyCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <a
                href={category.href}
                className="block relative overflow-hidden rounded-2xl bg-card border border-border hover:shadow-lg transition-all duration-300 hover:scale-105"
              >
                {/* Background Image */}
                <div className="relative h-48 w-full">
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-between">
                    {/* Title */}
                    <div className="flex justify-between items-start">
                      <h3 className="text-white font-semibold text-lg leading-tight">
                        {category.title}
                      </h3>
                    </div>
                    
                    {/* Count Badge */}
                    <div className="flex justify-end">
                      <Badge 
                        variant="secondary" 
                        className="bg-white/90 text-foreground hover:bg-white font-semibold px-3 py-1"
                      >
                        {category.count.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </a>
            </motion.div>
          ))}
        </div>

        {/* Interactive Button Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-xl font-semibold text-foreground">
              Ready to find your perfect property?
            </h3>
            <ButtonColorful label="Start Searching" href="/listings" />
          </div>
        </motion.div>
        
      </div>
    </section>
  );
};

export default PropertyCategories;
