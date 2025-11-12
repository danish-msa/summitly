"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const notificationSettings = [
  {
    category: "Watch Property",
    items: [
      { id: "watch-price", label: "Price changes on watched properties", enabled: true },
      { id: "watch-status", label: "Status updates on watched properties", enabled: true },
    ],
  },
  {
    category: "New Listings",
    items: [
      { id: "new-single", label: "Single Family Homes in Downtown", enabled: true },
      { id: "new-condo", label: "Condos in Suburbs", enabled: false },
      { id: "new-multi", label: "Multi-family properties in All areas", enabled: true },
    ],
  },
  {
    category: "Sold Listings",
    items: [
      { id: "sold-single", label: "Single Family Homes in Downtown", enabled: false },
      { id: "sold-condo", label: "Condos in Suburbs", enabled: true },
    ],
  },
  {
    category: "Expired Listings",
    items: [
      { id: "exp-single", label: "Single Family Homes in Downtown", enabled: false },
      { id: "exp-condo", label: "Condos in All areas", enabled: false },
    ],
  },
]

export default function NotificationPreferences() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Notification Preferences</h2>
        <p className="text-muted-foreground">Customize how you receive alerts and updates</p>
      </div>
      <div className="space-y-6">
        {notificationSettings.map((section) => (
          <Card key={section.category} className="shadow-md">
            <CardHeader>
              <CardTitle>{section.category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <Label htmlFor={item.id} className="cursor-pointer flex-1">
                    {item.label}
                  </Label>
                  <Switch id={item.id} defaultChecked={item.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Custom Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="custom-location">Location</Label>
              <Input id="custom-location" placeholder="Enter area or zip code" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="custom-type">Property Type</Label>
              <Input id="custom-type" placeholder="e.g., Single Family, Condo" className="mt-2" />
            </div>
            <button className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium">
              Add Custom Alert
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

