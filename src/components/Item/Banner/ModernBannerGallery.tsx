"use client"

import React, { useState } from 'react'
import { PropertyListing } from '@/lib/types'
import { ChevronLeft, ChevronRight, Layers, Map as MapIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapPin } from 'lucide-react'
import Map from '@/components/ui/map'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen'
import 'yet-another-react-lightbox/styles.css'
import Image from 'next/image'

interface ModernBannerGalleryProps {
  property: PropertyListing
}

type ImageCategory = 'all' | 'interior' | 'exterior' | 'amenities' | 'floorplan' | 'map'

interface CategorizedImage {
  src: string
  alt: string
  category: ImageCategory
  width: number
  height: number
}

const ModernBannerGallery: React.FC<ModernBannerGalleryProps> = ({ property }) => {
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [activeCategory, setActiveCategory] = useState<ImageCategory>('all')
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [defaultTab, setDefaultTab] = useState<string>('all')
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0)

  // Get image source with fallback
  const getImageSrc = (index: number) => {
    if (imageErrors[index]) {
      return `/images/p${(index % 5) + 1}.jpg`
    }

    if (property.images.allImages && property.images.allImages.length > index) {
      return property.images.allImages[index]
    }

    return `/images/p${(index % 5) + 1}.jpg`
  }

  // Handle image error
  const handleImageError = (index: number) => {
    setImageErrors(prev => ({
      ...prev,
      [index]: true
    }))
  }

  // Categorize images
  const allImages = property.images.allImages || [property.images.imageUrl]
  const categorizedImages: CategorizedImage[] = allImages.map((url, index) => {
    let category: ImageCategory = 'all'
    if (index < 4) category = 'exterior'
    else if (index < 8) category = 'interior'
    else if (index < 10) category = 'amenities'
    else category = 'floorplan'

    return {
      src: getImageSrc(index),
      alt: `${property.details.propertyType} - Image ${index + 1}`,
      category,
      width: 1920,
      height: 1080,
    }
  })

  // Filter images by category
  const filteredImages = activeCategory === 'all'
    ? categorizedImages
    : categorizedImages.filter(img => img.category === activeCategory)

  // Count images by category
  const categoryCounts = {
    all: categorizedImages.length,
    exterior: categorizedImages.filter(img => img.category === 'exterior').length,
    interior: categorizedImages.filter(img => img.category === 'interior').length,
    amenities: categorizedImages.filter(img => img.category === 'amenities').length,
    floorplan: categorizedImages.filter(img => img.category === 'floorplan').length,
  }

  const handleImageClick = (index: number) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
  }

  const handleModalOpen = (tab: string = 'all') => {
    setDefaultTab(tab)
    setIsModalOpen(true)
  }

  const handlePrevSlide = () => {
    const newIndex = currentSlideIndex === 0 ? categorizedImages.length - 1 : currentSlideIndex - 1
    setCurrentSlideIndex(newIndex)
    updateThumbnailIndex(newIndex)
  }

  const handleNextSlide = () => {
    const newIndex = currentSlideIndex === categorizedImages.length - 1 ? 0 : currentSlideIndex + 1
    setCurrentSlideIndex(newIndex)
    updateThumbnailIndex(newIndex)
  }

  const updateThumbnailIndex = (mainIndex: number) => {
    // Show 6 thumbnails, centered around the current image
    const thumbnailsToShow = 6
    const totalImages = categorizedImages.length
    
    if (totalImages <= thumbnailsToShow) {
      setThumbnailStartIndex(0)
      return
    }

    // Calculate start index to center the current image
    let start = mainIndex - Math.floor(thumbnailsToShow / 2)
    
    // Adjust if we're near the beginning
    if (start < 0) {
      start = 0
    }
    
    // Adjust if we're near the end
    if (start + thumbnailsToShow > totalImages) {
      start = totalImages - thumbnailsToShow
    }
    
    setThumbnailStartIndex(start)
  }

  const handleThumbnailClick = (index: number) => {
    setCurrentSlideIndex(index)
    updateThumbnailIndex(index)
  }

  // Update thumbnail index when main image changes
  React.useEffect(() => {
    updateThumbnailIndex(currentSlideIndex)
  }, [currentSlideIndex])

  // Get visible thumbnails
  const visibleThumbnails = categorizedImages.slice(
    thumbnailStartIndex,
    thumbnailStartIndex + 6
  )

  return (
    <>
      <div className="relative w-full">
        {/* Main Image Container */}
        <div className="relative w-full aspect-[16/10] bg-muted rounded-xl overflow-hidden group">
          <Image
            src={categorizedImages[currentSlideIndex]?.src || property.images.imageUrl}
            alt={categorizedImages[currentSlideIndex]?.alt || 'Property image'}
            fill
            className="object-cover transition-opacity duration-300"
            priority
            onError={() => handleImageError(currentSlideIndex)}
          />

          {/* Navigation Arrows */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 z-20"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>

          <button
            onClick={handleNextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 z-20"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          {/* Top Left Action Buttons */}
          <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-gray-900/80 text-white backdrop-blur-md hover:bg-gray-900 shadow-lg rounded-lg h-9 px-3"
              onClick={() => handleModalOpen('all')}
            >
              <Layers className="h-4 w-4" />
              View Gallery
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-2 bg-gray-900/80 text-white backdrop-blur-md hover:bg-gray-900 shadow-lg rounded-lg h-9 px-3"
              onClick={() => handleModalOpen('map')}
            >
              <MapIcon className="h-4 w-4" />
              Map View
            </Button>
          </div>
        </div>

        {/* Thumbnail Carousel */}
        <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
          {visibleThumbnails.map((image, index) => {
            const actualIndex = thumbnailStartIndex + index
            const isActive = actualIndex === currentSlideIndex

            return (
              <button
                key={actualIndex}
                onClick={() => handleThumbnailClick(actualIndex)}
                className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                  isActive
                    ? 'ring-2 ring-primary ring-offset-2 scale-105'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(actualIndex)}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* Full-Screen Gallery Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open)
          if (!open) {
            setDefaultTab('all')
            setActiveCategory('all')
          }
        }}
      >
        <DialogContent className="w-full max-w-none h-full p-0 gap-0 z-[9999] bg-background flex flex-col">
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-semibold">
                Property Gallery
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <Tabs
              value={defaultTab}
              defaultValue="all"
              className="w-full h-full flex flex-col"
              onValueChange={(value) => {
                setActiveCategory(value as ImageCategory)
                setDefaultTab(value)
              }}
            >
              <div className="sticky top-0 bg-background z-10 px-6 pt-4 pb-2 border-b flex-shrink-0">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="all" className="gap-2">
                    All
                    <span className="text-xs text-muted-foreground">({categoryCounts.all})</span>
                  </TabsTrigger>
                  {categoryCounts.exterior > 0 && (
                    <TabsTrigger value="exterior" className="gap-2">
                      Exterior
                      <span className="text-xs text-muted-foreground">({categoryCounts.exterior})</span>
                    </TabsTrigger>
                  )}
                  {categoryCounts.interior > 0 && (
                    <TabsTrigger value="interior" className="gap-2">
                      Interior
                      <span className="text-xs text-muted-foreground">({categoryCounts.interior})</span>
                    </TabsTrigger>
                  )}
                  {categoryCounts.amenities > 0 && (
                    <TabsTrigger value="amenities" className="gap-2">
                      Amenities
                      <span className="text-xs text-muted-foreground">({categoryCounts.amenities})</span>
                    </TabsTrigger>
                  )}
                  {categoryCounts.floorplan > 0 && (
                    <TabsTrigger value="floorplan" className="gap-2">
                      Floor Plans
                      <span className="text-xs text-muted-foreground">({categoryCounts.floorplan})</span>
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="map" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Map
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0 p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categorizedImages.map((image, index) => (
                    <div
                      key={index}
                      className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer bg-muted"
                      onClick={() => handleImageClick(index)}
                    >
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={() => handleImageError(index)}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-xs text-white">
                          Click to enlarge
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {categoryCounts.exterior > 0 && (
                <TabsContent value="exterior" className="mt-0 p-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categorizedImages
                      .filter(img => img.category === 'exterior')
                      .map((image, index) => {
                        const originalIndex = categorizedImages.findIndex(
                          img => img.src === image.src && img.category === image.category
                        )
                        return (
                          <div
                            key={index}
                            className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer bg-muted"
                            onClick={() => handleImageClick(originalIndex)}
                          >
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={() => handleImageError(originalIndex)}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                          </div>
                        )
                      })}
                  </div>
                </TabsContent>
              )}

              {categoryCounts.interior > 0 && (
                <TabsContent value="interior" className="mt-0 p-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categorizedImages
                      .filter(img => img.category === 'interior')
                      .map((image, index) => {
                        const originalIndex = categorizedImages.findIndex(
                          img => img.src === image.src && img.category === image.category
                        )
                        return (
                          <div
                            key={index}
                            className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer bg-muted"
                            onClick={() => handleImageClick(originalIndex)}
                          >
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={() => handleImageError(originalIndex)}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                          </div>
                        )
                      })}
                  </div>
                </TabsContent>
              )}

              {categoryCounts.amenities > 0 && (
                <TabsContent value="amenities" className="mt-0 p-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categorizedImages
                      .filter(img => img.category === 'amenities')
                      .map((image, index) => {
                        const originalIndex = categorizedImages.findIndex(
                          img => img.src === image.src && img.category === image.category
                        )
                        return (
                          <div
                            key={index}
                            className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer bg-muted"
                            onClick={() => handleImageClick(originalIndex)}
                          >
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={() => handleImageError(originalIndex)}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                          </div>
                        )
                      })}
                  </div>
                </TabsContent>
              )}

              {categoryCounts.floorplan > 0 && (
                <TabsContent value="floorplan" className="mt-0 p-6 overflow-y-auto flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categorizedImages
                      .filter(img => img.category === 'floorplan')
                      .map((image, index) => {
                        const originalIndex = categorizedImages.findIndex(
                          img => img.src === image.src && img.category === image.category
                        )
                        return (
                          <div
                            key={index}
                            className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer bg-muted"
                            onClick={() => handleImageClick(originalIndex)}
                          >
                            <Image
                              src={image.src}
                              alt={image.alt}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={() => handleImageError(originalIndex)}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                          </div>
                        )
                      })}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="map" className="mt-0 flex-1 overflow-hidden p-0">
                <div className="w-full h-full overflow-hidden">
                  <Map
                    latitude={property.map.latitude || undefined}
                    longitude={property.map.longitude || undefined}
                    address={
                      property.address.location ||
                      `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim()
                    }
                    height="100%"
                    width="100%"
                    zoom={15}
                    showControls={true}
                    showFullscreen={true}
                    showExternalLink={true}
                    showMarker={true}
                    className="w-full h-full"
                    borderRadius="lg"
                    currentProperty={property}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox for Individual Image Viewing */}
      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        index={lightboxIndex}
        slides={filteredImages}
        plugins={[Zoom, Fullscreen]}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true,
        }}
        animation={{
          fade: 300,
          swipe: 300,
        }}
        carousel={{
          finite: false,
          preload: 2,
        }}
        styles={{
          container: {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(8px)',
          },
        }}
        on={{
          view: ({ index }) => setLightboxIndex(index),
        }}
      />
    </>
  )
}

export default ModernBannerGallery

