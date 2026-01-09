"use client"

import React from 'react'
import { PropertyListing } from '@/lib/types'
import ComparisonTable from './ComparisonTable'

interface ListViewProps {
  currentProperty: PropertyListing
  comparableProperties: PropertyListing[]
}

const ListView: React.FC<ListViewProps> = ({
  currentProperty,
  comparableProperties
}) => {
  return (
    <ComparisonTable 
      currentProperty={currentProperty}
      comparableProperties={comparableProperties}
    />
  )
}

export default ListView
