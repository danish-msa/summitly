import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface PreConstructionCardSkeletonProps {
  className?: string;
}

export const PreConstructionCardSkeleton = ({ className }: PreConstructionCardSkeletonProps) => {
  return (
    <Card 
      className={`group hover:shadow-lg transition-all duration-300 overflow-hidden border-border cursor-pointer h-full w-full flex flex-col ${className || ''}`}
    >
      {/* Image Section */}
      <div className="aspect-video relative overflow-hidden bg-muted">
        <Skeleton className="w-full h-full" />
        
        {/* Status Badge Skeleton - Top Left */}
        <div className="absolute top-3 left-3 z-10">
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
        
        {/* Occupancy Year Badge Skeleton - Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <Skeleton className="h-5 w-24 rounded-md" />
        </div>
        
        {/* Location Overlay Skeleton - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3 z-10">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="flex flex-col flex-1">
        <div className="flex items-start justify-between gap-4 p-4 pb-0 mb-3 flex-1">
          <div className="flex-1 w-[65%]">
            {/* Project Name Skeleton */}
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-1.5" />
            
            {/* Developer Skeleton */}
            <div className="flex items-center gap-1.5 mb-1.5">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          
          {/* Price Section Skeleton */}
          <div className="text-right w-[35%]">
            <Skeleton className="h-3 w-16 mb-1 ml-auto" />
            <Skeleton className="h-6 w-20 ml-auto" />
          </div>
        </div>
      </div>
    </Card>
  );
};

