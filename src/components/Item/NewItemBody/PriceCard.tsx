"use client"

import { useState } from "react"
import { Award, Download } from "lucide-react"
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'
import { Button } from '@/components/ui/button'

interface PriceCardProps {
  property: PropertyListing
  rawProperty?: SinglePropertyListingResponse | null
  isPreCon?: boolean
  isRent?: boolean
}

const PriceCard = ({ property, rawProperty, isPreCon = false, isRent = false }: PriceCardProps) => {
  const [activeTab, setActiveTab] = useState<"listed" | "estimated">("estimated")

  // Extract values from props
  const listedPrice = property.listPrice || 0
  const estimatedValue = rawProperty?.estimate?.value || property.listPrice || 650000

  const handleDownloadReport = () => {
    // TODO: Implement download report functionality
    console.log('Download report clicked')
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const displayPrice = activeTab === "listed" ? listedPrice : estimatedValue

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
          {activeTab === "listed" ? "Listed Price" : "Summitly Estimated Value"}
        </p>

        {/* Download Report Button */}
        <div className="my-6 flex justify-center">
          <Button
            onClick={handleDownloadReport}
            className="rounded-full bg-white px-8 py-3 shadow-md hover:bg-gray-50 transition-colors flex items-center gap-2"
            variant="ghost"
          >
            <Download className="h-4 w-4 text-secondary" />
            <span className="text-sm font-medium text-secondary">
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
              : "text-muted-foreground hover:bg-gray-50"
          }`}
        >
          Estimated Value
        </button>
        <button
          onClick={() => setActiveTab("listed")}
          className={`flex-1 py-4 text-sm font-medium transition-all duration-300 ${
            activeTab === "listed"
              ? "text-foreground rounded-br-3xl"
              : "bg-white text-muted-foreground hover:bg-gray-50"
          }`}
        >
          Listed Price
        </button>
      </div>
    </div>
  )
}

export default PriceCard

