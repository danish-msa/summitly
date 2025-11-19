"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Bed, Bath, Maximize2, MapPin, Building2, User, Layers, Home, Users } from 'lucide-react';
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
      if (!bannerRef.current) return;

      const bannerBottom = bannerRef.current.offsetTop + bannerRef.current.offsetHeight;
      const scrollPosition = window.scrollY + sectionNavHeight;
      
      // Find the last content section to determine when to hide the sticky bar
      const contactSection = document.getElementById('contact-section');
      const footer = document.querySelector('footer');
      
      // Find the bottom of the main content area
      // Look for the last container-1400 which should contain SimilarListings
      let contentBottom = document.documentElement.scrollHeight;
      
      // Find all container-1400 elements and get the last one (which should be SimilarListings)
      const containers = Array.from(document.querySelectorAll('.container-1400'));
      if (containers.length > 0) {
        const lastContainer = containers[containers.length - 1] as HTMLElement;
        const lastContainerRect = lastContainer.getBoundingClientRect();
        const lastContainerBottom = lastContainerRect.top + window.scrollY + lastContainerRect.height;
        // Use the last container as the content end point
        contentBottom = lastContainerBottom;
      }
      
      // If contact section exists and is after the last container, use it instead
      if (contactSection) {
        const contactRect = contactSection.getBoundingClientRect();
        const contactBottom = contactRect.top + window.scrollY + contactRect.height;
        // Use whichever is further down (the actual last content)
        contentBottom = Math.max(contentBottom, contactBottom);
      }
      
      // Account for footer if it exists - hide sticky bar before footer
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const footerTop = footerRect.top + window.scrollY;
        // Hide sticky bar when we reach 100px before footer
        contentBottom = Math.min(contentBottom, footerTop - 100);
      }
      
      // Calculate if we should show the sticky bar
      // Show only if: past banner AND viewport hasn't reached the end of content
      const viewportBottom = window.scrollY + window.innerHeight;
      const shouldShow = scrollPosition >= bannerBottom && viewportBottom < contentBottom;
      
      setIsVisible(shouldShow);
    };

    const handleResize = () => {
      handleScroll(); // Recalculate on resize
    };

    // Initial check with delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      handleScroll();
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [bannerRef, sectionNavHeight]);

  const shortAddress = property.address.city 
    ? `${property.address.city}${property.address.state ? `, ${property.address.state}` : ''}`
    : 'Unknown Location';
  
  // Check if this is a rental property
  const isRental = property.type === 'Lease' || property.type?.toLowerCase().includes('lease');
  
  // Check if this is a pre-construction property
  const isPreCon = !!property.preCon;

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
            className="fixed left-0 right-0 z-[9] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg"
          >
            <div className="container-1400 mx-auto px-4">
              <div className="flex items-center justify-between py-2 gap-3 lg:gap-8">
                {isPreCon ? (
                  <>
                    {/* Pre-Construction Layout */}
                    {/* Starting Price */}
                    <div className="flex-shrink-0">
                      <div className="text-base lg:text-lg xl:text-2xl font-bold text-primary whitespace-nowrap">
                        {property.preCon?.startingPrice
                          ? formatPrice(property.preCon.startingPrice)
                          : property.preCon?.priceRange 
                          ? formatPrice(property.preCon.priceRange.min)
                          : 'Contact for Pricing'}
                      </div>
                    </div>

                    {/* Pre-Con Stats */}
                    <div className="hidden md:flex justify-start items-center gap-3 lg:gap-4 flex-shrink-0 flex-wrap">
                      {/* Project Name */}
                      {property.preCon?.projectName && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground whitespace-nowrap truncate max-w-[150px]">
                            {property.preCon.projectName}
                          </span>
                        </div>
                      )}

                      {/* Developer */}
                      {property.preCon?.developer && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground whitespace-nowrap truncate max-w-[120px]">
                            {property.preCon.developer}
                          </span>
                        </div>
                      )}

                      {/* Project Type */}
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground whitespace-nowrap">
                          {property.details.propertyType || 'Condominium'}
                        </span>
                      </div>

                      {/* Units */}
                      {property.preCon?.details?.totalUnits && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground whitespace-nowrap">
                            {property.preCon.details.totalUnits} Units
                          </span>
                        </div>
                      )}

                      {/* Suites */}
                      {property.preCon?.details?.availableUnits !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground whitespace-nowrap">
                            {property.preCon.details.availableUnits} Suites
                          </span>
                        </div>
                      )}

                      {/* Stories */}
                      {property.preCon?.details?.storeys && (
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground whitespace-nowrap">
                            {property.preCon.details.storeys} Stories
                          </span>
                        </div>
                      )}

                      {/* Completion */}
                      {property.preCon?.completion?.date && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <p className="text-sm text-foreground whitespace-nowrap">
                            {(() => {
                              const yearMatch = property.preCon.completion.date.match(/\d{4}/);
                              return yearMatch ? `Completion: ${yearMatch[0]}` : `Completion: ${property.preCon.completion.date}`;
                            })()}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Regular Property Layout */}
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
                  </>
                )}
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

      {/* Schedule Tour Modal - Only show for non-pre-con properties */}
      {!isPreCon && (
        <ScheduleTourModal 
          open={isScheduleTourModalOpen} 
          onOpenChange={setIsScheduleTourModalOpen}
          mlsNumber={property.mlsNumber}
          propertyAddress={property.address?.location || 
            `${property.address?.streetNumber || ''} ${property.address?.streetName || ''} ${property.address?.streetSuffix || ''}, ${property.address?.city || ''}, ${property.address?.state || ''} ${property.address?.zip || ''}`.trim()}
          property={property}
        />
      )}
    </>
  );
};

export default StickyPropertyBar;

