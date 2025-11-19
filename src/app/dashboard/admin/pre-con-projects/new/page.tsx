"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { isAdmin } from "@/lib/roles"
import { PreConProjectForm, type FormData, type Document } from "@/components/Dashboard/PreConProjectForm"

export default function NewProjectPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    // Basic Information
    projectName: "",
    developer: "",
    startingPrice: "",
    endingPrice: "",
    status: "",
    
    // Address
    streetNumber: "",
    streetName: "",
    city: "",
    state: "",
    zip: "",
    neighborhood: "",
    majorIntersection: "",
    latitude: "",
    longitude: "",
    
    // Property Details
    propertyType: "",
    subPropertyType: "",
    bedroomRange: "",
    bathroomRange: "",
    sqftRange: "",
    totalUnits: "",
    availableUnits: "",
    storeys: "",
    
    // Completion
    completionDate: "",
    completionProgress: "",
    promotions: "",
    
    // Media
    images: [] as string[],
    imageInput: "",
    videos: [] as string[],
    videoInput: "",
    
    // Amenities
    amenities: [] as Array<{ name: string; icon: string }>,
    customAmenities: [] as string[],
    customAmenityInput: "",
    
    // Description & Documents
    description: "",
    depositStructure: "",
    documents: [] as Document[],
    
    // Development Team (stored as developer IDs)
    developerInfo: "",
    architectInfo: "",
    interiorDesignerInfo: "",
    builderInfo: "",
    landscapeArchitectInfo: "",
    marketingInfo: "",
    developmentTeamOverview: "",
  })

  if (session?.user && !isAdmin(session.user.role)) {
    router.push("/dashboard")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        projectName: formData.projectName,
        developer: formData.developer,
        startingPrice: formData.startingPrice,
        endingPrice: formData.endingPrice,
        status: formData.status,
        streetNumber: formData.streetNumber,
        streetName: formData.streetName,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: "Canada",
        neighborhood: formData.neighborhood,
        majorIntersection: formData.majorIntersection,
        latitude: formData.latitude,
        longitude: formData.longitude,
        propertyType: formData.propertyType,
        subPropertyType: formData.subPropertyType,
        bedroomRange: formData.bedroomRange,
        bathroomRange: formData.bathroomRange,
        sqftRange: formData.sqftRange,
        totalUnits: formData.totalUnits,
        availableUnits: formData.availableUnits,
        storeys: formData.storeys,
        completionDate: formData.completionDate,
        completionProgress: formData.completionProgress,
        promotions: formData.promotions,
        images: formData.images,
        videos: formData.videos,
        amenities: formData.amenities,
        customAmenities: formData.customAmenities,
        depositStructure: formData.depositStructure,
        description: formData.description,
        documents: formData.documents.length > 0 ? formData.documents : null,
        developerInfo: formData.developerInfo || null,
        architectInfo: formData.architectInfo || null,
        builderInfo: formData.builderInfo || null,
        interiorDesignerInfo: formData.interiorDesignerInfo || null,
        landscapeArchitectInfo: formData.landscapeArchitectInfo || null,
        marketingInfo: formData.marketingInfo || null,
      }

      const response = await fetch("/api/admin/pre-con-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create project")
      }

      router.push("/dashboard/admin/pre-con-projects")
    } catch (error) {
      console.error("Error creating project:", error)
      const message = error instanceof Error ? error.message : "Failed to create project"
      alert(message)
    } finally {
      setLoading(false)
    }
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

      <PreConProjectForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel="Create Project"
        onCancel={() => router.back()}
      />
    </div>
  )
}
