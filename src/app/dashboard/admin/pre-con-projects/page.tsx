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
import { Plus, Search, Edit, Trash2, Building2, TrendingUp, Package, MapPin, CheckCircle2, Star, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { isAdmin } from "@/lib/roles"
import { Badge } from "@/components/ui/badge"

interface PreConProject {
  id: string
  mlsNumber: string
  projectName: string
  developer: string
  developerName?: string | null
  startingPrice: number
  status: string
  city: string
  state: string
  propertyType: string
  totalUnits: number
  availableUnits: number
  isPublished: boolean
  featured?: boolean
  createdAt: string
  creatorName?: string
  creatorId?: string | null
  units?: Array<{ id: string; status: string }>
}

export default function PreConProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<PreConProject[]>([])
  const { loading, error, setError, fetchData } = useBackgroundFetch()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [publicationFilter, setPublicationFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")
  const [creators, setCreators] = useState<Array<{ id: string; name: string }>>([])
  const [cities, setCities] = useState<Array<string>>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(10)
  const [sortBy, setSortBy] = useState<string>("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [stats, setStats] = useState({
    total: 0,
    selling: 0,
    comingSoon: 0,
    soldOut: 0,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<PreConProject | null>(null)
  const [togglingFeatured, setTogglingFeatured] = useState<string | null>(null)

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
      fetchProjects()
      fetchStats()
      fetchCreators()
      fetchCities()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, page, limit, searchTerm, statusFilter, cityFilter, publicationFilter, userFilter, sortBy, sortOrder])

  const handleSort = (key: string) => {
    if (sortBy === key) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // Set new sort column and default to ascending
      setSortBy(key)
      setSortOrder("asc")
    }
    setPage(1) // Reset to first page when sorting changes
  }

  const fetchProjects = async () => {
    await fetchData(async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
        ...(cityFilter && cityFilter !== "all" && { city: cityFilter }),
        ...(publicationFilter && publicationFilter !== "all" && { isPublished: publicationFilter }),
        ...(userFilter && userFilter !== "all" && { createdBy: userFilter }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      })

      const response = await fetch(`/api/admin/pre-con-projects?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch projects" }))
        throw new Error(errorData.error || "Failed to fetch projects")
      }

      const data = await response.json()
      setProjects(data.projects || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
      return data
    })
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/pre-con-projects?limit=1000")
      if (!response.ok) return

      const data = await response.json()
      const allProjects = data.projects || []
      
      setStats({
        total: allProjects.length,
        selling: allProjects.filter((p: PreConProject) => 
          p.status === "now-selling" || p.status === "selling"
        ).length,
        comingSoon: allProjects.filter((p: PreConProject) => 
          p.status === "coming-soon" || p.status === "new-release-coming-soon"
        ).length,
        soldOut: allProjects.filter((p: PreConProject) => p.status === "sold-out").length,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const fetchCreators = async () => {
    try {
      const response = await fetch("/api/admin/pre-con-projects?limit=1000")
      if (!response.ok) return

      const data = await response.json()
      const allProjects = data.projects || []
      
      // Extract unique creators with their IDs
      const creatorMap = new Map<string, { id: string; name: string }>()
      allProjects.forEach((p: PreConProject) => {
        if (p.creatorId && p.creatorName && p.creatorName !== "Unknown") {
          if (!creatorMap.has(p.creatorId)) {
            creatorMap.set(p.creatorId, { id: p.creatorId, name: p.creatorName })
          }
        }
      })

      const uniqueCreators = Array.from(creatorMap.values())
      setCreators(uniqueCreators)
    } catch (error) {
      console.error("Error fetching creators:", error)
    }
  }

  const fetchCities = async () => {
    try {
      const response = await fetch("/api/admin/pre-con-projects?limit=1000")
      if (!response.ok) return

      const data = await response.json()
      const allProjects = data.projects || []
      
      // Extract unique cities
      const citySet = new Set<string>()
      allProjects.forEach((p: PreConProject) => {
        if (p.city && p.city.trim() !== "") {
          citySet.add(p.city.trim())
        }
      })

      // Sort cities alphabetically
      const uniqueCities = Array.from(citySet).sort()
      setCities(uniqueCities)
    } catch (error) {
      console.error("Error fetching cities:", error)
    }
  }

  const handleDelete = async () => {
    if (!projectToDelete) return

    try {
      const response = await fetch(`/api/admin/pre-con-projects/${projectToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete project")

      setDeleteDialogOpen(false)
      setProjectToDelete(null)
      fetchProjects()
      fetchStats()
    } catch (error) {
      console.error("Error deleting project:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to delete project"
      alert(errorMessage)
    }
  }

  const handleToggleFeatured = async (projectId: string, currentFeatured: boolean) => {
    setTogglingFeatured(projectId)
    try {
      const response = await fetch(`/api/admin/pre-con-projects/${projectId}/featured`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ featured: !currentFeatured }),
      })

      if (!response.ok) throw new Error("Failed to update featured status")

      // Update the project in the local state
      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === projectId
            ? { ...project, featured: !currentFeatured }
            : project
        )
      )
    } catch (error) {
      console.error("Error toggling featured status:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update featured status"
      alert(errorMessage)
    } finally {
      setTogglingFeatured(null)
    }
  }

  const columns: Column<PreConProject>[] = [
    {
      key: "featured",
      header: "",
      sortable: false,
      render: (project) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleToggleFeatured(project.id, project.featured || false)
          }}
          disabled={togglingFeatured === project.id}
          className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={project.featured ? "Unfeature project" : "Feature project"}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              project.featured
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground hover:text-yellow-400"
            }`}
          />
        </button>
      ),
      className: "w-12",
    },
    {
      key: "projectName",
      header: "Project Name",
      sortable: true,
      sortKey: "projectName",
      render: (project) => (
        <div>
          <div className="font-medium">{project.projectName}</div>
          <div className="text-xs text-muted-foreground">{project.mlsNumber}</div>
        </div>
      ),
    },
    {
      key: "developer",
      header: "Developer",
      sortable: true,
      sortKey: "developer",
      render: (project) => (
        <div className="text-sm">
          {project.developerName || project.developer || "N/A"}
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      sortable: true,
      sortKey: "city",
      render: (project) => (
        <div className="text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {project.city}, {project.state}
          </div>
        </div>
      ),
    },
    {
      key: "isPublished",
      header: "Publication",
      sortable: true,
      sortKey: "isPublished",
      render: (project) => (
        <Badge variant={project.isPublished ? "default" : "secondary"}>
          {project.isPublished ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "creator",
      header: "Created By",
      sortable: true,
      sortKey: "createdAt",
      render: (project) => (
        <div className="text-sm font-medium text-foreground">
          {project.creatorName || "Unknown"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      render: (project) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(`/dashboard/admin/pre-con-projects/${project.id}/edit`, '_blank')}
            title="Edit project (opens in new tab)"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setProjectToDelete(project)
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  // Only show full-page loading for initial authentication check or initial data load
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">
          Loading... {status === "loading" ? "(Checking session...)" : "(Loading projects...)"}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pre-Con Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage pre-construction projects
          </p>
        </div>
        <ActionButton
          label="New Project"
          icon={Plus}
          onClick={() => router.push("/dashboard/admin/pre-con-projects/new")}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 shadow-md hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Total Projects
            </CardTitle>
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-white/80 mt-1">All pre-construction projects</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 shadow-md hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Selling
            </CardTitle>
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.selling}</div>
            <p className="text-xs text-white/80 mt-1">Currently available</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 shadow-md hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Coming Soon
            </CardTitle>
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.comingSoon}</div>
            <p className="text-xs text-white/80 mt-1">Launching soon</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-500 to-slate-600 shadow-md hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Sold Out
            </CardTitle>
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.soldOut}</div>
            <p className="text-xs text-white/80 mt-1">Fully sold</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="platinum-access">Platinum Access</SelectItem>
            <SelectItem value="now-selling">Now Selling</SelectItem>
            <SelectItem value="assignments">Assignments</SelectItem>
            <SelectItem value="new-release-coming-soon">New Release</SelectItem>
            <SelectItem value="coming-soon">Coming Soon</SelectItem>
            <SelectItem value="resale">Resale</SelectItem>
            <SelectItem value="sold-out">Sold Out</SelectItem>
          </SelectContent>
        </Select>
        <Select value={cityFilter} onValueChange={(value) => {
          setCityFilter(value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {cities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={publicationFilter} onValueChange={(value) => {
          setPublicationFilter(value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="true">Published</SelectItem>
            <SelectItem value="false">Draft</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={(value) => {
          setUserFilter(value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {creators.map((creator) => (
              <SelectItem key={creator.id} value={creator.id}>
                {creator.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          <p className="font-medium">Error loading projects</p>
          <p className="text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              setError(null)
              fetchProjects()
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Table */}
      <DataTable
        data={projects}
        columns={columns}
        keyExtractor={(project) => project.id}
        emptyMessage="No projects found"
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Showing {projects.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} projects
            </span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => {
                setLimit(parseInt(value))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs">per page</span>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="h-8 w-8 p-0"
                title="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 w-8 p-0"
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {(() => {
                  const pages: (number | string)[] = []
                  const maxVisible = 7
                  
                  if (totalPages <= maxVisible) {
                    // Show all pages if total pages is less than max visible
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    // Always show first page
                    pages.push(1)
                    
                    if (page <= 4) {
                      // Near the beginning
                      for (let i = 2; i <= 5; i++) {
                        pages.push(i)
                      }
                      pages.push('ellipsis-end')
                      pages.push(totalPages)
                    } else if (page >= totalPages - 3) {
                      // Near the end
                      pages.push('ellipsis-start')
                      for (let i = totalPages - 4; i <= totalPages; i++) {
                        pages.push(i)
                      }
                    } else {
                      // In the middle
                      pages.push('ellipsis-start')
                      for (let i = page - 1; i <= page + 1; i++) {
                        pages.push(i)
                      }
                      pages.push('ellipsis-end')
                      pages.push(totalPages)
                    }
                  }
                  
                  return pages.map((pageNum, index) => {
                    if (pageNum === 'ellipsis-start' || pageNum === 'ellipsis-end') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      )
                    }
                    
                    const pageNumber = pageNum as number
                    const isActive = pageNumber === page
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNumber)}
                        className={`h-8 w-8 p-0 ${isActive ? "bg-primary text-primary-foreground" : ""}`}
                      >
                        {pageNumber}
                      </Button>
                    )
                  })
                })()}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 w-8 p-0"
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="h-8 w-8 p-0"
                title="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{projectToDelete?.projectName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setProjectToDelete(null)
              }}
            >
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

