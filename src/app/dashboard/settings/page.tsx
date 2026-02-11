"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useSession } from 'next-auth/react'

export default function Settings() {
  const { data: session } = useSession()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {session?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'JD'}
                  </AvatarFallback>
                </Avatar>
                <Button variant="secondary">Change Photo</Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue={session?.user?.name?.split(' ')[0] || "John"} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue={session?.user?.name?.split(' ')[1] || "Doe"} className="mt-2" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={session?.user?.email || "john.doe@example.com"} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" defaultValue="+1 (555) 123-4567" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  className="mt-2 w-full min-h-[100px] px-3 py-2 border border-input rounded-lg bg-background"
                  defaultValue="Real estate enthusiast looking for the perfect home."
                />
              </div>
              <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive push notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive text messages</p>
                  </div>
                  <Switch />
                </div>
              </div>
              <div className="pt-4 border-t">
                <h3 className="font-semibold text-foreground mb-4">Notification Frequency</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="frequency" value="immediate" defaultChecked className="accent-primary" />
                    <div>
                      <p className="font-medium text-foreground">Immediate</p>
                      <p className="text-sm text-muted-foreground">Get notified as soon as updates happen</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="frequency" value="daily" className="accent-primary" />
                    <div>
                      <p className="font-medium text-foreground">Daily Digest</p>
                      <p className="text-sm text-muted-foreground">Receive a summary once per day</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="frequency" value="weekly" className="accent-primary" />
                    <div>
                      <p className="font-medium text-foreground">Weekly Summary</p>
                      <p className="text-sm text-muted-foreground">Get updates once a week</p>
                    </div>
                  </label>
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

