import { Badge } from "@/components/ui/badge";
import { Link2, Camera, HistoryIcon } from "lucide-react";
import { GroupedHistoryRecord } from './types';
import { Button } from "@/components/ui/button";

interface ListingTimelineProps {
  groupedHistory: GroupedHistoryRecord[];
  propertyAddress: string;
}

export default function ListingTimeline({ groupedHistory, propertyAddress }: ListingTimelineProps) {
  return (
    <div className="bg-white py-4">
      <p className="text-sm text-gray-600 mt-1 mt-4 mb-4">Listing history of {propertyAddress}</p>
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-8">
          {groupedHistory.map((record, index) => {
            const isActive = record.isActive;
            const markerColor = isActive ? 'bg-green-500' : 'bg-gray-400';
            const dotColor = isActive ? 'bg-green-500' : 'bg-gray-400';

            return (
              <div key={index} className="relative pl-16">
                {/* Timeline marker */}
                <div className={`absolute left-3 top-0 w-6 h-6 rounded-full ${markerColor} border-4 border-white shadow-sm z-10`}></div>

                {/* Main period header */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {isActive ? 'Active' : record.formattedStartDate} ({record.daysOnMarket} day{record.daysOnMarket !== 1 ? 's' : ''} on market)
                    </h3>
                    {isActive && (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                        Currently Viewing
                      </Badge>
                    )}
                    {!isActive && (
                      <Link2 className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-700">Brokerage - {record.brokerage}</p>
                </div>

                {/* Event entry */}
                <div className="relative ml-4 pl-6 border-l-2 border-gray-200">
                  {/* Sub-timeline dot */}
                  <div className={`absolute left-0 top-0 w-3 h-3 rounded-full ${dotColor} border-2 border-white -translate-x-[7px]`}></div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pb-4">
                    {/* Left side - Date and Event info */}
                    <div className="md:col-span-8 space-y-1">
                      <div className="flex items-start gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.formattedStartDate}</p>
                          <p className="text-xs text-gray-500">{record.timeAgo}</p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-row items-center gap-2">
                        {record.event === 'Terminated' ? (
                          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                            {record.event}
                          </Badge>
                        ) : (
                          <p className="text-sm text-gray-900">
                            {record.event === 'Listed For Sale' && isActive 
                              ? 'Listed For Sale (Still on market)' 
                              : record.event}
                          </p>
                        )}
                        {record.event !== 'Terminated' && (
                          <p className="text-xs text-gray-500 bg-brand-tide/50 px-2 py-1 rounded-full">{record.listingId}</p>
                        )}
                      </div>
                    </div>

                    {/* Right side - Price and Image */}
                    <div className="md:col-span-4 flex flex-row items-end gap-4 justify-end">
                      {/* Price */}
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{record.price}</p>
                        <p className="text-xs text-gray-500">
                          {isActive ? 'Listed Price' : record.event === 'Terminated' ? 'Last Price' : 'Listed Price'}
                        </p>
                      </div>

                      {/* Image thumbnail */}
                      {record.imageUrl && (
                        <div className="relative w-24 h-16 rounded overflow-hidden border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={record.imageUrl} 
                            alt="Property" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-tl flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            <span>{record.photoCount}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Call to Action */}
      <div className="flex justify-center pt-6 pb-4">
        <Button 
          variant="default" 
          className="px-8 py-6 text-base rounded-lg gap-2"
          onClick={() => {
            // Add handler for CTA click
            console.log('Need more history details about this property');
          }}
        >
          <HistoryIcon className="h-5 w-5" />
          Need more history details about this property
        </Button>
      </div>
    </div>
  );
}

