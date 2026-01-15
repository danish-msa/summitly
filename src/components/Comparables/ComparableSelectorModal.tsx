"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import ComparableSelector from './ComparableSelector'
import { PropertyListing } from '@/lib/types'

interface ComparableSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: PropertyListing
  onComparableValueChange?: (averagePrice: number | null) => void
}

const ComparableSelectorModal = ({
  open,
  onOpenChange,
  property,
  onComparableValueChange,
}: ComparableSelectorModalProps) => {
  const handleComparableValueChange = (averagePrice: number | null, count: number) => {
    // Only pass the averagePrice to the parent component
    onComparableValueChange?.(averagePrice)
  }

  const centerLat = property.map?.latitude
  const centerLng = property.map?.longitude

  if (!centerLat || !centerLng) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-6 flex flex-col rounded-none">
          <DialogHeader>
            <DialogTitle>Select Comparables</DialogTitle>
            <DialogDescription>
              Unable to load comparables. Property location is not available.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none m-0 p-6 flex flex-col overflow-hidden sm:rounded-none">
        {/* <DialogHeader className="flex-shrink-0 mb-4">
          <DialogTitle className="text-2xl font-bold">Select Properties for Comparison</DialogTitle>
          <DialogDescription>
            Select properties from the nearby area to calculate the comparable value. 
            The average price will be calculated automatically.
          </DialogDescription>
        </DialogHeader> */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ComparableSelector
            centerLat={centerLat}
            centerLng={centerLng}
            radius={5}
            basePropertyMlsNumber={property.mlsNumber}
            baseProperty={property}
            city={property.address?.city || undefined}
            onComparableValueChange={handleComparableValueChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ComparableSelectorModal

