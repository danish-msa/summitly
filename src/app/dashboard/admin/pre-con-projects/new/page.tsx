"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import { isAdmin } from "@/lib/roles"
import { PreConProjectForm, type FormData, type Document } from "@/components/Dashboard/PreConProjectForm"

export default function NewProjectPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    // Basic Information
    mlsNumber: "",
    projectName: "",
    developer: "",
    startingPrice: "",
    status: "selling",
    
    // Address
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
    
    // Property Details
    propertyType: "Condominium",
    bedroomRange: "",
    bathroomRange: "",
    sqftRange: "",
    totalUnits: "",
    availableUnits: "",
    storeys: "",
    
    // Completion
    completionDate: "",
    completionProgress: "0",
    
    // Media
    images: [] as string[],
    imageInput: "",
    
    // Features & Amenities
    features: [] as string[],
    featureInput: "",
    amenities: [] as string[],
    amenityInput: "",
    
    // Description & Documents
    description: "",
    depositStructure: "",
    documents: [] as Document[],
    
    // Development Team
    developerInfo: {
      name: "",
      description: "",
      website: "",
    },
    architectInfo: {
      name: "",
      description: "",
      website: "",
    },
    interiorDesignerInfo: {
      name: "",
      description: "",
      website: "",
    },
    builderInfo: {
      name: "",
      description: "",
      website: "",
    },
    landscapeArchitectInfo: {
      name: "",
      description: "",
      website: "",
    },
    marketingInfo: {
      name: "",
      description: "",
      website: "",
    },
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
        mlsNumber: formData.mlsNumber,
        projectName: formData.projectName,
        developer: formData.developer,
        startingPrice: formData.startingPrice,
        status: formData.status,
        streetNumber: formData.streetNumber,
        streetName: formData.streetName,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        neighborhood: formData.neighborhood,
        majorIntersection: formData.majorIntersection,
        latitude: formData.latitude,
        longitude: formData.longitude,
        propertyType: formData.propertyType,
        bedroomRange: formData.bedroomRange,
        bathroomRange: formData.bathroomRange,
        sqftRange: formData.sqftRange,
        totalUnits: formData.totalUnits,
        availableUnits: formData.availableUnits,
        storeys: formData.storeys,
        completionDate: formData.completionDate,
        completionProgress: formData.completionProgress,
        images: formData.images,
        features: formData.features,
        amenities: formData.amenities,
        depositStructure: formData.depositStructure,
        description: formData.description,
        documents: formData.documents.length > 0 ? formData.documents : null,
        developerInfo: formData.developerInfo.name ? formData.developerInfo : null,
        architectInfo: formData.architectInfo.name ? formData.architectInfo : null,
        builderInfo: formData.builderInfo.name ? formData.builderInfo : null,
        interiorDesignerInfo: formData.interiorDesignerInfo.name ? formData.interiorDesignerInfo : null,
        landscapeArchitectInfo: formData.landscapeArchitectInfo.name ? formData.landscapeArchitectInfo : null,
        marketingInfo: formData.marketingInfo.name ? formData.marketingInfo : null,
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
      />
      
      <div className="flex justify-end gap-4 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
