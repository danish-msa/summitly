"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Banner from './Banner/Banner'
import ItemBody from './ItemBody/ItemBody'
import BasicInfo from './ItemBody/BasicInfo'
import { fetchPropertyListings, getRawListingDetails, getListingDetails } from '@/lib/api/properties'
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import PropertyAlerts from './ItemBody/PropertyAlerts'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import BannerGallery from './Banner/BannerGallery'
import SectionNavigation from './ItemBody/SectionNavigation'
import SimilarListings from './ItemBody/SimilarListings'
import StickyPropertyBar from './StickyPropertyBar'
import Breadcrumbs from './Breadcrumbs'
import { ContactSection } from './ItemBody/ContactSection'
import { parsePropertyUrl } from '@/lib/utils/propertyUrl'

const Item: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  // For property pages, citySlug is the city name (without -real-estate suffix)
  const citySlug = (params?.citySlug || params?.cityName) as string; // Support both for backward compatibility
  const cityName = citySlug; // For property pages, citySlug is just the city name (no -real-estate)
  const propertyAddress = (params?.slug || params?.propertyAddress) as string; // Use slug as primary, support propertyAddress for backward compatibility
  const propertyId = params?.id as string; // Fallback for old URL structure
  const bannerRef = useRef<HTMLDivElement>(null);
  
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [rawProperty, setRawProperty] = useState<SinglePropertyListingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRental, setIsRental] = useState<boolean>(false);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        let foundProperty: PropertyListing | undefined;
        let mlsNumber: string | undefined;

        // If we have cityName and propertyAddress, use new URL structure
        if (cityName && propertyAddress) {
          const parsed = parsePropertyUrl(cityName, propertyAddress);
          if (!parsed) {
            setError('Invalid property URL');
            setLoading(false);
            return;
          }

          // BEST APPROACH: If MLS number is in URL, use it directly (fast!)
          if (parsed.mlsNumber) {
            console.log('🚀 Fast path: Using MLS number from URL:', parsed.mlsNumber);
            mlsNumber = parsed.mlsNumber;
            const propertyResult = await getListingDetails(parsed.mlsNumber);
            foundProperty = propertyResult || undefined;
            
            if (!foundProperty) {
              console.warn('⚠️ Property not found by MLS number, falling back to address matching');
              // Fall through to address matching as fallback
            }
          }

          // FALLBACK: If no MLS in URL or MLS lookup failed, use address matching
          if (!foundProperty) {
            console.log('🔍 Fallback: Searching by address (slower but backward compatible)');
            // Fetch all listings and find matching property
            const listings = await fetchPropertyListings();
          
            // Helper to normalize strings for comparison
            const normalize = (str: string | null | undefined): string => {
              if (!str) return '';
              return str
                .toLowerCase()
                .trim()
                .replace(/\s+/g, ' ')
                .replace(/[^\w\s]/g, ''); // Remove special characters for comparison
            };
            
            // Helper to normalize street name (handle suffixes and variations)
            const normalizeStreetName = (str: string | null | undefined): string => {
              if (!str) return '';
              let normalized = normalize(str);
              // Remove common street suffixes for comparison
              const suffixes = ['st', 'street', 'ave', 'avenue', 'rd', 'road', 'dr', 'drive', 'blvd', 'boulevard', 'ln', 'lane', 'ct', 'court', 'pl', 'place', 'way', 'pkwy', 'parkway'];
              suffixes.forEach(suffix => {
                const regex = new RegExp(`\\b${suffix}\\b`, 'gi');
                normalized = normalized.replace(regex, '').trim();
              });
              return normalized;
            };
            
            const searchCity = normalize(parsed.city);
            const searchStreetNumber = normalize(parsed.streetNumber);
            const searchStreetName = normalizeStreetName(parsed.streetName);
            
            // Debug logging
            console.log('🔍 Searching for property by address:', {
              urlParams: { citySlug, propertyAddress },
              parsed: parsed,
              search: {
                city: searchCity,
                streetNumber: searchStreetNumber,
                streetName: searchStreetName
              },
              totalListings: listings.length
            });
            
            foundProperty = listings.find(p => {
              const propCity = normalize(p.address?.city);
              const propStreetNumber = normalize(p.address?.streetNumber);
              const propStreetName = normalizeStreetName(p.address?.streetName);
              
              // Try exact match first
              const exactMatch = (
                propCity === searchCity &&
                propStreetNumber === searchStreetNumber &&
                propStreetName === searchStreetName
              );
              
              // If no exact match, try partial matching (street name might include suffix)
              const partialMatch = !exactMatch && (
                propCity === searchCity &&
                propStreetNumber === searchStreetNumber &&
                (propStreetName.includes(searchStreetName) || searchStreetName.includes(propStreetName))
              );
              
              if (exactMatch || partialMatch) {
                console.log('✅ Found property match:', {
                  mlsNumber: p.mlsNumber,
                  address: p.address?.location || `${p.address?.streetNumber} ${p.address?.streetName}`,
                  matchType: exactMatch ? 'exact' : 'partial'
                });
              }
              
              return exactMatch || partialMatch;
            });

            if (foundProperty) {
              mlsNumber = foundProperty.mlsNumber;
              console.log('✅ Property found via address matching:', foundProperty.mlsNumber);
            } else {
              // Log for debugging - show first few properties for comparison
              const sampleProps = listings.slice(0, 10).map(p => ({
                mlsNumber: p.mlsNumber,
                city: p.address?.city,
                streetNumber: p.address?.streetNumber,
                streetName: p.address?.streetName,
                fullAddress: p.address?.location,
                normalizedCity: normalize(p.address?.city),
                normalizedStreetNumber: normalize(p.address?.streetNumber),
                normalizedStreetName: normalizeStreetName(p.address?.streetName),
                cityMatch: normalize(p.address?.city) === searchCity,
                streetNumberMatch: normalize(p.address?.streetNumber) === searchStreetNumber,
                streetNameMatch: normalizeStreetName(p.address?.streetName) === searchStreetName
              }));
              
              console.warn('❌ Property not found!', {
                '🔍 Searching for': {
                  city: parsed.city,
                  streetNumber: parsed.streetNumber,
                  streetName: parsed.streetName,
                  normalized: {
                    city: searchCity,
                    streetNumber: searchStreetNumber,
                    streetName: searchStreetName
                  }
                },
                '📊 Total listings': listings.length,
                '📋 Sample properties (first 10)': sampleProps,
                '💡 Tip': 'Check if city/streetNumber/streetName match any property above'
              });
            }
          }
        } else if (propertyId) {
          // Fallback to old URL structure (using MLS number directly)
          console.log('🔍 Using propertyId from URL:', propertyId);
          mlsNumber = propertyId;
          const propertyResult = await getListingDetails(propertyId);
          foundProperty = propertyResult || undefined;
          
          if (!foundProperty) {
            // Try searching in listings as fallback
            const listings = await fetchPropertyListings();
            foundProperty = listings.find(p => p.mlsNumber === propertyId) || undefined;
          }
        } else {
          setError('Property not found');
          setLoading(false);
          return;
        }
        
        if (foundProperty && mlsNumber) {
          // Detect if this is a rental property (no redirect - keep SEO-friendly URL)
          const isRentalProperty = foundProperty.type === 'Lease' || foundProperty.type?.toLowerCase().includes('lease');
          setIsRental(isRentalProperty);
          
          // Fetch raw listing for imageInsights
          const rawListing = await getRawListingDetails(mlsNumber);
          
          // Merge openHouse data from rawProperty into property
          const propertyWithOpenHouse = {
            ...foundProperty,
            openHouse: rawListing?.openHouse || foundProperty.openHouse
          };
          setProperty(propertyWithOpenHouse);
          setRawProperty(rawListing);
        } else {
          setError('Property not found');
        }
      } catch (err) {
        setError('Failed to load property details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (cityName && propertyAddress) {
      fetchPropertyDetails();
    } else if (propertyId) {
      fetchPropertyDetails();
    } else {
      setLoading(false);
      setError('Invalid URL');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityName, propertyAddress, propertyId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading property details..." />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error || 'Property not found'}</p>
          {error && error.includes('not found') && (
            <button
              onClick={() => router.push('/listings')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Properties
            </button>
          )}
        </div>
      </div>
    );
  }

  // Define navigation sections - rentals don't have history section
  const navigationSections = isRental
    ? [
        { id: 'description', label: 'Description' },
        { id: 'listing-details', label: 'Listing Details' },
        { id: 'available-units', label: 'Available Units' },
        { id: 'features', label: 'Neighborhood' },
        { id: 'lifestyle', label: 'Lifestyle' },
        { id: 'demographics', label: 'Demographics' },
        { id: 'calculators', label: 'Calculators' }
      ]
    : [
        { id: 'description', label: 'Description' },
        { id: 'listing-details', label: 'Listing Details' },
        { id: 'history', label: 'History' },
        { id: 'features', label: 'Neighborhood' },
        { id: 'lifestyle', label: 'Lifestyle' },
        { id: 'demographics', label: 'Demographics' },
        { id: 'market-analytics', label: 'Market Analytics' },
        { id: 'calculators', label: 'Calculators' }
      ];

  return (
    <div className='bg-background'>
      {/* Sticky Property Bar */}
      <StickyPropertyBar property={property} bannerRef={bannerRef} />
      <div className='container-1400 mt-5 mb-4'>
        {/* Breadcrumbs */}
        <Breadcrumbs property={property} isPreCon={false} isRent={isRental} />
        <BannerGallery property={property} />
      </div>
      {/* Sticky Navigation Panel */}
      <SectionNavigation sections={navigationSections} property={property} />
      <div className='container-1400'>
          
        <div className='flex flex-row gap-8'>
          <div className='w-[70%] flex flex-col gap-6'>
            <div ref={bannerRef} data-banner-section>
              <Banner property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} />
            </div>
            <ItemBody property={property} isPreCon={false} isRent={isRental} />
          </div>
          <div className='w-[30%] flex flex-col gap-4 items-start gap-0 sticky top-[130px] self-start'>
            <BasicInfo property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} />
            <PropertyAlerts 
              propertyId={property.mlsNumber} 
              cityName={property.address.city || 'this area'}
              propertyType={property.details.propertyType || 'property'}
              neighborhood={property.address.neighborhood || undefined}
            />
          </div>
        </div>
        <div className='mt-6'>
          
        </div>
      </div>

      <div className='container-1400 mt-20 mb-4'>
        <ContactSection />
      </div>
      <div className='container-1400 mt-20 mb-4'>
        <SimilarListings currentProperty={property} />
      </div>
    </div>
  )
}

export default Item