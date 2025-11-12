"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, TrendingUp, Heart, Calendar } from "lucide-react"
import { useSavedProperties } from '@/hooks/useSavedProperties'
import { useAllPropertyAlerts } from '@/hooks/usePropertyAlerts'
import Link from 'next/link'

const stats = [
  {
    title: "Active Listings",
    value: "12",
    icon: Home,
    change: "+2 this week",
    color: "text-primary",
  },
  {
    title: "Saved Properties",
    value: "28",
    icon: Heart,
    change: "+5 new",
    color: "text-accent",
  },
  {
    title: "Avg. Property Value",
    value: "$425K",
    icon: TrendingUp,
    change: "+3.2% this month",
    color: "text-green-600",
  },
  {
    title: "Upcoming Tours",
    value: "4",
    icon: Calendar,
    change: "Next: Tomorrow 2PM",
    color: "text-blue-600",
  },
]

const recentActivity = [
  { action: "New property saved", property: "123 Oak Street", time: "2 hours ago" },
  { action: "Price drop alert", property: "456 Maple Ave", time: "5 hours ago" },
  { action: "Tour scheduled", property: "789 Pine Road", time: "1 day ago" },
  { action: "New listing match", property: "321 Elm Boulevard", time: "2 days ago" },
]

export default function DashboardHome() {
  const { savedProperties } = useSavedProperties()
  const { alerts } = useAllPropertyAlerts()

  // Update stats with real data
  const updatedStats = stats.map(stat => {
    if (stat.title === "Saved Properties") {
      return { ...stat, value: savedProperties.length.toString() }
    }
    if (stat.title === "Upcoming Tours") {
      return { ...stat, value: alerts.length.toString() }
    }
    return stat
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Welcome back!</h2>
        <p className="text-muted-foreground">Here's an overview of your real estate activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {updatedStats.map((stat) => (
          <Card key={stat.title} className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
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
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between border-b last:border-0 pb-3 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.property}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Link href="/listings">
                <button className="w-full p-4 text-left rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
                  <p className="font-medium">Search New Properties</p>
                  <p className="text-sm text-muted-foreground">Find your dream home</p>
                </button>
              </Link>
              <Link href="/dashboard/tours">
                <button className="w-full p-4 text-left rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
                  <p className="font-medium">Schedule a Tour</p>
                  <p className="text-sm text-muted-foreground">Book a property viewing</p>
                </button>
              </Link>
              <Link href="/find-an-agent">
                <button className="w-full p-4 text-left rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors">
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
