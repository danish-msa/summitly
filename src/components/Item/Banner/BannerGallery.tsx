import React, { useState } from 'react';
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PropertyListing } from '@/lib/types';
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

interface BannerGalleryProps {
    property: PropertyListing;
}

const BannerGallery: React.FC<BannerGalleryProps> = ({ property }) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
    const [isOpen, setIsOpen] = useState(false);
    
    // Get all images with fallback
    const getImageSrc = (index: number) => {
        if (imageErrors[index]) {
            return `/images/p${(index % 5) + 1}.jpg`;
        }
        
        if (property.images.allImages && property.images.allImages.length > index) {
            return property.images.allImages[index];
        }
        
        return `/images/p${(index % 5) + 1}.jpg`;
    };

    // Handle image error for a specific index
    const handleImageError = (index: number) => {
        setImageErrors(prev => ({
            ...prev,
            [index]: true
        }));
    };

    // Get all available images
    const allImages = property.images.allImages || [property.images.imageUrl];
    const images = allImages.map((url, index) => ({
        src: getImageSrc(index),
        alt: `${property.details.propertyType} - Image ${index + 1}`,
        width: 1920,
        height: 1080,
    }));

    return (
        <>
            {/* Image Gallery Grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[120px_1fr]">
                {/* Thumbnails - Hidden on mobile, visible on larger screens */}
                <div className="hidden lg:block">
                    <div className="flex flex-col gap-3">
                        {images.slice(0, 4).map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedImageIndex(index)}
                                className={`group relative aspect-[4/3] overflow-hidden rounded-lg transition-all duration-300 ${
                                    selectedImageIndex === index
                                        ? "ring-2 ring-primary ring-offset-2 scale-105"
                                        : "ring-1 ring-border hover:ring-2 hover:ring-primary/50 hover:scale-105"
                                }`}
                            >
                                <img
                                    src={image.src}
                                    alt={image.alt}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    onError={() => handleImageError(index)}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Image */}
                <div 
                    className="relative aspect-video overflow-hidden rounded-xl bg-muted shadow-lg cursor-pointer group"
                    onClick={() => setIsOpen(true)}
                >
                    <img
                        src={images[selectedImageIndex]?.src || images[0]?.src}
                        alt={images[selectedImageIndex]?.alt || images[0]?.alt}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => handleImageError(selectedImageIndex)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* View All Photos Button */}
                    <div className="absolute bottom-4 right-4 transform transition-all duration-300 group-hover:scale-105">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="gap-2 bg-white/95 backdrop-blur-md hover:bg-white shadow-lg"
                        >
                            <Layers className="h-4 w-4" />
                            <span className="hidden sm:inline">Show all</span> {images.length} photos
                        </Button>
                    </div>

                    {/* Image Counter */}
                    <div className="absolute top-4 left-4 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-sm text-white">
                        {selectedImageIndex + 1} / {images.length}
                    </div>
                </div>
                
                {/* Mobile Thumbnails - Show below main image on mobile */}
                <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden scrollbar-hide">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`relative aspect-[4/3] w-20 sm:w-24 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-300 ${
                                selectedImageIndex === index
                                    ? "ring-2 ring-primary ring-offset-2 scale-105"
                                    : "ring-1 ring-border opacity-70 hover:opacity-100"
                            }`}
                        >
                            <img 
                                src={image.src} 
                                alt={image.alt} 
                                className="h-full w-full object-cover"
                                onError={() => handleImageError(index)}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Modern Lightbox with Thumbnails, Zoom, and Fullscreen */}
            <Lightbox
                open={isOpen}
                close={() => setIsOpen(false)}
                index={selectedImageIndex}
                slides={images}
                plugins={[Thumbnails, Zoom, Fullscreen]}
                thumbnails={{
                    position: "bottom",
                    width: 120,
                    height: 80,
                    border: 2,
                    borderRadius: 8,
                    padding: 0,
                    gap: 12,
                }}
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
                    view: ({ index }) => setSelectedImageIndex(index),
                }}
            />
        </>
    );
};

export default BannerGallery;