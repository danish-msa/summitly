import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Share2, Video, Images, ArrowUp, MessageCircle, XCircle, Calculator } from 'lucide-react'
import { PropertyListing } from '@/lib/types'
import ShareModal from '../Banner/ShareModal'
import { useSession } from 'next-auth/react'
import { useSavedProperties } from '@/hooks/useSavedProperties'
import { toast } from '@/hooks/use-toast'
import AuthModal from '@/components/Auth/AuthModal'
import VideoModal from '@/components/PreConItem/PreConItemBody/VideoModal'
import { hasPricingData, hasDepositStructure, hasDocuments, hasAvailableUnits } from '@/utils/preConDataHelpers'

interface Section {
  id: string;
  label: string;
}

interface SectionNavigationProps {
  sections: Section[];
  onSectionClick?: (sectionId: string) => void;
  property?: PropertyListing;
}

const SectionNavigation: React.FC<SectionNavigationProps> = ({ 
  sections, 
  onSectionClick,
  property
}) => {
  const { data: session } = useSession()
  const isScrollingRef = useRef(false);
  const navBarRef = useRef<HTMLDivElement>(null);

  const { checkIsSaved, saveProperty, unsaveProperty, isSaving, isUnsaving } = useSavedProperties()
  const isSaved = property ? checkIsSaved(property.mlsNumber) : false;

  // Filter sections based on available data
  const filteredSections = useMemo(() => {
    return sections.filter(section => {
      if (!property?.preCon) return true; // Show all sections for non-pre-con properties
      
      switch (section.id) {
        case 'pricing-incentives':
          return hasPricingData(property);
        case 'deposit-structure':
          return hasDepositStructure(property);
        case 'documents':
          return hasDocuments(property);
        case 'available-units':
          return hasAvailableUnits(property);
        default:
          return true; // Show all other sections
      }
    });
  }, [sections, property]);

  const [activeSection, setActiveSection] = useState<string>(filteredSections[0]?.id || '');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isScrolledPastBanner, setIsScrolledPastBanner] = useState(false);
  const [navigationBarHeight, setNavigationBarHeight] = useState(64);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Update activeSection when filteredSections changes
  useEffect(() => {
    if (filteredSections.length > 0 && !filteredSections.find(s => s.id === activeSection)) {
      setActiveSection(filteredSections[0]?.id || '');
    }
  }, [filteredSections, activeSection]);

  const handleSave = async () => {
    if (!property) return;

    // If not logged in, show auth modal
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      if (isSaved) {
        await unsaveProperty(property.mlsNumber);
        toast({
          title: "Property Removed",
          description: "Property has been removed from your saved list.",
          icon: <XCircle className="h-5 w-5 text-gray-600" />,
        });
      } else {
        await saveProperty({ mlsNumber: property.mlsNumber });
        toast({
          title: "Property Saved",
          description: "Property has been added to your saved list.",
          variant: "success",
          icon: <Heart className="h-5 w-5 text-green-600 fill-green-600" />,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save property. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        icon: <XCircle className="h-5 w-5 text-red-600" />,
      });
    }
  };

  const handleVideoClick = () => {
    setIsVideoModalOpen(true);
  };

  const handleGalleryClick = () => {
    // Dispatch custom event to open gallery modal
    const galleryEvent = new CustomEvent('openGallery');
    window.dispatchEvent(galleryEvent);
  };

  const handleScrollToBanner = () => {
    const bannerElement = document.querySelector('[data-banner-section]');
    if (bannerElement) {
      const elementPosition = bannerElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - 100; // Offset for navbar
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      // Fallback to top if element not found
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handleContactClick = () => {
    const contactElement = document.getElementById('contact-section');
    if (contactElement) {
      const elementPosition = contactElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navigationBarHeight - 20; // Offset for navbar
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleCalculatorClick = () => {
    scrollToSection('calculators');
  };

  // Calculate navigation bar height dynamically
  useEffect(() => {
    const calculateNavHeight = () => {
      if (navBarRef.current) {
        setNavigationBarHeight(navBarRef.current.getBoundingClientRect().height);
      }
    };

    calculateNavHeight();
    window.addEventListener('resize', calculateNavHeight);
    
    // Use MutationObserver to watch for changes in the navigation bar
    const observer = new MutationObserver(calculateNavHeight);
    if (navBarRef.current) {
      observer.observe(navBarRef.current, { childList: true, subtree: true, attributes: true });
    }

    return () => {
      window.removeEventListener('resize', calculateNavHeight);
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Set active section immediately
      setActiveSection(sectionId);
      
      // Dispatch custom event to expand the section if collapsed
      const expandEvent = new CustomEvent('expandSection', { detail: sectionId });
      window.dispatchEvent(expandEvent);
      
      // Mark that we're programmatically scrolling to prevent scroll handler interference
      isScrollingRef.current = true;
      
      // Total offset: navigation bar + some padding
      const totalOffset = navigationBarHeight + 20;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - totalOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Re-enable scroll tracking after scroll animation completes
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
      
      if (onSectionClick) {
        onSectionClick(sectionId);
      }
    }
  };

  // Track if scrolled past banner
  useEffect(() => {
    const handleBannerScroll = () => {
      // Check if we've scrolled past the banner (assuming banner is at top)
      const scrollY = window.scrollY;
      // Banner is typically at the top, so if we've scrolled more than 400px, we're past it
      setIsScrolledPastBanner(scrollY > 400);
    };

    window.addEventListener('scroll', handleBannerScroll, { passive: true });
    handleBannerScroll(); // Initial check
    return () => {
      window.removeEventListener('scroll', handleBannerScroll);
    };
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Skip if we're programmatically scrolling
      if (isScrollingRef.current) return;

      const totalOffset = navigationBarHeight + 20;
      const viewportTop = window.scrollY + totalOffset;
      
      // Find the section that's currently at or above the viewport top
      let activeId = filteredSections[0]?.id || '';
      let lastSectionAboveViewport = filteredSections[0]?.id || '';

      // Check each section from bottom to top to find the first one that's above viewport
      for (let i = filteredSections.length - 1; i >= 0; i--) {
        const section = filteredSections[i];
        const element = document.getElementById(section.id);
        if (!element) continue;

        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + window.scrollY;
        const elementBottom = elementTop + rect.height;

        // If section top is above or at the viewport top (with offset), it's a candidate
        if (elementTop <= viewportTop) {
          // If this section is visible (its bottom is below viewport top), it's active
          if (elementBottom > viewportTop) {
            activeId = section.id;
            break;
          } else {
            // Store the last section that's above viewport
            lastSectionAboveViewport = section.id;
          }
        }
      }

      // If no section is currently crossing the viewport top, use the last one above
      if (activeId === filteredSections[0]?.id && lastSectionAboveViewport !== filteredSections[0]?.id) {
        activeId = lastSectionAboveViewport;
      }

      // If we're at the top, use the first section
      if (window.scrollY < 100) {
        activeId = filteredSections[0]?.id || '';
      }

      setActiveSection(activeId);
    };

    // Initial check with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      handleScroll();
    }, 100);

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', throttledHandleScroll);
    };
  }, [filteredSections, navigationBarHeight]);

  return (
    <div 
      ref={navBarRef}
      data-section-navigation
      className="sticky top-0 bg-white border-b border-gray-200  mb-4 z-50 rounded-xl"
    >
      <div className="container-1400 mx-auto px-4 sm:px-4">
        <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-hide">
          {/* Video, Gallery, and Scroll to Top Icons */}
          {property && (
            <div className="flex items-center gap-0.5 flex-shrink-0 mr-2 border-r border-gray-200 pr-3">
              {/* Only show video icon if property has videos */}
              {(property.preCon?.videos && property.preCon.videos.length > 0) && (
                <button
                  onClick={handleVideoClick}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary transition-all duration-200"
                  aria-label="Play property video"
                >
                  <Video className="h-5 w-5" />
                </button>
              )}
              
              <button
                onClick={handleGalleryClick}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary transition-all duration-200"
                aria-label="Open image gallery"
              >
                <Images className="h-5 w-5" />
              </button>
              
              {isScrolledPastBanner && (
                <button
                  onClick={handleScrollToBanner}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary transition-all duration-200"
                  aria-label="Scroll to top"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {filteredSections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? 'default' : 'ghost'}
              onClick={() => scrollToSection(section.id)}
              className={`whitespace-nowrap text-sm rounded-lg ${
                activeSection === section.id 
                  ? 'bg-secondary text-primary-foreground' 
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              {section.label}
            </Button>
          ))}
          
          {/* Contact, Calculator, Save and Share Icons */}
          {property && (
            <>
              <div className="ml-auto flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={handleContactClick}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary transition-all duration-200"
                  aria-label="Contact us"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
                
                <button
                  onClick={handleCalculatorClick}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary transition-all duration-200"
                  aria-label="Go to calculators"
                >
                  <Calculator className="h-5 w-5" />
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={isSaving || isUnsaving}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isSaved 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-red-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-label="Save property"
                >
                  <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary transition-all duration-200"
                  aria-label="Share property"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Share Modal */}
      {property && (
        <ShareModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          property={property}
        />
      )}

      {/* Video Modal */}
      {property && (
        <VideoModal
          open={isVideoModalOpen}
          onOpenChange={setIsVideoModalOpen}
          videos={property.preCon?.videos || []}
        />
      )}

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default SectionNavigation;


