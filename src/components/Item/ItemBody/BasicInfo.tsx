import React, { useMemo, useState } from 'react'
import { PropertyListing } from '@/lib/types'
import { Calendar, Clock, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ScheduleTourModal from './ScheduleTourModal'
import RequestInfoModal from './RequestInfoModal'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'

interface BasicInfoProps {
  property: PropertyListing;
  rawProperty?: SinglePropertyListingResponse | null;
  isPreCon?: boolean;
  isRent?: boolean;
}

const BasicInfo: React.FC<BasicInfoProps> = ({ property, rawProperty }) => {
  const [isScheduleTourModalOpen, setIsScheduleTourModalOpen] = useState(false);
  const [isRequestInfoModalOpen, setIsRequestInfoModalOpen] = useState(false);
  
  const mlsNumber = property.mlsNumber;
  const propertyAddress = property.address?.location || 
    `${property.address?.streetNumber || ''} ${property.address?.streetName || ''} ${property.address?.streetSuffix || ''}, ${property.address?.city || ''}, ${property.address?.state || ''} ${property.address?.zip || ''}`.trim();

  // Calculate the nearest available date and time
  const getNearestAvailableDateTime = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Available time slots (in 24-hour format)
    const availableTimes = [9, 10, 11, 14, 15, 16, 17, 19]; // 9 AM, 10 AM, 11 AM, 2 PM, 3 PM, 4 PM, 5 PM, 7 PM
    
    // Find next available time today
    const nextTime = availableTimes.find(time => time > currentHour);
    const targetDate = new Date(now);
    let targetTime = nextTime || availableTimes[0];
    
    // If no time available today, move to next day
    if (!nextTime) {
      targetDate.setDate(targetDate.getDate() + 1);
      targetTime = availableTimes[0];
    }
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    while (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    // Format date
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[targetDate.getDay()];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[targetDate.getMonth()];
    const day = targetDate.getDate();
    
    // Format time
    const hour12 = targetTime > 12 ? targetTime - 12 : targetTime;
    const ampm = targetTime >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hour12}:00${ampm}`;
    
    return {
      date: `${dayName}, ${monthName} ${day}`,
      shortDate: dayName,
      time: formattedTime,
      fullDateTime: targetDate
    };
  }, []);

  const handleScheduleTour = () => {
    setIsScheduleTourModalOpen(true);
  };

  const handleRequestInfo = () => {
    setIsRequestInfoModalOpen(true);
  };

  // Get listing provider name
  const listingProvider = rawProperty?.office?.brokerageName || 'Summitly';

  return (
    <div className="w-full">
      {/* Request a Tour / Book Appointment Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        {/* Tour Availability Header */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-secondary" />
            <span className="text-sm text-gray-600">Request a tour as early as</span>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {getNearestAvailableDateTime.shortDate} at {getNearestAvailableDateTime.time}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row gap-3">
          <Button
            variant="default"
            onClick={handleScheduleTour}
            className="w-full text-white font-semibold py-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Schedule Tour
          </Button>
          <Button 
            onClick={handleRequestInfo}
            variant="outline"
            className="w-full font-semibold py-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Info className="h-4 w-4" />
            Request Info
          </Button>
        </div>

      </div>

      {/* Schedule Tour Modal */}
      <ScheduleTourModal 
        open={isScheduleTourModalOpen} 
        onOpenChange={setIsScheduleTourModalOpen}
        mlsNumber={mlsNumber}
        propertyAddress={propertyAddress}
        property={property}
      />

      {/* Request Info Modal */}
      <RequestInfoModal 
        open={isRequestInfoModalOpen} 
        onOpenChange={setIsRequestInfoModalOpen} 
      />
    </div>
  )
}

export default BasicInfo
