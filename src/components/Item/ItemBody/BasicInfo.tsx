import React from 'react'
import { PropertyListing } from '@/lib/types'
import { MapPin, Calendar } from 'lucide-react'
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
    <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      
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

      {/* Estimated Value Section */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-green-600 font-semibold">
          {formatPrice(property.listPrice * 1.06)}
        </span>
        <span>Estimated value as of Oct 2025</span>
      </div>

      

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 p-3 bg-brand-celestial text-white rounded-lg hover:bg-brand-midnight transition-colors">
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
