"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import { isAdmin } from "@/lib/roles"
import { useBackgroundFetch } from "@/hooks/useBackgroundFetch"
import { FAQField } from "@/components/Dashboard/FAQField"
import { RichTextEditor } from "@/components/Dashboard/RichTextEditor"
import type { FaqItem } from "@/components/common/FAQ"

type LocationType = 'by-city' | 'by-area' | 'by-neighbourhood' | 'by-intersection' | 'by-communities'

interface PageContent {
  id: string
  pageType: string
  pageValue: string
  locationType: string | null
  parentId: string | null
  title: string | null
  description: string | null
  heroImage: string | null
  metaTitle: string | null
  metaDescription: string | null
  customContent: string | null
  faqs: string | null
  isPublished: boolean
}

interface LocationOption {
  id: string
  pageValue: string
  locationType: LocationType
  title: string | null
  children?: LocationOption[]
  level: number
}

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  'by-city': 'City',
  'by-area': 'Area',
  'by-neighbourhood': 'Neighbourhood',
  'by-intersection': 'Intersection',
  'by-communities': 'Community'
}

const LOCATION_HIERARCHY: Record<LocationType, LocationType | null> = {
  'by-city': null, // Top level
  'by-area': 'by-city',
  'by-neighbourhood': 'by-area',
  'by-intersection': 'by-neighbourhood',
  'by-communities': null // Top level (separate from city hierarchy)
}

export default function EditLocationPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const { loading, fetchData } = useBackgroundFetch<PageContent>()
  const [saving, setSaving] = useState(false)
  const [allLocations, setAllLocations] = useState<PageContent[]>([])
  const formInitializedRef = useRef(false)
  const isNewPage = params?.id === 'new'
  
  const [formData, setFormData] = useState({
    locationType: '' as LocationType | '',
    pageValue: '',
    parentId: '',
    title: "",
    description: "",
    heroImage: "",
    metaTitle: "",
    metaDescription: "",
    customContent: "",
    faqs: [] as FaqItem[],
    isPublished: false,
  })

  useEffect(() => {
    if (session?.user && !isAdmin(session.user.role)) {
      router.push("/dashboard")
    }
  }, [session?.user, router])

  useEffect(() => {
    fetchAllLocations()
    if (!isNewPage && params?.id) {
      fetchPageContent(params.id as string)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id, isNewPage])

  const fetchAllLocations = async () => {
    try {
      const response = await fetch("/api/admin/pre-con-projects/page-content?pageType=by-location")
      if (response.ok) {
        const data = await response.json()
        setAllLocations(data.pageContents || [])
      }
    } catch (error) {
      console.error("Error fetching locations:", error)
    }
  }

  const fetchPageContent = async (id: string) => {
    try {
      const content = await fetchData(async () => {
        const response = await fetch(`/api/admin/pre-con-projects/page-content?id=${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            return null
          }
          throw new Error("Failed to fetch page content")
        }
        const data = await response.json()
        return data.pageContent as PageContent
      })

      if (formInitializedRef.current) return
      formInitializedRef.current = true
      
      if (content) {
        let parsedFaqs: FaqItem[] = [];
        if (content.faqs) {
          try {
            parsedFaqs = JSON.parse(content.faqs);
          } catch (e) {
            console.error("Error parsing FAQs:", e);
          }
        }
        setFormData({
          locationType: (content.locationType as LocationType) || '',
          pageValue: content.pageValue || '',
          parentId: content.parentId || '',
          title: content.title || "",
          description: content.description || "",
          heroImage: content.heroImage || "",
          metaTitle: content.metaTitle || "",
          metaDescription: content.metaDescription || "",
          customContent: content.customContent || "",
          faqs: parsedFaqs,
          isPublished: content.isPublished || false,
        })
      }
    } catch (error) {
      console.error("Error fetching page content:", error)
    }
  }

  const buildLocationTree = (): LocationOption[] => {
    const locationsMap = new Map<string, LocationOption>()
    const rootLocations: LocationOption[] = []

    // First pass: create all location nodes
    allLocations.forEach(loc => {
      if (loc.locationType && loc.pageType === 'by-location') {
        locationsMap.set(loc.id, {
          id: loc.id,
          pageValue: loc.pageValue,
          locationType: loc.locationType as LocationType,
          title: loc.title,
          children: [],
          level: 0
        })
      }
    })

    // Second pass: build hierarchy
    allLocations.forEach(loc => {
      if (loc.locationType && loc.pageType === 'by-location') {
        const node = locationsMap.get(loc.id)!
        if (loc.parentId) {
          const parent = locationsMap.get(loc.parentId)
          if (parent) {
            if (!parent.children) parent.children = []
            parent.children.push(node)
            node.level = parent.level + 1
          } else {
            rootLocations.push(node)
          }
        } else {
          rootLocations.push(node)
        }
      }
    })

    return rootLocations
  }

  const getValidParents = (locationType: LocationType): LocationOption[] => {
    const parentType = LOCATION_HIERARCHY[locationType]
    if (!parentType) return []
    
    const tree = buildLocationTree()
    const validParents: LocationOption[] = []
    
    const collectParents = (nodes: LocationOption[]) => {
      nodes.forEach(node => {
        if (node.locationType === parentType) {
          validParents.push(node)
        }
        if (node.children) {
          collectParents(node.children)
        }
      })
    }
    
    collectParents(tree)
    return validParents
  }

  const renderLocationTree = (nodes: LocationOption[], selectedId: string, onSelect: (id: string) => void, excludeId?: string) => {
    return (
      <div className="space-y-1">
        {nodes.map(node => {
          if (node.id === excludeId) return null
          const isSelected = node.id === selectedId
          const hasChildren = node.children && node.children.length > 0
          
          return (
            <div key={node.id} className="pl-4">
              <div
                className={`flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer ${
                  isSelected ? 'bg-primary/10 border border-primary' : ''
                }`}
                onClick={() => onSelect(node.id)}
              >
                <span className="text-sm font-medium">
                  {node.title || node.pageValue} ({LOCATION_TYPE_LABELS[node.locationType]})
                </span>
              </div>
              {hasChildren && (
                <div className="ml-4 mt-1">
                  {renderLocationTree(node.children!, selectedId, onSelect, excludeId)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.locationType || !formData.pageValue) {
      alert("Please select location type and enter page value")
      return
    }
    
    setSaving(true)

    try {
      interface PageContentPayload {
        id?: string;
        pageType: string;
        pageValue: string;
        locationType: LocationType | '';
        parentId: string | null;
        title: string | null;
        description: string | null;
        heroImage: string | null;
        metaTitle: string | null;
        metaDescription: string | null;
        customContent: string | null;
        faqs: string | null;
        isPublished: boolean;
      }

      const payload: PageContentPayload = {
        pageType: "by-location",
        pageValue: formData.pageValue,
        locationType: formData.locationType,
        parentId: formData.parentId || null,
        title: formData.title || null,
        description: formData.description || null,
        heroImage: formData.heroImage || null,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        customContent: formData.customContent || null,
        faqs: formData.faqs.length > 0 ? JSON.stringify(formData.faqs) : null,
        isPublished: formData.isPublished,
      }

      if (!isNewPage && params?.id) {
        payload.id = params.id as string
      }

      const response = await fetch("/api/admin/pre-con-projects/page-content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save page content")
      }

      router.push("/dashboard/admin/pre-con-projects/by-location")
    } catch (error) {
      console.error("Error saving page content:", error)
      const message = error instanceof Error ? error.message : "Failed to save page content"
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading && !isNewPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const validParents = formData.locationType ? getValidParents(formData.locationType) : []
  const locationTree = buildLocationTree()

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isNewPage ? "Create Location Page" : "Edit Location Page"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isNewPage ? "Create a new location page" : "Customize page content"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Location Settings</CardTitle>
            <CardDescription>
              Configure the location type and hierarchy for this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationType">Location Type *</Label>
                <Select
                  value={formData.locationType}
                  onValueChange={(value) => {
                    setFormData({ ...formData, locationType: value as LocationType, parentId: '' })
                  }}
                  disabled={!isNewPage}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="by-city">City</SelectItem>
                    <SelectItem value="by-area">Area</SelectItem>
                    <SelectItem value="by-neighbourhood">Neighbourhood</SelectItem>
                    <SelectItem value="by-intersection">Intersection</SelectItem>
                    <SelectItem value="by-communities">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pageValue">Page Value *</Label>
                <Input
                  id="pageValue"
                  className="rounded-lg"
                  value={formData.pageValue}
                  onChange={(e) => setFormData({ ...formData, pageValue: e.target.value })}
                  placeholder="e.g., Toronto, Downtown, Yonge-Eglinton"
                  required
                />
              </div>
            </div>

            {formData.locationType && LOCATION_HIERARCHY[formData.locationType] && (
              <div className="space-y-2">
                <Label>Parent Location</Label>
                <Card className="p-4 max-h-64 overflow-y-auto">
                  {validParents.length > 0 ? (
                    renderLocationTree(
                      locationTree.filter(loc => validParents.some(p => p.id === loc.id || 
                        (loc.children && loc.children.some(c => validParents.some(p => p.id === c.id))))
                      ),
                      formData.parentId,
                      (id) => setFormData({ ...formData, parentId: id }),
                      isNewPage ? undefined : params?.id as string
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No valid parent locations available. Create a {LOCATION_TYPE_LABELS[LOCATION_HIERARCHY[formData.locationType]!]} first.
                    </p>
                  )}
                </Card>
                {formData.parentId && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, parentId: '' })}
                  >
                    Clear Parent
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Page Content</CardTitle>
            <CardDescription>
              Customize the content for this location page. If left empty, the default filtered view will be shown.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                className="rounded-lg"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Pre-Construction Projects in Toronto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Page description..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroImage">Hero Image URL</Label>
              <Input
                id="heroImage"
                className="rounded-lg"
                value={formData.heroImage}
                onChange={(e) => setFormData({ ...formData, heroImage: e.target.value })}
                placeholder="https://example.com/hero-image.jpg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">SEO Meta Title</Label>
                <Input
                  id="metaTitle"
                  className="rounded-lg"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  placeholder="SEO title for search engines"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">SEO Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  className="rounded-lg"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="SEO description for search engines"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customContent">Custom Content (HTML/JSON)</Label>
              <Textarea
                id="customContent"
                className="rounded-lg font-mono text-sm"
                value={formData.customContent}
                onChange={(e) => setFormData({ ...formData, customContent: e.target.value })}
                placeholder="Additional custom content (HTML or JSON)"
                rows={6}
              />
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t">
              <input
                type="checkbox"
                id="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPublished" className="font-normal cursor-pointer">
                Publish this page (if unchecked, default view will be shown)
              </Label>
            </div>
          </CardContent>
        </Card>

        <FAQField
          value={formData.faqs}
          onChange={(faqs) => setFormData({ ...formData, faqs })}
          label="Page-Specific FAQs"
          description="Add custom FAQs for this location page. These will be displayed along with the default pre-construction FAQs."
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              isNewPage ? "Create Page" : "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

