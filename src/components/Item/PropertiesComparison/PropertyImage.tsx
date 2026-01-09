"use client"

import React from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PropertyImageProps {
  src: string
  alt: string
  isSelected?: boolean
  showCheckmark?: boolean
  className?: string
}

const PropertyImage: React.FC<PropertyImageProps> = ({
  src,
  alt,
  isSelected = false,
  showCheckmark = false,
  className
}) => {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 256px"
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.src = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop'
        }}
      />
      {showCheckmark && isSelected && (
        <div className="absolute top-2 right-2 bg-secondary text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
          <Check className="w-5 h-5" />
        </div>
      )}
    </div>
  )
}

export default PropertyImage
