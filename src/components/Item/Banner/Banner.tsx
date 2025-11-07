import React, { useState } from 'react';
import { MapPin, Calendar, CreditCard, Bed, Bath, Maximize2, Megaphone, Building2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PropertyListing } from '@/lib/types';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';
import ShareModal from './ShareModal';
import ScheduleTourModal from '../ItemBody/ScheduleTourModal';

interface BannerProps {
    property: PropertyListing;
    rawProperty?: SinglePropertyListingResponse | null;
    isPreCon?: boolean;
}

const Banner: React.FC<BannerProps> = ({ property, isPreCon = false }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isScheduleTourModalOpen, setIsScheduleTourModalOpen] = useState(false);
    
    // For pre-con, use project name if available, otherwise use property type
    const preConData = property.preCon;
    
    // Format the full address
    const fullAddress = property.address.location || 
        `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim();
    
    // Format the short address (city, state)
    const shortAddress = property.address.city 
        ? `${property.address.city}${property.address.state ? `, ${property.address.state}` : ''}`
        : 'Unknown Location';

    // Format the price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handleGetPreQualified = () => {
        // Handle pre-qualification logic
        console.log('Get pre-qualified clicked');
        // You can add navigation to mortgage calculator or pre-qualification page
    };

    const handleScheduleTour = () => {
        setIsScheduleTourModalOpen(true);
    };

    // Get property stats
    const getBedrooms = () => {
        if (isPreCon && preConData?.details?.bedroomRange) {
            return preConData.details.bedroomRange;
        }
        return `${property.details.numBedrooms || 0} Bed${property.details.numBedrooms !== 1 ? 's' : ''}`;
    };

    const getBathrooms = () => {
        if (isPreCon && preConData?.details?.bathroomRange) {
            return preConData.details.bathroomRange;
        }
        return `${property.details.numBathrooms || 0} Bath${property.details.numBathrooms !== 1 ? 's' : ''}`;
    };

    const getSquareFeet = () => {
        if (isPreCon && preConData?.details?.sqftRange) {
            return preConData.details.sqftRange;
        }
        const sqft = property.details.sqft;
        if (!sqft) return 'N/A';
        return `${sqft.toLocaleString()} SqFt`;
    };

    return (
        <div className="">
            
            <div className="py-2">
                {/* Header Section */}
                <div>
                    {/* Two Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* First Column */}
                        <div className="flex flex-col gap-4 col-span-2">
                            {/* Heading with MLS and Status */}
                            <div className="flex flex-wrap items-center gap-3">
                                
                                <h1 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
                                    {shortAddress}
                                </h1>
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 uppercase py-1 px-4">
                                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary"></span>
                                    {isPreCon ? (preConData?.status || property.status || 'Selling') : (property.status || 'Active')}
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-2">
                                
                                {/* MLS Number or Project ID - Same line as heading */}
                                {/* {!isPreCon && (
                                    <span className="text-base text-muted-foreground font-normal">
                                        MLS # <span className="text-gray-600">{property.mlsNumber}</span>
                                    </span>
                                )} */}
                                {/* Address */}
                                <div className="flex items-start gap-2 text-primary mb-4">
                                    <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                    <span className="text-sm font-medium sm:text-lg">{fullAddress}</span>
                                </div>
                                {/* Property Stats with Icons - Above Price */}
                                <div className="flex items-center gap-4 sm:gap-6 mb-2">
                                    {/* property type */}
                                    <div className="flex flex-col items-center gap-1">
                                        <Building2 className="h-6 w-6 text-primary" />
                                        <span className="text-sm text-foreground font-medium">Detached</span>
                                    </div>
                                    {/* Beds */}
                                    <div className="flex flex-col items-center gap-1">
                                        <Bed className="h-6 w-6 text-primary" />
                                        <span className="text-sm text-foreground font-medium">{getBedrooms()}</span>
                                    </div>

                                    {/* Baths */}
                                    <div className="flex flex-col items-center gap-1">
                                        <Bath className="h-6 w-6 text-primary" />
                                        <span className="text-sm text-foreground font-medium">{getBathrooms()}</span>
                                    </div>

                                    {/* Square Feet */}
                                    <div className="flex flex-col items-center gap-1">
                                        <Maximize2 className="h-6 w-6 text-primary" />
                                        <span className="text-sm text-foreground font-medium">{getSquareFeet()}</span>
                                    </div>
                                </div>

                                {/* Developer for pre-con, Property Type for regular */}
                                {/* {isPreCon && preConData?.developer ? (
                                    <div className="mb-2">
                                        <span className="text-base font-medium text-primary">
                                            Developer: {preConData.developer}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="mb-2 inline-block">
                                        <span className="text-base font-medium text-primary">
                                            Property Type: {property.details.propertyType}
                                        </span>
                                    </div>
                                )} */}
                            </div>
                            
                            {/* Property Type and Address */}
                            <div>
                                

                                
                                
                            </div>
                        </div>

                        {/* Second Column */}
                        <div className="flex flex-col gap-2 justify-start items-end">
                        <h1 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
                                {isPreCon && preConData?.startingPrice 
                                    ? `Starting from ${formatPrice(preConData.startingPrice)}`
                                    : formatPrice(property.listPrice)}
                                </h1>
                                {/* Estimated Value Section - Only for regular properties */}
                                {!isPreCon && (
                                    <div className="text-sm text-gray-600 flex flex-col items-end gap-1">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-green-600 font-semibold">
                                                {formatPrice(property.listPrice * 1.06)}
                                            </span>
                                        </span>
                                        
                                        <span>Estimated value as of Oct 2025</span>
                                    </div>
                                )}

                            {/* Get Pre-Qualified Button */}
                            <Button 
                                onClick={handleGetPreQualified}
                                variant="outline"
                                className="w-full sm:w-auto font-medium py-2.5 bg-green-600 text-white px-4 rounded-lg transition-colors"
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Get Pre-Qualified
                            </Button>
                        </div>
                    </div>
                    {/* Announcement Message */}
                    <div className="flex items-center gap-4 mb-4 p-3 bg-white rounded-lg">
                        <Megaphone className="h-6 w-6 text-red-600 flex-shrink-0" />
                        <span className="text-lg text-red-900 font-medium flex-1">
                            Prices are changing. Get a free home estimate
                        </span>
                        <Button variant="default" className="rounded-lg bg-red-600 text-white">
                            Find Home Estimate
                        </Button>
                    </div>
                    
                    {/* Open House and CTA Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Open House Section - Hardcoded for UI purposes */}
                        <div className="flex items-center justify-start gap-4 p-4 bg-gradient-to-r from-brand-celestial/10 to-brand-cb-blue/10 rounded-lg">
                            {/* <Home className="h-6 w-6 text-blue-600 flex-shrink-0" /> */}
                            <div className="">
                                <div className="text-lg font-semibold text-blue-900 mb-1">
                                    There is an Open House!
                                </div>
                                <div className="text-base text-blue-800">
                                    Come visit this property on Saturday, November 08, 12:00 PM to 02:00 PM.
                                </div>
                            </div>
                        </div>

                        {/* CTA Block */}
                        <div className="flex flex-col gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                                <span className="text-base font-semibold text-gray-900">
                                    We estimate this home will sell faster than 85% nearby.
                                </span>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button type="button" className="flex-shrink-0">
                                            <Info className="h-4 w-4 text-gray-600 hover:text-gray-800 cursor-help" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-4 text-sm text-gray-700 leading-relaxed">
                                        We use data from nearby home sales, property details and engagement to estimate how fast a home will sell. The property features and home sales data comes from BNYMLS.
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <Button 
                                onClick={handleScheduleTour}
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule Tour
                            </Button>
                        </div>
                    </div>
                    {/* Property Stats Grid */}
                    {/* <PropertyStats property={property} rawProperty={rawProperty} isPreCon={isPreCon} /> */}
                </div>
            </div>
            
            {/* Share Modal */}
            <ShareModal 
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                property={property}
            />

            {/* Schedule Tour Modal */}
            <ScheduleTourModal 
                open={isScheduleTourModalOpen} 
                onOpenChange={setIsScheduleTourModalOpen} 
            />
        </div>
    );
};

export default Banner;