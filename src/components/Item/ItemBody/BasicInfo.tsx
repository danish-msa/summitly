import React from 'react'
import { PropertyListing } from '@/lib/types'
import { MapPin, Bed, Bath, Maximize2, Calendar, DollarSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface BasicInfoProps {
  property: PropertyListing;
}

const BasicInfo: React.FC<BasicInfoProps> = ({ property }) => {
  // Format the full address
  // const fullAddress = property.address.location || 
  //   `${property.address.streetNumber || ''} ${property.address.streetName || ''} ${property.address.streetSuffix || ''}, ${property.address.city || ''}, ${property.address.state || ''} ${property.address.zip || ''}`.trim();

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

  return (
    <div className="w-full h-full bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      
      {/* Price and Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-3xl font-bold text-gray-900">
            {formatPrice(property.listPrice)}
          </span>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500"></span>
            {property.status || 'Active'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Listed on {formatDate(property.listDate)}</span>
        </div>
      </div>

      {/* Property Details */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Bed className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm text-gray-600">Bedrooms</span>
              <p className="font-semibold text-gray-900">{property.details.numBedrooms}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Bath className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm text-gray-600">Bathrooms</span>
              <p className="font-semibold text-gray-900">{property.details.numBathrooms}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Maximize2 className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm text-gray-600">Square Feet</span>
              <p className="font-semibold text-gray-900">
                {typeof property.details.sqft === 'number' 
                  ? property.details.sqft.toLocaleString() 
                  : property.details.sqft}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm text-gray-600">Price per Sq Ft</span>
              <p className="font-semibold text-gray-900">
                {typeof property.details.sqft === 'number' 
                  ? formatPrice(property.listPrice / property.details.sqft)
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Type and Class */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Property Information</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Property Type</span>
            <span className="text-sm font-medium text-gray-900">{property.details.propertyType}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Class</span>
            <span className="text-sm font-medium text-gray-900">{property.class}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Type</span>
            <span className="text-sm font-medium text-gray-900">{property.type}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
            <MapPin className="h-4 w-4" />
            View on Map
          </button>
          <button className="flex items-center justify-center gap-2 p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Calendar className="h-4 w-4" />
            Schedule Tour
          </button>
        </div>
      </div>
    </div>
  )
}

export default BasicInfo
