"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Bed, Bath, Maximize2, MapPin, Building2, User, Layers, Home, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyListing } from '@/lib/types';
import ShareModal from './Banner/ShareModal';
import ScheduleTourModal from './ItemBody/ScheduleTourModal';
import Link from 'next/link';

interface StickyPropertyBarProps {
  property: PropertyListing;
  bannerRef: React.RefObject<HTMLDivElement | null>;
}

// Helper function to generate slug for property type
const getPropertyTypeSlug = (propertyType: string): string => {
  const typeMap: Record<string, string> = {
    'Condos': 'condos',
    'Houses': 'houses',
    'Lofts': 'lofts',
    'Master-Planned Communities': 'master-planned-communities',
    'Multi Family': 'multi-family',
    'Offices': 'offices',
    'Condominium': 'condos',
    'Condo': 'condos',
  };
  return typeMap[propertyType] || propertyType.toLowerCase().replace(/\s+/g, '-');
};

// Helper function to generate slug for sub-property type
const getSubPropertyTypeSlug = (subPropertyType: string, propertyType: string): string => {
  const subTypeSlug = subPropertyType.toLowerCase().replace(/\s+/g, '-');
  const propertyTypeSlug = getPropertyTypeSlug(propertyType);
  
  // For Condos: high-rise-condos, mid-rise-condos, low-rise-condos
  if (propertyTypeSlug === 'condos') {
    return `${subTypeSlug}-condos`;
  }
  // For Houses: link-houses, townhouse-houses, semi-detached-houses, detached-houses
  if (propertyTypeSlug === 'houses') {
    return `${subTypeSlug}-houses`;
  }
  
  return `${subTypeSlug}-${propertyTypeSlug}`;
};

// Helper function to extract year from completion date
const extractYear = (dateString: string): string | null => {
  const yearMatch = dateString.match(/\d{4}/);
  return yearMatch ? yearMatch[0] : null;
};

// Helper function to convert status to slug
const _getStatusSlug = (status: string): string => {
  const statusMap: Record<string, string> = {
    'now-selling': 'selling',
    'selling': 'selling',
    'coming-soon': 'coming-soon',
    'sold-out': 'sold-out',
    'platinum-access': 'platinum-access',
    'register-now': 'register-now',
    'assignments': 'assignments',
    'resale': 'resale',
    'new-release-coming-soon': 'coming-soon',
  };
  
  const normalizedStatus = status?.toLowerCase() || '';
  return statusMap[normalizedStatus] || normalizedStatus.replace(/\s+/g, '-');
};

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
    if (!price || price === 0) return 'Coming Soon';
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
            <div className="container-1400 mx-auto px-4 sm:px-6 lg:px-8 ">
              <div className="flex items-center justify-between py-2 gap-3 lg:gap-8">
                {isPreCon ? (
                  <>
                    {/* Pre-Construction Layout */}
                    {/* Starting Price */}
                    <div className="flex-shrink-0">
                      <div className="text-base lg:text-lg xl:text-2xl font-bold text-primary whitespace-nowrap">
                        {property.preCon?.priceRange && property.preCon.priceRange.min > 0
                          ? formatPrice(property.preCon.priceRange.min)
                          : property.preCon?.startingPrice && property.preCon.startingPrice > 0
                          ? formatPrice(property.preCon.startingPrice)
                          : 'Coming Soon'}
                      </div>
                    </div>

                    {/* Pre-Con Stats */}
                    <div className="hidden md:flex justify-start items-center gap-3 lg:gap-4 flex-shrink-0 flex-wrap">
                      {/* Project Name */}
                      {property.preCon?.projectName && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground whitespace-nowrap truncate max-w-[200px] lg:max-w-[250px]">
                            {property.preCon.projectName}
                          </span>
                        </div>
                      )}

                      {/* Developer */}
                      {property.preCon?.developer && (
                        <div className="flex items-center gap-1.5 group">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                          <Link 
                            href={`/pre-con?developer=${encodeURIComponent(property.preCon.developer)}`}
                            className="relative inline-block text-sm text-foreground whitespace-nowrap truncate max-w-[180px] lg:max-w-[220px]"
                          >
                            <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
                              {property.preCon.developer}
                            </span>
                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                          </Link>
                        </div>
                      )}

                      {/* Property Type - Show sub-property type if available for Condos/Houses */}
                      {(() => {
                        const propertyType = property.details?.propertyType || 
                                             property.preCon?.details?.propertyType || 
                                             'Condominium';
                        const subPropertyType = property.preCon?.details?.subPropertyType;
                        const isCondo = propertyType.toLowerCase().includes('condo');
                        const isHouse = propertyType.toLowerCase().includes('house');
                        
                        // Show sub-property type if available for Condos/Houses
                        if (subPropertyType && (isCondo || isHouse)) {
                          const displayText = isCondo ? `${subPropertyType} Condo` : `${subPropertyType} House`;
                          const linkUrl = `/pre-con/${getSubPropertyTypeSlug(subPropertyType, propertyType)}`;
                          
                          return (
                            <div className="flex items-center gap-1.5 group">
                              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                              <Link 
                                href={linkUrl}
                                className="relative inline-block text-sm text-foreground whitespace-nowrap"
                              >
                                <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
                                  {displayText}
                                </span>
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                              </Link>
                            </div>
                          );
                        }
                        
                        // Show property type if not Condos/Houses or no sub-property type
                        const propertyTypeSlug = getPropertyTypeSlug(propertyType);
                        return (
                          <div className="flex items-center gap-1.5 group">
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                            <Link 
                              href={`/pre-con/${propertyTypeSlug}`}
                              className="relative inline-block text-sm text-foreground whitespace-nowrap"
                            >
                              <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
                                {propertyType}
                              </span>
                              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                          </div>
                        );
                      })()}

                      {/* Units */}
                      {property.preCon?.details?.totalUnits && property.preCon.details.totalUnits > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground whitespace-nowrap">
                            {property.preCon.details.totalUnits} Units
                          </span>
                        </div>
                      )}

                      {/* Suites */}
                      {property.preCon?.details?.availableUnits !== undefined && 
                       property.preCon.details.availableUnits !== null && 
                       property.preCon.details.availableUnits > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground whitespace-nowrap">
                            {property.preCon.details.availableUnits} Suites
                          </span>
                        </div>
                      )}

                      {/* Stories */}
                      {property.preCon?.details?.storeys && property.preCon.details.storeys > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Layers className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm text-foreground whitespace-nowrap">
                            {property.preCon.details.storeys} Stories
                          </span>
                        </div>
                      )}

                      {/* Occupancy */}
                      {property.preCon?.completion?.date && (() => {
                        const year = extractYear(property.preCon.completion.date);
                        const displayText = year ? `Occupancy: ${year}` : `Occupancy: ${property.preCon.completion.date}`;
                        const linkUrl = year ? `/pre-con/${year}` : null;
                        
                        return (
                          <div className="flex items-center gap-1.5 group">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                            {linkUrl ? (
                              <Link 
                                href={linkUrl}
                                className="relative inline-block text-sm text-foreground whitespace-nowrap"
                              >
                                <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
                                  {displayText}
                                </span>
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                              </Link>
                            ) : (
                              <span className="text-sm text-foreground whitespace-nowrap">
                                {displayText}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Regular Property Layout */}
                    {/* Price */}
                    <div className="flex-shrink-0">
                      <div className="text-base lg:text-lg xl:text-2xl font-bold text-primary whitespace-nowrap">
                        {isRental 
                          ? (property.listPrice && property.listPrice > 0
                              ? `${formatPrice(property.listPrice)}/mo`
                              : 'Coming Soon')
                          : (property.listPrice && property.listPrice > 0
                              ? formatPrice(property.listPrice)
                              : 'Coming Soon')}
                      </div>
                    </div>

                    {/* Property Stats (Beds, Baths, Sqft) */}
                    <div className="hidden md:flex justify-start items-center gap-4 lg:gap-6 flex-shrink-0">
                      {/* Beds */}
                      {getBedrooms() && (
                        <div className="flex items-center gap-1.5">
                          <Bed className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-base text-foreground whitespace-nowrap">
                            {getBedrooms()}
                          </span>
                        </div>
                      )}

                      {/* Baths */}
                      {getBathrooms() && (
                        <div className="flex items-center gap-1.5">
                          <Bath className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-base text-foreground whitespace-nowrap">
                            {getBathrooms()}
                          </span>
                        </div>
                      )}

                      {/* Square Feet */}
                      {getSquareFeet() && getSquareFeet() !== 'N/A sqft' && (
                        <div className="flex items-center gap-1.5">
                          <Maximize2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-base text-foreground whitespace-nowrap">
                            {getSquareFeet()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    {shortAddress && shortAddress !== 'Unknown Location' && (
                      <div className="flex flex-col justify-center gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0 min-w-0">
                          <MapPin className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate text-base max-w-[300px] lg:max-w-[400px] xl:max-w-[500px]">{shortAddress}</span>
                        </div>
                      </div>
                    )}

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

