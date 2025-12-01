import React from 'react';
import PreConSearchBar from '@/components/common/PreConSearchBar';

interface HeroSectionProps {
  heroImage: string | null;
  title: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ heroImage, title }) => {
  const imageSrc = heroImage || '/images/HeroBackImage.jpg';

  return (
    <div className="w-full h-64 md:h-96 relative overflow-hidden">
      <img 
        src={imageSrc} 
        alt={title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      
      {/* Search Bar Overlay */}
      <div className="absolute inset-0 flex items-center justify-center px-4 z-10">
        <div className="w-full max-w-2xl">
          <PreConSearchBar
            placeholder="Enter location to search pre-construction properties"
            className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg"
            autoNavigate={true}
          />
        </div>
      </div>
    </div>
  );
};

