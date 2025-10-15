import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, MapPin, Bed, Bath, Square } from 'lucide-react'
import { PropertyListing } from '@/lib/types'
import { formatCurrency, formatRelativeTime } from '@/lib/utils/format'

interface PropertyCardProps {
  property: PropertyListing
  onFavorite?: (propertyId: string) => void
  isFavorite?: boolean
  className?: string
}

export function PropertyCard({ 
  property, 
  onFavorite, 
  isFavorite = false, 
  className 
}: PropertyCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const [imgError, setImgError] = React.useState(false)

  const images = imgError || !property.images.allImages || property.images.allImages.length === 0 
    ? ['/images/p1.jpg', '/images/p2.jpg', '/images/p3.jpg'] 
    : property.images.allImages

  const currentImage = images[currentImageIndex]

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onFavorite?.(property.mlsNumber)
  }

  return (
    <Card className={`group overflow-hidden transition-all duration-300 hover:shadow-lg ${className}`}>
      <CardHeader className="p-0">
        <div className="relative h-64 w-full overflow-hidden">
          <Image 
            src={currentImage} 
            alt={`${property.details.propertyType} in ${property.address.city}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
            unoptimized={!currentImage.startsWith('/')}
          />
          
          {/* Image Navigation */}
          <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button 
              variant="secondary" 
              size="icon"
              onClick={prevImage}
              className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
            >
              ←
            </Button>
            <Button 
              variant="secondary" 
              size="icon"
              onClick={nextImage}
              className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
            >
              →
            </Button>
          </div>
          
          {/* Image Counter */}
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {currentImageIndex + 1}/{images.length}
          </div>
          
          {/* Property Type Badge */}
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-white/90 text-primary">
              {property.details.propertyType}
            </Badge>
          </div>
          
          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFavorite}
            className="absolute top-4 right-4 h-8 w-8 bg-white/90 hover:bg-white text-gray-600 hover:text-red-500"
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Price */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-primary">
              {formatCurrency(property.listPrice)}
            </h3>
            <span className="text-sm text-muted-foreground">
              {formatRelativeTime(property.listDate)}
            </span>
          </div>
          
          {/* Address */}
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="truncate">
              {property.address.streetNumber} {property.address.streetName}, {property.address.city}
            </span>
          </div>
          
          {/* Property Details */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Bed className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{property.details.numBedrooms}</span>
              </div>
              <div className="flex items-center">
                <Bath className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{property.details.numBathrooms}</span>
              </div>
              <div className="flex items-center">
                <Square className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{property.details.sqft} sqft</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={`/property/${property.mlsNumber}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
