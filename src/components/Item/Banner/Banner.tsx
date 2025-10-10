import React, { useState } from 'react'
import BlurImage from '../../Helper/BlurImage';
import { PropertyListing } from '@/data/types'; // Import the interface from types.ts

interface BannerProps {
    property: PropertyListing;
}

const Banner: React.FC<BannerProps> = ({ property }) => {
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
    
    

    // Create a property name from property type and location
    const propertyName = `${property.details.propertyType} in ${property.address.city || 'Unknown Location'}`;

    // Handle image error for a specific index
    const handleImageError = (index: number) => {
        setImageErrors(prev => ({
            ...prev,
            [index]: true
        }));
    };

    // Get image source with fallback
    const getImageSrc = (index: number) => {
        if (imageErrors[index]) {
            return `/images/p${(index % 5) + 1}.jpg`;
        }
        
        if (property.images.allImages && property.images.allImages.length > index) {
            return property.images.allImages[index];
        }
        
        return `/images/p${(index % 5) + 1}.jpg`;
    };

    return (
        <div className='w-[95%] mx-auto flex flex-row gap-4 mt-20'>
            {/* Main large image */}
            <BlurImage 
                className='w-1/2 rounded-2xl' 
                src={getImageSrc(0)} 
                alt={propertyName} 
                width={1920} 
                height={1080}
                onError={() => handleImageError(0)}
                unoptimized={true}
            />
            
            {/* First column of smaller images */}
            <div className='w-1/4 flex flex-col gap-4'>
                <BlurImage 
                    className='rounded-2xl' 
                    src={getImageSrc(1)} 
                    alt={propertyName} 
                    width={1920} 
                    height={1080}
                    onError={() => handleImageError(1)}
                    unoptimized={true}
                />
                <BlurImage 
                    className='rounded-2xl' 
                    src={getImageSrc(2)} 
                    alt={propertyName} 
                    width={1920} 
                    height={1080}
                    onError={() => handleImageError(2)}
                    unoptimized={true}
                />
            </div>
            
            {/* Second column of smaller images */}
            <div className='w-1/4 flex flex-col gap-4'>
                <BlurImage 
                    className='rounded-2xl' 
                    src={getImageSrc(3)} 
                    alt={propertyName} 
                    width={1920} 
                    height={1080}
                    onError={() => handleImageError(3)}
                    unoptimized={true}
                />
                <BlurImage 
                    className='rounded-2xl' 
                    src={getImageSrc(4)} 
                    alt={propertyName} 
                    width={1920} 
                    height={1080}
                    onError={() => handleImageError(4)}
                    unoptimized={true}
                />
            </div>
        </div>
    )
}

export default Banner