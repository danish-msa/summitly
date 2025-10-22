import React, { useState } from 'react';
import { MapPin, Users, Layers, Eye, Heart, Share2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyListing } from '@/lib/types';

interface BannerProps {
    property: PropertyListing;
}

const Banner: React.FC<BannerProps> = ({ property }) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    
    // Create property title from property details
    const propertyTitle = `${property.details.propertyType} in ${property.address.city || 'Unknown Location'}`;
    
    // Format the full address
    const fullAddress = property.address.location || 
        `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim();

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

    // Modal functions
    const openPhotoModal = () => {
        setModalImageIndex(selectedImageIndex);
        setIsPhotoModalOpen(true);
    };

    const closePhotoModal = () => {
        setIsPhotoModalOpen(false);
    };

    const nextImage = () => {
        setModalImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setModalImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // Get all available images
    const allImages = property.images.allImages || [property.images.imageUrl];
    const images = allImages.map((url, index) => ({
        id: index.toString(),
        url: getImageSrc(index),
        alt: `${property.details.propertyType} - Image ${index + 1}`
    }));

    return (
        <div className=" bg-white rounded-xl">
            <div className="px-4 py-8 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
                                    {propertyTitle}
                                </h1>
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary"></span>
                                    {property.status || 'Active'}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Share2 className="h-4 w-4" />
                                Share
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Heart className="h-4 w-4" />
                                Save
                            </Button>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground sm:gap-6">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{property.details.numBedrooms} Bedrooms</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            <span>{property.details.numBathrooms} Bathrooms</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span>Views</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4" />
                            <span>Favorites</span>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 text-primary">
                        <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium sm:text-base">{fullAddress}</span>
                    </div>
                </div>

                {/* Image Gallery */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[100px_1fr]">
                    {/* Thumbnails - Hidden on mobile, visible on larger screens */}
                    <div className="hidden lg:block">
                        <div className="flex flex-col gap-4">
                            {images.map((image, index) => (
                                <button
                                    key={image.id}
                                    onClick={() => setSelectedImageIndex(index)}
                                    className={`group relative aspect-[4/3] overflow-hidden rounded-lg transition-all ${
                                        selectedImageIndex === index
                                            ? "ring-2 ring-primary ring-offset-2"
                                            : "ring-1 ring-border hover:ring-2 hover:ring-primary/50"
                                    }`}
                                >
                                    <img
                                        src={image.url}
                                        alt={image.alt}
                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                        onError={() => handleImageError(index)}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Image */}
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                        <img
                            src={images[selectedImageIndex]?.url || images[0]?.url}
                            alt={images[selectedImageIndex]?.alt || images[0]?.alt}
                            className="h-full w-full object-cover"
                            onError={() => handleImageError(selectedImageIndex)}
                        />
                        <div className="absolute bottom-4 right-4">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="gap-2 bg-white/90 backdrop-blur-sm hover:bg-white"
                                onClick={openPhotoModal}
                            >
                                <Layers className="h-4 w-4" />
                                Show all photos
                            </Button>
                        </div>
            </div>
            
                    {/* Mobile Thumbnails - Show below main image on mobile */}
                    <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
                        {images.map((image, index) => (
                            <button
                                key={image.id}
                                onClick={() => setSelectedImageIndex(index)}
                                className={`relative aspect-[4/3] w-24 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                                    selectedImageIndex === index
                                        ? "ring-2 ring-primary ring-offset-2"
                                        : "ring-1 ring-border"
                                }`}
                            >
                                <img 
                                    src={image.url} 
                                    alt={image.alt} 
                                    className="h-full w-full object-cover"
                                    onError={() => handleImageError(index)}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Photo Modal */}
            {isPhotoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
                    <div className="relative h-full w-full max-w-7xl p-4">
                        {/* Close Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-4 top-4 z-10 bg-black/50 text-white hover:bg-black/70"
                            onClick={closePhotoModal}
                        >
                            <X className="h-6 w-6" />
                        </Button>

                        {/* Navigation Buttons */}
                        {images.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute left-4 top-1/2 z-10 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                                    onClick={prevImage}
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-4 top-1/2 z-10 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                                    onClick={nextImage}
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </Button>
                            </>
                        )}

                        {/* Main Image */}
                        <div className="flex h-full items-center justify-center">
                            <img
                                src={images[modalImageIndex]?.url}
                                alt={images[modalImageIndex]?.alt}
                                className="max-h-full max-w-full object-contain"
                                onError={() => handleImageError(modalImageIndex)}
                            />
                        </div>

                        {/* Image Counter */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-white backdrop-blur-sm">
                            {modalImageIndex + 1} of {images.length}
                        </div>

                        {/* Thumbnail Strip */}
                        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-full">
                            {images.map((image, index) => (
                                <button
                                    key={image.id}
                                    onClick={() => setModalImageIndex(index)}
                                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg transition-all ${
                                        modalImageIndex === index
                                            ? "ring-2 ring-white"
                                            : "opacity-70 hover:opacity-100"
                                    }`}
                                >
                                    <img
                                        src={image.url}
                                        alt={image.alt}
                                        className="h-full w-full object-cover"
                                        onError={() => handleImageError(index)}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Banner;