"use client"

import React, { useState } from 'react'
import { PropertyListing } from '@/lib/types'
import { Home, Bed, Bath, Maximize2, Heart, Share2, FileText, XCircle, Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { useSavedProperties } from '@/hooks/useSavedProperties'
import { toast } from '@/hooks/use-toast'
import ShareModal from '../Banner/ShareModal'
import AuthModal from '@/components/Auth/AuthModal'
import ProjectRatingDisplay from '@/components/PreConItem/PreConItemBody/ProjectRatingDisplay'
import PropertyAlerts from '../ItemBody/PropertyAlerts'

interface PropertyHeaderProps {
  property: PropertyListing;
}

const PropertyHeader: React.FC<PropertyHeaderProps> = ({ property }) => {
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
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Left Section: Address and Features */}
        <div className="flex-1">
          <div className="flex flex-row items-center gap-2 mb-4">
            {/* Address */}
            <h1 className="text-2xl font-bold text-gray-900">
              {address}
            </h1>
            {/* Status Badge */}
            <Badge variant="active" showDot>
              Active
            </Badge>
          </div>

          {/* Property Features */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="text-xs text-gray-500">MLS # {property.mlsNumber}</span>

            {/* Property Type */}
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                {property.details?.propertyType || 'Property'}
              </span>
            </div>

            {/* Bedrooms */}
            {property.details?.numBedrooms > 0 && (
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {property.details.numBedrooms} {property.details.numBedrooms === 1 ? 'Bed' : 'Beds'}
                </span>
              </div>
            )}

            {/* Bathrooms */}
            {property.details?.numBathrooms > 0 && (
              <div className="flex items-center gap-2">
                <Bath className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {property.details.numBathrooms} {property.details.numBathrooms === 1 ? 'Bath' : 'Baths'}
                </span>
              </div>
            )}

            {/* Square Footage */}
            {sqftDisplay !== 'N/A' && (
              <div className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">{sqftDisplay}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Status, Rating, Actions */}
        <div className="flex flex-col items-end gap-2">
           {/* Action Buttons */}
           <div className="flex items-center gap-2">
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

           {/* Project Rating Display */}
          <ProjectRatingDisplay propertyId={property.mlsNumber || preConData?.projectName || 'default'} />
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

