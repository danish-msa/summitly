import { Skeleton } from '@/components/ui/skeleton';

interface CityCardSkeletonProps {
  className?: string;
}

export const CityCardSkeleton = ({ className }: CityCardSkeletonProps) => {
  return (
    <div className={`relative rounded-lg overflow-hidden m-2 ${className || ''}`}>
      {/* Image Skeleton */}
      <Skeleton className='w-full h-[250px] rounded-2xl' />
      
      {/* Bottom Overlay Skeleton */}
      <div className='absolute bottom-2 left-2 right-2 rounded-xl px-4 pt-4 pb-4 bg-white flex justify-between items-center'>
        <div className='flex flex-col flex-1'>
          <Skeleton className='h-5 w-24 mb-1' />
        </div>
        <Skeleton className='h-8 w-8 rounded-full' />
      </div>
    </div>
  );
};

