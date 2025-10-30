"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyListing } from '@/lib/types';
import ShareModal from './Banner/ShareModal';

interface StickyPropertyBarProps {
  property: PropertyListing;
  bannerRef: React.RefObject<HTMLDivElement | null>;
}

const StickyPropertyBar: React.FC<StickyPropertyBarProps> = ({ property, bannerRef }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (bannerRef.current) {
        const bannerBottom = bannerRef.current.offsetTop + bannerRef.current.offsetHeight;
        // Navbar height: h-14 (56px) mobile, h-16 (64px) desktop
        const navbarHeight = window.innerWidth >= 1024 ? 64 : 56;
        // Show property bar when banner bottom has passed the viewport top + navbar
        const scrollPosition = window.scrollY + navbarHeight;
        
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
  }, [bannerRef]);

  const propertyTitle = `${property.details.propertyType} in ${property.address.city || 'Unknown Location'}`;
  const fullAddress = property.address.location || 
    `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    // Add save functionality here
  };

  const handleScheduleTour = () => {
    // Add schedule tour functionality here
    console.log('Schedule tour clicked');
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
            className="fixed top-14 lg:top-16 left-0 right-0 z-[9998] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg"
          >
            <div className="container-1400 mx-auto px-4">
              <div className="flex items-center justify-between h-16 lg:h-15 gap-3 lg:gap-4">
                {/* Left Side: Property Info - Stacked */}
                <div className="flex flex-col justify-center gap-1 flex-1 min-w-0">
                  {/* Property Title - Always visible */}
                  <div className="flex-shrink-0">
                    <h2 className="text-sm lg:text-base font-bold text-foreground truncate">
                      {propertyTitle}
                    </h2>
                  </div>

                  {/* Address - Always visible */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0 min-w-0">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{fullAddress}</span>
                  </div>
                </div>

                {/* Middle: Price */}
                <div className="flex-shrink-0">
                  <div className="text-base lg:text-lg xl:text-xl font-bold text-primary whitespace-nowrap">
                    {formatPrice(property.listPrice)}
                  </div>
                </div>

                {/* Right Side: Action Buttons */}
                <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                  {/* Save Button */}
                  <Button
                    variant={isSaved ? "default" : "outline"}
                    size="default"
                    onClick={handleSave}
                    className="gap-2"
                  >
                    <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">Save</span>
                  </Button>

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

                  {/* Share Button */}
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setIsShareModalOpen(true)}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
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
    </>
  );
};

export default StickyPropertyBar;

