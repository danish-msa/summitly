"use client"

import React, { useState } from 'react'
import { PropertyListing } from '@/lib/types'
import { ChevronLeft, ChevronRight, Layers, Map as MapIcon, Minus, Plus } from 'lucide-react'
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
import { Slider } from '@/components/ui/slider'
import { FlyAroundButton } from '@/features/fly-around'

// Custom styles for lightbox close button position (left side)
const lightboxStyles = `
  .yarl__button[aria-label="Close"],
  .yarl__button[aria-label*="Close"],
  button[aria-label="Close"],
  button[aria-label*="Close"] {
    left: 1rem !important;
    right: auto !important;
  }
  
  /* Also target by class if aria-label doesn't work */
  .yarl__button.yarl__button_close,
  .yarl__button_close {
    left: 1rem !important;
    right: auto !important;
  }
`

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
  const [_activeCategory, setActiveCategory] = useState<ImageCategory>('all')
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [defaultTab, setDefaultTab] = useState<string>('all')
  const [gridColumns, setGridColumns] = useState([4]) // Default to 4 columns (xl:grid-cols-4)
  const thumbnailScrollRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [hasDragged, setHasDragged] = useState(false)

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
  // const filteredImages = activeCategory === 'all'
  //   ? categorizedImages
  //   : categorizedImages.filter(img => img.category === activeCategory)

  // Count images by category
  const categoryCounts = {
    all: categorizedImages.length,
    exterior: categorizedImages.filter(img => img.category === 'exterior').length,
    interior: categorizedImages.filter(img => img.category === 'interior').length,
    amenities: categorizedImages.filter(img => img.category === 'amenities').length,
    floorplan: categorizedImages.filter(img => img.category === 'floorplan').length,
  }

  // Get grid columns class based on slider value
  const getGridColsClass = () => {
    const cols = gridColumns[0]
    const gridMap: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    }
    return gridMap[cols] || gridMap[4]
  }

  const handleImageClick = (index: number) => {
    setLightboxIndex(index)
    setIsLightboxOpen(true)
    // Keep modal open - lightbox will appear on top
  }

  const handleModalOpen = (tab: string = 'all') => {
    setDefaultTab(tab)
    setIsModalOpen(true)
  }

  const handlePrevSlide = () => {
    const newIndex = currentSlideIndex === 0 ? categorizedImages.length - 1 : currentSlideIndex - 1
    setCurrentSlideIndex(newIndex)
    scrollToThumbnail(newIndex)
  }

  const handleNextSlide = () => {
    const newIndex = currentSlideIndex === categorizedImages.length - 1 ? 0 : currentSlideIndex + 1
    setCurrentSlideIndex(newIndex)
    scrollToThumbnail(newIndex)
  }

  const scrollToThumbnail = (index: number) => {
    if (thumbnailScrollRef.current) {
      const thumbnailElement = thumbnailScrollRef.current.children[index] as HTMLElement
      if (thumbnailElement) {
        thumbnailElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        })
      }
    }
  }

  const handleThumbnailClick = (index: number, e?: React.MouseEvent) => {
    // Prevent click if user was dragging
    if (hasDragged) {
      e?.preventDefault()
      e?.stopPropagation()
      return
    }
    setCurrentSlideIndex(index)
    scrollToThumbnail(index)
  }

  // Scroll to active thumbnail when main image changes
  React.useEffect(() => {
    scrollToThumbnail(currentSlideIndex)
  }, [currentSlideIndex])

  // Drag to scroll handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!thumbnailScrollRef.current) return
    setIsDragging(true)
    setHasDragged(false)
    setStartX(e.pageX - thumbnailScrollRef.current.offsetLeft)
    setScrollLeft(thumbnailScrollRef.current.scrollLeft)
    thumbnailScrollRef.current.style.cursor = 'grabbing'
    thumbnailScrollRef.current.style.userSelect = 'none'
  }

  const handleMouseLeave = () => {
    if (!thumbnailScrollRef.current) return
    setIsDragging(false)
    setHasDragged(false)
    thumbnailScrollRef.current.style.cursor = 'grab'
    thumbnailScrollRef.current.style.userSelect = 'auto'
  }

  const handleMouseUp = () => {
    if (!thumbnailScrollRef.current) return
    setIsDragging(false)
    thumbnailScrollRef.current.style.cursor = 'grab'
    thumbnailScrollRef.current.style.userSelect = 'auto'
    // Reset hasDragged after a short delay to allow click events
    setTimeout(() => setHasDragged(false), 100)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !thumbnailScrollRef.current) return
    e.preventDefault()
    const x = e.pageX - thumbnailScrollRef.current.offsetLeft
    const walk = (x - startX) * 2 // Scroll speed multiplier
    thumbnailScrollRef.current.scrollLeft = scrollLeft - walk
    
    // Mark as dragged if movement is significant
    if (Math.abs(walk) > 5) {
      setHasDragged(true)
    }
  }

  return (
    <>
      <style>{lightboxStyles}</style>
      <div className="relative w-full">
        {/* Main Image Container */}
        <div className="relative w-full aspect-[16/10] bg-muted rounded-3xl overflow-hidden group">
          <Image
            src={categorizedImages[currentSlideIndex]?.src || property.images.imageUrl}
            alt={categorizedImages[currentSlideIndex]?.alt || 'Property image'}
            fill
            className="object-cover transition-opacity duration-300 cursor-pointer"
            priority
            onError={() => handleImageError(currentSlideIndex)}
            onClick={() => {
              // Open the gallery modal only
              const currentImage = categorizedImages[currentSlideIndex]
              if (currentImage) {
                setActiveCategory(currentImage.category)
                setDefaultTab(currentImage.category)
              } else {
                setActiveCategory('all')
                setDefaultTab('all')
              }
              setIsModalOpen(true)
            }}
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
              className="gap-2 backdrop-blur-md rounded-lg h-9 px-3"
              onClick={() => handleModalOpen('all')}
            >
              <Layers className="h-4 w-4" />
              View Gallery
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-2 backdrop-blur-md rounded-lg h-9 px-3"
              onClick={() => handleModalOpen('map')}
            >
              <MapIcon className="h-4 w-4" />
              Map View
            </Button>
          </div>

          {/* Bottom Left - Fly Around */}
          {property.map?.latitude != null && property.map?.longitude != null && (
            <div className="absolute bottom-4 left-4 z-20">
              <FlyAroundButton
                latitude={property.map.latitude}
                longitude={property.map.longitude}
                address={property.address?.location ?? undefined}
                label="Fly Around"
                variant="white"
                size="sm"
                className="gap-2 h-9"
              />
            </div>
          )}
        </div>

        {/* Thumbnail Carousel */}
        <div 
          ref={thumbnailScrollRef}
          className="mt-4 px-2 py-1 flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth cursor-grab active:cursor-grabbing select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {categorizedImages.map((image, index) => {
            const isActive = index === currentSlideIndex

            return (
              <button
                key={index}
                onClick={(e) => handleThumbnailClick(index, e)}
                className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                  isActive
                    ? 'border-2 border-primary scale-105'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(index)}
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
        <DialogContent className={`w-full max-w-none h-full p-0 gap-0 ${isLightboxOpen ? 'z-[9998]' : 'z-[9999]'} bg-background flex flex-col`}>
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="text-2xl font-semibold">
              Property Gallery
            </DialogTitle>
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
                <div className="flex items-center justify-between gap-4">
                  <TabsList className="flex-1 justify-start">
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
                  
                  {/* Image Size Slider */}
                  <div className="flex items-center gap-3 min-w-[200px] flex-shrink-0">
                    <button
                      onClick={() => setGridColumns([Math.max(1, gridColumns[0] - 1)])}
                      className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors"
                      aria-label="Decrease image size"
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <Slider
                      value={gridColumns}
                      onValueChange={setGridColumns}
                      min={1}
                      max={6}
                      step={1}
                      className="flex-1"
                    />
                    <button
                      onClick={() => setGridColumns([Math.min(6, gridColumns[0] + 1)])}
                      className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors"
                      aria-label="Increase image size"
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <TabsContent value="all" className="mt-0 p-6 overflow-y-auto flex-1">
                <div className={`grid ${getGridColsClass()} gap-4`}>
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
                  <div className={`grid ${getGridColsClass()} gap-4`}>
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
                  <div className={`grid ${getGridColsClass()} gap-4`}>
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
                  <div className={`grid ${getGridColsClass()} gap-4`}>
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
                  <div className={`grid ${getGridColsClass()} gap-4`}>
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

      {/* Lightbox for Individual Image Viewing - Rendered outside Dialog with highest z-index */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0"
          style={{ 
            zIndex: 10001,
            pointerEvents: 'auto'
          }}
        >
          <Lightbox
            open={isLightboxOpen}
            close={() => {
              // Only close lightbox, keep modal open
              setIsLightboxOpen(false)
            }}
            index={lightboxIndex}
            slides={categorizedImages}
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
              root: {
                zIndex: 10001,
              },
            }}
            className="lightbox-close-right"
            on={{
              view: ({ index }) => setLightboxIndex(index),
            }}
          />
        </div>
      )}
    </>
  )
}

export default ModernBannerGallery

