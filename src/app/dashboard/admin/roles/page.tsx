"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, UserCheck, Crown } from "lucide-react"
import { isSuperAdmin } from "@/lib/roles"
import { StatCard } from "@/components/Dashboard/StatCard"

export default function RolesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

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
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const roles = [
    {
      name: "SUBSCRIBER",
      displayName: "Subscriber",
      description: "Default role for users who sign up from the website. Can access basic dashboard features.",
      permissions: [
        "View dashboard",
        "Save properties",
        "Create alerts",
        "Schedule tours",
        "View market reports",
      ],
      icon: UserCheck,
      color: "bg-gray-100 text-gray-800",
    },
    {
      name: "ADMIN",
      displayName: "Admin",
      description: "Can manage pre-construction projects and perform administrative tasks.",
      permissions: [
        "All Subscriber permissions",
        "Manage pre-con projects (CRUD)",
        "View admin dashboard",
      ],
      icon: Shield,
      color: "bg-blue-100 text-blue-800",
    },
    {
      name: "SUPER_ADMIN",
      displayName: "Super Admin",
      description: "Full access to everything. Can manage admins, roles, and all system features.",
      permissions: [
        "All Admin permissions",
        "Manage users",
        "Manage roles",
        "Manage admins",
        "System configuration",
      ],
      icon: Crown,
      color: "bg-purple-100 text-purple-800",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Role Management</h1>
        <p className="text-muted-foreground mt-1">
          View and understand user roles and permissions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.name}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${role.color}`}>
                  <role.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>{role.displayName}</CardTitle>
                  <Badge className={`mt-2 ${role.color}`}>
                    {role.name}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {role.description}
              </CardDescription>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Permissions:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {role.permissions.map((permission, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{permission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Hierarchy</CardTitle>
          <CardDescription>
            Roles are hierarchical. Higher roles inherit all permissions from lower roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Crown className="h-6 w-6 text-purple-600" />
              <div>
                <div className="font-semibold">Super Admin</div>
                <div className="text-sm text-muted-foreground">Highest level access</div>
              </div>
            </div>
            <div className="border-l-2 border-muted ml-3 pl-4">
              <div className="flex items-center gap-4">
                <Shield className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="font-semibold">Admin</div>
                  <div className="text-sm text-muted-foreground">Project management access</div>
                </div>
              </div>
            </div>
            <div className="border-l-2 border-muted ml-3 pl-4">
              <div className="flex items-center gap-4">
                <UserCheck className="h-6 w-6 text-gray-600" />
                <div>
                  <div className="font-semibold">Subscriber</div>
                  <div className="text-sm text-muted-foreground">Basic user access</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

