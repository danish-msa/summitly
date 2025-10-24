import React from 'react'
import { PropertyListing } from '@/lib/types'
import CollapsibleTabs from './CollapsibleTabs'
import AgentCTA from './AgentCTA'

interface ItemBodyProps {
  property: PropertyListing;
}

const ItemBody: React.FC<ItemBodyProps> = ({ property }) => {

  return (
    <div className='w-full h-full relative'>
      <CollapsibleTabs property={property} />
    </div>
  )
}

export default ItemBody