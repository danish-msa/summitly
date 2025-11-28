import React from 'react';

interface HeroSectionProps {
  heroImage: string | null;
  title: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ heroImage, title }) => {
  if (!heroImage) return null;

  return (
    <div className="w-full h-64 md:h-96 relative overflow-hidden">
      <img 
        src={heroImage} 
        alt={title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );
};

