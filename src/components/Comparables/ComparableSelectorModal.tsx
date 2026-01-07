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
  const handleComparableValueChange = (averagePrice: number | null) => {
    onComparableValueChange?.(averagePrice)
  }

  const centerLat = property.map?.latitude
  const centerLng = property.map?.longitude

  if (!centerLat || !centerLng) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-7xl max-h-[90vh] p-6 flex flex-col">
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
      <DialogContent className="sm:max-w-7xl max-h-[90vh] p-6 flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">Select Properties for Comparison</DialogTitle>
          <DialogDescription>
            Select properties from the nearby area to calculate the comparable value. 
            The average price will be calculated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex-1 min-h-0 overflow-hidden">
          <ComparableSelector
            centerLat={centerLat}
            centerLng={centerLng}
            radius={5}
            onComparableValueChange={handleComparableValueChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ComparableSelectorModal

