import React, { useState, useEffect } from 'react'
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
      // Dispatch custom event to expand the section if collapsed
      const expandEvent = new CustomEvent('expandSection', { detail: sectionId });
      window.dispatchEvent(expandEvent);
      
      // Total offset: navbar + navigation bar + some padding
      const totalOffset = navbarHeight + navigationBarHeight + 20;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - totalOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
      
      if (onSectionClick) {
        onSectionClick(sectionId);
      }
    }
  };

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Total offset: navbar + navigation bar + some padding
      const totalOffset = navbarHeight + navigationBarHeight + 20;
      const scrollPosition = window.scrollY + totalOffset;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections, navbarHeight]);

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

