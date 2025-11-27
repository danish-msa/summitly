"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { isAdmin } from "@/lib/roles"
import { useBackgroundFetch } from "@/hooks/useBackgroundFetch"
import { preConCityProjectsData } from "@/components/PreCon/PreConCityProperties/preConCityProjectsData"

interface PageContent {
  id: string
  pageType: string
  pageValue: string
  title: string | null
  description: string | null
  heroImage: string | null
  metaTitle: string | null
  metaDescription: string | null
  customContent: string | null
  isPublished: boolean
}

export default function EditCityPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const { loading, fetchData } = useBackgroundFetch<PageContent>()
  const [saving, setSaving] = useState(false)
  const formInitializedRef = useRef(false)
  const loadedPageValueRef = useRef<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    heroImage: "",
    metaTitle: "",
    metaDescription: "",
    customContent: "",
    isPublished: false,
  })

  useEffect(() => {
    if (session?.user && !isAdmin(session.user.role)) {
      router.push("/dashboard")
    }
  }, [session?.user, router])

  useEffect(() => {
    if (!params?.value) return

    const pageValue = decodeURIComponent(params.value as string)
    
    if (loadedPageValueRef.current !== pageValue) {
      formInitializedRef.current = false
      loadedPageValueRef.current = pageValue
      fetchPageContent(pageValue)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.value])

  const fetchPageContent = async (pageValue: string) => {
    try {
      const content = await fetchData(async () => {
        const response = await fetch(`/api/admin/pre-con-projects/page-content?pageType=city&pageValue=${encodeURIComponent(pageValue)}`)
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
        setFormData({
          title: content.title || "",
          description: content.description || "",
          heroImage: content.heroImage || "",
          metaTitle: content.metaTitle || "",
          metaDescription: content.metaDescription || "",
          customContent: content.customContent || "",
          isPublished: content.isPublished || false,
        })
      }
    } catch (error) {
      console.error("Error fetching page content:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!params?.value) return
    
    setSaving(true)
    const pageValue = decodeURIComponent(params.value as string)

    try {
      const payload = {
        pageType: "city",
        pageValue,
        title: formData.title || null,
        description: formData.description || null,
        heroImage: formData.heroImage || null,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        customContent: formData.customContent || null,
        isPublished: formData.isPublished,
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

      router.push("/dashboard/admin/pre-con-projects/by-city")
    } catch (error) {
      console.error("Error saving page content:", error)
      const message = error instanceof Error ? error.message : "Failed to save page content"
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

  const pageValue = params?.value ? decodeURIComponent(params.value as string) : ""
  const city = preConCityProjectsData.find(c => c.id === pageValue)
  const cityName = city?.name || pageValue

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
          <h1 className="text-3xl font-bold">Edit City Page</h1>
          <p className="text-muted-foreground mt-1">
            {cityName} - Customize page content
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Page Content</CardTitle>
            <CardDescription>
              Customize the content for this city page. If left empty, the default filtered view will be shown.
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
                placeholder={`e.g., Pre-Construction Projects in ${cityName}`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                className="rounded-lg"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Page description..."
                rows={4}
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
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

