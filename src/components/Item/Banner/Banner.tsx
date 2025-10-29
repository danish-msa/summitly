import React, { useState } from 'react';
import { MapPin, Users, Layers, Eye, Heart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyListing } from '@/lib/types';
import BannerGallery from './BannerGallery';
import ShareModal from './ShareModal';

interface BannerProps {
    property: PropertyListing;
}

const Banner: React.FC<BannerProps> = ({ property }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    
    // Create property title from property details
    const propertyTitle = `${property.details.propertyType} in ${property.address.city || 'Unknown Location'}`;
    
    // Format the full address
    const fullAddress = property.address.location || 
        `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim();

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
                            <Button 
                                variant="default" 
                                size="sm" 
                                className="gap-2"
                                onClick={() => setIsShareModalOpen(true)}
                            >
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
                <BannerGallery property={property} />
            </div>

            {/* Share Modal */}
            <ShareModal 
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                property={property}
            />
        </div>
    );
};

export default Banner;