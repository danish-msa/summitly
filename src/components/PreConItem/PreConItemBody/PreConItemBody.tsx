import React from 'react'
import { PropertyListing } from '@/lib/types'
import PreConCollapsibleTabs from './PreConCollapsibleTabs'

interface PreConItemBodyProps {
  property: PropertyListing;
}

const PreConItemBody: React.FC<PreConItemBodyProps> = ({ property }) => {
  return (
    <div className='w-full h-full relative'>
      <PreConCollapsibleTabs property={property} />
    </div>
  )
}

export default PreConItemBody

