import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

interface Section {
  id: string;
  label: string;
}

interface SectionNavigationProps {
  sections: Section[];
  onSectionClick?: (sectionId: string) => void;
}

const SectionNavigation: React.FC<SectionNavigationProps> = ({ 
  sections, 
  onSectionClick
}) => {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '');
  const [navbarHeight, setNavbarHeight] = useState<number>(56); // Default mobile height
  const isScrollingRef = useRef(false);

  // Calculate navbar height based on window width
  useEffect(() => {
    const calculateNavbarHeight = () => {
      // Navbar height: h-14 (56px) mobile, h-16 (64px) desktop
      const height = window.innerWidth >= 1024 ? 64 : 56;
      setNavbarHeight(height);
    };

    calculateNavbarHeight();
    window.addEventListener('resize', calculateNavbarHeight);
    return () => window.removeEventListener('resize', calculateNavbarHeight);
  }, []);

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
      
      // Total offset: navbar + navigation bar + some padding
      const totalOffset = navbarHeight + navigationBarHeight + 20;
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

      const totalOffset = navbarHeight + navigationBarHeight + 20;
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
  }, [sections, navbarHeight, navigationBarHeight]);

  return (
    <div 
      className="sticky z-50 bg-white border-b border-gray-200 shadow-sm mb-6"
      style={{ top: `${navbarHeight}px` }}
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
        </div>
      </div>
    </div>
  );
};

export default SectionNavigation;


