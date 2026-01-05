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
  const [activeTab, setActiveTab] = useState<"comparable" | "estimated">("estimated")

  // Extract values from props
  const comparableValue = null // TODO: Will be implemented in future system
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

        {/* Download Report Button */}
        <div className="my-6 flex justify-center">
          <Button
            onClick={handleDownloadReport}
            className={`rounded-full px-8 py-3 shadow-md transition-colors flex items-center gap-2 ${
              activeTab === "comparable"
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                : "bg-white hover:bg-gray-50"
            }`}
            variant={activeTab === "comparable" ? "secondary" : "ghost"}
          >
            <Download className={`h-4 w-4 ${activeTab === "comparable" ? "text-secondary-foreground" : "text-secondary"}`} />
            <span className={`text-sm font-medium ${activeTab === "comparable" ? "text-secondary-foreground" : "text-secondary"}`}>
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
    </div>
  )
}

export default PriceCard

