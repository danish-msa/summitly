import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import SectionHeading from '@/components/Helper/SectionHeading'
import { fetchPropertyClasses } from '@/data/data';
import React from 'react'
import AppartmentTypeCard from './AppartmentTypeCard';

// Interface for property class
interface PropertyClass {
  id: number;
  icon: string;
  type: string;
  number: number;
}

const ApartmentType = () => {
  const [propertyClasses, setPropertyClasses] = useState<PropertyClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPropertyClasses = async () => {
      try {
        const classes = await fetchPropertyClasses();
        setPropertyClasses(classes);
      } catch (err) {
        setError('Failed to load property classes');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadPropertyClasses();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading property types...
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-background">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-destructive">
              <div className="w-4 h-4 rounded-full bg-destructive" />
              {error}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('/images/pattern.png')] bg-cover bg-center" />
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
      
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
              Property Categories
            </Badge>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-4xl font-bold text-foreground mb-6">
            Explore Properties by Type
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Browse through our diverse collection of property categories to find your perfect match. 
            From cozy apartments to luxury homes, we have everything you need.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span>Verified Properties</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-secondary rounded-full" />
              <span>Expert Guidance</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-accent rounded-full" />
              <span>24/7 Support</span>
            </div>
          </div>
        </motion.div>
        
        {/* Property Types Grid - Optimized for 3 cards */}
        <div className="flex flex-col lg:flex-row justify-center items-center gap-8 mb-12 max-w-5xl mx-auto">
          {propertyClasses.map((propertyClass, index) => (
            <motion.div
              key={propertyClass.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="flex-1 max-w-sm w-full"
            >
              <AppartmentTypeCard type={propertyClass} />
            </motion.div>
          ))}
        </div>
        
        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-brand-glacier to-brand-icy-blue rounded-2xl p-8 border border-border/50">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Can't Find What You're Looking For?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our expert team is here to help you find the perfect property. 
              Get personalized recommendations based on your specific needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="dark" className="px-8 py-3">
                Get Expert Help
              </Button>
              <Button variant="outline" className="px-8 py-3">
                View All Properties
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default ApartmentType