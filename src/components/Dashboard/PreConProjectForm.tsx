"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface Document {
  id: string
  name: string
  url: string
  type: string
  size?: string
  uploadedDate?: string
}

export interface FormData {
  mlsNumber: string
  projectName: string
  developer: string
  startingPrice: string
  status: string
  streetNumber: string
  streetName: string
  city: string
  state: string
  zip: string
  country: string
  neighborhood: string
  majorIntersection: string
  latitude: string
  longitude: string
  propertyType: string
  bedroomRange: string
  bathroomRange: string
  sqftRange: string
  totalUnits: string
  availableUnits: string
  storeys: string
  completionDate: string
  completionProgress: string
  images: string[]
  imageInput: string
  features: string[]
  featureInput: string
  amenities: string[]
  amenityInput: string
  description: string
  depositStructure: string
  documents: Document[]
  developerInfo: { name: string; description: string; website: string }
  architectInfo: { name: string; description: string; website: string }
  interiorDesignerInfo: { name: string; description: string; website: string }
  builderInfo: { name: string; description: string; website: string }
  landscapeArchitectInfo: { name: string; description: string; website: string }
  marketingInfo: { name: string; description: string; website: string }
  developmentTeamOverview: string
}

interface PreConProjectFormProps {
  formData: FormData
  setFormData: React.Dispatch<React.SetStateAction<FormData>>
  onSubmit: (e: React.FormEvent) => void
  loading?: boolean
  submitLabel?: string
}

export function PreConProjectForm({
  formData,
  setFormData,
  onSubmit,
  loading = false,
  submitLabel = "Create Project",
}: PreConProjectFormProps) {
  const [activeTab, setActiveTab] = useState("basic")

  const addArrayItem = (field: "images" | "features" | "amenities", inputField: "imageInput" | "featureInput" | "amenityInput") => {
    const input = formData[inputField]
    if (!input.trim()) return
    
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], input.trim()],
      [inputField]: "",
    }))
  }

  const removeArrayItem = (field: "images" | "features" | "amenities", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const addDocument = () => {
    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      name: "",
      url: "",
      type: "brochure",
    }
    setFormData((prev) => ({
      ...prev,
      documents: [...prev.documents, newDoc],
    }))
  }

  const updateDocument = (index: number, field: keyof Document, value: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.map((doc, i) =>
        i === index ? { ...doc, [field]: value } : doc
      ),
    }))
  }

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }))
  }

  return (
    <form onSubmit={onSubmit}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="address">Address</TabsTrigger>
          <TabsTrigger value="details">Property Details</TabsTrigger>
          <TabsTrigger value="media">Media & Content</TabsTrigger>
          <TabsTrigger value="team">Development Team</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Essential project details and identification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mlsNumber">MLS Number *</Label>
                  <Input
                    id="mlsNumber"
                    value={formData.mlsNumber}
                    onChange={(e) => setFormData({ ...formData, mlsNumber: e.target.value })}
                    placeholder="e.g., luxury-heights-condominiums"
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address Tab */}
        <TabsContent value="address" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Address & Location</CardTitle>
              <CardDescription>
                Project location and geographic information
              </CardDescription>
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
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
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
                <div className="space-y-2">
                  <Label htmlFor="majorIntersection">Major Intersection</Label>
                  <Input
                    id="majorIntersection"
                    value={formData.majorIntersection}
                    onChange={(e) => setFormData({ ...formData, majorIntersection: e.target.value })}
                    placeholder="e.g., Main Street & King Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="e.g., 43.6532"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="e.g., -79.3832"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Property Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>
                Unit specifications and building information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
        </TabsContent>

        {/* Media & Content Tab */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Project images and media URLs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Image URL"
                  value={formData.imageInput}
                  onChange={(e) => setFormData({ ...formData, imageInput: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addArrayItem("images", "imageInput")
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addArrayItem("images", "imageInput")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.images.map((img, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2">
                    <span className="truncate max-w-[200px]">{img}</span>
                    <button
                      type="button"
                      onClick={() => removeArrayItem("images", index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>
                Key project features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Feature name"
                  value={formData.featureInput}
                  onChange={(e) => setFormData({ ...formData, featureInput: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addArrayItem("features", "featureInput")
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addArrayItem("features", "featureInput")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2">
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeArrayItem("features", index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
              <CardDescription>
                Building and community amenities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Amenity name"
                  value={formData.amenityInput}
                  onChange={(e) => setFormData({ ...formData, amenityInput: e.target.value })}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addArrayItem("amenities", "amenityInput")
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => addArrayItem("amenities", "amenityInput")}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.amenities.map((amenity, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2">
                    {amenity}
                    <button
                      type="button"
                      onClick={() => removeArrayItem("amenities", index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description & Documents</CardTitle>
              <CardDescription>
                Project description and downloadable documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  placeholder="Detailed project description..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depositStructure">Deposit Structure</Label>
                <Textarea
                  id="depositStructure"
                  value={formData.depositStructure}
                  onChange={(e) => setFormData({ ...formData, depositStructure: e.target.value })}
                  rows={2}
                  placeholder="e.g., 5% on signing, 10% within 6 months, 5% at occupancy"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Documents</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addDocument}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </div>
                {formData.documents.map((doc, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-end p-3 border rounded-lg">
                    <Input
                      placeholder="Document name"
                      value={doc.name}
                      onChange={(e) => updateDocument(index, "name", e.target.value)}
                    />
                    <Input
                      placeholder="URL"
                      value={doc.url}
                      onChange={(e) => updateDocument(index, "url", e.target.value)}
                    />
                    <Select
                      value={doc.type}
                      onValueChange={(value) => updateDocument(index, "type", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brochure">Brochure</SelectItem>
                        <SelectItem value="floorplan">Floorplan</SelectItem>
                        <SelectItem value="specification">Specification</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDocument(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Development Team Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Development Team</CardTitle>
              <CardDescription>
                Information about the development team members
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="teamOverview">Team Overview</Label>
                <Textarea
                  id="teamOverview"
                  value={formData.developmentTeamOverview}
                  onChange={(e) => setFormData({ ...formData, developmentTeamOverview: e.target.value })}
                  rows={3}
                  placeholder="Overview of the development team..."
                />
              </div>

              {[
                { key: "developerInfo", label: "Developer" },
                { key: "architectInfo", label: "Architect" },
                { key: "interiorDesignerInfo", label: "Interior Designer" },
                { key: "builderInfo", label: "Builder" },
                { key: "landscapeArchitectInfo", label: "Landscape Architect" },
                { key: "marketingInfo", label: "Marketing" },
              ].map(({ key, label }) => {
                const teamMember = formData[key as keyof typeof formData] as { name: string; description: string; website: string }
                return (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="text-lg">{label}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={teamMember.name}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [key]: { ...teamMember, name: e.target.value },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={teamMember.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [key]: { ...teamMember, description: e.target.value },
                            })
                          }
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input
                          type="url"
                          value={teamMember.website}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [key]: { ...teamMember, website: e.target.value },
                            })
                          }
                          placeholder="https://example.com"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-4 mt-6">
        <Button
          type="submit"
          disabled={loading}
        >
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}

