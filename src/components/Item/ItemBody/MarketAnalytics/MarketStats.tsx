import React from 'react'
import { TrendingUp, ArrowDown } from 'lucide-react'

interface MarketStatsProps {
  neighborhood: string
  displayCity: string
  marketStats: {
    activeListings: number
    newListings: number
    soldProperties: number
    medianPrice: number
    avgDOM: number
    last1YearGrowth: number
    last5YearsGrowth: number
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export const MarketStats: React.FC<MarketStatsProps> = ({ neighborhood, displayCity, marketStats }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-foreground">
          Market Insights in {neighborhood}, {displayCity}
        </h3>
        <span className="text-sm text-muted-foreground">
          As of {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </span>
      </div>
      
      {/* Stats Grid - Top Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-secondary/20 rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Active Listings</p>
          <p className="text-2xl font-bold text-foreground">{marketStats.activeListings}</p>
        </div>
        
        <div className="bg-secondary/20 rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">New Listings</p>
          <p className="text-2xl font-bold text-foreground">{marketStats.newListings}</p>
        </div>
        
        <div className="bg-secondary/10 rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Sold Properties</p>
          <p className="text-2xl font-bold text-foreground">{marketStats.soldProperties}</p>
        </div>
        
        <div className="bg-secondary/20 rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Count</p>
          <p className="text-2xl font-bold text-foreground">{marketStats.activeListings + marketStats.soldProperties}</p>
        </div>
      </div>

      {/* Stats Grid - Bottom Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/20 border border-muted/20 rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Median Price</p>
          <p className="text-2xl font-bold text-foreground">{formatPrice(marketStats.medianPrice)}</p>
        </div>
        
        <div className="bg-muted/20 border border-muted/20 rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Avg DOM</p>
          <p className="text-2xl font-bold text-foreground">{marketStats.avgDOM}</p>
        </div>
        
        <div className={`rounded-xl p-6 border ${
          marketStats.last1YearGrowth >= 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <p className="text-sm text-muted-foreground mb-1">Last 1 Year's Growth</p>
          <div className="flex items-center gap-1">
            {marketStats.last1YearGrowth >= 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{marketStats.last1YearGrowth.toFixed(1)}%</p>
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{Math.abs(marketStats.last1YearGrowth).toFixed(1)}%</p>
              </>
            )}
          </div>
        </div>
        
        <div className={`rounded-xl p-6 border ${
          marketStats.last5YearsGrowth >= 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <p className="text-sm text-muted-foreground mb-1">Last 5 Years' Growth</p>
          <div className="flex items-center gap-1">
            {marketStats.last5YearsGrowth >= 0 ? (
              <>
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-2xl font-bold text-green-600">{marketStats.last5YearsGrowth.toFixed(1)}%</p>
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4 text-red-600" />
                <p className="text-2xl font-bold text-red-600">{Math.abs(marketStats.last5YearsGrowth).toFixed(1)}%</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketStats

