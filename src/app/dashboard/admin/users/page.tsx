"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useBackgroundFetch } from "@/hooks/useBackgroundFetch"
import { DataTable, Column } from "@/components/ui/data-table"
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
import { Search, Edit, Trash2, Users, Shield, UserCheck, Crown } from "lucide-react"
import { isSuperAdmin } from "@/lib/roles"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface User {
  id: string
  name: string | null
  email: string
  role: string
  image: string | null
  createdAt: string
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const { loading, error, setError, fetchData } = useBackgroundFetch()
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    subscribers: 0,
    admins: 0,
    superAdmins: 0,
  })
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (status === "authenticated" && session?.user) {
      if (!isSuperAdmin(session.user.role)) {
        router.push("/dashboard")
        return
      }
      fetchUsers()
      fetchStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router, page, searchTerm, roleFilter])

  const fetchUsers = async () => {
    await fetchData(async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
      })

      const url = `/api/admin/users?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch users" }))
        throw new Error(errorData.error || errorData.details || "Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users || [])
      setTotalPages(data.pagination?.totalPages || 1)
      
      return data
    })
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/users?limit=1000")
      
      if (!response.ok) {
        return
      }

      const data = await response.json()
      const allUsers = data.users || []
      
      setStats({
        total: allUsers.length,
        subscribers: allUsers.filter((u: User) => u.role === "SUBSCRIBER").length,
        admins: allUsers.filter((u: User) => u.role === "ADMIN").length,
        superAdmins: allUsers.filter((u: User) => u.role === "SUPER_ADMIN").length,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleEdit = async () => {
    if (!selectedUser || !selectedRole) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: selectedRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update user")
      }

      setEditDialogOpen(false)
      setSelectedUser(null)
      setSelectedRole("")
      fetchUsers()
      fetchStats()
    } catch (error) {
      console.error("Error updating user:", error)
      const message = error instanceof Error ? error.message : "Failed to update user"
      alert(message)
    }
  }

  const handleDelete = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete user")
      }

      setDeleteDialogOpen(false)
      setSelectedUser(null)
      fetchUsers()
      fetchStats()
    } catch (error) {
      console.error("Error deleting user:", error)
      const message = error instanceof Error ? error.message : "Failed to delete user"
      alert(message)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-800"
      case "ADMIN":
        return "bg-blue-100 text-blue-800"
      case "SUBSCRIBER":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const columns: Column<User>[] = [
    {
      key: "user",
      header: "User",
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.image || undefined} />
            <AvatarFallback>
              {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name || "No name"}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <Badge className={getRoleBadgeColor(user.role)}>
          {user.role.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "Actions",
      render: (user) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(user)
              setSelectedRole(user.role)
              setEditDialogOpen(true)
            }}
            disabled={user.id === session?.user?.id}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(user)
              setDeleteDialogOpen(true)
            }}
            disabled={user.id === session?.user?.id}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  // Only show full loading screen on initial load or when checking session
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">
          Loading... {status === "loading" ? "(Checking session...)" : "(Loading users...)"}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage users and their roles
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          <p className="font-medium">Error loading users</p>
          <p className="text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => {
              setError(null)
              fetchUsers()
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 shadow-md hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Total Users
            </CardTitle>
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-white/80 mt-1">All registered users</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Subscribers
            </CardTitle>
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.subscribers}</div>
            <p className="text-xs text-white/80 mt-1">Regular users</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-indigo-500 shadow-md hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Admins
            </CardTitle>
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.admins}</div>
            <p className="text-xs text-white/80 mt-1">Administrators</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 shadow-md hover:shadow-xl transition-all duration-300 border-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">
              Super Admins
            </CardTitle>
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Crown className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.superAdmins}</div>
            <p className="text-xs text-white/80 mt-1">Super administrators</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={roleFilter || "all"} onValueChange={(value) => {
          // Convert "all" back to empty string for API filtering
          setRoleFilter(value === "all" ? "" : value)
          setPage(1)
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="SUBSCRIBER">Subscriber</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        data={users}
        columns={columns}
        keyExtractor={(user) => user.id}
        emptyMessage="No users found"
      />

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

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUBSCRIBER">Subscriber</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false)
                  setSelectedUser(null)
                  setSelectedRole("")
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setSelectedUser(null)
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

