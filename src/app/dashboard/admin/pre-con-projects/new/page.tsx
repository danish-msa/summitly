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
    avgPricePerSqft: "",
    status: "",
    parkingPrice: "",
    parkingPriceDetail: "",
    lockerPrice: "",
    lockerPriceDetail: "",
    assignmentFee: "",
    developmentLevies: "",
    developmentCharges: "",
    
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
    sqftMin: "",
    sqftMax: "",
    hasDen: false,
    hasStudio: false,
    hasLoft: false,
    hasWorkLiveLoft: false,
    totalUnits: "",
    availableUnits: "",
    suites: "",
    storeys: "",
    height: "",
    maintenanceFeesPerSqft: "",
    maintenanceFeesDetail: "",
    floorPremiums: "",
    
    // Completion
    occupancyDate: "",
    completionProgress: "",
    promotions: "",
    ownershipType: "",
    garage: "",
    basement: "",
    
    // Media
    images: [] as string[],
    pendingImages: [] as Array<{ file: File; preview: string; id: string }>,
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
    salesMarketingCompany: "",
    developmentTeamOverview: "",
    isPublished: false,
    units: [],
  })

  if (session?.user && !isAdmin(session.user.role)) {
    router.push("/dashboard")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First, upload all pending images
      const uploadedImageUrls: string[] = []
      
      if (formData.pendingImages && formData.pendingImages.length > 0) {
        for (const pendingImage of formData.pendingImages) {
          try {
            const uploadFormData = new FormData()
            uploadFormData.append('file', pendingImage.file)

            const uploadResponse = await fetch('/api/admin/upload/image', {
              method: 'POST',
              body: uploadFormData,
            })

            if (!uploadResponse.ok) {
              const error = await uploadResponse.json()
              throw new Error(error.error || `Failed to upload image: ${pendingImage.file.name}`)
            }

            const uploadData = await uploadResponse.json()
            uploadedImageUrls.push(uploadData.path)
          } catch (error) {
            console.error(`Error uploading image ${pendingImage.file.name}:`, error)
            throw new Error(`Failed to upload image: ${pendingImage.file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      // Combine uploaded images with existing image URLs
      const allImages = [...formData.images, ...uploadedImageUrls]

      const payload = {
        projectName: formData.projectName,
        developer: formData.developer,
        startingPrice: formData.startingPrice,
        endingPrice: formData.endingPrice,
        avgPricePerSqft: formData.avgPricePerSqft || null,
        status: formData.status,
        parkingPrice: formData.parkingPrice || null,
        parkingPriceDetail: formData.parkingPriceDetail || null,
        lockerPrice: formData.lockerPrice || null,
        lockerPriceDetail: formData.lockerPriceDetail || null,
        assignmentFee: formData.assignmentFee || null,
        developmentLevies: formData.developmentLevies || null,
        developmentCharges: formData.developmentCharges || null,
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
        sqftRange: formData.sqftMin && formData.sqftMax 
          ? `${formData.sqftMin}-${formData.sqftMax}` 
          : formData.sqftMin || formData.sqftMax || '',
        hasDen: formData.hasDen,
        hasStudio: formData.hasStudio,
        hasLoft: formData.hasLoft,
        hasWorkLiveLoft: formData.hasWorkLiveLoft,
        totalUnits: formData.totalUnits,
        availableUnits: formData.availableUnits,
        suites: formData.suites || null,
        storeys: formData.storeys,
        height: formData.height || null,
        maintenanceFeesPerSqft: formData.maintenanceFeesPerSqft || null,
        maintenanceFeesDetail: formData.maintenanceFeesDetail || null,
        floorPremiums: formData.floorPremiums || null,
        occupancyDate: formData.occupancyDate,
        completionProgress: formData.completionProgress,
        promotions: formData.promotions,
        ownershipType: formData.ownershipType || null,
        garage: formData.garage || null,
        basement: formData.basement || null,
        images: allImages,
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
        salesMarketingCompany: formData.salesMarketingCompany || null,
        developmentTeamOverview: formData.developmentTeamOverview || null,
        isPublished: formData.isPublished === true,
        units: formData.units?.map((unit) => ({
          unitName: unit.unitName,
          beds: parseInt(unit.beds) || 0,
          baths: parseInt(unit.baths) || 0,
          sqft: parseInt(unit.sqft) || 0,
          price: parseFloat(unit.price) || 0,
          maintenanceFee: unit.maintenanceFee ? parseFloat(unit.maintenanceFee) : null,
          status: unit.status,
          studio: unit.studio || false,
          images: Array.isArray(unit.images) ? unit.images : [],
          description: unit.description || null,
          features: unit.features || [],
          amenities: unit.amenities || [],
        })) || [],
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
        const errorMessage = error.message || error.error || "Failed to create project"
        if (error.missingFields && Array.isArray(error.missingFields)) {
          throw new Error(`${errorMessage}\n\nMissing fields: ${error.missingFields.join(', ')}`)
        }
        throw new Error(errorMessage)
      }

      // Clean up preview URLs
      formData.pendingImages?.forEach((img) => {
        URL.revokeObjectURL(img.preview)
      })

      router.push("/dashboard/admin/pre-con-projects")
    } catch (error) {
      console.error("Error creating project:", error)
      const message = error instanceof Error ? error.message : "Failed to create project"
      
      // If the error contains missing fields info, format it nicely
      if (message.includes("Missing fields:")) {
        const lines = message.split("\n\n")
        alert(`${lines[0]}\n\n${lines[1]}`)
      } else {
        alert(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pt-20">
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
