import React from 'react'
import { PropertyListing } from '@/lib/types'
import CollapsibleTabs from './CollapsibleTabs'

interface ItemBodyProps {
  property: PropertyListing;
  isPreCon?: boolean;
}

const ItemBody: React.FC<ItemBodyProps> = ({ property, isPreCon = false }) => {

  return (
    <div className='w-full h-full relative'>
      <CollapsibleTabs property={property} isPreCon={isPreCon} />
    </div>
  )
}

export default ItemBody