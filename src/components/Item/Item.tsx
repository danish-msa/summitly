"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import BasicInfo from './ItemBody/BasicInfo'
import { getRawListingDetails, getListingDetails } from '@/lib/api/properties'
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SimilarListings from './ItemBody/SimilarListings'
import StickyPropertyBar from './StickyPropertyBar'
import Breadcrumbs from './Breadcrumbs'
import { ContactSection } from './ItemBody/ContactSection'
import { parsePropertyUrl } from '@/lib/utils/propertyUrl'
import NewItemBody, { NewItemBodyRef } from './ItemBody/NewItemBody'
import PropertyHeader from './ItemBody/PropertyHeader'
import ModernBannerGallery from './Banner/ModernBannerGallery'
import PriceCard from './ItemBody/PriceCard'
import Description from './ItemBody/Description'
import Sidebar from './ItemBody/Sidebar'
import PropertiesComparison from './PropertiesComparison/PropertiesComparison'

const Item: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const newItemBodyRef = useRef<NewItemBodyRef>(null);
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
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Fetch AI property analysis
  useEffect(() => {
    const fetchAIAnalysis = async () => {
      if (!property?.mlsNumber) return;
      
      try {
        console.log('🤖 [AI ANALYSIS] Fetching for MLS:', property.mlsNumber);
        const response = await fetch('/api/ai/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mls_number: property.mlsNumber,
            mode: 'quick',
            property: {
              id: property.mlsNumber,
              title: `${property.details.propertyType} in ${property.address.city}`,
              price: property.listPrice,
              location: `${property.address.city}, ${property.address.province}`,
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ [AI ANALYSIS] Received RAW data:', data);
          console.log('✅ [AI ANALYSIS] Full Response Structure:', JSON.stringify(data, null, 2));
          console.log('📊 [AI ANALYSIS] data.insights:', data?.insights);
          console.log('📊 [AI ANALYSIS] data.analysis:', data?.analysis);
          console.log('📊 [AI ANALYSIS] Estimated Value from insights:', data?.insights?.estimated_value);
          console.log('📊 [AI ANALYSIS] Estimated Value from analysis:', data?.analysis?.estimated_value);
          console.log('📊 [AI ANALYSIS] Type of Estimated Value:', typeof data?.insights?.estimated_value);
          
          // CHECK AI SUMMARY IN MULTIPLE PATHS
          const aiSummary = data?.ai_summary || data?.insights?.ai_summary || data?.analysis?.ai_summary;
          if (aiSummary) {
            console.log('📝 [AI ANALYSIS] AI Summary FOUND:', aiSummary.substring(0, 150) + '...');
          } else {
            console.error('❌ [AI ANALYSIS] NO AI SUMMARY FOUND!');
            console.error('   Checked paths: data.ai_summary, data.insights.ai_summary, data.analysis.ai_summary');
          }
          
          // CHECK BOTH PATHS - insights and analysis
          const estimatedValue = data?.insights?.estimated_value || data?.analysis?.estimated_value;
          
          if (estimatedValue) {
            console.log('🎯 [AI ANALYSIS] AI ESTIMATE FOUND:', estimatedValue);
          } else {
            console.error('❌ [AI ANALYSIS] NO ESTIMATED VALUE IN RESPONSE!');
            console.error('   Response keys:', Object.keys(data));
            if (data.insights) {
              console.error('   Insights keys:', Object.keys(data.insights));
            }
            if (data.analysis) {
              console.error('   Analysis keys:', Object.keys(data.analysis));
            }
          }
          
          setAiAnalysis(data);
        } else {
          console.error('❌ [AI ANALYSIS] Response not OK:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('❌ [AI ANALYSIS] Error:', error);
      }
    };

    fetchAIAnalysis();
  }, [property?.mlsNumber]);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      let mlsNumber: string | undefined;
      
      try {
        // Extract MLS number from URL
        if (cityName && propertyAddress) {
          // New URL structure: /{citySlug}/{streetNumber}-{streetName}-{mlsNumber}
          const parsed = parsePropertyUrl(cityName, propertyAddress);
          
          if (!parsed) {
            setError('Invalid property URL');
            setLoading(false);
            return;
          }

          // Extract MLS number from URL - this is the primary method
          if (parsed.mlsNumber) {
            mlsNumber = parsed.mlsNumber;
          } else {
            setError('Property URL must include MLS number');
            setLoading(false);
            return;
          }
        } else if (propertyId) {
          // Fallback to old URL structure (using MLS number directly)
          mlsNumber = propertyId;
        } else {
          setError('Invalid URL - MLS number required');
          setLoading(false);
          return;
        }

        // Fetch property directly from Repliers API using MLS number
        if (!mlsNumber) {
          setError('MLS number not found in URL');
          setLoading(false);
          return;
        }

        const foundProperty = await getListingDetails(mlsNumber);
        
        if (!foundProperty) {
          setError(`Property not found for MLS number: ${mlsNumber}`);
          setLoading(false);
          return;
        }

        // Detect if this is a rental property (no redirect - keep SEO-friendly URL)
        const isRentalProperty = foundProperty.type === 'Lease' || foundProperty.type?.toLowerCase().includes('lease');
        setIsRental(isRentalProperty);
        
        // Fetch raw listing for imageInsights
        let rawListing: SinglePropertyListingResponse | null = null;
        try {
          rawListing = await getRawListingDetails(mlsNumber);
        } catch (_rawError) {
          // Continue without raw listing - it's not critical
        }
        
        // Merge openHouse data from rawProperty into property
        const propertyWithOpenHouse = {
          ...foundProperty,
          openHouse: rawListing?.openHouse || foundProperty.openHouse
        };
        setProperty(propertyWithOpenHouse);
        setRawProperty(rawListing);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to load property details: ${errorMessage}`);
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

  // Determine if this is a pre-construction property
  const isPreCon = !!property.preCon;

  return (
    <div>
      <div className='container-1400 px-4 sm:px-6 lg:px-8 mt-2 sm:mt-4 md:mt-6 lg:mt-10 mb-4'>

        <StickyPropertyBar 
          property={property} 
          bannerRef={bannerRef}
          onCalculatorClick={() => {
            newItemBodyRef.current?.setActiveTab('calculators');
            setTimeout(() => {
              newItemBodyRef.current?.scrollToSection();
            }, 100);
          }}
        />
        {/* Breadcrumbs */}
        <Breadcrumbs property={property} isPreCon={false} isRent={isRental} />
        <PropertyHeader 
          property={property}
          onCalculatorClick={() => {
            newItemBodyRef.current?.setActiveTab('calculators');
            setTimeout(() => {
              newItemBodyRef.current?.scrollToSection();
            }, 100);
          }}
        />
        
        <div className='flex flex-col md:flex-row gap-6 md:gap-8 mt-4 md:mt-6 mb-6 md:mb-10'>
          <div className='w-full md:w-[70%] flex flex-col gap-6'>
            <div ref={bannerRef} data-banner-section>
              <ModernBannerGallery property={property} />
            </div>
            <Description property={property} isPreCon={isPreCon} aiAnalysis={aiAnalysis} />

            {/* <div ref={bannerRef} data-banner-section>
              <Banner property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} />
            </div> */}
            
          </div>
          <div className='w-full md:w-[30%] flex flex-col gap-4 items-stretch md:items-start md:gap-4 md:sticky md:top-2 md:self-start'>
            <PriceCard property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} aiAnalysis={aiAnalysis} />
            <BasicInfo property={property} rawProperty={rawProperty} isPreCon={false} isRent={isRental} />
            <Sidebar isPreCon={isPreCon} isRent={isRental} property={property} />
          </div>
        </div>
        <NewItemBody 
          ref={newItemBodyRef}
          property={property} 
          rawProperty={rawProperty} 
          isPreCon={isPreCon} 
          isRent={isRental} 
        />
        <PropertiesComparison currentProperty={property} />
      </div>

      <div className='container-1400 px-4 sm:px-6 lg:px-8 mt-12 md:mt-20 mb-4'>
        <ContactSection />
      </div>
      <div className='container-1400 px-4 sm:px-6 lg:px-8 mt-12 md:mt-20 mb-4'>
        <SimilarListings currentProperty={property} />
      </div>
    </div>
  )
}

export default Item