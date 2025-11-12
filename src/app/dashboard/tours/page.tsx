"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"

const tours = [
  {
    id: 1,
    property: "Modern Family Home",
    address: "123 Oak Street, San Francisco, CA",
    date: "Tomorrow",
    time: "2:00 PM",
    agent: "Sarah Johnson",
    status: "Confirmed",
  },
  {
    id: 2,
    property: "Luxury Condo",
    address: "456 Maple Ave, Los Angeles, CA",
    date: "Dec 20, 2024",
    time: "10:00 AM",
    agent: "Mike Chen",
    status: "Pending",
  },
]

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

export default function Tours() {
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
          <div className="space-y-4">
            {tours.map((tour) => (
              <Card key={tour.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-bold text-lg text-foreground">{tour.property}</h3>
                        <Badge
                          className={
                            tour.status === "Confirmed"
                              ? "bg-green-600 text-white"
                              : "bg-yellow-600 text-white"
                          }
                        >
                          {tour.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{tour.address}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">{tour.date}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{tour.time}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Agent: {tour.agent}</p>
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
    </div>
  )
}

