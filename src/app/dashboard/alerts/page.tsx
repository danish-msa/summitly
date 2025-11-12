"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, Star, MapPin } from "lucide-react"
import { useAllPropertyAlerts } from '@/hooks/usePropertyAlerts'
import { fetchPropertyListings } from '@/lib/api/properties'
import { useState, useEffect } from 'react'
import { PropertyListing } from '@/lib/types'
import Link from 'next/link'

export default function Alerts() {
  const { alerts } = useAllPropertyAlerts()
  const [properties, setProperties] = useState<PropertyListing[]>([])

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const allProperties = await fetchPropertyListings()
        // Match properties to alerts
        const matchedProperties = allProperties.filter(p => 
          alerts.some(alert => 
            alert.mlsNumber === p.mlsNumber ||
            (alert.cityName && p.address.city?.toLowerCase().includes(alert.cityName.toLowerCase()))
          )
        )
        setProperties(matchedProperties)
      } catch (error) {
        console.error('Error loading alerts:', error)
      }
    }
    if (alerts.length > 0) {
      loadAlerts()
    }
  }, [alerts])

  // Mock alerts data - replace with real data from your API
  const mockAlerts = [
    {
      id: 1,
      type: "price-drop",
      title: "Price Drop Alert",
      property: "456 Maple Avenue",
      location: "Los Angeles, CA",
      oldPrice: "$875,000",
      newPrice: "$850,000",
      time: "2 hours ago",
    },
    {
      id: 2,
      type: "new-listing",
      title: "New Listing Match",
      property: "789 Pine Road",
      location: "San Francisco, CA",
      price: "$1,150,000",
      time: "5 hours ago",
    },
  ]

  const displayAlerts = alerts.length > 0 ? mockAlerts : mockAlerts

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Alerts</h2>
        <p className="text-muted-foreground">Stay updated on price changes and new listings</p>
      </div>

      <div className="space-y-4">
        {displayAlerts.map((alert) => (
          <Card key={alert.id} className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-full ${
                    alert.type === "price-drop"
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {alert.type === "price-drop" ? (
                    <TrendingDown className="h-6 w-6" />
                  ) : (
                    <Star className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-foreground">{alert.title}</h3>
                    <Badge variant="secondary">{alert.time}</Badge>
                  </div>
                  <p className="font-semibold text-foreground mb-1">{alert.property}</p>
                  <div className="flex items-center gap-1 text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{alert.location}</span>
                  </div>
                  {alert.type === "price-drop" ? (
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground line-through">{alert.oldPrice}</span>
                      <span className="text-2xl font-bold text-green-600">{alert.newPrice}</span>
                      <Badge className="bg-green-600 text-white">
                        {Math.round(
                          ((parseInt(alert.oldPrice.replace(/[$,]/g, "")) -
                            parseInt(alert.newPrice.replace(/[$,]/g, ""))) /
                            parseInt(alert.oldPrice.replace(/[$,]/g, ""))) *
                            100
                        )}
                        % off
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-primary">{alert.price}</p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Link href="/listings">
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                        View Property
                      </button>
                    </Link>
                    <button className="px-4 py-2 border border-border rounded-lg hover:bg-muted">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

