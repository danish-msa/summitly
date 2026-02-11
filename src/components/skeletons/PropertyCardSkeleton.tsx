import { Skeleton } from '@/components/ui/skeleton';

interface PropertyCardSkeletonProps {
  className?: string;
}

export const PropertyCardSkeleton = ({ className }: PropertyCardSkeletonProps) => {
  return (
    <div 
      className={`bg-card rounded-3xl overflow-hidden transition-all duration-500 ${className || ''}`}
      style={{ boxShadow: '0 8px 16px 0 rgba(0, 0, 0, 0.05)' }}
    >
      {/* Image Section */}
      <div className='relative h-60 w-full overflow-hidden'>
        <Skeleton className='w-full h-full' />
        
        {/* Property Type Badge Skeleton - Top Left */}
        <div className='absolute top-5 left-5'>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        
        {/* Date Badge and Menu Skeleton - Top Right */}
        <div className='absolute top-5 right-5 flex items-center gap-2'>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        
        {/* Status Badge Skeleton - Bottom Left */}
        <div className='absolute bottom-5 left-5'>
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        
        {/* Save Button Skeleton - Bottom Right */}
        <div className='absolute bottom-5 right-5'>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      
      {/* Content Section */}
      <div className='p-4'>
        {/* Price Section */}
        <div className='mb-3 flex items-center justify-between'>
          <div className="flex items-center justify-between gap-2 flex-1">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        </div>
        
        {/* Property Title Skeleton */}
        <Skeleton className="h-4 w-3/4 mb-2" />
        
        {/* Location Skeleton */}
        <div className='flex items-start mb-4'>
          <Skeleton className="h-3 w-3 rounded-full mr-1 mt-0.5" />
          <Skeleton className="h-3 w-40" />
        </div>
        
        {/* Property Details Skeleton */}
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-14" />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className="h-3 w-3 rounded" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
};

