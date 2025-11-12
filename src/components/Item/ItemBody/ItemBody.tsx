import React from 'react'
import { PropertyListing } from '@/lib/types'
import CollapsibleTabs from './CollapsibleTabs'

interface ItemBodyProps {
  property: PropertyListing;
  isPreCon?: boolean;
  isRent?: boolean;
}

const ItemBody: React.FC<ItemBodyProps> = ({ property, isPreCon = false, isRent = false }) => {

  return (
    <div className='w-full h-full relative'>
      <CollapsibleTabs property={property} isPreCon={isPreCon} isRent={isRent} />
    </div>
  )
}

export default ItemBody