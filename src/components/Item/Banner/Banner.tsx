import React, { useState } from 'react';
import { Calendar, CreditCard, Bed, Bath, Maximize2, Megaphone, Building2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyListing } from '@/lib/types';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';
import ShareModal from './ShareModal';
import ScheduleTourModal from '../ItemBody/ScheduleTourModal';
import RatingsOverview from '../ItemBody/QualityScore';

interface BannerProps {
    property: PropertyListing;
    rawProperty?: SinglePropertyListingResponse | null;
    isPreCon?: boolean;
    isRent?: boolean;
}

const Banner: React.FC<BannerProps> = ({ property, isPreCon = false, isRent = false }) => {
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

    // Format price change in simplified format (e.g., $105K instead of $105,150)
    const formatPriceChange = (dollars: number) => {
        const thousands = Math.abs(dollars) / 1000;
        // Round to 1 decimal place if needed, but show as integer if it's a whole number
        const rounded = Math.round(thousands * 10) / 10;
        const formatted = rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
        return `$${formatted}K`;
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

    // Calculate price change in dollars for estimated price
    const estimatedPrice = property.listPrice * 1.06;
    const priceChangeDollars = estimatedPrice - property.listPrice;
    const isPriceRising = priceChangeDollars > 0;

    return (
        <div className="">
            
            <div className="py-2">
                {/* Header Section */}
                <div>
                    {/* Two Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* First Column */}
                        <div className="flex flex-col gap-2 col-span-2 items-start">
                            {/* Heading with MLS and Status */}
                            <div className="flex flex-wrap items-center gap-3">
                                
                                <h1 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-3xl">
                                    {shortAddress}
                                </h1>
                                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 uppercase py-1 px-4">
                                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-primary"></span>
                                    {isPreCon 
                                        ? (preConData?.status || property.status || 'Selling')
                                        : isRent
                                        ? (property.status || 'Available')
                                        : (property.status || 'Active')}
                                </Badge>
                            </div>
                            <div className="flex flex-col gap-2 justify-start">
                                {/* Address */}
                                <div className="flex items-start text-primary">
                                    {/* <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0" /> */}
                                    <span className="text-sm font-medium sm:text-lg max-w-xl">{fullAddress}</span>
                                </div>
                                {/* MLS Number or Project ID - Same line as heading */}
                                {!isPreCon && !isRent && (
                                    <span className="text-base text-muted-foreground font-normal">
                                        MLS # <span className="text-gray-600">{property.mlsNumber}</span>
                                    </span>
                                )}
                                {isRent && (
                                    <span className="text-base text-muted-foreground font-normal">
                                        Listing ID: <span className="text-gray-600">{property.mlsNumber}</span>
                                    </span>
                                )}
                                
                                {/* Property Stats with Icons - Above Price */}
                                <div className="flex items-center gap-4 sm:gap-6 mt-2">
                                    {/* property type */}
                                    <div className="flex flex-row items-center gap-1">
                                        <Building2 className="h-6 w-6 text-primary" />
                                        <span className="text-sm text-foreground font-medium">Detached</span>
                                    </div>
                                    {/* Beds */}
                                    <div className="flex flex-row items-center gap-1">
                                        <Bed className="h-6 w-6 text-primary" />
                                        <span className="text-sm text-foreground font-medium">{getBedrooms()}</span>
                                    </div>

                                    {/* Baths */}
                                    <div className="flex flex-row items-center gap-1">
                                        <Bath className="h-6 w-6 text-primary" />
                                        <span className="text-sm text-foreground font-medium">{getBathrooms()}</span>
                                    </div>

                                    {/* Square Feet */}
                                    <div className="flex flex-row items-center gap-1">
                                        <Maximize2 className="h-6 w-6 text-primary" />
                                        <span className="text-sm text-foreground font-medium">{getSquareFeet()}</span>
                                    </div>
                                </div>
                                <RatingsOverview />
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
                        <div className="flex flex-col gap-4 justify-start items-end">
                            {/* Two Price Blocks Side by Side */}
                            
                                {/* Listed Price Block */}
                                <div className="flex flex-col gap-1 items-end  rounded-lg bg-white p-4">
                                    <span className="text-xs text-gray-600 font-medium uppercase">
                                        {isRent ? 'Monthly Rent' : isPreCon ? 'Starting Price' : 'Listed Price'}
                                    </span>
                                    <div className="text-xl font-bold text-foreground sm:text-3xl">
                                        {isPreCon && preConData?.startingPrice 
                                            ? `Starting from ${formatPrice(preConData.startingPrice)}`
                                            : isRent
                                            ? `${formatPrice(property.listPrice)}/month`
                                            : formatPrice(property.listPrice)}
                                    </div>
                                    {!isPreCon && !isRent && (
                                        <span className="text-xs text-gray-500">
                                            21 days on market
                                        </span>
                                    )}
                                    {isRent && (
                                        <span className="text-xs text-gray-500">
                                            Available now
                                        </span>
                                    )}
                                </div>

                                {/* Estimated Price Block - Only for buy properties */}
                                {!isPreCon && !isRent && (
                                    <div className="flex flex-col gap-1 items-end bg-gradient-to-r from-green-100 to-brand-cb-blue/30 rounded-lg p-4">
                                        <span className="text-xs text-gray-600 font-medium uppercase">Estimated Price</span>
                                        <div className="text-lg font-bold text-green-700 sm:text-xl">
                                            {formatPrice(estimatedPrice)}
                                        </div>
                                        <div className="flex items-center flex-row gap-1 mb-2">
                                            {isPriceRising ? (
                                                <>
                                                    <ArrowUp className="h-3 w-3 text-green-600" />
                                                    <span className="text-xs text-green-600 font-medium">
                                                        +{formatPriceChange(priceChangeDollars)}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <ArrowDown className="h-3 w-3 text-red-600" />
                                                    <span className="text-xs text-red-600 font-medium">
                                                        {formatPriceChange(priceChangeDollars)}
                                                    </span>
                                                </>
                                            )}
                                            <span className="text-xs text-gray-500">as of Oct 2025</span>
                                        </div>
                                        
                                    </div>
                                    
                                )}
                                        {/* Get Pre-Qualified Button - Only for buy properties */}
                                        {!isRent && (
                                        <Button 
                                            onClick={handleGetPreQualified}
                                            variant="outline"
                                            className="w-full sm:w-auto font-medium py-2.5 bg-green-600 text-white px-4 rounded-lg transition-colors"
                                        >
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Get Pre-Qualified
                                        </Button>
                                        )}
                            
                        </div>
                    </div>
                    
                    
                    {/* home estimate and CTA Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {/* Announcement Message */}
                        <div className="flex flex-col gap-4 p-3 bg-white rounded-lg">
                            <div className="flex gap-2 flex-1">
                                <Megaphone className="h-6 w-6 text-red-600 flex-shrink-0" />
                                <span className="text-lg text-red-900 font-medium flex-1">
                                    Prices are changing. Get a free home estimate
                                </span>
                            </div>
                            
                            <Button variant="default" className="w-full sm:w-auto rounded-lg bg-red-600 text-white">
                                Find Home Estimate
                            </Button>
                        </div>

                        {/* CTA Block */}
                        <div className="flex flex-col gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                                <span className="text-base font-semibold text-gray-900">
                                    We estimate this home will sell faster than 85% nearby.
                                </span>
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
                mlsNumber={property.mlsNumber}
                propertyAddress={fullAddress}
            />
        </div>
    );
};

export default Banner;