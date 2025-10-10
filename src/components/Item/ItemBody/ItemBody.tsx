import React, { useState, useEffect, useRef } from 'react'
import Overview from './Overview'
import Features from './Features'
import Location from './Location'
import Demographics from './Demographics'
import { PropertyListing } from '@/data/types'
import PriceSection from './PriceSection'

interface ItemBodyProps {
  property: PropertyListing;
}

const ItemBody: React.FC<ItemBodyProps> = ({ property }) => {
  const [activeSection, setActiveSection] = useState('description');
  const [isSticky, setIsSticky] = useState(false);
  
  // Define sections for navigation
  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'description', label: 'Description' },
    { id: 'features', label: 'Amenities & Features' },
    { id: 'location', label: 'Map Location' },
    { id: 'demographics', label: 'Demographics' }
  ];
  
  // Refs for each section
  const descriptionRef = useRef<HTMLDivElement>(null);
  const overviewRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const demographicsRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Scroll to section when tab is clicked
  const scrollToSection = (sectionId: string) => {
    let ref;
    switch(sectionId) {
      case 'overview': ref = overviewRef; break;
      case 'description': ref = descriptionRef; break;
      case 'features': ref = featuresRef; break;
      case 'location': ref = locationRef; break;
      case 'demographics': ref = demographicsRef; break;
      default: ref = descriptionRef;
    }
    
    if (ref.current) {
      // Offset for the sticky header
      const yOffset = -100; 
      const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    }
  };

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Make tabs sticky
      if (tabsRef.current) {
        const tabsPosition = tabsRef.current.getBoundingClientRect().top;
        setIsSticky(tabsPosition <= 0);
      }
      
      // Determine which section is in view
      const scrollPosition = window.scrollY + 150; // Offset for better UX
      
      const sectionRefs = [
        { id: 'overview', ref: overviewRef },
        { id: 'description', ref: descriptionRef },
        { id: 'features', ref: featuresRef },
        { id: 'location', ref: locationRef },
        { id: 'demographics', ref: demographicsRef }
      ];
      
      for (let i = sectionRefs.length - 1; i >= 0; i--) {
        const section = sectionRefs[i];
        if (section.ref.current && section.ref.current.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className='mx-auto w-[95%] my-5 relative'>
      <div 
        ref={tabsRef} 
        className={`flex overflow-x-auto whitespace-nowrap gap-2 py-4 bg-white w-full transition-all duration-300 ${
          isSticky ? 'shadow-md' : ''
        }`}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 999
        }}
      >
        {sections.map((section) => (
          <button 
            key={section.id}
            onClick={() => scrollToSection(section.id)} 
            className={`min-w-[15%] p-4 rounded-lg text-lg font-medium transition-all ${
              activeSection === section.id 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-black'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>
      <div className='flex flex-col md:flex-row gap-2 justify-between mt-6'>
        <div className='md:w-[68%] flex flex-col gap-5'>  
            <div ref={overviewRef} className='scroll-mt-24'>
              <Overview property={property} />
            </div>
          <div ref={descriptionRef} className='scroll-mt-24 mt-3 rounded-xl border border-solid border-[#DBDBDB] bg-white px-3 py-6 sm:px-4'>
              <h3 className='text-black font-medium text-2xl mb-2'>Description</h3>
              <p className='text-gray-500 font-light'>{property.lot.legalDescription}</p>
          </div>
          
          <div ref={featuresRef} className='scroll-mt-24 mt-3 rounded-xl border border-solid border-[#DBDBDB] bg-white px-3 py-6 sm:px-4'>
            <h3 className='text-black font-medium text-2xl mb-2'>Amenities and features</h3>
              <Features />
          </div>
          <div ref={locationRef} className='scroll-mt-24 mt-3 rounded-xl border border-solid border-[#DBDBDB] bg-white px-3 py-6 sm:px-4'>
            <h3 className='text-black font-medium text-2xl mb-2'>Map location</h3>
              <Location property={property}  />
          </div>
          <div ref={demographicsRef} className='scroll-mt-24 mt-3 rounded-xl border border-solid border-[#DBDBDB] bg-white px-3 py-6 sm:px-4'>
            <h3 className='text-black font-medium text-2xl mb-2'>Demographics</h3>
              <Demographics />
          </div>
        </div>
        <div className='md:w-[30%] sticky h-fit md:top-[120px]'>
          <PriceSection/>
        </div>
      </div>
    </div>
  )
}

export default ItemBody