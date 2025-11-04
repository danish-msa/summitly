import React from 'react'
import { PropertyListing } from '@/lib/types'
import { MapPin, Calendar, User, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'

interface BasicInfoProps {
  property: PropertyListing;
  rawProperty?: SinglePropertyListingResponse | null;
}

const BasicInfo: React.FC<BasicInfoProps> = () => {

  const handleRequestTour = () => {
    // Handle tour request logic
    console.log('Request tour clicked');
    // You can add navigation or modal logic here
  };

  const handleGetPreQualified = () => {
    // Handle pre-qualification logic
    console.log('Get pre-qualified clicked');
    // You can add navigation to mortgage calculator or pre-qualification page
  };

  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      {/* Request a Tour Section */}
      <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-brand-celestial" />
          <h3 className="text-lg font-semibold text-gray-900">Tour with a local agent</h3>
        </div>
        <p className="text-sm text-gray-600">
          Schedule a personalized tour with one of our experienced local agents and explore this property in person.
        </p>
        <Button 
          onClick={handleRequestTour}
          className="w-full bg-brand-celestial hover:bg-brand-midnight text-white font-semibold py-6 rounded-lg transition-colors"
        >
          Request a Tour
        </Button>
      </div>

      {/* Get Pre-Qualified Section */}
      <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-5 w-5 text-brand-celestial" />
          <h3 className="text-lg font-semibold text-gray-900">Get Pre-Qualified</h3>
        </div>
        <p className="text-sm text-gray-600">
          Find out how much you can afford and get pre-qualified for a mortgage in minutes.
        </p>
        <Button 
          onClick={handleGetPreQualified}
          variant="outline"
          className="w-full border-brand-celestial text-brand-celestial hover:bg-brand-celestial hover:text-white font-semibold py-6 rounded-lg transition-colors"
        >
          Get Pre-Qualified
        </Button>
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
