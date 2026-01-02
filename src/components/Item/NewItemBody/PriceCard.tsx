"use client"

import { useState } from "react"
import { Award } from "lucide-react"
import { PropertyListing } from '@/lib/types'
import type { SinglePropertyListingResponse } from '@/lib/api/repliers/types/single-listing'

interface PriceCardProps {
  property: PropertyListing
  rawProperty?: SinglePropertyListingResponse | null
  isPreCon?: boolean
  isRent?: boolean
}

const PriceCard = ({ property, rawProperty, isPreCon = false, isRent = false }: PriceCardProps) => {
  const [activeTab, setActiveTab] = useState<"listed" | "estimated">("listed")

  // Extract values from props
  const listedPrice = property.listPrice || 0
  const estimatedValue = rawProperty?.estimate?.value || property.listPrice || 650000
  const daysOnMarket = rawProperty?.daysOnMarket || rawProperty?.simpleDaysOnMarket || property.daysOnMarket || 0

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
    <div className="price-card-gradient w-full max-w-md overflow-hidden rounded-3xl bg-white" style={{ boxShadow: '0px 40px 80px rgba(0, 0, 0, .2)' }}>
      {/* Main gradient section */}
      <div className=" px-8 pb-6 pt-10 rounded-t-3xl">
        {/* Price and Icon Row */}
        <div className="flex items-start justify-center gap-4">
          <h1 className="text-5xl font-light tracking-tight text-white">
            {formatPrice(displayPrice)}
          </h1>
          <Award 
            className="mt-1 h-12 w-12 text-white opacity-80" 
            strokeWidth={1.5}
          />
        </div>

        {/* Label */}
        <p className="mt-2 text-center text-sm font-medium tracking-wide text-white/80">
          {activeTab === "listed" ? "Listed Price" : "Estimated Value"}
        </p>

        {/* Days on Market Badge */}
        <div className="mt-6 flex justify-center">
          <div className="rounded-full bg-white px-8 py-3 shadow-md">
            <span className="text-sm font-medium text-secondary">
              {daysOnMarket} Day{daysOnMarket !== 1 ? "s" : ""} on market
            </span>
          </div>
        </div>
      </div>

      {/* Tab Section */}
      <div className="flex rounded-b-3xl overflow-hidden">
        <button
          onClick={() => setActiveTab("listed")}
          className={`flex-1 py-4 text-sm font-medium transition-all duration-300 ${
            activeTab === "listed"
              ? "text-white rounded-bl-3xl"
              : "bg-white text-muted-foreground hover:bg-gray-50"
          }`}
        >
          Listed Price
        </button>
        <button
          onClick={() => setActiveTab("estimated")}
          className={`flex-1 py-4 text-sm font-medium transition-all duration-300 ${
            activeTab === "estimated"
              ? "text-white rounded-br-3xl"
              : "bg-white text-muted-foreground hover:bg-gray-50"
          }`}
        >
          Estimated Value
        </button>
      </div>
    </div>
  )
}

export default PriceCard

