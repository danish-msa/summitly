"use client"

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useSavedProperties } from '@/hooks/useSavedProperties'
import { useAllPropertyAlerts } from '@/hooks/usePropertyAlerts'
import { fetchPropertyListings } from '@/lib/api/properties'
import PropertyCard from '@/components/Helper/PropertyCard'
import { PropertyListing } from '@/lib/types'
import { useState } from 'react'
import { Heart, Search, Loader2, MapPin, Calendar, Layers, Image as ImageIcon, Bell, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

// Tab configuration matching UserProfileDropdown menu items
const dashboardTabs = [
  {
    id: 'saved-properties',
    label: 'Saved Properties',
    href: '/dashboard/saved-properties',
    icon: Heart,
  },
  {
    id: 'saved-images',
    label: 'Saved Images',
    href: '/dashboard/saved-images',
    icon: ImageIcon,
  },
  {
    id: 'saved-areas',
    label: 'Saved Areas',
    href: '/dashboard/saved-areas',
    icon: MapPin,
  },
  {
    id: 'saved-communities',
    label: 'Saved Communities',
    href: '/dashboard/saved-communities',
    icon: MapPin,
  },
  {
    id: 'watchlist',
    label: 'Watchlist',
    href: '/dashboard/watchlist',
    icon: Heart,
  },
  {
    id: 'planned-open-houses',
    label: 'Planned Open Houses',
    href: '/dashboard/planned-open-houses',
    icon: Calendar,
  },
  {
    id: 'recently-viewed',
    label: 'Recently Viewed',
    href: '/dashboard/recently-viewed',
    icon: Layers,
  },
]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { savedProperties, isLoading: isLoadingSaved } = useSavedProperties()
  const [properties, setProperties] = useState<PropertyListing[]>([])
  const [isLoadingProperties, setIsLoadingProperties] = useState(true)
  
  // Get current active tab from pathname
  const activeTab = pathname?.split('/').pop() || 'saved-properties'

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Fetch property details for saved MLS numbers
  useEffect(() => {
    const fetchProperties = async () => {
      if (savedProperties.length === 0) {
        setIsLoadingProperties(false)
        return
      }

      try {
        const allProperties = await fetchPropertyListings()
        const savedMlsNumbers = savedProperties.map((sp) => sp.mlsNumber)
        const savedPropertyListings = allProperties.filter((p) =>
          savedMlsNumbers.includes(p.mlsNumber)
        )
        setProperties(savedPropertyListings)
      } catch (error) {
        console.error('Error fetching saved properties:', error)
      } finally {
        setIsLoadingProperties(false)
      }
    }

    if (savedProperties.length > 0) {
      fetchProperties()
    } else {
      setIsLoadingProperties(false)
    }
  }, [savedProperties])

  if (status === 'loading' || isLoadingSaved) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-background mt-16">
      <div className="container-1400 mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center gap-4">
            {/* Profile Image/Avatar */}
            <Avatar className="h-16 w-16 rounded-lg">
              <AvatarImage 
                src={session.user?.image || undefined} 
                alt={session.user?.name || 'User'} 
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-semibold rounded-lg">
                {session.user?.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 1) || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {/* User Info */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Hello, {session.user?.name || 'User'}!
              </h1>
              <p className="text-muted-foreground">
                {session.user?.email || 'user@example.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saved Properties</p>
                <p className="text-2xl font-bold text-foreground">
                  {savedProperties.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Search className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Search History</p>
                <p className="text-2xl font-bold text-foreground">0</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-6 border border-border">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-2xl font-bold text-foreground">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="w-full inline-flex gap-4 h-12 items-center justify-start rounded-lg p-1 text-muted-foreground overflow-x-auto">
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id || (tab.id === 'saved-properties' && pathname === '/dashboard')
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    isActive
                      ? "bg-white text-foreground shadow"
                      : "bg-muted/50 hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Tab Content - Saved Properties (default) */}
        {activeTab === 'saved-properties' || pathname === '/dashboard' ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Saved Properties
              </h2>
              <Link href="/listings">
                <Button variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Browse More Properties
                </Button>
              </Link>
            </div>

            {isLoadingProperties ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : properties.length === 0 ? (
              <div className="bg-card rounded-lg p-12 border border-border text-center">
                <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No saved properties yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Start saving properties you're interested in to see them here.
                </p>
                <Link href="/listings">
                  <Button>Browse Properties</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.mlsNumber}
                    property={property}
                    onHide={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'watchlist' ? (
          <WatchlistContent />
        ) : (
          <div className="mb-8">
            <div className="bg-card rounded-lg p-12 border border-border text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {dashboardTabs.find(t => t.id === activeTab)?.label || 'Content'}
              </h3>
              <p className="text-muted-foreground">
                This section is coming soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Watchlist Content Component
function WatchlistContent() {
  const { alerts, isLoading } = useAllPropertyAlerts()
  const { deleteAlert, isDeleting } = usePropertyAlerts()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteAlert(id, undefined)
    } catch (error) {
      console.error('Error deleting alert:', error)
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="mb-8">
        <div className="bg-card rounded-lg p-12 border border-border text-center">
          <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold text-foreground mb-2">
            No alerts set up yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Set up property alerts to get notified about new listings, price changes, and more.
          </p>
          <Link href="/listings">
            <Button>Browse Properties</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-foreground">
          Property Alerts
        </h2>
        <Link href="/listings">
          <Button variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Browse More Properties
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {alert.mlsNumber ? 'Property Watch' : 'Area Alerts'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {alert.neighborhood || alert.cityName || 'Unknown location'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(alert.id)}
                disabled={deletingId === alert.id || isDeleting}
                className="p-2 hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingId === alert.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-destructive" />
                ) : (
                  <Trash2 className="h-4 w-4 text-destructive" />
                )}
              </button>
            </div>

            <div className="space-y-3">
              {alert.watchProperty && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Watching property updates</span>
                </div>
              )}
              {alert.newProperties && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">New properties in area</span>
                </div>
              )}
              {alert.soldListings && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Sold listings notifications</span>
                </div>
              )}
              {alert.expiredListings && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span className="text-muted-foreground">Expired listings notifications</span>
                </div>
              )}
            </div>

            {alert.propertyType && (
              <div className="mt-4 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  Property Type: <span className="font-medium">{alert.propertyType}</span>
                </span>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Created {new Date(alert.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

