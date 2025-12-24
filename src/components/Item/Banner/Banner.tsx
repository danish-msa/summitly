import React, { useState } from 'react';
import { Calendar, CreditCard, Bed, Bath, Maximize2, Megaphone, Building2, ArrowUp, ArrowDown, Calendar as CalendarIcon, Layers, Home, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyListing } from '@/lib/types';
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing';
import ShareModal from './ShareModal';
import ScheduleTourModal from '../ItemBody/ScheduleTourModal';
import RatingsOverview from '../ItemBody/QualityScore';
import ProjectRatingDisplay from '../../PreConItem/PreConItemBody/ProjectRatingDisplay';
import Link from 'next/link';

interface BannerProps {
    property: PropertyListing;
    rawProperty?: SinglePropertyListingResponse | null;
    isPreCon?: boolean;
    isRent?: boolean;
}

// Helper function to generate slug for property type
const getPropertyTypeSlug = (propertyType: string): string => {
    const typeMap: Record<string, string> = {
        'Condos': 'condos',
        'Houses': 'houses',
        'Lofts': 'lofts',
        'Master-Planned Communities': 'master-planned-communities',
        'Multi Family': 'multi-family',
        'Offices': 'offices',
        'Condominium': 'condos',
        'Condo': 'condos',
    };
    return typeMap[propertyType] || propertyType.toLowerCase().replace(/\s+/g, '-');
};

// Helper function to generate slug for sub-property type
const getSubPropertyTypeSlug = (subPropertyType: string, propertyType: string): string => {
    const subTypeSlug = subPropertyType.toLowerCase().replace(/\s+/g, '-');
    const propertyTypeSlug = getPropertyTypeSlug(propertyType);
    
    // For Condos: high-rise-condos, mid-rise-condos, low-rise-condos
    if (propertyTypeSlug === 'condos') {
        return `${subTypeSlug}-condos`;
    }
    // For Houses: link-houses, townhouse-houses, semi-detached-houses, detached-houses
    if (propertyTypeSlug === 'houses') {
        return `${subTypeSlug}-houses`;
    }
    
    return `${subTypeSlug}-${propertyTypeSlug}`;
};

// Helper function to extract year from completion date
const extractYear = (dateString: string): string | null => {
    const yearMatch = dateString.match(/\d{4}/);
    return yearMatch ? yearMatch[0] : null;
};

// Helper function to slugify city name
const slugifyCity = (city: string): string => {
    return city.toLowerCase().replace(/\s+/g, '-');
};

// Helper function to convert status to slug
const getStatusSlug = (status: string): string => {
    const statusMap: Record<string, string> = {
        'now-selling': 'selling',
        'selling': 'selling',
        'coming-soon': 'coming-soon',
        'sold-out': 'sold-out',
        'platinum-access': 'platinum-access',
        'register-now': 'register-now',
        'assignments': 'assignments',
        'resale': 'resale',
        'new-release-coming-soon': 'coming-soon',
    };
    
    const normalizedStatus = status?.toLowerCase() || '';
    return statusMap[normalizedStatus] || normalizedStatus.replace(/\s+/g, '-');
};

const Banner: React.FC<BannerProps> = ({ property, rawProperty, isPreCon = false, isRent = false }) => {
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isScheduleTourModalOpen, setIsScheduleTourModalOpen] = useState(false);
    
    // For pre-con, use project name if available, otherwise use property type
    const preConData = property.preCon;
    
    // Format the full address according to Canadian standards
    // Build street address (Line 1)
    const streetParts = [];
    if (property.address.unitNumber) streetParts.push(property.address.unitNumber);
    if (property.address.streetNumber) streetParts.push(property.address.streetNumber);
    if (property.address.streetName) streetParts.push(property.address.streetName);
    if (property.address.streetSuffix) streetParts.push(property.address.streetSuffix);
    if (property.address.streetDirection) streetParts.push(property.address.streetDirection);
    const streetAddress = streetParts.length > 0 ? streetParts.join(' ') : '';
    
    // Build city line (Line 2) - Canadian format: "Area, City, Province Postal Code"
    // Include area if available (e.g., "Parry Sound, The Archipelago, ON P0G 1K0")
    const cityParts = [];
    if (property.address.area) cityParts.push(property.address.area);
    if (property.address.city) cityParts.push(property.address.city);
    if (property.address.state) cityParts.push(property.address.state);
    if (property.address.zip) cityParts.push(property.address.zip);
    const cityLine = cityParts.length > 0 ? cityParts.join(' ') : '';
    
    // Parse location if it contains newline (from formatLocation function)
    let addressLine1 = streetAddress;
    let addressLine2 = cityLine;
    
    if (property.address.location) {
      const locationParts = property.address.location.split('\n');
      if (locationParts.length === 2) {
        addressLine1 = locationParts[0];
        addressLine2 = locationParts[1];
      } else {
        // Fallback: use location as single line
        addressLine1 = property.address.location;
      }
    }
    
    // Fallback if we don't have parsed address
    if (!addressLine1 && !addressLine2) {
      addressLine1 = streetAddress || cityLine || 'Location not available';
    }
    
    // For single-line display (used in some places)
    const fullAddress = addressLine1 && addressLine2 
        ? `${addressLine1}, ${addressLine2}` 
        : addressLine1 || addressLine2 || 'Location not available';
    
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
        if (property.details.numBedrooms && property.details.numBedrooms > 0) {
            return `${property.details.numBedrooms} Bed${property.details.numBedrooms !== 1 ? 's' : ''}`;
        }
        return null;
    };

    const getBathrooms = () => {
        if (isPreCon && preConData?.details?.bathroomRange) {
            return preConData.details.bathroomRange;
        }
        if (property.details.numBathrooms && property.details.numBathrooms > 0) {
            return `${property.details.numBathrooms} Bath${property.details.numBathrooms !== 1 ? 's' : ''}`;
        }
        return null;
    };

    const getSquareFeet = () => {
        if (isPreCon && preConData?.details?.sqftRange) {
            return preConData.details.sqftRange;
        }
        const sqft = property.details.sqft;
        if (!sqft || sqft === 0) return null;
        return `${sqft.toLocaleString()} SqFt`;
    };

    // Calculate price change in dollars for estimated price
    const estimatedPrice = property.listPrice * 1.06;
    const priceChangeDollars = estimatedPrice - property.listPrice;
    const isPriceRising = priceChangeDollars > 0;

    // Get status color based on status value
    const getStatusColor = (status: string) => {
        const normalizedStatus = status?.toLowerCase() || '';
        
        // PreCon statuses
        if (normalizedStatus === 'selling' || normalizedStatus === 'active' || normalizedStatus === 'available') {
            return 'bg-green-600 text-white hover:bg-green-800';
        }
        if (normalizedStatus === 'coming-soon' || normalizedStatus === 'coming soon') {
            return 'bg-blue-600 text-white hover:bg-blue-800';
        }
        if (normalizedStatus === 'sold-out' || normalizedStatus === 'sold out' || normalizedStatus === 'sold') {
            return 'bg-red-600 text-white hover:bg-red-800';
        }
        if (normalizedStatus === 'pending') {
            return 'bg-yellow-500 text-white hover:bg-yellow-700';
        }
        if (normalizedStatus === 'rented' || normalizedStatus === 'inactive') {
            return 'bg-gray-500 text-white hover:bg-gray-700';
        }
        
        // Default color
        return 'bg-secondary text-white hover:bg-secondary/90';
    };

    // Get status text
    const statusText = isPreCon 
        ? (preConData?.status || property.status || 'Selling Now')
        : isRent
        ? (property.status || 'Available Now')
        : (property.status || 'Active');

    // Get days on market from property or rawProperty
    const daysOnMarket = property.daysOnMarket ?? rawProperty?.daysOnMarket ?? rawProperty?.simpleDaysOnMarket;

    return (
        <div className="">
            
            <div className="py-2">
                {/* Header Section */}
                <div>
                    {/* Two Column Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* First Column */}
                        <div className="flex flex-col gap-2 col-span-2">
                            {/* Heading with MLS and Status */}
                            <div className="flex flex-wrap items-center gap-3">
                                
                                <h1 className="text-2xl font-bold text-foreground sm:text-3xl lg:text-3xl">
                                    {isPreCon ? preConData?.projectName : shortAddress}
                                </h1>
                                {isPreCon ? (
                                    <Link href={`/pre-con/${getStatusSlug(statusText)}`}>
                                        <Badge className={`${getStatusColor(statusText)} uppercase py-1 px-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl`}>
                                            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-white"></span>
                                            {statusText}
                                        </Badge>
                                    </Link>
                                ) : (
                                    <Badge className={`${getStatusColor(statusText)} uppercase py-1 px-4`}>
                                        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-white"></span>
                                        {statusText}
                                    </Badge>
                                )}
                                
                            </div>
                            {isPreCon && preConData?.developer && (
                                <span className="text-base text-foreground font-medium">
                                    Developed by{' '}
                                    <Link 
                                        href={`/pre-con?developer=${encodeURIComponent(preConData.developer)}`}
                                        className="relative inline-block text-primary group"
                                    >
                                        <span className="relative z-10">{preConData.developer}</span>
                                        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                                    </Link>
                                </span>
                            )}  
                            
                            
                            <div className="flex flex-col gap-2 justify-start">
                                {/* Address */}
                                {isPreCon && property.address.city ? (
                                    <div className="flex items-start text-primary">
                                        <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 mr-1" />
                                        <span className="text-sm font-medium sm:text-lg max-w-xl">
                                            {property.address.streetNumber && property.address.streetName ? (
                                                <>
                                                    {property.address.streetNumber} {property.address.streetName}
                                                    {property.address.streetSuffix && ` ${property.address.streetSuffix}`},{' '}
                                                </>
                                            ) : null}
                                            <Link 
                                                href={`/pre-con/${slugifyCity(property.address.city)}`}
                                                className="relative inline-block group"
                                            >
                                                <span className="relative z-10 hover:text-primary/80 transition-colors duration-300">
                                                    {property.address.city}
                                                </span>
                                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                                            </Link>
                                            {property.address.state && `, ${property.address.state}`}
                                            {property.address.zip && ` ${property.address.zip}`}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-start text-primary">
                                        <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 mr-1" />
                                        <span className="text-sm font-medium sm:text-lg max-w-xl">
                                            {fullAddress}
                                        </span>
                                    </div>
                                )}
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
                                
                                {/* Property Stats with Icons */}
                                {isPreCon ? (
                                    <>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-4">
                                            {/* Sub-Property Type (e.g., High-Rise Condo) */}
                                            {(() => {
                                                // Get propertyType from details or preCon details (if available)
                                                const propertyType = property.details?.propertyType || 
                                                                     property.preCon?.details?.propertyType || 
                                                                     'Condominium';
                                                // Get subPropertyType from preCon details
                                                const subPropertyType = property.preCon?.details?.subPropertyType;
                                                
                                                // Check if propertyType is Condo/Condominium or House/Houses
                                                const isCondo = propertyType.toLowerCase().includes('condo');
                                                const isHouse = propertyType.toLowerCase().includes('house');
                                                
                                                // Only show if subPropertyType exists
                                                if (subPropertyType && (isCondo || isHouse)) {
                                                    const displayText = isCondo ? `${subPropertyType} Condo` : `${subPropertyType} House`;
                                                    const linkUrl = `/pre-con/${getSubPropertyTypeSlug(subPropertyType, propertyType)}`;
                                                    
                                                    return (
                                                        <div className="flex flex-row items-center gap-1 group">
                                                            <Building2 className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                                                            <Link 
                                                                href={linkUrl}
                                                                className="relative inline-block text-sm text-foreground font-medium"
                                                            >
                                                                <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
                                                                    {displayText}
                                                                </span>
                                                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                                                            </Link>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                            {/* Occupancy Date */}
                                            {preConData?.completion?.date && (() => {
                                                const year = extractYear(preConData.completion.date);
                                                const displayText = year ? `Occupancy: ${year}` : `Occupancy: ${preConData.completion.date}`;
                                                const linkUrl = year ? `/pre-con/${year}` : null;
                                                
                                                return (
                                                    <div className="flex flex-row items-center gap-1 group">
                                                        <CalendarIcon className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                                                        {linkUrl ? (
                                                            <Link 
                                                                href={linkUrl}
                                                                className="relative inline-block text-sm text-foreground font-medium"
                                                            >
                                                                <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
                                                                    {displayText}
                                                                </span>
                                                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                                                            </Link>
                                                        ) : (
                                                            <span className="text-sm text-foreground font-medium">
                                                                {displayText}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                            {/* Property Type (e.g., Condos) - Only show if no sub-property type exists for Condos/Houses */}
                                            {(() => {
                                                const propertyType = property.details?.propertyType || 
                                                                     property.preCon?.details?.propertyType || 
                                                                     'Condominium';
                                                const subPropertyType = property.preCon?.details?.subPropertyType;
                                                const isCondo = propertyType.toLowerCase().includes('condo');
                                                const isHouse = propertyType.toLowerCase().includes('house');
                                                
                                                // Only show property type if:
                                                // 1. It's not Condos or Houses, OR
                                                // 2. It's Condos/Houses but no sub-property type exists
                                                const shouldShowPropertyType = !(isCondo || isHouse) || !subPropertyType;
                                                
                                                if (!shouldShowPropertyType) {
                                                    return null;
                                                }
                                                
                                                const propertyTypeSlug = getPropertyTypeSlug(propertyType);
                                                
                                                return (
                                                    <div className="flex flex-row items-center gap-1 group">
                                                        <Building2 className="h-6 w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                                                        <Link 
                                                            href={`/pre-con/${propertyTypeSlug}`}
                                                            className="relative inline-block text-sm text-foreground font-medium"
                                                        >
                                                            <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">
                                                                Property Type: {propertyType}
                                                            </span>
                                                            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                                                        </Link>
                                                    </div>
                                                );
                                            })()}
                                            {/* Area */}
                                            {preConData?.details?.sqftRange && (
                                                <div className="flex flex-row items-center gap-1">
                                                    <Maximize2 className="h-6 w-6 text-primary" />
                                                    <span className="text-sm text-foreground font-medium">{preConData.details.sqftRange}</span>
                                                </div>
                                            )}
                                            {/* Storeys */}
                                            {preConData?.details?.storeys && preConData.details.storeys > 0 && (
                                                <div className="flex flex-row items-center gap-1">
                                                    <Layers className="h-6 w-6 text-primary" />
                                                    <span className="text-sm text-foreground font-medium">{preConData.details.storeys} Storeys</span>
                                                </div>
                                            )}
                                            {/* Suites - Available suites */}
                                            {preConData?.details?.availableUnits !== undefined && preConData.details.availableUnits !== null && preConData.details.availableUnits > 0 && (
                                                <div className="flex flex-row items-center gap-1">
                                                    <Home className="h-6 w-6 text-primary" />
                                                    <span className="text-sm text-foreground font-medium">{preConData.details.availableUnits} Suites</span>
                                                </div>
                                            )}
                                            {/* Units - Total units */}
                                            {preConData?.details?.totalUnits && preConData.details.totalUnits > 0 && (
                                                <div className="flex flex-row items-center gap-1">
                                                    <Users className="h-6 w-6 text-primary" />
                                                    <span className="text-sm text-foreground font-medium">{preConData.details.totalUnits} Units</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        
                                        </>
                                    ) : (
                                        <>
                                        <div className="flex items-center gap-4 sm:gap-6 mt-2 flex-wrap">
                                            {/* property type */}
                                            <div className="flex flex-row items-center gap-1">
                                                <Building2 className="h-6 w-6 text-primary" />
                                                <span className="text-sm text-foreground font-medium">{property.details.propertyType || 'Detached'}</span>
                                            </div>
                                            {/* Beds */}
                                            {getBedrooms() && (
                                                <div className="flex flex-row items-center gap-1">
                                                    <Bed className="h-6 w-6 text-primary" />
                                                    <span className="text-sm text-foreground font-medium">{getBedrooms()}</span>
                                                </div>
                                            )}

                                            {/* Baths */}
                                            {getBathrooms() && (
                                                <div className="flex flex-row items-center gap-1">
                                                    <Bath className="h-6 w-6 text-primary" />
                                                    <span className="text-sm text-foreground font-medium">{getBathrooms()}</span>
                                                </div>
                                            )}

                                            {/* Square Feet */}
                                            {getSquareFeet() && (
                                                <div className="flex flex-row items-center gap-1">
                                                    <Maximize2 className="h-6 w-6 text-primary" />
                                                    <span className="text-sm text-foreground font-medium">{getSquareFeet()}</span>
                                                </div>
                                            )}
                                        </div>
                                        </>
                                    )}
                                

                                {/* Ratings Overview for regular properties */}
                                {isPreCon ? "" : <RatingsOverview />}
                                
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
                                    <div className="text-xl font-bold text-foreground text-right sm:text-3xl">
                                        {isPreCon 
                                            ? (preConData?.priceRange && preConData.priceRange.min > 0
                                                ? `${formatPrice(preConData.priceRange.min)}`
                                                : (preConData?.startingPrice && preConData.startingPrice > 0
                                                    ? formatPrice(preConData.startingPrice)
                                                    : 'Coming Soon'))
                                            : isRent
                                            ? `${formatPrice(property.listPrice)}/month`
                                            : formatPrice(property.listPrice)}
                                    </div>
                                    {!isPreCon && !isRent && daysOnMarket !== undefined && daysOnMarket > 0 && (
                                        <span className="text-xs text-gray-500">
                                            {daysOnMarket} {daysOnMarket === 1 ? 'day' : 'days'} on market
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
                                {/* Project Rating Display for Pre-Con */}
                            <ProjectRatingDisplay propertyId={property.mlsNumber || preConData?.projectName || 'default'} />
                            
                                
                        </div>
                    </div>
                    
                    
                    {/* home estimate and CTA Row */}
                    {!isPreCon && !isRent && (
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
                    )}
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
                property={property}
            />
        </div>
    );
};

export default Banner;