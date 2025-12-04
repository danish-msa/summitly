"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { isAdmin } from "@/lib/roles"
import { slugify } from "@/lib/utils/propertyUrl"
import { toast } from "@/hooks/use-toast"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface Category {
  id: string
  name: string
  slug: string
}

interface ParentPage {
  id: string
  title: string
  slug: string
}

interface Page {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  status: "DRAFT" | "PUBLISHED"
  parentId: string | null
  categoryId: string | null
}

export default function EditPagePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const pageId = params?.id as string
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [parentPages, setParentPages] = useState<ParentPage[]>([])
  const [formData, setFormData] = useState<Page | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session?.user) {
      if (!isAdmin(session.user.role)) {
        router.push("/dashboard")
        return
      }
      if (pageId) {
        fetchPage()
        fetchCategories()
        fetchParentPages()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, pageId])

  const fetchPage = async () => {
    try {
      const response = await fetch(`/api/admin/pages/${pageId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch page")
      }
      const data = await response.json()
      setFormData(data.page)
    } catch (error) {
      console.error("Error fetching page:", error)
      toast({
        title: "Error",
        description: "Failed to load page",
        variant: "destructive",
      })
      router.push("/dashboard/admin/pages")
    } finally {
      setFetching(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/page-categories")
      if (!response.ok) return
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchParentPages = async () => {
    try {
      const response = await fetch("/api/admin/pages?limit=1000")
      if (!response.ok) return
      const data = await response.json()
      // Filter out current page from parent options
      setParentPages(data.pages.filter((p: ParentPage) => p.id !== pageId) || [])
    } catch (error) {
      console.error("Error fetching parent pages:", error)
    }
  }

  const handleTitleChange = (value: string) => {
    if (!formData) return
    setFormData((prev) => ({
      ...prev!,
      title: value,
    }))
  }

  const handleSlugChange = (value: string) => {
    if (!formData) return
    setFormData((prev) => ({
      ...prev!,
      slug: slugify(value),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/pages/${pageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          content: formData.content || "",
          excerpt: formData.excerpt || "",
          status: formData.status,
          parentId: formData.parentId || null,
          categoryId: formData.categoryId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update page")
      }

      toast({
        title: "Page Updated",
        description: "The page has been updated successfully.",
      })

      router.push("/dashboard/admin/pages")
    } catch (error) {
      console.error("Error updating page:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update page",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!formData) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/admin/pages")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pages
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Page</h1>
          <p className="text-muted-foreground mt-1">
            Update page content and settings
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter page title"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Permalink *</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">/</span>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="page-slug"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    The URL-friendly version of the title
                  </p>
                </div>
                <div>
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt || ""}
                    onChange={(e) =>
                      setFormData((prev) => prev ? ({ ...prev, excerpt: e.target.value }) : prev)
                    }
                    placeholder="Brief description of the page"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <RichTextEditor
                    value={formData.content || ""}
                    onChange={(value) =>
                      setFormData((prev) => prev ? ({ ...prev, content: value }) : prev)
                    }
                    placeholder="Start typing your page content..."
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "DRAFT" | "PUBLISHED") =>
                      setFormData((prev) => prev ? ({ ...prev, status: value }) : prev)
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Updating..." : "Update Page"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Page Attributes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="parent">Parent Page</Label>
                  <Select
                    value={formData.parentId || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => prev ? ({ ...prev, parentId: value === "none" ? null : value }) : prev)
                    }
                  >
                    <SelectTrigger id="parent">
                      <SelectValue placeholder="No parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No parent</SelectItem>
                      {parentPages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.categoryId || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => prev ? ({ ...prev, categoryId: value === "none" ? null : value }) : prev)
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="No category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

