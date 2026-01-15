"use client"

import React, { useState } from 'react'
import { PropertyListing } from '@/lib/types'
import { Home, Bed, Bath, Maximize2, Heart, Share2, FileText, XCircle, Bell, Calculator, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useSavedProperties } from '@/hooks/useSavedProperties'
import { toast } from '@/hooks/use-toast'
import ShareModal from '../Banner/ShareModal'
import AuthModal from '@/components/Auth/AuthModal'
import ProjectRatingDisplay from '@/components/PreConItem/PreConItemBody/ProjectRatingDisplay'
import PropertyAlerts from '../ItemBody/PropertyAlerts'
import { formatCurrency } from '@/lib/utils'
import { getPropertyTypeUrl, getNeighborhoodUrl } from '@/lib/utils/comparisonTableUrls'

interface PropertyHeaderProps {
  property: PropertyListing;
  onCalculatorClick?: () => void;
}

const PropertyHeader: React.FC<PropertyHeaderProps> = ({ property, onCalculatorClick }) => {
  const { data: session } = useSession()
  const { checkIsSaved, saveProperty, unsaveProperty, isSaving, isUnsaving } = useSavedProperties()
  const isSaved = checkIsSaved(property.mlsNumber)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isPropertyAlertsModalOpen, setIsPropertyAlertsModalOpen] = useState(false)

  // For pre-con, use project name if available
  const preConData = property.preCon;

  // Format address
  const address = property.address?.location || 
    `${property.address?.streetNumber || ''} ${property.address?.streetName || ''} ${property.address?.streetSuffix || ''}, ${property.address?.city || ''}, ${property.address?.state || ''} ${property.address?.zip || ''}`.trim()

  // Format square footage
  const formatSqft = (sqft: number | string | null | undefined) => {
    if (!sqft) return 'N/A';
    const num = typeof sqft === 'string' ? parseInt(sqft) : sqft;
    if (isNaN(num)) return 'N/A';
    
    // Format as range if needed (e.g., 1600-1799)
    if (num >= 1600 && num < 1800) return '1600-1799 SqFt';
    if (num >= 1400 && num < 1600) return '1400-1599 SqFt';
    if (num >= 1200 && num < 1400) return '1200-1399 SqFt';
    return `${num} SqFt`;
  };

  const sqftDisplay = formatSqft(property.details?.sqft);

  // Determine property status based on Repliers data
  const getPropertyStatus = () => {
    // Check if property is sold
    const isSold = 
      (property.soldPrice && property.soldPrice.trim() !== '') ||
      (property.soldDate && property.soldDate.trim() !== '') ||
      property.lastStatus?.toLowerCase() === 'sld' ||
      property.status?.toLowerCase().includes('sold') ||
      property.status?.toLowerCase().includes('closed');
    
    if (isSold) {
      return {
        label: 'Sold',
        variant: 'sold' as const,
      };
    }
    
    // Check for other statuses
    const statusLower = property.status?.toLowerCase() || '';
    const lastStatusLower = property.lastStatus?.toLowerCase() || '';
    
    // Active statuses
    if (
      statusLower.includes('active') ||
      lastStatusLower === 'new' ||
      lastStatusLower === 'sc' ||
      lastStatusLower === 'pc' ||
      lastStatusLower === 'hold'
    ) {
      return {
        label: 'Active',
        variant: 'active' as const,
      };
    }
    
    // Pending/Under Contract
    if (
      statusLower.includes('pending') ||
      statusLower.includes('contract') ||
      lastStatusLower === 'pc' ||
      lastStatusLower === 'sc'
    ) {
      return {
        label: 'Pending',
        variant: 'secondary' as const,
      };
    }
    
    // Default to Active
    return {
      label: 'Active',
      variant: 'active' as const,
    };
  };

  const propertyStatus = getPropertyStatus();

  const handleContactClick = () => {
    const contactElement = document.getElementById('contact-section');
    if (contactElement) {
      const elementPosition = contactElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - 100; // Offset for navbar
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleCalculatorClick = () => {
    if (onCalculatorClick) {
      onCalculatorClick();
      return;
    }
    // Fallback: try to scroll to calculators section
    const calculatorsElement = document.getElementById('calculators');
    if (calculatorsElement) {
      const elementPosition = calculatorsElement.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - 100; // Offset for navbar
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleSave = async () => {
    // If not logged in, show auth modal
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      if (isSaved) {
        await unsaveProperty(property.mlsNumber);
        toast({
          title: "Property Removed",
          description: "Property has been removed from your saved list.",
          icon: <XCircle className="h-5 w-5 text-gray-600" />,
        });
      } else {
        await saveProperty({ mlsNumber: property.mlsNumber });
        toast({
          title: "Property Saved",
          description: "Property has been added to your saved list.",
          variant: "success",
          icon: <Heart className="h-5 w-5 text-green-600 fill-green-600" />,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save property. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full">
      

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Section: Address and Features */}
        <div className="flex-1 gap-4">
          <div className="flex flex-row items-center gap-4 mb-2">
            {/* Address */}
            <h1 className="text-2xl font-bold text-gray-900">
              {address}
            </h1>
            
            {/* Status Badge */}
            <Badge variant={propertyStatus.variant} showDot>
              {propertyStatus.label}
            </Badge>
          </div>

          {/* Property Features */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Only show MLS # for non pre-con properties */}
            {!preConData && (
              <span className="text-base text-gray-500">MLS # {property.mlsNumber}</span>
            )}

            {/* Property Type */}
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-gray-600" />
              {(() => {
                const propertyType = property.details?.propertyType || 'Property'
                const typeUrl = getPropertyTypeUrl(propertyType, property.address?.city)
                if (typeUrl) {
                  return (
                    <Link 
                      href={typeUrl}
                      className="text-base text-gray-700 hover:text-primary hover:underline transition-colors"
                    >
                      {propertyType}
                    </Link>
                  )
                }
                return <span className="text-base text-gray-700">{propertyType}</span>
              })()}
            </div>

            {/* Bedrooms */}
            {property.details?.numBedrooms > 0 && (
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-gray-600" />
                <span className="text-base text-gray-700">
                  {property.details.numBedrooms} {property.details.numBedrooms === 1 ? 'Bed' : 'Beds'}
                </span>
              </div>
            )}

            {/* Bathrooms */}
            {property.details?.numBathrooms > 0 && (
              <div className="flex items-center gap-2">
                <Bath className="h-4 w-4 text-gray-600" />
                <span className="text-base text-gray-700">
                  {property.details.numBathrooms} {property.details.numBathrooms === 1 ? 'Bath' : 'Baths'}
                </span>
              </div>
            )}

            {/* Square Footage */}
            {sqftDisplay !== 'N/A' && (
              <div className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4 text-gray-600" />
                <span className="text-base text-gray-700">{sqftDisplay}</span>
              </div>
            )}
            {/* Project Rating Display */}
            <ProjectRatingDisplay propertyId={property.mlsNumber || preConData?.projectName || 'default'} />
          </div>
        </div>

        {/* Right Section: Status, Rating, Actions */}
        <div className="flex flex-col items-end gap-4">
          {/* Listed Price Badge */}
            <div className="flex items-end flex-col">
              <span className="text-sm font-medium text-gray-700">Listed Price</span>
              {preConData && (property.listPrice === 0 || !property.listPrice) ? (
                <span className="text-3xl font-bold text-gray-700">Coming Soon</span>
              ) : (
                <span className="text-3xl font-bold text-gray-700">{formatCurrency(property.listPrice || 0)}</span>
              )}
            </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
              {/* Contact Button */}
              <Button
                variant="default"
                size="icon"
                onClick={handleContactClick}
                className="h-10 w-10 rounded-lg bg-white border border-gray text-gray-600 hover:bg-gray-50 hover:text-primary transition-all duration-200"
                aria-label="Contact us"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
              {/* Calculator Button */}
              <Button
                variant="default"
                size="icon"
                onClick={handleCalculatorClick}
                className="h-10 w-10 rounded-lg bg-white border border-gray text-gray-600 hover:bg-gray-50 hover:text-primary transition-all duration-200"
                aria-label="Go to calculators"
              >
                <Calculator className="h-5 w-5" />
              </Button>
              {/* Property Alerts Button */}
              <Button
                variant="default"
                size="icon"
                onClick={() => setIsPropertyAlertsModalOpen(true)}
                className="h-10 w-10 rounded-lg bg-white border border-gray text-gray-600 hover:bg-gray-50 hover:text-primary transition-all duration-200"
                aria-label="Property Alerts"
              >
                <Bell className="h-5 w-5" />
              </Button>
              {/* Heart Button */}
              <Button
                variant="default"
                size="icon"
                onClick={handleSave}
                disabled={isSaving || isUnsaving}
                className={`h-10 w-10 rounded-lg bg-white border border-gray transition-all duration-200 ${
                  isSaved 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border-red-200' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-red-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                aria-label="Save property"
              >
                <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
              </Button>

              {/* Share Button */}
              <Button
                variant="default"
                size="icon"
                onClick={() => setIsShareModalOpen(true)}
                className="h-10 w-10 rounded-lg bg-white border border-gray text-gray-600 hover:bg-gray-50 hover:text-primary transition-all duration-200"
                aria-label="Share property"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
            
            
         </div>
       </div>

       {/* Share Modal */}
       <ShareModal 
         isOpen={isShareModalOpen}
         onClose={() => setIsShareModalOpen(false)}
         property={property}
       />

       {/* Auth Modal */}
       <AuthModal 
         isOpen={isAuthModalOpen} 
         onClose={() => setIsAuthModalOpen(false)} 
       />

       {/* Property Alerts Modal */}
       <PropertyAlerts
         open={isPropertyAlertsModalOpen}
         onOpenChange={setIsPropertyAlertsModalOpen}
         propertyId={property.mlsNumber}
         cityName={property.address?.city || 'this area'}
         propertyType={property.details?.propertyType || 'property'}
         neighborhood={property.address?.neighborhood || undefined}
       />
     </div>
   )
 }

export default PropertyHeader

