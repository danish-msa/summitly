"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { isAdmin } from "@/lib/roles"
import { PreConProjectForm, type FormData } from "@/components/Dashboard/PreConProjectForm"

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    projectName: "",
    developer: "",
    startingPrice: "",
    endingPrice: "",
    status: "",
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
    sqftRange: "",
    totalUnits: "",
    availableUnits: "",
    storeys: "",
    completionDate: "",
    completionProgress: "",
    promotions: "",
    images: [] as string[],
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
    developmentTeamOverview: "",
  })

  useEffect(() => {
    if (session?.user && !isAdmin(session.user.role)) {
      router.push("/dashboard")
      return
    }

    if (params?.id) {
      fetchProject()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id, session, router])

  const fetchProject = async () => {
    if (!params?.id) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/pre-con-projects/${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch project")

      const data = await response.json()
      const project = data.project

      setFormData({
        projectName: project.projectName || "",
        developer: project.developer || "",
        startingPrice: project.startingPrice?.toString() || "",
        endingPrice: project.endingPrice?.toString() || "",
        status: project.status || "",
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
        sqftRange: project.sqftRange || "",
        totalUnits: project.totalUnits?.toString() || "",
        availableUnits: project.availableUnits?.toString() || "",
        storeys: project.storeys?.toString() || "",
        completionDate: project.completionDate || "",
        completionProgress: project.completionProgress || "",
        promotions: project.promotions || "",
        images: project.images || [],
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
        developmentTeamOverview: "",
      })
    } catch (error) {
      console.error("Error fetching project:", error)
      alert("Failed to load project")
      router.push("/dashboard/admin/pre-con-projects")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!params?.id) return
    
    setSaving(true)

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

      const response = await fetch(`/api/admin/pre-con-projects/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update project")
      }

      router.push("/dashboard/admin/pre-con-projects")
    } catch (error) {
      console.error("Error updating project:", error)
      const message = error instanceof Error ? error.message : "Failed to update project"
      alert(message)
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
