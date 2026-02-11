"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Video, User } from "lucide-react"
import { useTours } from "@/hooks/useTours"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { useState } from "react"
import { TourDetailsDialog } from "@/components/Dashboard/TourDetailsDialog"
import { getListingDetails } from "@/lib/api/repliers/services/listings"
import { PropertyListing } from "@/lib/types"
import { getPropertyUrl } from "@/lib/utils/propertyUrl"

// Tour type from useTours hook
interface Tour {
  id: string
  userId: string
  mlsNumber: string
  tourType: 'IN_PERSON' | 'VIDEO_CHAT' | 'SELF_GUIDED'
  scheduledDate: Date | string
  name: string
  phone: string
  email: string
  preApproval: boolean
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  notes?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

const appointments = [
  {
    id: 1,
    type: "Consultation",
    agent: "Emily Davis",
    date: "Dec 22, 2024",
    time: "3:00 PM",
    purpose: "Investment Portfolio Review",
    status: "Confirmed",
  },
  {
    id: 2,
    type: "Document Signing",
    agent: "James Wilson",
    date: "Dec 25, 2024",
    time: "11:00 AM",
    purpose: "Purchase Agreement - 789 Pine Road",
    status: "Confirmed",
  },
]

// Format date for display
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const todayStr = now.toDateString()
  const tomorrowStr = tomorrow.toDateString()
  const dateStr = d.toDateString()
  
  if (dateStr === todayStr) {
    return "Today"
  } else if (dateStr === tomorrowStr) {
    return "Tomorrow"
  } else {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
}

// Format time for display
const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function Tours() {
  const { tours, isLoading, deleteTour, isDeleting, updateTour, isUpdating } = useTours()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [property, setProperty] = useState<PropertyListing | null>(null)
  const [isLoadingProperty, setIsLoadingProperty] = useState(false)

  const handleCancelTour = async (tourId: string) => {
    if (!confirm('Are you sure you want to cancel this tour?')) {
      return
    }

    try {
      setDeletingId(tourId)
      await deleteTour(tourId)
      toast({
        title: "Tour Cancelled",
        description: "Your tour has been cancelled successfully.",
        variant: "default",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to cancel tour. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-600 text-white"
      case "PENDING":
        return "bg-yellow-600 text-white"
      case "COMPLETED":
        return "bg-blue-600 text-white"
      case "CANCELLED":
        return "bg-gray-600 text-white"
      default:
        return "bg-gray-600 text-white"
    }
  }

  const handleViewRequest = async (tour: Tour) => {
    setSelectedTour(tour)
    setIsDialogOpen(true)
    setIsLoadingProperty(true)
    
    try {
      const propertyData = await getListingDetails(tour.mlsNumber)
      setProperty(propertyData)
    } catch (error) {
      console.error('Failed to fetch property details:', error)
      toast({
        title: "Error",
        description: "Failed to load property details.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingProperty(false)
    }
  }

  const handleApprove = async (tourId: string) => {
    try {
      await updateTour({ id: tourId, data: { status: 'CONFIRMED' } })
      toast({
        title: "Tour Approved",
        description: "The tour has been approved successfully.",
        variant: "default",
      })
      setIsDialogOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to approve tour. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleCancelFromDialog = async (tourId: string) => {
    try {
      await updateTour({ id: tourId, data: { status: 'CANCELLED' } })
      toast({
        title: "Tour Cancelled",
        description: "The tour has been cancelled successfully.",
        variant: "default",
      })
      setIsDialogOpen(false)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to cancel tour. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Tours & Appointments</h2>
        <p className="text-muted-foreground">Manage your scheduled tours and appointments</p>
      </div>

      <Tabs defaultValue="tours" className="w-full">
        <TabsList>
          <TabsTrigger value="tours">Property Tours</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="tours" className="mt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading tours...</p>
            </div>
          ) : tours.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No tours scheduled</h3>
              <p className="text-muted-foreground mb-4">You haven't scheduled any property tours yet.</p>
              <Link href="/listings">
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                  Browse Properties
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {tours.map((tour) => {
                const scheduledDate = new Date(tour.scheduledDate)
                const isPast = scheduledDate < new Date()
                
                return (
                  <Card key={tour.id} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <h3 className="font-bold text-lg text-foreground">
                              Property Tour
                            </h3>
                            <Badge className={getStatusColor(tour.status)}>
                              {tour.status}
                            </Badge>
                            {tour.tourType === 'VIDEO_CHAT' && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Video className="h-3 w-3" />
                                Video Chat
                              </Badge>
                            )}
                            {tour.tourType === 'IN_PERSON' && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                In-Person
                              </Badge>
                            )}
                            {tour.tourType === 'SELF_GUIDED' && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Self-guided
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="text-sm">MLS: {tour.mlsNumber}</span>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">{formatDate(scheduledDate)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">{formatTime(scheduledDate)}</span>
                              </div>
                            </div>
                            {tour.preApproval && (
                              <p className="text-sm text-muted-foreground">
                                Pre-approval requested
                              </p>
                            )}
                            {isPast && tour.status !== 'COMPLETED' && tour.status !== 'CANCELLED' && (
                              <p className="text-sm text-yellow-600 font-medium">
                                This tour was scheduled for the past
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleViewRequest(tour)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                          >
                            View Request
                          </button>
                          {tour.mlsNumber && (
                            <Link href={getPropertyUrl({ mlsNumber: tour.mlsNumber })}>
                              <button className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted">
                                View Property
                              </button>
                            </Link>
                          )}
                          {tour.status !== 'CANCELLED' && !isPast && (
                            <button
                              onClick={() => handleCancelTour(tour.id)}
                              disabled={deletingId === tour.id || isDeleting}
                              className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 disabled:opacity-50"
                            >
                              {deletingId === tour.id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="appointments" className="mt-6">
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-bold text-lg text-foreground">{appointment.type}</h3>
                        <Badge className="bg-green-600 text-white">{appointment.status}</Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-foreground font-medium">{appointment.purpose}</p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">{appointment.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{appointment.time}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">With: {appointment.agent}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                        Reschedule
                      </button>
                      <button className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10">
                        Cancel
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tour Details Dialog */}
      <TourDetailsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        tour={selectedTour}
        property={property}
        isLoading={isLoadingProperty}
        onApprove={handleApprove}
        onCancel={handleCancelFromDialog}
        isProcessing={isUpdating}
      />
    </div>
  )
}

