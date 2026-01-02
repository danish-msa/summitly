"use client"

import React, { useState } from 'react'
import { Megaphone, TrendingUp, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ScheduleTourModal from './ScheduleTourModal'
import { PropertyListing } from '@/lib/types'

interface SidebarProps {
  isPreCon?: boolean
  isRent?: boolean
  property?: PropertyListing // Optional property for schedule tour modal
}

const Sidebar: React.FC<SidebarProps> = ({ isPreCon = false, isRent = false, property }) => {
  const [isScheduleTourModalOpen, setIsScheduleTourModalOpen] = useState(false)

  const handleScheduleTour = () => {
    setIsScheduleTourModalOpen(true)
  }

  // Only show for non-pre-con and non-rental properties
  if (isPreCon || isRent) {
    return null
  }

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        {/* Green Card - Sell Faster */}
        <div className="flex flex-col gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            {/* Icon Container */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-700" />
            </div>
            {/* Text Content */}
            <div className="flex-1 flex flex-col gap-1">
              <h3 className="text-base font-bold text-green-900">
                Sell faster than 85% nearby
              </h3>
              <p className="text-sm text-green-700/80 font-normal">
                We estimate this home will sell faster than similar properties.
              </p>
            </div>
          </div>
          <Button 
            onClick={handleScheduleTour}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Schedule Tour
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Red Card - Sell Faster */}
        <div className="flex flex-col gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            {/* Icon Container */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-red-700" />
            </div>
            {/* Text Content */}
            <div className="flex-1 flex flex-col gap-1">
              <h3 className="text-base font-bold text-red-900">
                Prices are changing
              </h3>
              <p className="text-sm text-red-700/80 font-normal">
                Get a free home estimate
              </p>
            </div>
          </div>
          <Button 
            onClick={handleScheduleTour}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Find Home Estimate
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Schedule Tour Modal */}
      {property && (
        <ScheduleTourModal
          open={isScheduleTourModalOpen}
          onOpenChange={setIsScheduleTourModalOpen}
          property={property}
        />
      )}
    </>
  )
}

export default Sidebar
