"use client"

import PropertyCard from '@/components/Helper/PropertyCard'
import { fetchPropertyListings } from '@/lib/api/properties'
import { useState, useEffect } from 'react'
import { PropertyListing } from '@/lib/types'
import { useBackgroundFetch } from '@/hooks/useBackgroundFetch'

export default function MyListings() {
  const [listings, setListings] = useState<PropertyListing[]>([])
  const { loading, fetchData } = useBackgroundFetch()

  useEffect(() => {
    const loadListings = async () => {
      await fetchData(async () => {
        const allProperties = await fetchPropertyListings()
        // Filter for user's listings - in a real app, this would filter by user ID
        setListings(allProperties.slice(0, 2)) // Mock: show first 2
        return allProperties
      }).catch((error) => {
        console.error('Error loading listings:', error)
      })
    }
    loadListings()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">My Listings</h2>
          <p className="text-muted-foreground">Manage your property listings</p>
        </div>
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium">
          Add New Listing
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="bg-card rounded-lg p-12 border border-border text-center">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No listings yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Start by adding your first property listing.
          </p>
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium">
            Add New Listing
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listings.map((listing) => (
            <div key={listing.mlsNumber} className="relative">
              <PropertyCard property={listing} onHide={() => {}} />
              <div className="mt-2 flex gap-2">
                <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm">
                  Edit
                </button>
                <button className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

