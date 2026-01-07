"use client"

import React, { useState, useMemo } from 'react'
import { Bed, Bath, Maximize2, MapPin, Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PropertyListing } from '@/lib/types'
import { useSavedComparables } from '@/hooks/useSavedComparables'
import { useSession } from 'next-auth/react'
import AuthModal from '@/components/Auth/AuthModal'

interface ComparablePropertyCardProps {
  property: PropertyListing
  onSelect?: (property: PropertyListing, isSelected: boolean) => void
}

const ComparablePropertyCard = ({ property, onSelect }: ComparablePropertyCardProps) => {
  const [imgError, setImgError] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  
  const { data: session } = useSession()
  const { checkIsSaved, saveComparable, unsaveComparable, isSaving, isUnsaving } = useSavedComparables()
  const isSelected = checkIsSaved(property.mlsNumber)
  
  // Get images array with proper fallbacks
  const images = useMemo(() => {
    const allImages = property.images?.allImages || []
    const imageUrl = property.images?.imageUrl || ''
    
    const validImages = [
      ...allImages,
      ...(imageUrl && !allImages.includes(imageUrl) ? [imageUrl] : [])
    ].filter(url => url && typeof url === 'string' && url.trim() !== '')
    
    if (validImages.length === 0) {
      return ['/images/p1.jpg']
    }
    
    return validImages
  }, [property.images])
  
  const totalImages = images.length
  
  // Format price
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(property.listPrice)

  const imageSrc = useMemo(() => {
    if (imgError || !images[currentImageIndex]) {
      return '/images/p1.jpg'
    }
    return images[currentImageIndex]
  }, [images, currentImageIndex, imgError])

  const handleToggleSelect = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      setIsAuthModalOpen(true)
      return
    }

    try {
      if (isSelected) {
        await unsaveComparable(property.mlsNumber)
        onSelect?.(property, false)
      } else {
        await saveComparable(property.mlsNumber)
        onSelect?.(property, true)
      }
    } catch (error) {
      console.error('Error toggling comparable:', error)
    }
  }

  return (
    <>
      <div 
        className={cn(
          'group cursor-pointer bg-card rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-xl relative',
          isSelected && 'ring-2 ring-secondary ring-offset-2'
        )}
        style={{ boxShadow: '0 8px 16px 0 rgba(0, 0, 0, 0.05)' }}
      >
        {/* Selection Checkbox - Top Right */}
        <button
          onClick={handleToggleSelect}
          disabled={isSaving || isUnsaving}
          className={cn(
            'absolute top-4 right-4 z-20 p-2 rounded-full transition-all duration-200 shadow-lg',
            isSelected 
              ? 'bg-secondary text-white' 
              : 'bg-card/95 backdrop-blur-sm hover:bg-card',
            (isSaving || isUnsaving) && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={isSelected ? 'Remove from comparables' : 'Add to comparables'}
        >
          <Check 
            className={cn(
              "w-5 h-5 transition-all duration-200",
              isSelected ? "text-white" : "text-muted-foreground opacity-0 group-hover:opacity-100"
            )} 
          />
        </button>

        {/* Image Section */}
        <div className='relative h-60 w-full overflow-hidden'>
          <img 
            src={imageSrc} 
            alt={`${property.details.propertyType} in ${property.address.city || 'Unknown City'}`}
            className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-700'
            onError={() => setImgError(true)}
          />
          
          {/* Top badges row */}
          <div className='absolute top-5 left-5 flex items-center gap-2'>
            <Badge className="bg-brand-smoky-gray backdrop-blur-sm text-white hover:bg-brand-smoky-gray border-0 rounded-full px-4 py-1.5 text-xs font-light">
              {property.details.propertyType}
            </Badge>
          </div>
        </div>
        
        {/* Content Section */}
        <div className='p-4'>
          {/* Price */}
          <div className='mb-3 flex items-center justify-between'>
            <h3 className='text-xl font-bold text-foreground'>{formattedPrice}</h3>
            <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
              For Sale
            </Badge>
          </div>
          
          {/* Property Title */}
          <h4 className='text-sm font-body font-medium text-foreground mb-2 line-clamp-1'>
            Premium {property.details.propertyType}
          </h4>
          
          {/* Location */}
          <div className='flex items-start mb-4'>
            <MapPin className='mr-1 text-muted-foreground flex-shrink-0 mt-0.5' size={12} />
            <p className='text-xs font-light text-foreground line-clamp-1'>{property.address.location}</p>
          </div>
          
          {/* Property Details */}
          <div className='flex items-center gap-4'>
            {property.details.numBedrooms > 0 && (
              <div className='flex items-center gap-2 text-foreground'>
                <Bed className='text-muted-foreground' size={12} />
                <span className='text-xs font-light'>{property.details.numBedrooms} Bed</span>
              </div>
            )}
            
            {property.details.numBathrooms > 0 && (
              <div className='flex items-center gap-2 text-foreground'>
                <Bath className='text-muted-foreground' size={12} />
                <span className='text-xs font-light'>{property.details.numBathrooms} Bath</span>
              </div>
            )}
            
            <div className='flex items-center gap-2 text-foreground'>
              <Maximize2 className='text-muted-foreground' size={12} />
              <span className='text-xs font-light'>
                {typeof property.details.sqft === 'number' 
                  ? property.details.sqft.toLocaleString() 
                  : property.details.sqft} sqft
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  )
}

export default ComparablePropertyCard

