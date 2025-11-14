"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  MapPin, 
  Bed, 
  Bath, 
  Maximize2, 
  Calendar, 
  Clock, 
  User, 
  Video, 
  Phone, 
  Mail,
  Check,
  X
} from "lucide-react"
import { PropertyListing } from "@/lib/types"

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

interface Tour {
  id: string
  userId: string
  mlsNumber: string
  tourType: 'IN_PERSON' | 'VIDEO_CHAT'
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

interface TourDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tour: Tour | null
  property: PropertyListing | null
  isLoading: boolean
  onApprove: (tourId: string) => Promise<void>
  onCancel: (tourId: string) => Promise<void>
  isProcessing: boolean
}

export function TourDetailsDialog({
  open,
  onOpenChange,
  tour,
  property,
  isLoading,
  onApprove,
  onCancel,
  isProcessing,
}: TourDetailsDialogProps) {
  if (!tour) return null

  const scheduledDate = new Date(tour.scheduledDate)
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatSqft = (sqft: number | string | undefined) => {
    if (!sqft) return 'N/A'
    const num = typeof sqft === 'string' ? parseInt(sqft.replace(/,/g, '')) : sqft
    return new Intl.NumberFormat('en-US').format(num)
  }

  const getAddress = () => {
    if (property?.address?.location) {
      return property.address.location
    }
    if (property?.address) {
      const addr = property.address
      return `${addr.streetNumber || ''} ${addr.streetName || ''} ${addr.streetSuffix || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.zip || ''}`.trim()
    }
    return 'Address not available'
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-2xl font-bold">Tour Request Details</DialogTitle>
            <Badge 
              className={getStatusColor(tour.status)}
            >
              {tour.status}
            </Badge>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">Loading property details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Property Details Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Property Information</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="text-sm font-medium">{getAddress()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">MLS Number:</span>
                  <span className="text-sm font-medium">{tour.mlsNumber}</span>
                </div>

                {property && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <Bed className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Bedrooms</p>
                          <p className="text-sm font-medium">
                            {property.details?.numBedrooms || property.details?.numBedroomsPlus || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bath className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Bathrooms</p>
                          <p className="text-sm font-medium">
                            {property.details?.numBathrooms || property.details?.numBathroomsPlus || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Maximize2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Area</p>
                          <p className="text-sm font-medium">
                            {formatSqft(property.details?.sqft)} sqft
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(property.listPrice || 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Tour Details and Contact Information Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tour Details Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Tour Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="text-sm font-medium">{formatDate(scheduledDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="text-sm font-medium">{formatTime(scheduledDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {tour.tourType === 'VIDEO_CHAT' ? (
                      <Video className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Tour Type</p>
                      <Badge variant="outline" className="mt-1">
                        {tour.tourType === 'VIDEO_CHAT' ? 'Video Chat' : 'In-Person'}
                      </Badge>
                    </div>
                  </div>


                  {tour.preApproval && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Pre-approval requested</strong> - User wants pre-approval information from Summitly Home Loans
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="text-sm font-medium">{tour.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{tour.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{tour.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {tour.status === 'PENDING' && (
              <>
                <Separator />
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => onCancel(tour.id)}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={() => onApprove(tour.id)}
                    disabled={isProcessing}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

