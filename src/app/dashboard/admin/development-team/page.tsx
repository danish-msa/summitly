"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useBackgroundFetch } from "@/hooks/useBackgroundFetch"
import { DataTable, Column } from "@/components/Dashboard/DataTable"
import { ActionButton } from "@/components/Dashboard/ActionButton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Search, Edit, Trash2, Briefcase, Upload, Loader2, X, Users, Building2, Palette } from "lucide-react"
import { isAdmin } from "@/lib/roles"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Developer {
  id: string
  name: string
  type: string
  description: string | null
  website: string | null
  image: string | null
  email: string | null
  phone: string | null
  createdAt: string
  updatedAt: string
}


const developerTypes = [
  { value: "DEVELOPER", label: "Developer" },
  { value: "ARCHITECT", label: "Architect" },
  { value: "INTERIOR_DESIGNER", label: "Interior Designer" },
  { value: "BUILDER", label: "Builder" },
  { value: "LANDSCAPE_ARCHITECT", label: "Landscape Architect" },
  { value: "MARKETING", label: "Marketing" },
]

export default function DevelopersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [developers, setDevelopers] = useState<Developer[]>([])
  const { loading, fetchData } = useBackgroundFetch()
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    developers: 0,
    architects: 0,
    others: 0,
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [developerToDelete, setDeveloperToDelete] = useState<Developer | null>(null)
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingDeveloper, setEditingDeveloper] = useState<Developer | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "DEVELOPER",
    description: "",
    website: "",
    image: "",
    email: "",
    phone: "",
  })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      fetchDevelopers()
      fetchStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, page, searchTerm, typeFilter])

  const fetchDevelopers = async () => {
    await fetchData(async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter && typeFilter !== "all" && { type: typeFilter }),
      })

      const response = await fetch(`/api/admin/development-team?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch developers" }))
        throw new Error(errorData.error || "Failed to fetch developers")
      }

      const data = await response.json()
      setDevelopers(data.developers || [])
      setTotalPages(data.pagination?.totalPages || 1)
      
      return data
    }).catch((error) => {
      console.error("Error fetching developers:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch developers"
      alert(errorMessage)
    })
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/development-team?limit=1000")
      if (response.ok) {
        const data = await response.json()
        const devs = data.developers || []
        setStats({
          total: devs.length,
          developers: devs.filter((d: Developer) => d.type === "DEVELOPER").length,
          architects: devs.filter((d: Developer) => d.type === "ARCHITECT").length,
          others: devs.filter((d: Developer) => !["DEVELOPER", "ARCHITECT"].includes(d.type)).length,
        })
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('File size exceeds 10MB limit.')
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/admin/upload/image', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }

      const data = await response.json()
      setFormData(prev => ({ ...prev, image: data.path }))

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleOpenForm = (developer?: Developer) => {
    if (developer) {
      setEditingDeveloper(developer)
      setFormData({
        name: developer.name,
        type: developer.type,
        description: developer.description || "",
        website: developer.website || "",
        image: developer.image || "",
        email: developer.email || "",
        phone: developer.phone || "",
      })
    } else {
      setEditingDeveloper(null)
      setFormData({
        name: "",
        type: "DEVELOPER",
        description: "",
        website: "",
        image: "",
        email: "",
        phone: "",
      })
    }
    setFormDialogOpen(true)
  }

  const handleCloseForm = () => {
    setFormDialogOpen(false)
    setEditingDeveloper(null)
    setFormData({
      name: "",
      type: "DEVELOPER",
      description: "",
      website: "",
      image: "",
      email: "",
      phone: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingDeveloper
        ? `/api/admin/development-team/${editingDeveloper.id}`
        : "/api/admin/development-team"
      const method = editingDeveloper ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save developer")
      }

      handleCloseForm()
      fetchDevelopers()
      fetchStats()
    } catch (error) {
      console.error("Error saving developer:", error)
      alert(error instanceof Error ? error.message : "Failed to save developer")
    }
  }

  const handleDelete = async () => {
    if (!developerToDelete) return

    try {
      const response = await fetch(`/api/admin/development-team/${developerToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete developer")
      }

      setDeleteDialogOpen(false)
      setDeveloperToDelete(null)
      fetchDevelopers()
      fetchStats()
    } catch (error) {
      console.error("Error deleting developer:", error)
      alert(error instanceof Error ? error.message : "Failed to delete developer")
    }
  }

  const columns: Column<Developer>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.image || undefined} alt={row.name} />
            <AvatarFallback>{row.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (row) => {
        const typeLabel = developerTypes.find(t => t.value === row.type)?.label || row.type
        return <Badge variant="secondary">{typeLabel}</Badge>
      },
    },
    {
      key: "email",
      header: "Email",
      render: (row) => row.email || "-",
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => row.phone || "-",
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <ActionButton
            icon={Edit}
            onClick={() => handleOpenForm(row)}
            label="Edit"
            variant="outline"
          />
          <ActionButton
            icon={Trash2}
            onClick={() => {
              setDeveloperToDelete(row)
              setDeleteDialogOpen(true)
            }}
            label="Delete"
            variant="destructive"
          />
        </div>
      ),
    },
  ]

  if (status === "loading") {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Development Team</h1>
          <p className="text-muted-foreground">Manage development team members</p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 shadow-md hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Total
            </CardTitle>
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-white/80 mt-1">All team members</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 shadow-md hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Developers
            </CardTitle>
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.developers}</div>
            <p className="text-xs text-white/80 mt-1">Development companies</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 shadow-md hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Architects
            </CardTitle>
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Palette className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.architects}</div>
            <p className="text-xs text-white/80 mt-1">Architecture firms</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-amber-600 shadow-md hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Others
            </CardTitle>
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.others}</div>
            <p className="text-xs text-white/80 mt-1">Other team members</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setPage(1) }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {developerTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <DataTable
                data={developers}
                columns={columns}
                keyExtractor={(developer) => developer.id}
                emptyMessage="No team members found"
              />
            </CardContent>
          </Card>
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
        </>
      )}

      {/* Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDeveloper ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
            <DialogDescription>
              {editingDeveloper ? "Update team member information" : "Add a new development team member"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {developerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Profile Image</Label>
              <div className="flex gap-4 items-center">
                {formData.image && (
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={formData.image} alt="Profile" />
                      <AvatarFallback>IMG</AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image: "" })}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="rounded-lg"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {formData.image ? "Change Image" : "Upload Image"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{developerToDelete?.name}"? This action cannot be undone.
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

