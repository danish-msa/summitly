"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Bed, Bath, Maximize2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyListing } from '@/lib/types';
import ShareModal from './Banner/ShareModal';
import ScheduleTourModal from './ItemBody/ScheduleTourModal';

interface StickyPropertyBarProps {
  property: PropertyListing;
  bannerRef: React.RefObject<HTMLDivElement | null>;
}

const StickyPropertyBar: React.FC<StickyPropertyBarProps> = ({ property, bannerRef }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isScheduleTourModalOpen, setIsScheduleTourModalOpen] = useState(false);
  const [sectionNavHeight, setSectionNavHeight] = useState(64); // Default SectionNavigation height

  // Calculate SectionNavigation height
  useEffect(() => {
    const calculateSectionNavHeight = () => {
      const sectionNav = document.querySelector('[data-section-navigation]');
      if (sectionNav) {
        setSectionNavHeight(sectionNav.getBoundingClientRect().height);
      }
    };

    calculateSectionNavHeight();
    window.addEventListener('resize', calculateSectionNavHeight);
    // Use MutationObserver to watch for changes in SectionNavigation
    const observer = new MutationObserver(calculateSectionNavHeight);
    const sectionNav = document.querySelector('[data-section-navigation]');
    if (sectionNav) {
      observer.observe(sectionNav, { childList: true, subtree: true, attributes: true });
    }

    return () => {
      window.removeEventListener('resize', calculateSectionNavHeight);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (bannerRef.current) {
        const bannerBottom = bannerRef.current.offsetTop + bannerRef.current.offsetHeight;
        // SectionNavigation height (sticky at top)
        const scrollPosition = window.scrollY + sectionNavHeight;
        
        if (scrollPosition >= bannerBottom) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      }
    };

    const handleResize = () => {
      handleScroll(); // Recalculate on resize
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    handleScroll(); // Check initial position

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [bannerRef, sectionNavHeight]);

  const shortAddress = property.address.city 
    ? `${property.address.city}${property.address.state ? `, ${property.address.state}` : ''}`
    : 'Unknown Location';
  
  // Check if this is a rental property
  const isRental = property.type === 'Lease' || property.type?.toLowerCase().includes('lease');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatSqft = (sqft: number | string | null | undefined) => {
    if (!sqft) return 'N/A';
    const num = typeof sqft === 'string' ? parseInt(sqft) : sqft;
    if (isNaN(num)) return 'N/A';
    return typeof sqft === 'number' ? sqft.toLocaleString() : sqft;
  };

  const getBedrooms = () => {
    if (property.preCon?.details?.bedroomRange) {
      return property.preCon.details.bedroomRange;
    }
    return `${property.details.numBedrooms} Bed${property.details.numBedrooms !== 1 ? 's' : ''}`;
  };

  const getBathrooms = () => {
    if (property.preCon?.details?.bathroomRange) {
      return property.preCon.details.bathroomRange;
    }
    return `${property.details.numBathrooms} Bath${property.details.numBathrooms !== 1 ? 's' : ''}`;
  };

  const getSquareFeet = () => {
    if (property.preCon?.details?.sqftRange) {
      return property.preCon.details.sqftRange;
    }
    return `${formatSqft(property.details.sqft)} sqft`;
  };

  const handleScheduleTour = () => {
    setIsScheduleTourModalOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -150, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -150, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{ top: `${sectionNavHeight}px` }}
            className="fixed left-0 right-0 z-[98] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg"
          >
            <div className="container-1400 mx-auto px-4">
              <div className="flex items-center justify-between py-2 gap-3 lg:gap-8">
                {/* Price */}
                <div className="flex-shrink-0">
                  <div className="text-base lg:text-lg xl:text-2xl font-bold text-primary whitespace-nowrap">
                    {isRental 
                      ? `${formatPrice(property.listPrice)}/mo`
                      : formatPrice(property.listPrice)}
                  </div>
                </div>

                {/* Property Stats (Beds, Baths, Sqft) */}
                <div className="hidden md:flex justify-start items-center gap-4 lg:gap-6 flex-shrink-0">
                  {/* Beds */}
                  <div className="flex items-center gap-1.5">
                    <Bed className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-base text-foreground whitespace-nowrap">
                      {getBedrooms()}
                    </span>
                  </div>

                  {/* Baths */}
                  <div className="flex items-center gap-1.5">
                    <Bath className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-base text-foreground whitespace-nowrap">
                      {getBathrooms()}
                    </span>
                  </div>

                  {/* Square Feet */}
                  <div className="flex items-center gap-1.5">
                    <Maximize2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-base text-foreground whitespace-nowrap">
                      {getSquareFeet()}
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex flex-col justify-center gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0 min-w-0">
                    <MapPin className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate text-base">{shortAddress}</span>
                  </div>
                </div>

                {/* Right Side: Action Buttons */}
                <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                  
                  {/* Schedule Tour Button */}
                  <Button
                    variant="default"
                    size="default"
                    onClick={handleScheduleTour}
                    className="gap-2 bg-brand-cb-blue hover:bg-brand-midnight"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Schedule Tour</span>
                    <span className="sm:hidden">Tour</span>
                  </Button>

                  
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        property={property}
      />

      {/* Schedule Tour Modal */}
      <ScheduleTourModal 
        open={isScheduleTourModalOpen} 
        onOpenChange={setIsScheduleTourModalOpen} 
      />
    </>
  );
};

export default StickyPropertyBar;

