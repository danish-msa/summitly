import Image from 'next/image'
import React from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PropertyType {
  id: number;
  icon: string;
  type: string;
  number: number;
}

interface AppartmentTypeCardProps {
  type: PropertyType;
}

const AppartmentTypeCard = ({ type }: AppartmentTypeCardProps) => {
  // Use a default icon if the icon path is invalid
  const iconSrc = type.icon || "/images/a1.png";
  
  // Generate color variants based on type - optimized for 3 cards
  const getColorVariant = (id: number) => {
    const variants = [
      { 
        bg: 'bg-gradient-to-br from-primary/10 to-primary/5', 
        border: 'border-primary/30', 
        icon: 'bg-gradient-to-br from-primary/20 to-primary/10', 
        text: 'text-primary',
        accent: 'bg-primary/20'
      },
      { 
        bg: 'bg-gradient-to-br from-secondary/10 to-secondary/5', 
        border: 'border-secondary/30', 
        icon: 'bg-gradient-to-br from-secondary/20 to-secondary/10', 
        text: 'text-secondary',
        accent: 'bg-secondary/20'
      },
      { 
        bg: 'bg-gradient-to-br from-accent/10 to-accent/5', 
        border: 'border-accent/30', 
        icon: 'bg-gradient-to-br from-accent/20 to-accent/10', 
        text: 'text-accent',
        accent: 'bg-accent/20'
      },
    ];
    return variants[id % variants.length];
  };

  const colors = getColorVariant(type.id);
  
  return (
    <motion.div 
      className={cn(
        'group relative flex flex-col items-center justify-center p-8 bg-background border-2 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden h-full min-h-[280px]',
        colors.bg,
        colors.border
      )}
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
    >
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('/images/pattern.png')] bg-cover bg-center" />
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Top Accent Line */}
      <div className={cn(
        'absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-1 rounded-full group-hover:w-16 transition-all duration-500',
        colors.accent
      )} />
      
      {/* Icon Container */}
      <motion.div 
        className={cn(
          'relative p-6 rounded-3xl mb-6 shadow-lg border-2 border-border/30 group-hover:border-border/60 transition-all duration-500',
          colors.icon
        )}
        whileHover={{ scale: 1.1, rotate: 8 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
      >
        <Image 
          src={iconSrc} 
          alt={type.type} 
          width={64} 
          height={64}
          className="w-16 h-16 object-contain"
        />
        
        {/* Icon Glow Effect */}
        <div className={cn(
          'absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-lg',
          colors.accent
        )} />
        
        {/* Icon Background Pattern */}
        <div className="absolute inset-0 rounded-3xl opacity-10">
          <div className="absolute inset-0 bg-[url('/images/pattern.png')] bg-cover bg-center" />
        </div>
      </motion.div>
      
      {/* Content */}
      <div className='text-center relative z-10 flex-1 flex flex-col justify-center'>
        <h3 className={cn(
          'text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300 uppercase tracking-wide',
          colors.text
        )}>
          {type.type}
        </h3>
        
        <div className="flex items-center justify-center">
          <div className={cn(
            'px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 group-hover:scale-105',
            colors.accent,
            colors.text
          )}>
            {type.number.toLocaleString()} Properties
          </div>
        </div>
      </div>
      
      {/* Bottom Hover Indicator */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-primary rounded-full group-hover:w-20 transition-all duration-500" />
      
      {/* Corner Accents */}
      <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute bottom-4 left-4 w-2 h-2 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  )
}

export default AppartmentTypeCard