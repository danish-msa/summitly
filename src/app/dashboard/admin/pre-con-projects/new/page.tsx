"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { isAdmin } from "@/lib/roles"

export default function NewProjectPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    mlsNumber: "",
    projectName: "",
    developer: "",
    startingPrice: "",
    status: "selling",
    streetNumber: "",
    streetName: "",
    city: "",
    state: "",
    zip: "",
    country: "Canada",
    neighborhood: "",
    majorIntersection: "",
    latitude: "",
    longitude: "",
    propertyType: "Condominium",
    bedroomRange: "",
    bathroomRange: "",
    sqftRange: "",
    totalUnits: "",
    availableUnits: "",
    storeys: "",
    completionDate: "",
    completionProgress: "0",
    images: [] as string[],
    features: [] as string[],
    amenities: [] as string[],
    depositStructure: "",
    description: "",
  })

  if (session?.user && !isAdmin(session.user.role)) {
    router.push("/dashboard")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/pre-con-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create project")
      }

      router.push("/dashboard/admin/pre-con-projects")
    } catch (error: any) {
      console.error("Error creating project:", error)
      alert(error.message || "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  const handleArrayInput = (field: "images" | "features" | "amenities", value: string) => {
    const items = value.split(",").map((item) => item.trim()).filter(Boolean)
    setFormData((prev) => ({ ...prev, [field]: items }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Pre-Con Project</h1>
          <p className="text-muted-foreground mt-1">
            Create a new pre-construction project
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mlsNumber">MLS Number *</Label>
                <Input
                  id="mlsNumber"
                  value={formData.mlsNumber}
                  onChange={(e) => setFormData({ ...formData, mlsNumber: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="developer">Developer *</Label>
                <Input
                  id="developer"
                  value={formData.developer}
                  onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startingPrice">Starting Price *</Label>
                <Input
                  id="startingPrice"
                  type="number"
                  value={formData.startingPrice}
                  onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="selling">Selling</SelectItem>
                    <SelectItem value="coming-soon">Coming Soon</SelectItem>
                    <SelectItem value="sold-out">Sold Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type *</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Condominium">Condominium</SelectItem>
                    <SelectItem value="Detached">Detached</SelectItem>
                    <SelectItem value="Semi-Detached">Semi-Detached</SelectItem>
                    <SelectItem value="Townhome">Townhome</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="streetNumber">Street Number</Label>
                <Input
                  id="streetNumber"
                  value={formData.streetNumber}
                  onChange={(e) => setFormData({ ...formData, streetNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="streetName">Street Name</Label>
                <Input
                  id="streetName"
                  value={formData.streetName}
                  onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State/Province *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP/Postal Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Neighborhood</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Details */}
        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedroomRange">Bedroom Range *</Label>
                <Input
                  id="bedroomRange"
                  placeholder="e.g., 1-3"
                  value={formData.bedroomRange}
                  onChange={(e) => setFormData({ ...formData, bedroomRange: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathroomRange">Bathroom Range *</Label>
                <Input
                  id="bathroomRange"
                  placeholder="e.g., 1-3"
                  value={formData.bathroomRange}
                  onChange={(e) => setFormData({ ...formData, bathroomRange: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sqftRange">Square Foot Range *</Label>
                <Input
                  id="sqftRange"
                  placeholder="e.g., 650-1,450"
                  value={formData.sqftRange}
                  onChange={(e) => setFormData({ ...formData, sqftRange: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalUnits">Total Units *</Label>
                <Input
                  id="totalUnits"
                  type="number"
                  value={formData.totalUnits}
                  onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableUnits">Available Units *</Label>
                <Input
                  id="availableUnits"
                  type="number"
                  value={formData.availableUnits}
                  onChange={(e) => setFormData({ ...formData, availableUnits: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeys">Storeys</Label>
                <Input
                  id="storeys"
                  type="number"
                  value={formData.storeys}
                  onChange={(e) => setFormData({ ...formData, storeys: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion */}
        <Card>
          <CardHeader>
            <CardTitle>Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="completionDate">Completion Date *</Label>
                <Input
                  id="completionDate"
                  placeholder="e.g., Q4 2025"
                  value={formData.completionDate}
                  onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="completionProgress">Completion Progress (%)</Label>
                <Input
                  id="completionProgress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.completionProgress}
                  onChange={(e) => setFormData({ ...formData, completionProgress: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="depositStructure">Deposit Structure</Label>
              <Textarea
                id="depositStructure"
                value={formData.depositStructure}
                onChange={(e) => setFormData({ ...formData, depositStructure: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="images">Images (comma-separated URLs)</Label>
              <Input
                id="images"
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                onChange={(e) => handleArrayInput("images", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Input
                id="features"
                placeholder="Feature 1, Feature 2, Feature 3"
                onChange={(e) => handleArrayInput("features", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities (comma-separated)</Label>
              <Input
                id="amenities"
                placeholder="Amenity 1, Amenity 2, Amenity 3"
                onChange={(e) => handleArrayInput("amenities", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  )
}

