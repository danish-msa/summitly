'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, TrendingUp, Home, DollarSign, MapPin, Calendar, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import { summitlyAIService } from '@/lib/services/summitly-ai-service'
import type { PropertyListing } from '@/lib/types'
import type { AiAnalysis } from '@/components/summitly-ai/types'

interface PropertyAIAnalysisDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: PropertyListing
}

export function PropertyAIAnalysisDialog({
  open,
  onOpenChange,
  property,
}: PropertyAIAnalysisDialogProps) {
  const [analysis, setAnalysis] = React.useState<AiAnalysis | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open && !analysis && !loading) {
      fetchAnalysis()
    }
  }, [open])

  const fetchAnalysis = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await summitlyAIService.getPropertyAnalysis(
        property.mlsNumber,
        {
          id: property.mlsNumber,
          title: `${property.details.propertyType} in ${property.address.city}`,
          price: formatCurrency(property.listPrice),
          location: `${property.address.city}, ${property.address.province}`,
          bedrooms: property.details.numBedrooms,
          bathrooms: property.details.numBathrooms,
          sqft: property.details.sqft,
          description: property.details.description || '',
        }
      )

      if (result.success && result.analysis) {
        setAnalysis(result.analysis)
      } else {
        setError('Failed to generate analysis')
      }
    } catch (err) {
      setError('An error occurred while fetching analysis')
      console.error('Analysis error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Clear analysis after dialog closes
    setTimeout(() => {
      setAnalysis(null)
      setError(null)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>AI Property Analysis</DialogTitle>
          </div>
          <DialogDescription>
            AI-powered valuation and insights for {property.address.streetNumber}{' '}
            {property.address.streetName}, {property.address.city}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">
                  {property.address.streetNumber} {property.address.streetName}
                </h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  {property.address.city}, {property.address.province}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(property.listPrice)}
                </div>
                <Badge variant="secondary" className="mt-1">
                  {property.details.propertyType}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{property.details.numBedrooms} Bed</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{property.details.numBathrooms} Bath</span>
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{property.details.sqft} sqft</span>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">
                Analyzing property with AI...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAnalysis}
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && !loading && (
            <div className="space-y-6">
              {/* Valuation */}
              {analysis.valuation && (
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">AI Valuation</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Estimated Value</span>
                      <span className="font-semibold text-lg">
                        {formatCurrency(analysis.valuation.estimated_value)}
                      </span>
                    </div>
                    {analysis.valuation.value_range && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Value Range</span>
                        <span className="text-sm">
                          {formatCurrency(analysis.valuation.value_range.low)} -{' '}
                          {formatCurrency(analysis.valuation.value_range.high)}
                        </span>
                      </div>
                    )}
                    {analysis.valuation.confidence_score && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Confidence</span>
                        <Badge variant="outline">{analysis.valuation.confidence_score}%</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Investment Insights */}
              {analysis.insights && analysis.insights.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Investment Insights</h3>
                  </div>
                  <ul className="space-y-2">
                    {analysis.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Market Analysis */}
              {analysis.market_analysis && (
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Market Analysis</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis.market_analysis}
                  </p>
                </div>
              )}

              {/* Comparable Properties */}
              {analysis.comparable_properties && analysis.comparable_properties.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="font-semibold mb-3">Comparable Properties</h3>
                  <div className="space-y-3">
                    {analysis.comparable_properties.slice(0, 3).map((comp, index) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded-md bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{comp.address}</p>
                          <p className="text-xs text-muted-foreground">
                            {comp.bedrooms} bed • {comp.bathrooms} bath • {comp.sqft} sqft
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{formatCurrency(comp.price)}</p>
                          {comp.distance && (
                            <p className="text-xs text-muted-foreground">{comp.distance}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {analysis && (
            <Button onClick={() => window.open(`/ai?property=${property.mlsNumber}`, '_blank')}>
              Chat with AI About This Property
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
