"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Award, Download } from "lucide-react"
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import { Button } from '@/components/ui/button'
import { useSavedComparables } from '@/hooks/useSavedComparables'
import { useSession } from 'next-auth/react'
import AuthModal from '@/components/Auth/AuthModal'
import { fetchPropertyListings } from '@/lib/api/properties'
import ComparableSelectorModal from '@/components/Comparables/ComparableSelectorModal'

interface PriceCardProps {
  property: PropertyListing
  rawProperty?: SinglePropertyListingResponse | null
  isPreCon?: boolean
  isRent?: boolean
}

const PriceCard = ({ property, rawProperty, isPreCon = false, isRent = false }: PriceCardProps) => {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<"comparable" | "estimated">("estimated")
  const [comparableProperties, setComparableProperties] = useState<PropertyListing[]>([])
  const [isLoadingComparables, setIsLoadingComparables] = useState(false)
  const [isComparableModalOpen, setIsComparableModalOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [comparableValueFromModal, setComparableValueFromModal] = useState<number | null>(null)

  const { savedComparables } = useSavedComparables(property.mlsNumber)
  
  // Create a stable reference for savedComparables to prevent infinite loops
  const savedComparablesRef = useRef<string>('')
  const savedComparablesKey = useMemo(() => {
    // Create a stable key from the MLS numbers
    const mlsNumbers = savedComparables.map(sc => sc.mlsNumber).sort().join(',')
    return mlsNumbers
  }, [savedComparables])

  // Fetch comparable properties
  useEffect(() => {
    // Skip if the key hasn't changed
    if (savedComparablesKey === savedComparablesRef.current) {
      return
    }
    
    savedComparablesRef.current = savedComparablesKey
    
    const fetchComparableProperties = async () => {
      if (savedComparables.length === 0) {
        setComparableProperties([])
        setIsLoadingComparables(false)
        return
      }

      setIsLoadingComparables(true)
      try {
        const allProperties = await fetchPropertyListings()
        const comparableMlsNumbers = savedComparables.map((sc) => sc.mlsNumber)
        const comparablePropertyListings = allProperties.filter((p) =>
          comparableMlsNumbers.includes(p.mlsNumber)
        )
        setComparableProperties(comparablePropertyListings)
      } catch (error) {
        console.error('Error fetching comparable properties:', error)
        setComparableProperties([])
      } finally {
        setIsLoadingComparables(false)
      }
    }

    fetchComparableProperties()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedComparablesKey])

  // Calculate comparable value (average price of saved comparables)
  // Use value from modal if available, otherwise calculate from properties
  const comparableValue = useMemo(() => {
    // If we have a value from the modal, use it (most up-to-date)
    if (comparableValueFromModal !== null) {
      return comparableValueFromModal
    }
    // Otherwise, calculate from fetched properties
    if (comparableProperties.length === 0) return null
    const sum = comparableProperties.reduce((acc, p) => acc + p.listPrice, 0)
    return sum / comparableProperties.length
  }, [comparableProperties, comparableValueFromModal])

  // Extract values from props
  const estimatedValue = rawProperty?.estimate?.value || property.listPrice || 650000

  const handleDownloadReport = () => {
    // TODO: Implement download report functionality
    console.log('Download report clicked')
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return "--"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const displayPrice = activeTab === "comparable" ? comparableValue : estimatedValue

  return (
    <div className={`w-full max-w-md overflow-hidden rounded-3xl bg-white ${activeTab === 'estimated' ? 'price-card-gradient' : 'bg-secondary'}`} style={{ boxShadow: '0px 40px 80px rgba(0, 0, 0, .2)' }}>
      {/* Main gradient section */}
      <div className=" px-8 pb-6 pt-10 rounded-t-3xl">
        {/* Price and Icon Row */}
        <div className="flex items-start justify-center gap-4">
          <h1 className={`text-5xl font-bold tracking-tight ${activeTab === "estimated" ? "text-white" : "text-foreground"}`}>
            {formatPrice(displayPrice)}
          </h1>
          <Award 
            className={`mt-1 h-12 w-12 ${activeTab === "estimated" ? "text-white opacity-80" : "text-foreground opacity-80"}`}
            strokeWidth={1.5}
          />
        </div>

        {/* Label */}
        <p className={`mt-2 text-center text-sm font-medium tracking-wide ${activeTab === "estimated" ? "text-white/80" : "text-muted-foreground"}`}>
          {activeTab === "comparable" ? "Comparable Value" : "Summitly's Value"}
        </p>
        
        {/* Property Count for Comparables */}
        {activeTab === "comparable" && comparableProperties.length > 0 && (
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Based on {comparableProperties.length} {comparableProperties.length === 1 ? 'property' : 'properties'}
          </p>
        )}
        
        {/* Loading state for comparables */}
        {activeTab === "comparable" && isLoadingComparables && (
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Loading comparables...
          </p>
        )}
        
        {/* No comparables message */}
        {activeTab === "comparable" && !isLoadingComparables && comparableProperties.length === 0 && (
          <p className="mt-1 text-center text-xs text-muted-foreground">
            No comparables selected. Select properties from nearby areas to calculate comparable value.
          </p>
        )}

        {/* Action Buttons */}
        <div className="my-6 flex flex-col gap-3 items-center">
          {activeTab === "comparable" && (
            <Button
              onClick={() => {
                if (!session) {
                  setIsAuthModalOpen(true)
                } else {
                  setIsComparableModalOpen(true)
                }
              }}
              className="rounded-full px-8 py-3 shadow-md transition-colors flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full"
              variant="secondary"
            >
              <span className="text-sm font-medium">
                {comparableProperties.length > 0 ? 'Manage Comparables' : 'Select Comparables'}
              </span>
            </Button>
          )}
          <Button
            onClick={handleDownloadReport}
            className={`rounded-full px-8 py-3 shadow-md transition-colors flex items-center gap-2 ${
              activeTab === "comparable"
                ? "bg-white text-secondary hover:bg-gray-50 w-full"
                : "bg-white hover:bg-gray-50"
            }`}
            variant={activeTab === "comparable" ? "outline" : "ghost"}
          >
            <Download className={`h-4 w-4 ${activeTab === "comparable" ? "text-secondary" : "text-secondary"}`} />
            <span className={`text-sm font-medium ${activeTab === "comparable" ? "text-secondary" : "text-secondary"}`}>
              Download Report
            </span>
          </Button>
        </div>
      </div>

      {/* Tab Section */}
      <div className="flex rounded-b-3xl overflow-hidden">
        <button
          onClick={() => setActiveTab("estimated")}
          className={`flex-1 py-4 text-sm font-medium transition-all duration-300  ${
            activeTab === "estimated"
              ? "text-white rounded-bl-3xl"
              : "text-white price-card-gradient rounded-tr-3xl hover:bg-gray-50"
          }`}
        >
          Summitly's Value
        </button>
        <button
          onClick={() => setActiveTab("comparable")}
          className={`flex-1 py-4 text-sm font-medium transition-all duration-300 ${
            activeTab === "comparable"
              ? "text-foreground rounded-br-3xl"
              : "bg-white text-muted-foreground rounded-tl-3xl hover:bg-gray-50"
          }`}
        >
          Comparable Value
        </button>
      </div>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Comparable Selector Modal */}
      {session && (
        <ComparableSelectorModal
          open={isComparableModalOpen}
          onOpenChange={(open) => {
            setIsComparableModalOpen(open)
            // When modal closes, the savedComparables from the hook will automatically update
            // and trigger the useEffect to refetch comparable properties
          }}
          property={property}
          onComparableValueChange={(averagePrice) => {
            // Update the comparable value directly from the modal
            setComparableValueFromModal(averagePrice)
          }}
        />
      )}
    </div>
  )
}

export default PriceCard

