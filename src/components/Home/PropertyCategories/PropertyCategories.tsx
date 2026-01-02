import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { ButtonColorful } from '@/components/ui/button-colorful';
import Image from 'next/image';
import { useLocationDetection } from '@/hooks/useLocationDetection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PropertyCategory {
  id: number;
  title: string;
  count: number;
  image: string;
  href: string;
  apiKey: string;
}

const propertyCategoriesConfig: Omit<PropertyCategory, 'count'>[] = [
  {
    id: 1,
    title: "New Listings",
    image: "/images/PropertyCategories/newlistings.jpeg",
    href: "/listings?type=new",
    apiKey: "new",
  },
  {
    id: 2,
    title: "Price Reduced",
    image: "/images/propertycategories/pricereduced.jpeg",
    href: "/listings?type=reduced",
    apiKey: "priceReduced",
  },
  {
    id: 3,
    title: "Open Houses",
    image: "/images/propertycategories/openhouses.jpeg",
    href: "/listings?type=open-houses",
    apiKey: "openHouses",
  },
  {
    id: 4,
    title: "Recently Sold",
    image: "/images/propertycategories/recentlysold.jpeg",
    href: "/listings?type=sold",
    apiKey: "sold",
  },
  {
    id: 5,
    title: "New Construction",
    image: "/images/propertycategories/newconstruction.jpeg",
    href: "/listings?type=construction",
    apiKey: "construction",
  },
  {
    id: 6,
    title: "New Home Communities",
    image: "/images/propertycategories/newhomecommunities.jpeg",
    href: "/listings?type=communities",
    apiKey: "communities",
  },
  {
    id: 7,
    title: "Land",
    image: "/images/propertycategories/land.jpeg",
    href: "/listings?type=land",
    apiKey: "land",
  },
  {
    id: 8,
    title: "Foreclosures",
    image: "/images/propertycategories/foreclosures.jpeg",
    href: "/listings?type=foreclosures",
    apiKey: "foreclosures",
  }
];

const PropertyCategories = () => {
  const { location } = useLocationDetection();
  const [categories, setCategories] = useState<PropertyCategory[]>(
    propertyCategoriesConfig.map(cat => ({ ...cat, count: 0 }))
  );
  const [loading, setLoading] = useState(true);
  
  // Get display location - use detected location or fallback to Henderson, NV
  const displayLocation = location ? location.fullLocation : "Henderson, NV";

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchCategoryCounts = async () => {
      try {
        const response = await fetch('/api/property-categories', {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Failed to fetch category counts');
        }
        
        const data = await response.json();
        
        // Map API data to categories
        const updatedCategories = propertyCategoriesConfig.map(cat => ({
          ...cat,
          count: data[cat.apiKey]?.count || 0,
        }));
        
        if (!controller.signal.aborted) {
          setCategories(updatedCategories);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Error fetching category counts:', error);
          // Keep default counts (0) on error
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchCategoryCounts();
    
    // Cleanup: abort fetch on unmount
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <section className="py-16 bg-background">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 px-2">
            Browse homes in <span className="text-gradient-brand">{displayLocation}</span>
          </h2>
        </motion.div>

        {/* Property Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
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
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between">
                    {/* Title */}
                    <div className="flex justify-between items-start">
                      <h3 className="text-white font-semibold text-base sm:text-lg leading-tight">
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
            <Button variant="secondary" asChild>
              <Link href="/listings">
                Start Searching
              </Link>
            </Button>
          </div>
        </motion.div>  </div>
    </section>
  );
}

export default PropertyCategories;
