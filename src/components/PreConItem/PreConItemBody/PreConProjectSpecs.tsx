"use client"

import React from 'react'
import { PropertyListing } from '@/lib/types'
import { Building2, Maximize2, Layers, CheckCircle } from 'lucide-react'

interface PreConProjectSpecsProps {
  property: PropertyListing
}

const PreConProjectSpecs: React.FC<PreConProjectSpecsProps> = ({ property }) => {
  const preConData = property.preCon
  
  if (!preConData) {
    return null
  }

  // Format Type (subPropertyType or propertyType)
  const formatType = (type: string | undefined | null): string => {
    if (!type) return 'N/A'
    // Convert kebab-case or snake_case to Title Case
    return type
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }
  
  const type = formatType(
    preConData.details?.subPropertyType || 
    preConData.details?.propertyType || 
    property.details?.propertyType
  )
  
  // Get Size (sqftRange) - format if it's a range
  const size = preConData.details?.sqftRange 
    ? preConData.details.sqftRange.includes('-') 
      ? `${preConData.details.sqftRange} sqft`
      : `${preConData.details.sqftRange} sqft`
    : 'N/A'
  
  // Get Scale (storeys)
  const scale = preConData.details?.storeys && preConData.details.storeys > 0
    ? `${preConData.details.storeys} Storeys`
    : 'N/A'
  
  // Get Availability (availableUnits)
  const availability = preConData.details?.availableUnits !== undefined && 
                       preConData.details.availableUnits !== null &&
                       preConData.details.availableUnits >= 0
    ? `${preConData.details.availableUnits} ${preConData.details.availableUnits === 1 ? 'Suite' : 'Suites'} Left`
    : 'N/A'

  const specs = [
    {
      label: 'Type',
      value: type,
      icon: Building2,
    },
    {
      label: 'Size',
      value: size,
      icon: Maximize2,
    },
    {
      label: 'Scale',
      value: scale,
      icon: Layers,
    },
    {
      label: 'Availability',
      value: availability,
      icon: CheckCircle,
    },
  ]

  return (
    <div className="flex flex-row gap-4 mb-6">
      {specs.map((spec, index) => {
        const Icon = spec.icon
        return (
          <div key={index} className="flex items-center gap-3 flex-1">
            {/* Icon with light blue background */}
            <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
              <Icon className="h-6 w-6 text-secondary" />
            </div>
            
            {/* Label and Value */}
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-gray-500 font-medium mb-1">
                {spec.label}
              </span>
              <span className="text-sm font-bold text-gray-900 truncate">
                {spec.value}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default PreConProjectSpecs
