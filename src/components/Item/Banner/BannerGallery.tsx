import React, { useState, useEffect } from 'react';
import { Layers, ChevronLeft, ChevronRight, MapPin, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyListing } from '@/lib/types';
import Map from "@/components/ui/map";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";

interface BannerGalleryProps {
    property: PropertyListing;
}

// Image categories for filtering
type ImageCategory = 'all' | 'interior' | 'exterior' | 'amenities' | 'floorplan' | 'map';

interface CategorizedImage {
    src: string;
    alt: string;
    category: ImageCategory;
    width: number;
    height: number;
}

const BannerGallery: React.FC<BannerGalleryProps> = ({ property }) => {
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [activeCategory, setActiveCategory] = useState<ImageCategory>('all');
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [defaultTab, setDefaultTab] = useState<string>('all');
    
    // Get image source with fallback
    const getImageSrc = (index: number) => {
        if (imageErrors[index]) {
            return `/images/p${(index % 5) + 1}.jpg`;
        }
        
        if (property.images.allImages && property.images.allImages.length > index) {
            return property.images.allImages[index];
        }
        
        return `/images/p${(index % 5) + 1}.jpg`;
    };

    // Handle image error
    const handleImageError = (index: number) => {
        setImageErrors(prev => ({
            ...prev,
            [index]: true
        }));
    };

    // Categorize images
    const allImages = property.images.allImages || [property.images.imageUrl];
    const categorizedImages: CategorizedImage[] = allImages.map((url, index) => {
        let category: ImageCategory = 'all';
        if (index < 4) category = 'exterior';
        else if (index < 8) category = 'interior';
        else if (index < 10) category = 'amenities';
        else category = 'floorplan';

        return {
            src: getImageSrc(index),
            alt: `${property.details.propertyType} - Image ${index + 1}`,
            category,
            width: 1920,
            height: 1080,
        };
    });

    // Filter images by category
    const filteredImages = activeCategory === 'all' 
        ? categorizedImages 
        : categorizedImages.filter(img => img.category === activeCategory);

    // Count images by category
    const categoryCounts = {
        all: categorizedImages.length,
        exterior: categorizedImages.filter(img => img.category === 'exterior').length,
        interior: categorizedImages.filter(img => img.category === 'interior').length,
        amenities: categorizedImages.filter(img => img.category === 'amenities').length,
        floorplan: categorizedImages.filter(img => img.category === 'floorplan').length,
    };

    const handleImageClick = (index: number) => {
        setLightboxIndex(index);
        setIsLightboxOpen(true);
    };

    const handleModalOpen = (tab: string = 'all') => {
        setDefaultTab(tab);
        setIsModalOpen(true);
    };

    // Listen for custom event to open gallery from navigation
    useEffect(() => {
        const handleOpenGallery = () => {
            setIsModalOpen(true);
        };

        window.addEventListener('openGallery', handleOpenGallery);
        return () => {
            window.removeEventListener('openGallery', handleOpenGallery);
        };
    }, []);

    const handlePrevSlide = () => {
        setCurrentSlideIndex((prev) => 
            prev === 0 ? categorizedImages.length - 1 : prev - 1
        );
    };

    const handleNextSlide = () => {
        setCurrentSlideIndex((prev) => 
            prev === categorizedImages.length - 1 ? 0 : prev + 1
        );
    };


    return (
        <>
            {/* 50-50 Split Layout: Slider Left + 2x2 Grid Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Side: Large Image Slider (50%) */}
                <div className="relative overflow-hidden bg-muted group aspect-[4/3] rounded-2xl">
                    <img
                        src={categorizedImages[currentSlideIndex]?.src}
                        alt={categorizedImages[currentSlideIndex]?.alt}
                        className="h-full w-full object-cover transition-all duration-300"
                        onError={() => handleImageError(currentSlideIndex)}
                    />
                    
                    {/* Previous Button */}
                    <button
                        onClick={handlePrevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="h-6 w-6 text-gray-800" />
                    </button>
                    
                    {/* Next Button */}
                    <button
                        onClick={handleNextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
                        aria-label="Next image"
                    >
                        <ChevronRight className="h-6 w-6 text-gray-800" />
                    </button>
                    
                
                    
                    {/* Action Buttons Row */}
                    <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                        <Button
                            variant="default"
                            className="gap-2 bg-white/85 text-black backdrop-blur-md hover:bg-white shadow-lg rounded-lg"
                            onClick={() => handleModalOpen('all')}
                        >
                            <Layers className="h-4 w-4" />
                            View Gallery
                        </Button>
                        <Button
                            variant="default"
                            className="gap-2 bg-white/85 text-black backdrop-blur-md hover:bg-white shadow-lg rounded-lg"
                            onClick={() => handleModalOpen('map')}
                        >
                            <MapIcon className="h-4 w-4" />
                            Map View
                        </Button>
                    </div>
                </div>

                {/* Right Side: 2x2 Grid (50%) */}
                <div className="hidden md:grid grid-cols-2 grid-rows-2 aspect-[4/3] gap-4">
                    {categorizedImages.slice(1, 5).map((image, index) => {
                        const actualIndex = index + 1;
                        const isLastImage = index === 3;
                        
                        return (
                            <div 
                                key={actualIndex}
                                className="relative overflow-hidden bg-muted cursor-pointer group aspect-[4/3] rounded-2xl"
                                onClick={() => isLastImage && categorizedImages.length > 5 ? handleModalOpen('all') : handleImageClick(actualIndex)}
                            >
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    onError={() => handleImageError(actualIndex)}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                
                                {/* Photo Count Badge on Last Image */}
                                {isLastImage && categorizedImages.length > 5 && (
                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center cursor-pointer">
                                        <div className="flex items-center gap-2 text-white">
                                            <Layers className="h-5 w-5" />
                                            <span className="text-xl font-semibold">+{categorizedImages.length - 5}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Show All Photos Button - Mobile Only */}
                <Button
                    variant="secondary"
                    size="sm"
                    className="md:hidden absolute bottom-4 right-4 z-10 gap-2 bg-white/95 backdrop-blur-md hover:bg-white shadow-lg"
                    onClick={() => handleModalOpen('all')}
                >
                    <Layers className="h-4 w-4" />
                    Show all {categorizedImages.length} photos
                </Button>
            </div>

            {/* Full-Screen Gallery Modal */}
            <Dialog open={isModalOpen} onOpenChange={(open) => {
                setIsModalOpen(open);
                if (!open) {
                    // Reset to 'all' tab when modal closes
                    setDefaultTab('all');
                    setActiveCategory('all');
                }
            }}>
                <DialogContent className="w-full max-w-none h-full p-0 gap-0 z-[9999] bg-background flex flex-col">
                    <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-2xl font-semibold">
                                Property Gallery
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                        <Tabs value={defaultTab} defaultValue="all" className="w-full h-full flex flex-col" onValueChange={(value) => {
                            setActiveCategory(value as ImageCategory);
                            setDefaultTab(value);
                        }}>
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
                                            <img
                                                src={image.src}
                                                alt={image.alt}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
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
                                        {categorizedImages.filter(img => img.category === 'exterior').map((image, index) => {
                                            const originalIndex = categorizedImages.findIndex(img => img.src === image.src && img.category === image.category);
                                            return (
                                                <div
                                                    key={index}
                                                    className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer bg-muted"
                                                    onClick={() => handleImageClick(originalIndex)}
                                                >
                                                    <img
                                                        src={image.src}
                                                        alt={image.alt}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        onError={() => handleImageError(originalIndex)}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-xs text-white">
                                                            Click to enlarge
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>
                            )}
                            {categoryCounts.interior > 0 && (
                                <TabsContent value="interior" className="mt-0 p-6 overflow-y-auto flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {categorizedImages.filter(img => img.category === 'interior').map((image, index) => {
                                            const originalIndex = categorizedImages.findIndex(img => img.src === image.src && img.category === image.category);
                                            return (
                                                <div
                                                    key={index}
                                                    className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer bg-muted"
                                                    onClick={() => handleImageClick(originalIndex)}
                                                >
                                                    <img
                                                        src={image.src}
                                                        alt={image.alt}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        onError={() => handleImageError(originalIndex)}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-xs text-white">
                                                            Click to enlarge
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>
                            )}
                            {categoryCounts.amenities > 0 && (
                                <TabsContent value="amenities" className="mt-0 p-6 overflow-y-auto flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {categorizedImages.filter(img => img.category === 'amenities').map((image, index) => {
                                            const originalIndex = categorizedImages.findIndex(img => img.src === image.src && img.category === image.category);
                                            return (
                                                <div
                                                    key={index}
                                                    className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer bg-muted"
                                                    onClick={() => handleImageClick(originalIndex)}
                                                >
                                                    <img
                                                        src={image.src}
                                                        alt={image.alt}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        onError={() => handleImageError(originalIndex)}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-xs text-white">
                                                            Click to enlarge
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>
                            )}
                            {categoryCounts.floorplan > 0 && (
                                <TabsContent value="floorplan" className="mt-0 p-6 overflow-y-auto flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {categorizedImages.filter(img => img.category === 'floorplan').map((image, index) => {
                                            const originalIndex = categorizedImages.findIndex(img => img.src === image.src && img.category === image.category);
                                            return (
                                                <div
                                                    key={index}
                                                    className="group relative aspect-video overflow-hidden rounded-lg cursor-pointer bg-muted"
                                                    onClick={() => handleImageClick(originalIndex)}
                                                >
                                                    <img
                                                        src={image.src}
                                                        alt={image.alt}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        onError={() => handleImageError(originalIndex)}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                                                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1 text-xs text-white">
                                                            Click to enlarge
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </TabsContent>
                            )}
                            <TabsContent value="map" className="mt-0 flex-1 overflow-hidden p-0">
                                <div className="w-full h-full overflow-hidden">
                                    <Map
                                        latitude={property.map.latitude || undefined}
                                        longitude={property.map.longitude || undefined}
                                        address={property.address.location || `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim()}
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
                        backgroundColor: "rgba(0, 0, 0, 0.95)",
                        backdropFilter: "blur(8px)",
                    },
                }}
                on={{
                    view: ({ index }) => setLightboxIndex(index),
                }}
            />
        </>
    );
};

export default BannerGallery;