"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useBackgroundFetch } from "@/hooks/useBackgroundFetch"
import { DataTable, Column } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Edit, Search, Plus, Trash2 } from "lucide-react"
import { isAdmin } from "@/lib/roles"

interface PageContent {
  id: string
  pageType: string
  pageValue: string
  locationType: string | null
  parentId: string | null
  title: string | null
  description: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
  parent?: PageContent | null
  children?: PageContent[]
}

type LocationType = 'by-city' | 'by-area' | 'by-neighbourhood' | 'by-intersection' | 'by-communities'

const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  'by-city': 'City',
  'by-area': 'Area',
  'by-neighbourhood': 'Neighbourhood',
  'by-intersection': 'Intersection',
  'by-communities': 'Community'
}

export default function ByLocationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pageContents, setPageContents] = useState<PageContent[]>([])
  const { loading, error, setError, fetchData } = useBackgroundFetch()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocationType, setSelectedLocationType] = useState<LocationType | 'all'>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [contentToDelete, setContentToDelete] = useState<PageContent | null>(null)

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
      fetchPageContents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router])

  const fetchPageContents = async () => {
    await fetchData(async () => {
      const response = await fetch("/api/admin/pre-con-projects/page-content?pageType=by-location")
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch page contents" }))
        throw new Error(errorData.error || "Failed to fetch page contents")
      }

      const data = await response.json()
      const contents: PageContent[] = data.pageContents || []
      
      // Build hierarchy structure
      const contentsMap = new Map<string, PageContent>()
      contents.forEach(content => {
        contentsMap.set(content.id, { ...content, children: [] })
      })

      const rootContents: PageContent[] = []
      contents.forEach(content => {
        const contentWithChildren = contentsMap.get(content.id)!
        if (content.parentId) {
          const parent = contentsMap.get(content.parentId)
          if (parent) {
            if (!parent.children) parent.children = []
            parent.children.push(contentWithChildren)
          }
        } else {
          rootContents.push(contentWithChildren)
        }
      })
      
      setPageContents(contents)
      return data
    })
  }

  const getLocationPath = (content: PageContent, contents: PageContent[]): string => {
    const path: string[] = [content.pageValue]
    let current = content
    while (current.parentId) {
      const parent = contents.find(c => c.id === current.parentId)
      if (parent) {
        path.unshift(parent.pageValue)
        current = parent
      } else {
        break
      }
    }
    return path.join(' > ')
  }

  const filteredContents = pageContents.filter((content) => {
    const matchesSearch = (
      content.pageValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false
    )
    const matchesType = selectedLocationType === 'all' || content.locationType === selectedLocationType
    return matchesSearch && matchesType
  })

  const handleDelete = async () => {
    if (!contentToDelete) return

    try {
      const response = await fetch(`/api/admin/pre-con-projects/page-content?id=${contentToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete location page" }))
        throw new Error(errorData.error || "Failed to delete location page")
      }

      setDeleteDialogOpen(false)
      setContentToDelete(null)
      fetchPageContents()
    } catch (error) {
      console.error("Error deleting location page:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete location page"
      alert(errorMessage)
    }
  }

  const columns: Column<PageContent>[] = [
    {
      key: "locationType",
      header: "Type",
      render: (content) => (
        <Badge variant="outline">
          {content.locationType ? LOCATION_TYPE_LABELS[content.locationType as LocationType] || content.locationType : 'N/A'}
        </Badge>
      ),
    },
    {
      key: "pageValue",
      header: "Location",
      render: (content) => {
        const path = getLocationPath(content, pageContents)
        return (
          <div className="font-medium">
            <div>{content.pageValue}</div>
            {content.parentId && (
              <div className="text-xs text-muted-foreground mt-1">{path}</div>
            )}
          </div>
        )
      },
    },
    {
      key: "title",
      header: "Title",
      render: (content) => (
        <div className="text-sm">
          {content.title || <span className="text-muted-foreground italic">No title set</span>}
        </div>
      ),
    },
    {
      key: "isPublished",
      header: "Status",
      render: (content) => (
        <Badge variant={content.isPublished ? "default" : "secondary"}>
          {content.isPublished ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (content) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/admin/pre-con-projects/by-location/${content.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setContentToDelete(content)
              setDeleteDialogOpen(true)
            }}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Location Pages</h1>
          <p className="text-muted-foreground mt-1">
            Manage content for location pages (Cities, Areas, Neighbourhoods, Intersections, Communities)
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/admin/pre-con-projects/by-location/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Location
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-48">
          <select
            value={selectedLocationType}
            onChange={(e) => setSelectedLocationType(e.target.value as LocationType | 'all')}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="all">All Types</option>
            <option value="by-city">City</option>
            <option value="by-area">Area</option>
            <option value="by-neighbourhood">Neighbourhood</option>
            <option value="by-intersection">Intersection</option>
            <option value="by-communities">Community</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          <p className="font-medium">Error loading page contents</p>
          <p className="text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              setError(null)
              fetchPageContents()
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      <DataTable
        data={filteredContents}
        columns={columns}
        keyExtractor={(content) => content.id}
        emptyMessage="No locations found"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location Page</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{contentToDelete?.pageValue}&quot;? This action cannot be undone.
              {contentToDelete?.children && contentToDelete.children.length > 0 && (
                <div className="mt-2 text-sm text-amber-600">
                  Warning: This location has {contentToDelete.children.length} child location(s) that will also be affected.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

