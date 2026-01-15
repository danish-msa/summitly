import React from 'react'
import { PropertyListing } from '@/lib/types'
import { Info } from 'lucide-react'

interface DepositStructureProps {
  property: PropertyListing;
}

interface DepositSchedule {
  type: 'Standard' | 'International';
  items: string[];
}

const DepositStructure: React.FC<DepositStructureProps> = ({ property }) => {
  const preCon = property.preCon;
  
  if (!preCon || !preCon.depositStructure) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Deposit structure information not available
      </div>
    );
  }

  // Parse deposit structure to extract Standard and International schedules
  const parseDepositStructure = (depositInfo: string): DepositSchedule[] => {
    const schedules: DepositSchedule[] = [];
    
    // Try to split by "Standard" and "International" keywords
    const standardMatch = depositInfo.match(/Standard[:\s]*(.*?)(?=International|$)/is);
    const internationalMatch = depositInfo.match(/International[:\s]*(.*?)$/is);
    
    if (standardMatch) {
      const standardText = standardMatch[1].trim();
      const items = standardText
        .split(/[•\n]/)
        .map(item => item.trim())
        .filter(item => item.length > 0 && !item.match(/^(Standard|International)/i));
      if (items.length > 0) {
        schedules.push({ type: 'Standard', items });
      }
    }
    
    if (internationalMatch) {
      const internationalText = internationalMatch[1].trim();
      const items = internationalText
        .split(/[•\n]/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
      if (items.length > 0) {
        schedules.push({ type: 'International', items });
      }
    }
    
    // If no structured format found, try to parse as a single schedule
    if (schedules.length === 0) {
      const items = depositInfo
        .split(/[•\n]/)
        .map(item => item.trim())
        .filter(item => item.length > 0 && !item.match(/^(Standard|International)/i));
      if (items.length > 0) {
        schedules.push({ type: 'Standard', items });
      }
    }
    
    return schedules;
  };

  const schedules = parseDepositStructure(preCon.depositStructure);

  // Default schedules if none found
  const defaultSchedules: DepositSchedule[] = [
    {
      type: 'Standard',
      items: [
        '$10,000 on Signing',
        '5% in 30 Days',
        '5% in 180 Days',
        '2.5% in 360 Days',
        '2.5% in 540 Days'
      ]
    },
    {
      type: 'International',
      items: [
        '$10,000 on Signing',
        'Balance of 10% in 30 Days',
        '10% in 180 Days',
        '5% in 360 Days',
        '5% in 540 Days'
      ]
    }
  ];

  const displaySchedules = schedules.length > 0 ? schedules : defaultSchedules;

  return (
    <div className="w-full pl-14">
      <h2 className="text-2xl font-bold text-foreground mb-6">Payment Schedule</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Section: Deposit Schedules */}
        <div className=" space-y-6">
          {displaySchedules.map((schedule, index) => (
            <div key={index} className="space-y-4">
              {/* Pill Header */}
              <div className="inline-block bg-gray-100 rounded-full px-4 py-2 text-sm font-medium text-gray-800">
                {schedule.type}
              </div>
              
              {/* Bullet List */}
              <ul className="space-y-2">
                {schedule.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-base text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Right Section: Important Information */}
        <div className="bg-[#FEF3C7]/40 rounded-lg p-6 shadow-sm ">
          <div className="flex items-center gap-3 mb-4">
            <Info className="h-5 w-5 text-[#D97706]" />
            <h3 className="font-bold text-lg text-[#92400E]">Important Information</h3>
          </div>
          
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#D97706] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-base text-[#92400E]">Deposit structure may vary by unit type and floor plan</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#D97706] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-base text-[#92400E]">All deposits are held in trust until closing</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#D97706] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-base text-[#92400E]">Please consult with your real estate agent for specific deposit requirements</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#D97706] rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-base text-[#92400E]">Terms and conditions apply as per the purchase agreement</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DepositStructure;

