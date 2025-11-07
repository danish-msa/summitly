import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Share2 } from 'lucide-react'
import { PropertyListing } from '@/lib/types'
import ShareModal from '../Banner/ShareModal'

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
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const isScrollingRef = useRef(false);

  const handleSave = () => {
    setIsSaved(!isSaved);
    // Add save functionality here
  };

  // Navigation bar height (this component itself)
  const navigationBarHeight = 64; // Approximate height of the navigation bar

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

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Skip if we're programmatically scrolling
      if (isScrollingRef.current) return;

      const totalOffset = navigationBarHeight + 20;
      const viewportTop = window.scrollY + totalOffset;
      
      // Find the section that's currently at or above the viewport top
      let activeId = sections[0]?.id || '';
      let lastSectionAboveViewport = sections[0]?.id || '';

      // Check each section from bottom to top to find the first one that's above viewport
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
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
      if (activeId === sections[0]?.id && lastSectionAboveViewport !== sections[0]?.id) {
        activeId = lastSectionAboveViewport;
      }

      // If we're at the top, use the first section
      if (window.scrollY < 100) {
        activeId = sections[0]?.id || '';
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
  }, [sections, navigationBarHeight]);

  return (
    <div 
      data-section-navigation
      className="sticky top-0 bg-white border-b border-gray-200 shadow-sm mb-6 z-50"
    >
      <div className="container-1400 mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-hide">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? 'default' : 'ghost'}
              onClick={() => scrollToSection(section.id)}
              className={`whitespace-nowrap text-base rounded-lg ${
                activeSection === section.id 
                  ? 'bg-secondary text-primary-foreground' 
                  : 'text-gray-700 hover:text-primary'
              }`}
            >
              {section.label}
            </Button>
          ))}
          
          {/* Save and Share Buttons */}
          {property && (
            <>
              <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                <Button
                  variant={isSaved ? "default" : "outline"}
                  size="default"
                  onClick={handleSave}
                  className="gap-2"
                >
                  <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  <span className="hidden sm:inline">Save</span>
                </Button>
                
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
    </div>
  );
};

export default SectionNavigation;


