import React, { useState } from 'react';
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyListing } from '@/lib/types';
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import "yet-another-react-lightbox/styles.css";

interface BannerGalleryProps {
    property: PropertyListing;
}

// Image categories for filtering
type ImageCategory = 'all' | 'interior' | 'exterior' | 'amenities' | 'floorplan';

interface CategorizedImage {
    src: string;
    alt: string;
    category: ImageCategory;
    width: number;
    height: number;
}

const BannerGallery: React.FC<BannerGalleryProps> = ({ property }) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [activeCategory, setActiveCategory] = useState<ImageCategory>('all');
    
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

    // Categorize images (you can customize this logic based on your data)
    const allImages = property.images.allImages || [property.images.imageUrl];
    const categorizedImages: CategorizedImage[] = allImages.map((url, index) => {
        // Simple categorization logic - customize based on your needs
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

    const handleModalOpen = () => {
        setIsModalOpen(true);
    };

    return (
        <>
            {/* Image Gallery Grid */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[120px_1fr]">
                {/* Thumbnails - Hidden on mobile, visible on larger screens */}
                <div className="hidden lg:block">
                    <div className="flex flex-col gap-3">
                        {categorizedImages.slice(0, 4).map((image, index) => (
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
                    onClick={handleModalOpen}
                >
                    <img
                        src={categorizedImages[selectedImageIndex]?.src || categorizedImages[0]?.src}
                        alt={categorizedImages[selectedImageIndex]?.alt || categorizedImages[0]?.alt}
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
                            onClick={(e) => {
                                e.stopPropagation();
                                handleModalOpen();
                            }}
                        >
                            <Layers className="h-4 w-4" />
                            <span className="hidden sm:inline">Show all</span> {categorizedImages.length} photos
                        </Button>
                    </div>

                    {/* Image Counter */}
                    <div className="absolute top-4 left-4 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1 text-sm text-white">
                        {selectedImageIndex + 1} / {categorizedImages.length}
                    </div>
                </div>
                
                {/* Mobile Thumbnails */}
                <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden scrollbar-hide">
                    {categorizedImages.map((image, index) => (
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

            {/* Full-Screen Gallery Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-full max-w-none h-full p-0 gap-0">
                    <DialogHeader className="px-6 py-4 border-b">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-2xl font-semibold">
                                Property Gallery
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto">
                        <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setActiveCategory(value as ImageCategory)}>
                            <div className="sticky top-0 bg-background z-10 px-6 pt-4 pb-2 border-b">
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
                                </TabsList>
                            </div>

                            <TabsContent value={activeCategory} className="mt-0 p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredImages.map((image, index) => (
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