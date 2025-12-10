import React from 'react'
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import CollapsibleTabs from './CollapsibleTabs'

interface ItemBodyProps {
  property: PropertyListing;
  rawProperty?: SinglePropertyListingResponse | null;
  isPreCon?: boolean;
  isRent?: boolean;
}

const ItemBody: React.FC<ItemBodyProps> = ({ property, rawProperty, isPreCon = false, isRent = false }) => {

  return (
    <div className='w-full h-full relative'>
      <CollapsibleTabs property={property} rawProperty={rawProperty} isPreCon={isPreCon} isRent={isRent} />
    </div>
  )
}

export default ItemBody