"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Save } from "lucide-react"
import { isAdmin } from "@/lib/roles"
import { PreConProjectForm, type FormData, type Document } from "@/components/Dashboard/PreConProjectForm"
import { Badge } from "@/components/ui/badge"

export default function NewProjectPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [isDraftSaving, setIsDraftSaving] = useState(false)
  const [lastDraftSaved, setLastDraftSaved] = useState<Date | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoSavingRef = useRef(false)
  
  // Initialize form data
  const getInitialFormData = (): FormData => {
    return {
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
  }
  }

  const [formData, setFormData] = useState<FormData>(getInitialFormData)

  // Check for existing draft on mount (if user navigated back)
  useEffect(() => {
    const checkForDraft = async () => {
      try {
        // Check URL params for draft ID
        const urlParams = new URLSearchParams(window.location.search)
        const draftIdParam = urlParams.get('draftId')
        
        if (draftIdParam) {
          // Load existing draft
          const response = await fetch(`/api/admin/pre-con-projects/${draftIdParam}`)
          if (response.ok) {
            const data = await response.json()
            const project = data.project
            
            if (project && !project.isPublished) {
              setDraftId(project.id)
              // Convert project data to form data format
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
                developmentLevies: project.developmentLevies || "",
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
                pendingImages: [],
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
                units: project.units?.map((unit: {
                  id: string
                  unitName: string
                  beds: number
                  baths: number
                  sqft: number
                  price: number
                  maintenanceFee: number | null
                  status: string
                  studio: boolean
                  images: string[]
                  description: string | null
                  features: string[]
                  amenities: string[]
                }) => ({
                  id: unit.id,
                  unitName: unit.unitName || "",
                  beds: unit.beds?.toString() || "",
                  baths: unit.baths?.toString() || "",
                  sqft: unit.sqft?.toString() || "",
                  price: unit.price?.toString() || "",
                  maintenanceFee: unit.maintenanceFee?.toString() || "",
                  status: unit.status || "for-sale",
                  studio: unit.studio ?? false,
                  images: Array.isArray(unit.images) ? unit.images : [],
                  pendingImages: [],
                  description: unit.description || "",
                  features: unit.features || [],
                  amenities: unit.amenities || [],
                })) || [],
              })
              setLastDraftSaved(new Date(project.updatedAt))
            }
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error)
      } finally {
        setHasInitialized(true)
      }
    }

    checkForDraft()
  }, [])

  // Auto-draft functionality - saves to database as draft
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true)
      return
    }

    // Skip auto-save if form is empty (no project name)
    if (!formData.projectName || formData.projectName.trim() === '') {
      return
    }

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Debounce auto-save (3 seconds)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      if (isAutoSavingRef.current) return

      try {
        isAutoSavingRef.current = true
        setIsDraftSaving(true)

        const draftPayload = {
          ...(draftId && { draftId }),
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
          images: formData.images, // Only saved images, not pending ones
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
          isPublished: false, // Always save as draft
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

        const response = await fetch('/api/admin/pre-con-projects/draft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(draftPayload),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.id && !draftId) {
            setDraftId(data.id)
          }
          setLastDraftSaved(new Date())
        }
      } catch (error) {
        console.error('Auto-draft error:', error)
        // Silently fail - don't interrupt user
      } finally {
        setIsDraftSaving(false)
        isAutoSavingRef.current = false
      }
    }, 3000) // 3 seconds debounce

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [formData, draftId, hasInitialized])

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

      // If we have a draft, update it to published. Otherwise create new.
      const url = draftId 
        ? `/api/admin/pre-con-projects/${draftId}`
        : "/api/admin/pre-con-projects"
      const method = draftId ? "PUT" : "POST"

      const finalPayload = {
        ...payload,
        isPublished: formData.isPublished === true, // Use checkbox value
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalPayload),
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = error.message || error.error || "Failed to save project"
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

  // Format time ago for draft status
  const getTimeAgo = (date: Date | null): string => {
    if (!date) return ''
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  return (
    <div className="space-y-6 pt-20">
      <div className="flex items-center justify-between">
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
        
        {/* Draft Status Indicator */}
        {draftId && (
          <div className="flex items-center gap-2">
            {isDraftSaving ? (
              <Badge variant="outline" className="gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                Saving draft...
              </Badge>
            ) : lastDraftSaved ? (
              <Badge variant="outline" className="gap-2">
                <Save className="h-3 w-3" />
                Draft saved {getTimeAgo(lastDraftSaved)}
              </Badge>
            ) : null}
          </div>
        )}
      </div>

      <PreConProjectForm
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel={draftId ? "Publish Project" : "Create Project"}
        onCancel={() => router.back()}
      />
    </div>
  )
}
