"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DataTable, Column } from "@/components/ui/data-table"
import { ActionButton } from "@/components/Dashboard/ActionButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, ArrowLeft, Save } from "lucide-react"
import { isAdmin } from "@/lib/roles"
import { slugify } from "@/lib/utils/propertyUrl"
import { toast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: string
  updatedAt: string
  _count?: {
    pages: number
  }
}

export default function CategoriesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  })

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
      fetchCategories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router])

  const fetchCategories = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/api/admin/page-categories?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }

      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchCategories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, status])

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug || slugify(value),
    }))
  }

  const handleSlugChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      slug: slugify(value),
    }))
  }

  const openEditDialog = (category: Category | null = null) => {
    if (category) {
      setCategoryToEdit(category)
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
      })
    } else {
      setCategoryToEdit(null)
      setFormData({
        name: "",
        slug: "",
        description: "",
      })
    }
    setEditDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast({
        title: "Error",
        description: "Name and slug are required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const url = categoryToEdit
        ? `/api/admin/page-categories/${categoryToEdit.id}`
        : "/api/admin/page-categories"
      const method = categoryToEdit ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save category")
      }

      toast({
        title: categoryToEdit ? "Category Updated" : "Category Created",
        description: `The category has been ${categoryToEdit ? "updated" : "created"} successfully.`,
      })

      setEditDialogOpen(false)
      fetchCategories()
    } catch (error) {
      console.error("Error saving category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save category",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!categoryToDelete) return

    try {
      const response = await fetch(`/api/admin/page-categories/${categoryToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete category")
      }

      toast({
        title: "Category Deleted",
        description: "The category has been deleted successfully.",
      })

      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
      fetchCategories()
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive",
      })
    }
  }

  const columns: Column<Category>[] = [
    {
      key: "name",
      header: "Name",
      render: (category) => (
        <div>
          <div className="font-medium">{category.name}</div>
          <div className="text-xs text-muted-foreground">/{category.slug}</div>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description",
      render: (category) => (
        <div className="text-sm text-muted-foreground">
          {category.description || "—"}
        </div>
      ),
    },
    {
      key: "pages",
      header: "Pages",
      render: (category) => (
        <div className="text-sm">
          {category._count?.pages || 0} page{category._count?.pages !== 1 ? "s" : ""}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (category) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(category)}
            title="Edit category"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCategoryToDelete(category)
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold">Page Categories</h1>
            <p className="text-muted-foreground mt-1">
              Manage page categories
            </p>
          </div>
        </div>
        <ActionButton
          label="New Category"
          icon={Plus}
          onClick={() => openEditDialog(null)}
        />
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <DataTable
        data={categories}
        columns={columns}
        keyExtractor={(category) => category.id}
        emptyMessage="No categories found"
      />

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {categoryToEdit ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {categoryToEdit
                ? "Update the category details below."
                : "Create a new category for organizing pages."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Category name"
                required
              />
            </div>
            <div>
              <Label htmlFor="cat-slug">Slug *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/</span>
                <Input
                  id="cat-slug"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="category-slug"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cat-description">Description</Label>
              <Textarea
                id="cat-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Category description"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"?
              {categoryToDelete?._count && categoryToDelete._count.pages > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This category has {categoryToDelete._count.pages} page(s). Please remove or reassign them first.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

