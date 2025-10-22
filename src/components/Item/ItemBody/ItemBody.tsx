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
      <div className='flex flex-row gap-6'>
          <div className='w-[70%]'>
            <CollapsibleTabs property={property} />
          </div>
          <div className='w-[30%]'>
            <AgentCTA />
          </div>
        </div>
    </div>
  )
}

export default ItemBody