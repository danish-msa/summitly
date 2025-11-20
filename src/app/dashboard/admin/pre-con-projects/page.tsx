"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
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
import { Plus, Search, Edit, Trash2, Building2, TrendingUp, Package, MapPin, CheckCircle2 } from "lucide-react"
import { isAdmin } from "@/lib/roles"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

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
  createdAt: string
  units?: Array<{ id: string; status: string }>
}

export default function PreConProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<PreConProject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    selling: 0,
    comingSoon: 0,
    soldOut: 0,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<PreConProject | null>(null)

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, page, searchTerm, statusFilter, cityFilter])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
        ...(cityFilter && { city: cityFilter }),
      })

      const response = await fetch(`/api/admin/pre-con-projects?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch projects" }))
        throw new Error(errorData.error || "Failed to fetch projects")
      }

      const data = await response.json()
      setProjects(data.projects || [])
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Error fetching projects:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch projects"
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
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
      alert("Failed to delete project")
    }
  }

  const columns: Column<PreConProject>[] = [
    {
      key: "projectName",
      header: "Project Name",
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
      render: (project) => (
        <div className="text-sm">
          {project.developerName || project.developer || "N/A"}
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
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
      key: "startingPrice",
      header: "Starting Price",
      render: (project) => formatCurrency(project.startingPrice),
    },
    {
      key: "status",
      header: "Status",
      render: (project) => {
        const statusColors: Record<string, string> = {
          "platinum-access": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
          "now-selling": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          "assignments": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          "new-release-coming-soon": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
          "coming-soon": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          "resale": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
          "sold-out": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        }
        
        // Format status text: replace hyphens with spaces and capitalize words
        const formatStatus = (status: string) => {
          return status
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        }
        
        return (
          <Badge className={statusColors[project.status] || "hover:bg-none bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}>
            {formatStatus(project.status)}
          </Badge>
        )
      },
    },
    {
      key: "units",
      header: "Units",
      render: (project) => (
        <div className="text-sm">
          {project.availableUnits} / {project.totalUnits} available
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (project) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/admin/pre-con-projects/${project.id}/edit`)}
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

  // Only show full-page loading for initial authentication check
  // Once authenticated, show the page structure and load data in background
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
            <SelectItem value="new-release-coming-soon">New Release Coming Soon</SelectItem>
            <SelectItem value="coming-soon">Coming Soon</SelectItem>
            <SelectItem value="resale">Resale</SelectItem>
            <SelectItem value="sold-out">Sold Out</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="City"
          value={cityFilter}
          onChange={(e) => {
            setCityFilter(e.target.value)
            setPage(1)
          }}
          className="w-[180px]"
        />
      </div>

      {/* Table */}
      {loading && projects.length === 0 ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-muted-foreground">Loading projects...</div>
        </div>
      ) : (
        <DataTable
          data={projects}
          columns={columns}
          keyExtractor={(project) => project.id}
          emptyMessage="No projects found"
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
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

