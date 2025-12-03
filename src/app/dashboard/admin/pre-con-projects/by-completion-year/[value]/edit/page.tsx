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
import { FAQField } from "@/components/Dashboard/FAQField"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import type { FaqItem } from "@/components/common/FAQ"

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
  faqs: string | null
  isPublished: boolean
}

export default function EditCompletionYearPage() {
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
    faqs: [] as FaqItem[],
    isPublished: false,
  })

  useEffect(() => {
    if (session?.user && !isAdmin(session.user.role)) {
      router.push("/dashboard")
    }
  }, [session?.user, router])

  useEffect(() => {
    if (!params?.value) return

    const pageValue = params.value as string
    
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
        const response = await fetch(`/api/admin/pre-con-projects/page-content?pageType=completionYear&pageValue=${encodeURIComponent(pageValue)}`)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!params?.value) return
    
    setSaving(true)
    const pageValue = params.value as string

    try {
      const payload = {
        pageType: "completionYear",
        pageValue,
        title: formData.title || null,
        description: formData.description || null,
        heroImage: formData.heroImage || null,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        customContent: formData.customContent || null,
        faqs: formData.faqs.length > 0 ? JSON.stringify(formData.faqs) : null,
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

      router.push("/dashboard/admin/pre-con-projects/by-completion-year")
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

  const pageValue = params?.value as string || ""

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
          <h1 className="text-3xl font-bold">Edit Completion Year Page</h1>
          <p className="text-muted-foreground mt-1">
            {pageValue} - Customize page content
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Page Content</CardTitle>
            <CardDescription>
              Customize the content for this completion year page. If left empty, the default filtered view will be shown.
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
                placeholder={`e.g., Pre-Construction Projects Completing in ${pageValue}`}
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
          description="Add custom FAQs for this completion year page. These will be displayed along with the default pre-construction FAQs."
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
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

