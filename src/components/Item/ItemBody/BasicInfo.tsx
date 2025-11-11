import React, { useMemo, useState } from 'react'
import { PropertyListing } from '@/lib/types'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ScheduleTourModal from './ScheduleTourModal'
import RequestInfoModal from './RequestInfoModal'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'

interface BasicInfoProps {
  property: PropertyListing;
  rawProperty?: SinglePropertyListingResponse | null;
  isPreCon?: boolean;
}

const BasicInfo: React.FC<BasicInfoProps> = () => {
  const [isScheduleTourModalOpen, setIsScheduleTourModalOpen] = useState(false);
  const [isRequestInfoModalOpen, setIsRequestInfoModalOpen] = useState(false);

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

  return (
    <div className="w-full border border-gray-100">
      {/* Request a Tour / Book Appointment Section */}
      <div className="space-y-3 pb-6 border-b border-gray-200 bg-white p-6 rounded-xl shadow-sm ">
        <div className="text-base text-center font-regular text-gray-900">
          <span className="text-gray-700">
            Request a tour as early as<br />{' '}
            <span className=" font-semibold text-gray-900">
              {getNearestAvailableDateTime.shortDate} at {getNearestAvailableDateTime.time}
            </span>
          </span>
        </div>
        {/* Two Buttons */}
        <div className="flex flex-col gap-3">
          <Button 
            onClick={handleScheduleTour}
            className="flex-1 bg-brand-celestial hover:bg-brand-midnight text-white font-semibold py-2 rounded-lg transition-colors"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Tour
          </Button>
          <Button 
            onClick={handleRequestInfo}
            variant="outline"
            className="flex-1 border-brand-celestial text-brand-celestial hover:bg-brand-celestial hover:text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Request Info
          </Button>
        </div>
      </div>

      {/* Schedule Tour Modal */}
      <ScheduleTourModal 
        open={isScheduleTourModalOpen} 
        onOpenChange={setIsScheduleTourModalOpen} 
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
