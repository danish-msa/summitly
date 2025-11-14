import Item from '@/components/Item/Item';
import React from 'react'

const RentItemPage: React.FC = () => {
  // Item.tsx now handles both buy and rent properties
  // This route is kept for backward compatibility with old /rent/[id] URLs
  return (
    <Item />
  )
}

export default RentItemPage

