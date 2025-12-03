"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useBackgroundFetch } from "@/hooks/useBackgroundFetch"
import { DataTable, Column } from "@/components/Dashboard/DataTable"
import { ActionButton } from "@/components/Dashboard/ActionButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { isAdmin } from "@/lib/roles"
import { Badge } from "@/components/ui/badge"

interface Page {
  id: string
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  status: "DRAFT" | "PUBLISHED"
  parentId: string | null
  categoryId: string | null
  createdAt: string
  updatedAt: string
  parent?: {
    id: string
    title: string
    slug: string
  } | null
  category?: {
    id: string
    name: string
    slug: string
  } | null
  creator?: {
    id: string
    name: string | null
    email: string
  } | null
  _count?: {
    children: number
  }
}

export default function PagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pages, setPages] = useState<Page[]>([])
  const { loading, error, setError, fetchData } = useBackgroundFetch()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [parentFilter, setParentFilter] = useState("all")
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [parentPages, setParentPages] = useState<Array<{ id: string; title: string }>>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(10)
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null)

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
      fetchPages()
      fetchCategories()
      fetchParentPages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, page, limit, searchTerm, statusFilter, categoryFilter, parentFilter, sortBy, sortOrder])

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(key)
      setSortOrder("asc")
    }
    setPage(1)
  }

  const fetchPages = async () => {
    await fetchData(async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
        ...(categoryFilter && categoryFilter !== "all" && { categoryId: categoryFilter }),
        ...(parentFilter && parentFilter !== "all" && parentFilter !== "none" && { parentId: parentFilter }),
        ...(parentFilter === "none" && { parentId: "none" }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      })

      const response = await fetch(`/api/admin/pages?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch pages" }))
        throw new Error(errorData.error || "Failed to fetch pages")
      }

      const data = await response.json()
      setPages(data.pages || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
      return data
    })
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
      setParentPages(data.pages || [])
    } catch (error) {
      console.error("Error fetching parent pages:", error)
    }
  }

  const handleDelete = async () => {
    if (!pageToDelete) return

    try {
      const response = await fetch(`/api/admin/pages/${pageToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete page")
      }

      setDeleteDialogOpen(false)
      setPageToDelete(null)
      fetchPages()
    } catch (error) {
      console.error("Error deleting page:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete page"
      alert(errorMessage)
    }
  }

  const columns: Column<Page>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      sortKey: "title",
      render: (page) => (
        <div>
          <div className="font-medium">{page.title}</div>
          <div className="text-xs text-muted-foreground">/{page.slug}</div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortKey: "status",
      render: (page) => (
        <Badge variant={page.status === "PUBLISHED" ? "default" : "secondary"}>
          {page.status}
        </Badge>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: false,
      render: (page) => (
        <div className="text-sm">
          {page.category?.name || "—"}
        </div>
      ),
    },
    {
      key: "parent",
      header: "Parent",
      sortable: false,
      render: (page) => (
        <div className="text-sm">
          {page.parent?.title || "—"}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      sortKey: "createdAt",
      render: (page) => (
        <div className="text-sm text-muted-foreground">
          {new Date(page.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      render: (page) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/admin/pages/${page.id}/edit`)}
            title="Edit page"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPageToDelete(page)
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">
          Loading... {status === "loading" ? "(Checking session...)" : "(Loading pages...)"}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pages</h1>
          <p className="text-muted-foreground mt-1">
            Manage website pages
          </p>
        </div>
        <ActionButton
          label="New Page"
          icon={Plus}
          onClick={() => router.push("/dashboard/admin/pages/new")}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={parentFilter}
          onValueChange={(value) => {
            setParentFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Parents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pages</SelectItem>
            <SelectItem value="none">No Parent</SelectItem>
            {parentPages.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        data={pages}
        columns={columns}
        keyExtractor={(page) => page.id}
        emptyMessage="No pages found"
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} pages
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{pageToDelete?.title}"? This action cannot be undone.
              {pageToDelete?._count && pageToDelete._count.children > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This page has {pageToDelete._count.children} child page(s). Please delete or reassign them first.
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

