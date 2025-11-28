"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { isAdmin } from "@/lib/roles"
import { PreConProjectForm, type FormData } from "@/components/Dashboard/PreConProjectForm"
import { useBackgroundFetch } from "@/hooks/useBackgroundFetch"

// Type for the project returned from the API
interface PreConProject {
  id: string
  mlsNumber: string
  projectName: string
  developer: string
  startingPrice: number
  endingPrice: number | null
  avgPricePerSqft: number | null
  status: string
  parkingPrice: number | null
  parkingPriceDetail: string | null
  lockerPrice: number | null
  lockerPriceDetail: string | null
  assignmentFee: number | null
  developmentLevies: number | null
  developmentCharges: number | null
  streetNumber: string | null
  streetName: string | null
  city: string
  state: string
  zip: string | null
  neighborhood: string | null
  majorIntersection: string | null
  latitude: number | null
  longitude: number | null
  propertyType: string
  subPropertyType: string | null
  bedroomRange: string
  bathroomRange: string
  sqftRange: string
  hasDen: boolean
  hasStudio: boolean
  hasLoft: boolean
  hasWorkLiveLoft: boolean
  totalUnits: number
  availableUnits: number
  suites: number | null
  storeys: number | null
  height: number | null
  maintenanceFeesPerSqft: number | null
  maintenanceFeesDetail: string | null
  floorPremiums: string | null
  occupancyDate: string
  completionProgress: string
  promotions: string | null
  ownershipType: string | null
  garage: string | null
  basement: string | null
  images: string[]
  videos: string[]
  amenities: Array<string | { name: string; icon: string }>
  depositStructure: string | null
  description: string | null
  documents: Array<{ id: string; name: string; url: string; type: string }> | null
  developerInfo: string | null
  architectInfo: string | null
  interiorDesignerInfo: string | null
  builderInfo: string | null
  landscapeArchitectInfo: string | null
  marketingInfo: string | null
  salesMarketingCompany: string | null
  developmentTeamOverview: string | null
  isPublished: boolean
  units?: Array<{
    id: string
    unitName: string
    beds: number
    baths: number
    sqft: number
    price: number
    maintenanceFee: number | null
    status: string
    floorplanImage: string | null
    description: string | null
    features: string[]
    amenities: string[]
  }>
}

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const { loading, fetchData } = useBackgroundFetch<PreConProject>()
  const [saving, setSaving] = useState(false)
  // Track if form has been initially loaded to prevent background updates from overwriting edits
  const formInitializedRef = useRef(false)
  // Track which project ID we've loaded to prevent unnecessary refetches
  const loadedProjectIdRef = useRef<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
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
    streetNumber: "",
    streetName: "",
    city: "",
    state: "",
    zip: "",
    neighborhood: "",
    majorIntersection: "",
    latitude: "",
    longitude: "",
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
    occupancyDate: "",
    completionProgress: "",
    promotions: "",
    ownershipType: "",
    garage: "",
    basement: "",
    images: [] as string[],
    pendingImages: [] as Array<{ file: File; preview: string; id: string }>,
    imageInput: "",
    videos: [] as string[],
    videoInput: "",
    amenities: [] as Array<{ name: string; icon: string }>,
    customAmenities: [] as string[],
    customAmenityInput: "",
    depositStructure: "",
    description: "",
    documents: [] as Array<{ id: string; name: string; url: string; type: string }>,
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

  // Handle auth check separately to avoid unnecessary re-runs
  useEffect(() => {
    if (session?.user && !isAdmin(session.user.role)) {
      router.push("/dashboard")
    }
  }, [session?.user, router])

  // Handle project fetching - only depend on project ID
  useEffect(() => {
    if (!params?.id) return

    // Only reset and fetch if this is a different project than what we've loaded
    // This prevents refetching when switching windows/tabs or when other dependencies change
    if (loadedProjectIdRef.current !== params.id) {
      formInitializedRef.current = false
      loadedProjectIdRef.current = params.id as string
      fetchProject()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id])

  const fetchProject = async () => {
    if (!params?.id) return
    
    try {
      const project = await fetchData(async () => {
        const response = await fetch(`/api/admin/pre-con-projects/${params.id}`)
        if (!response.ok) throw new Error("Failed to fetch project")

        const data = await response.json()
        return data.project as PreConProject
      })

      if (!project) return

      // Only update form data on initial load, not on background refreshes
      // This prevents background updates from overwriting user edits
      if (formInitializedRef.current) {
        // Form already initialized, skip updating to preserve user edits
        return
      }

      formInitializedRef.current = true
      setFormData({
        projectName: project.projectName || "",
        developer: project.developer || "",
        startingPrice: project.startingPrice?.toString() || "",
        endingPrice: project.endingPrice?.toString() || "",
        avgPricePerSqft: project.avgPricePerSqft?.toString() || "",
        status: project.status || "",
        parkingPrice: project.parkingPrice?.toString() || "",
        parkingPriceDetail: project.parkingPriceDetail || "",
        lockerPrice: project.lockerPrice?.toString() || "",
        lockerPriceDetail: project.lockerPriceDetail || "",
        assignmentFee: project.assignmentFee?.toString() || "",
        developmentLevies: project.developmentLevies?.toString() || "",
        developmentCharges: project.developmentCharges?.toString() || "",
        streetNumber: project.streetNumber || "",
        streetName: project.streetName || "",
        city: project.city || "",
        state: project.state || "",
        zip: project.zip || "",
        neighborhood: project.neighborhood || "",
        majorIntersection: project.majorIntersection || "",
        latitude: project.latitude?.toString() || "",
        longitude: project.longitude?.toString() || "",
        propertyType: project.propertyType || "",
        subPropertyType: project.subPropertyType || "",
        bedroomRange: project.bedroomRange || "",
        bathroomRange: project.bathroomRange || "",
        sqftMin: project.sqftRange ? (project.sqftRange.split('-')[0]?.trim() || '') : '',
        sqftMax: project.sqftRange ? (project.sqftRange.split('-')[1]?.trim() || '') : '',
        hasDen: project.hasDen ?? false,
        hasStudio: project.hasStudio ?? false,
        hasLoft: project.hasLoft ?? false,
        hasWorkLiveLoft: project.hasWorkLiveLoft ?? false,
        totalUnits: project.totalUnits?.toString() || "",
        availableUnits: project.availableUnits?.toString() || "",
        suites: project.suites?.toString() || "",
        storeys: project.storeys?.toString() || "",
        height: project.height?.toString() || "",
        maintenanceFeesPerSqft: project.maintenanceFeesPerSqft?.toString() || "",
        maintenanceFeesDetail: project.maintenanceFeesDetail || "",
        floorPremiums: project.floorPremiums || "",
        occupancyDate: project.occupancyDate || "",
        completionProgress: project.completionProgress || "",
        promotions: project.promotions || "",
        ownershipType: project.ownershipType || "",
        garage: project.garage || "",
        basement: project.basement || "",
        images: project.images || [],
        pendingImages: [] as Array<{ file: File; preview: string; id: string }>,
        imageInput: "",
        videos: project.videos || [],
        videoInput: "",
        amenities: Array.isArray(project.amenities) 
          ? project.amenities.filter((a: string | { name: string; icon: string }) => 
              typeof a === 'object' && a !== null && 'icon' in a
            ).map((a: { name: string; icon: string }) => a)
          : [],
        customAmenities: Array.isArray(project.amenities)
          ? project.amenities.filter((a: string | { name: string; icon: string }) => 
              typeof a === 'string'
            )
          : [],
        customAmenityInput: "",
        depositStructure: project.depositStructure || "",
        description: project.description || "",
        documents: project.documents || [],
        developerInfo: project.developerInfo || "",
        architectInfo: project.architectInfo || "",
        interiorDesignerInfo: project.interiorDesignerInfo || "",
        builderInfo: project.builderInfo || "",
        landscapeArchitectInfo: project.landscapeArchitectInfo || "",
        marketingInfo: project.marketingInfo || "",
        salesMarketingCompany: project.salesMarketingCompany || "",
        developmentTeamOverview: project.developmentTeamOverview || "",
        isPublished: project.isPublished ?? false,
        units: project.units?.map((unit) => ({
          id: unit.id,
          unitName: unit.unitName || "",
          beds: unit.beds?.toString() || "",
          baths: unit.baths?.toString() || "",
          sqft: unit.sqft?.toString() || "",
          price: unit.price?.toString() || "",
          maintenanceFee: unit.maintenanceFee?.toString() || "",
          status: unit.status || "for-sale",
          floorplanImage: unit.floorplanImage || "",
          description: unit.description || "",
          features: unit.features || [],
          amenities: unit.amenities || [],
        })) || [],
      })
    } catch (error) {
      console.error("Error fetching project:", error)
      alert("Failed to load project")
      router.push("/dashboard/admin/pre-con-projects")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!params?.id) return
    
    setSaving(true)

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
        avgPricePerSqft: formData.avgPricePerSqft === '' ? null : formData.avgPricePerSqft,
        status: formData.status,
        parkingPrice: formData.parkingPrice === '' ? null : formData.parkingPrice,
        parkingPriceDetail: formData.parkingPriceDetail === '' ? null : formData.parkingPriceDetail,
        lockerPrice: formData.lockerPrice === '' ? null : formData.lockerPrice,
        lockerPriceDetail: formData.lockerPriceDetail === '' ? null : formData.lockerPriceDetail,
        assignmentFee: formData.assignmentFee === '' ? null : formData.assignmentFee,
        developmentLevies: formData.developmentLevies === '' ? null : formData.developmentLevies,
        developmentCharges: formData.developmentCharges === '' ? null : formData.developmentCharges,
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
        maintenanceFeesPerSqft: formData.maintenanceFeesPerSqft === '' ? null : formData.maintenanceFeesPerSqft,
        maintenanceFeesDetail: formData.maintenanceFeesDetail === '' ? null : formData.maintenanceFeesDetail,
        floorPremiums: formData.floorPremiums === '' ? null : formData.floorPremiums,
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
        isPublished: formData.isPublished || false,
        units: formData.units?.map((unit) => ({
          id: unit.id.startsWith('unit-') ? undefined : unit.id, // Don't send ID for new units
          unitName: unit.unitName,
          beds: parseInt(unit.beds) || 0,
          baths: parseInt(unit.baths) || 0,
          sqft: parseInt(unit.sqft) || 0,
          price: parseFloat(unit.price) || 0,
          maintenanceFee: unit.maintenanceFee ? parseFloat(unit.maintenanceFee) : null,
          status: unit.status,
          floorplanImage: unit.floorplanImage || null,
          description: unit.description || null,
          features: unit.features || [],
          amenities: unit.amenities || [],
        })) || [],
      }

      const response = await fetch(`/api/admin/pre-con-projects/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = error.message || error.error || "Failed to update project"
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
      console.error("Error updating project:", error)
      const message = error instanceof Error ? error.message : "Failed to update project"
      
      // If the error contains missing fields info, format it nicely
      if (message.includes("Missing fields:")) {
        const lines = message.split("\n\n")
        alert(`${lines[0]}\n\n${lines[1]}`)
      } else {
        alert(message)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
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
          <h1 className="text-3xl font-bold">Edit Pre-Con Project</h1>
          <p className="text-muted-foreground mt-1">
            Update project information
          </p>
        </div>
      </div>

      <PreConProjectForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        loading={saving}
        submitLabel="Update Project"
        onCancel={() => router.back()}
      />
    </div>
  )
}
