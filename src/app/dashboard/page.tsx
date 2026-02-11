"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, TrendingUp, Heart, Calendar } from "lucide-react"
import { useSavedProperties } from '@/hooks/useSavedProperties'
import { useTours } from '@/hooks/useTours'
import { useActivity } from '@/hooks/useActivity'
import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import { getListingDetails } from '@/lib/api/repliers/services/listings'
import { getPropertyUrl } from '@/lib/utils/propertyUrl'
import { PropertyListing } from '@/lib/types'
import { getAllPreConProjects } from '@/data/mockPreConData'

const stats = [
  {
    title: "Active Listings",
    value: "12",
    icon: Home,
    change: "+2 this week",
    color: "text-blue-600",
    bgGradient: "from-blue-500 to-blue-600",
    iconBg: "bg-blue-100",
  },
  {
    title: "Saved Properties",
    value: "28",
    icon: Heart,
    change: "+5 new",
    color: "text-pink-600",
    bgGradient: "from-pink-500 to-rose-500",
    iconBg: "bg-pink-100",
  },
  {
    title: "Avg. Property Value",
    value: "$425K",
    icon: TrendingUp,
    change: "+3.2% this month",
    color: "text-emerald-600",
    bgGradient: "from-emerald-500 to-teal-500",
    iconBg: "bg-emerald-100",
  },
  {
    title: "Upcoming Tours",
    value: "4",
    icon: Calendar,
    change: "Next: Tomorrow 2PM",
    color: "text-purple-600",
    bgGradient: "from-purple-500 to-indigo-500",
    iconBg: "bg-purple-100",
  },
]

// Format time ago
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

export default function DashboardHome() {
  const { savedProperties } = useSavedProperties()
  const { tours } = useTours()
  const { activities, isLoading: isLoadingActivity } = useActivity()

  // Get upcoming tours count
  const upcomingTours = useMemo(() => {
    const now = new Date()
    return tours.filter(tour => {
      const tourDate = new Date(tour.scheduledDate)
      return tourDate >= now && tour.status !== 'CANCELLED' && tour.status !== 'COMPLETED'
    })
  }, [tours])

  // Get next tour
  const nextTour = useMemo(() => {
    if (upcomingTours.length === 0) return null
    const sorted = [...upcomingTours].sort((a, b) => {
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    })
    return sorted[0]
  }, [upcomingTours])

  // Format next tour time
  const nextTourTime = useMemo(() => {
    if (!nextTour) return "No upcoming tours"
    const tourDate = new Date(nextTour.scheduledDate)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayStr = now.toDateString()
    const tomorrowStr = tomorrow.toDateString()
    const dateStr = tourDate.toDateString()
    
    let dateText = ""
    if (dateStr === todayStr) {
      dateText = "Today"
    } else if (dateStr === tomorrowStr) {
      dateText = "Tomorrow"
    } else {
      dateText = tourDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    
    const time = tourDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    return `Next: ${dateText} ${time}`
  }, [nextTour])

  // Update stats with real data
  const updatedStats = stats.map(stat => {
    if (stat.title === "Saved Properties") {
      return { ...stat, value: savedProperties.length.toString() }
    }
    if (stat.title === "Upcoming Tours") {
      return { 
        ...stat, 
        value: upcomingTours.length.toString(),
        change: nextTourTime
      }
    }
    return stat
  })

  // Fetch property details for activities that need URLs
  const [propertyMap, setPropertyMap] = useState<Record<string, PropertyListing>>({})
  
  // Get all pre-construction projects for checking
  const allPreConProjects = useMemo(() => getAllPreConProjects(), [])
  const preConProjectMap = useMemo(() => {
    const map: Record<string, PropertyListing> = {}
    allPreConProjects.forEach(project => {
      if (project.mlsNumber) {
        map[project.mlsNumber] = project
      }
    })
    return map
  }, [allPreConProjects])
  
  useEffect(() => {
    const fetchProperties = async () => {
      const mlsNumbers = activities
        .filter(a => a.mlsNumber && (a.type === 'property_saved' || a.type === 'alert_watch'))
        .map(a => a.mlsNumber!)
        .filter((v, i, a) => a.indexOf(v) === i) // unique values
        .filter(mls => !preConProjectMap[mls]) // Exclude pre-con projects (they're already in preConProjectMap)
      
      const properties: Record<string, PropertyListing> = {}
      await Promise.all(
        mlsNumbers.map(async (mls) => {
          try {
            const prop = await getListingDetails(mls)
            if (prop) properties[mls] = prop
          } catch (error) {
            console.error(`Failed to fetch property ${mls}:`, error)
          }
        })
      )
      setPropertyMap(properties)
    }
    
    if (activities.length > 0) {
      fetchProperties()
    }
  }, [activities, preConProjectMap])

  // Transform activities for display
  const recentActivity = useMemo(() => {
    return activities.slice(0, 4).map(activity => {
      const propertyText = activity.mlsNumber 
        ? `MLS: ${activity.mlsNumber}` 
        : activity.location || 'Property'
      
      // Check if this is a pre-construction project
      const isPreConProject = activity.mlsNumber && preConProjectMap[activity.mlsNumber]
      const preConProject = (activity.mlsNumber && isPreConProject) ? preConProjectMap[activity.mlsNumber] : null
      
      // Determine link based on activity type
      let link = ''
      let linkText = propertyText
      let actionText = activity.action
      
      if (activity.type === 'property_saved' && activity.mlsNumber) {
        if (isPreConProject && preConProject) {
          // Pre-construction project
          link = `/pre-con/${activity.mlsNumber}`
          linkText = preConProject.preCon?.projectName || preConProject.address?.location || propertyText
          actionText = 'Project saved'
        } else {
          // Regular property
          const property = propertyMap[activity.mlsNumber]
          if (property) {
            link = getPropertyUrl(property)
            linkText = property.address?.streetNumber && property.address?.streetName
              ? `${property.address.streetNumber} ${property.address.streetName}`
              : propertyText
          } else {
            link = `/property/${activity.mlsNumber}` // Fallback
          }
        }
      } else if (activity.type === 'tour_scheduled') {
        link = '/dashboard/tours'
        linkText = 'View tour'
      } else if (activity.type === 'alert_watch' && activity.mlsNumber) {
        if (isPreConProject && preConProject) {
          // Pre-construction project
          link = `/pre-con/${activity.mlsNumber}`
          linkText = preConProject.preCon?.projectName || preConProject.address?.location || propertyText
        } else {
          // Regular property
          const property = propertyMap[activity.mlsNumber]
          if (property) {
            link = getPropertyUrl(property)
            linkText = property.address?.streetNumber && property.address?.streetName
              ? `${property.address.streetNumber} ${property.address.streetName}`
              : propertyText
          } else {
            link = `/property/${activity.mlsNumber}` // Fallback
          }
        }
      } else if (activity.type === 'alert_new') {
        link = '/dashboard/alerts'
        linkText = 'View alerts'
      }
      
      return {
        action: actionText,
        property: propertyText,
        time: formatTimeAgo(activity.timestamp),
        mlsNumber: activity.mlsNumber,
        type: activity.type,
        link,
        linkText,
      }
    })
  }, [activities, propertyMap, preConProjectMap])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Welcome back!</h2>
        <p className="text-muted-foreground">Here's an overview of your real estate activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {updatedStats.map((stat) => (
          <Card key={stat.title} className={`bg-gradient-to-br ${stat.bgGradient} shadow-md hover:shadow-xl transition-all duration-300 border-0`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white/90">
                {stat.title}
              </CardTitle>
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <p className="text-xs text-white/80 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingActivity ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">Loading activity...</p>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.type + activity.mlsNumber + activity.time}
                    className="flex items-start justify-between border-b last:border-0 pb-3 last:pb-0"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{activity.action}</p>
                      {activity.link ? (
                        <Link 
                          href={activity.link}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-block"
                        >
                          {activity.linkText}
                        </Link>
                      ) : (
                        <p className="text-sm text-muted-foreground">{activity.property}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{activity.time}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link href="/listings">
                <button className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/40 transition-colors">
                  <p className="font-medium">Search New Properties</p>
                  <p className="text-sm text-muted-foreground">Find your dream home</p>
                </button>
              </Link>
              <Link href="/dashboard/tours">
                <button className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/40 transition-colors">
                  <p className="font-medium">Schedule a Tour</p>
                  <p className="text-sm text-muted-foreground">Book a property viewing</p>
                </button>
              </Link>
              <Link href="/find-an-agent">
                <button className="w-full p-4 text-left rounded-lg border border-border hover:bg-muted/40 transition-colors">
                  <p className="font-medium">Contact an Agent</p>
                  <p className="text-sm text-muted-foreground">Get expert assistance</p>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
