import React, { useState } from 'react';
import { MapPin, Heart, Share2, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyListing } from '@/lib/types';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';
import ShareModal from './ShareModal';
import PropertyStats from '../ItemBody/PropertyStats';

interface BannerProps {
    property: PropertyListing;
    rawProperty?: SinglePropertyListingResponse | null;
    isPreCon?: boolean;
}

const Banner: React.FC<BannerProps> = ({ property, rawProperty, isPreCon = false }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    
    // For pre-con, use project name if available, otherwise use property type
    const preConData = property.preCon;
    const propertyTitle = isPreCon && preConData?.projectName 
        ? preConData.projectName 
        : `${property.details.propertyType} in ${property.address.city || 'Unknown Location'}`;
    
    // Format the full address
    const fullAddress = property.address.location || 
        `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim();

    // Format the price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    // Format the date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleGetPreQualified = () => {
        // Handle pre-qualification logic
        console.log('Get pre-qualified clicked');
        // You can add navigation to mortgage calculator or pre-qualification page
    };

    return (
        <div className="">
            
            <div className="py-8">
                {/* Header Section */}
                <div>
                    {/* Two Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* First Column */}
                        <div className="flex flex-col gap-4 col-span-2">
                            {/* Heading with MLS and Status */}
                            <div className="mb-2 flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
                                    {propertyTitle}
                                </h1>
                                {/* MLS Number or Project ID - Same line as heading */}
                                {!isPreCon && (
                                    <span className="text-base text-muted-foreground font-normal">
                                        MLS # <span className="text-gray-600">{property.mlsNumber}</span>
                                    </span>
                                )}
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 uppercase py-1 px-4">
                                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary"></span>
                                    {isPreCon ? (preConData?.status || property.status || 'Selling') : (property.status || 'Active')}
                                </Badge>
                            </div>

                            {/* Property Type and Address */}
                            <div>
                                {/* Developer for pre-con, Property Type for regular */}
                                {isPreCon && preConData?.developer ? (
                                    <div className="mb-2">
                                        <span className="text-base font-medium text-gray-700">
                                            Developer: {preConData.developer}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="mb-2">
                                        <span className="text-base font-medium text-gray-700">
                                            {property.details.propertyType}
                                        </span>
                                    </div>
                                )}
                                {/* Address */}
                                <div className="flex items-start gap-2 text-primary mb-4">
                                    <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                    <span className="text-sm font-medium sm:text-base">{fullAddress}</span>
                                </div>
                                
                                {/* Get Pre-Qualified Button */}
                                <Button 
                                    onClick={handleGetPreQualified}
                                    variant="outline"
                                    className="w-full sm:w-auto border-brand-celestial/30 text-brand-celestial hover:bg-brand-celestial/10 hover:border-brand-celestial font-medium py-2.5 px-4 rounded-lg transition-colors"
                                >
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Get Pre-Qualified
                                </Button>
                            </div>
                        </div>

                        {/* Second Column */}
                        <div className="flex flex-col gap-4 justify-end items-end">
                            {/* Price and Status */}
                            <div className="flex flex-col justify-end items-end gap-2">
                                <div className="mb-2">
                                    <div className="text-3xl font-bold text-primary text-right">
                                        {isPreCon && preConData?.startingPrice 
                                            ? `Starting from ${formatPrice(preConData.startingPrice)}`
                                            : formatPrice(property.listPrice)}
                                    </div>
                                    {isPreCon && preConData?.completion?.date ? (
                                        <div className="flex justify-end items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="h-4 w-4" />
                                            <span>Completion: {preConData.completion.date}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="h-4 w-4" />
                                            <span>Listed on {formatDate(property.listDate)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Estimated Value Section - Only for regular properties */}
                                {!isPreCon && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-green-600 font-semibold">
                                            {formatPrice(property.listPrice * 1.06)}
                                        </span>
                                        <span>Estimated value as of Oct 2025</span>
                                    </div>
                                )}
                            </div>

                            {/* Share and Save Buttons */}
                            <div className="flex gap-2">
                                <Button 
                                    variant="default" 
                                    size="default" 
                                    className="gap-2"
                                    onClick={() => setIsShareModalOpen(true)}
                                >
                                    <Share2 className="h-4 w-4" />
                                    Share
                                </Button>
                                <Button variant="outline" size="default" className="gap-2">
                                    <Heart className="h-4 w-4" />
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Property Stats Grid */}
                    <PropertyStats property={property} rawProperty={rawProperty} isPreCon={isPreCon} />
                </div>
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