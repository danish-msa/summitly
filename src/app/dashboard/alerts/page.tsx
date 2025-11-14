"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingDown, Star, MapPin, Bell, Home, Calendar } from "lucide-react"
import { useAllPropertyAlerts } from '@/hooks/usePropertyAlerts'
import { useEffect, useState } from 'react'
import Link from 'next/link'
// Helper function to format time ago
const formatTimeAgo = (date: Date | string): string => {
  const now = new Date()
  const past = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
  return `${Math.floor(diffInSeconds / 2592000)} months ago`
}

export default function Alerts() {
  const { alerts, isLoading } = useAllPropertyAlerts()
  const [displayAlerts, setDisplayAlerts] = useState<Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    timestamp: Date;
    mlsNumber?: string;
    location?: string;
    property?: string;
    propertyType?: string;
    time?: string;
    alertId?: string;
  }>>([])

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      // Transform saved alerts into display format
      const transformedAlerts = alerts.flatMap(alert => {
        const alertCards: Array<{
          id: string;
          type: string;
          title: string;
          description?: string;
          timestamp: Date;
          mlsNumber?: string;
          location?: string;
          property?: string;
          propertyType?: string;
          time?: string;
          alertId?: string;
        }> = []
        const location = alert.neighborhood 
          ? `${alert.neighborhood}, ${alert.cityName || ''}`
          : alert.cityName || 'Unknown Location'
        
        const timeAgo = alert.updatedAt 
          ? formatTimeAgo(alert.updatedAt)
          : 'Recently'

        // Watch Property alert
        if (alert.watchProperty && alert.mlsNumber) {
          alertCards.push({
            id: `${alert.id}-watch`,
            type: "watch-property",
            title: "Watching Property",
            property: alert.mlsNumber,
            location: location,
            propertyType: alert.propertyType || 'Property',
            time: timeAgo,
            alertId: alert.id,
            mlsNumber: alert.mlsNumber,
          })
        }

        // New Properties alert
        if (alert.newProperties) {
          alertCards.push({
            id: `${alert.id}-new`,
            type: "new-listing",
            title: "New Properties Alert",
            location: location,
            propertyType: alert.propertyType || 'Properties',
            time: timeAgo,
            alertId: alert.id,
            description: `Get notified when new ${alert.propertyType || 'properties'} are listed in ${location}`,
          })
        }

        // Sold Listings alert
        if (alert.soldListings) {
          alertCards.push({
            id: `${alert.id}-sold`,
            type: "sold-listing",
            title: "Sold Listings Alert",
            location: location,
            propertyType: alert.propertyType || 'Properties',
            time: timeAgo,
            alertId: alert.id,
            description: `Get notified when ${alert.propertyType || 'properties'} are sold in ${location}`,
          })
        }

        // Expired Listings alert
        if (alert.expiredListings) {
          alertCards.push({
            id: `${alert.id}-expired`,
            type: "expired-listing",
            title: "Expired Listings Alert",
            location: location,
            propertyType: alert.propertyType || 'Properties',
            time: timeAgo,
            alertId: alert.id,
            description: `Get notified when ${alert.propertyType || 'properties'} listings expire in ${location}`,
          })
        }

        return alertCards
      })

      setDisplayAlerts(transformedAlerts)
    } else {
      setDisplayAlerts([])
    }
  }, [alerts])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "watch-property":
        return <Home className="h-6 w-6" />
      case "new-listing":
        return <Star className="h-6 w-6" />
      case "sold-listing":
        return <TrendingDown className="h-6 w-6" />
      case "expired-listing":
        return <Calendar className="h-6 w-6" />
      default:
        return <Bell className="h-6 w-6" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case "watch-property":
        return "bg-blue-100 text-blue-600"
      case "new-listing":
        return "bg-green-100 text-green-600"
      case "sold-listing":
        return "bg-purple-100 text-purple-600"
      case "expired-listing":
        return "bg-orange-100 text-orange-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Alerts</h2>
          <p className="text-muted-foreground">Stay updated on price changes and new listings</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Alerts</h2>
        <p className="text-muted-foreground">Stay updated on price changes and new listings</p>
      </div>

      {displayAlerts.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Active Alerts</h3>
            <p className="text-muted-foreground mb-4">
              You don't have any active alerts. Set up alerts on property pages to get notified about updates.
            </p>
            <Link href="/listings">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                Browse Properties
              </button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayAlerts.map((alert) => (
            <Card key={alert.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${getAlertColor(alert.type)}`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-foreground">{alert.title}</h3>
                      <Badge variant="secondary">{alert.time}</Badge>
                    </div>
                    {alert.mlsNumber && (
                      <p className="font-semibold text-foreground mb-1">MLS: {alert.mlsNumber}</p>
                    )}
                    <div className="flex items-center gap-1 text-muted-foreground mb-3">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{alert.location}</span>
                    </div>
                    {alert.description && (
                      <p className="text-muted-foreground mb-3">{alert.description}</p>
                    )}
                    <div className="flex gap-2 mt-4">
                      {alert.mlsNumber ? (
                        <Link href={(() => {
                          // Try to get property from displayAlerts or fetch it
                          // For now, use fallback URL structure
                          return `/property/${alert.mlsNumber}`
                        })()}>
                          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                            View Property
                          </button>
                        </Link>
                      ) : (
                        <Link href={alert.location ? `/${alert.location.toLowerCase().replace(/,/g, '').replace(/\s+/g, '-')}` : '/listings'}>
                          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                            View Listings
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

