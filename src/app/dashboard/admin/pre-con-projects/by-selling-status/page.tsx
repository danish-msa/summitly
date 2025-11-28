"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useBackgroundFetch } from "@/hooks/useBackgroundFetch"
import { DataTable, Column } from "@/components/Dashboard/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Search } from "lucide-react"
import { isAdmin } from "@/lib/roles"

interface PageContent {
  id: string
  pageType: string
  pageValue: string
  title: string | null
  description: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

// Selling statuses from schema
const SELLING_STATUSES = [
  "platinum-access",
  "now-selling",
  "assignments",
  "new-release-coming-soon",
  "coming-soon",
  "register-now",
  "resale",
  "sold-out",
]

const formatStatusLabel = (status: string) => {
  return status
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export default function BySellingStatusPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pageContents, setPageContents] = useState<PageContent[]>([])
  const { loading, error, setError, fetchData } = useBackgroundFetch()
  const [searchTerm, setSearchTerm] = useState("")

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
      const response = await fetch("/api/admin/pre-con-projects/page-content?pageType=status")
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch page contents" }))
        throw new Error(errorData.error || "Failed to fetch page contents")
      }

      const data = await response.json()
      const contents = data.pageContents || []
      
      // Create entries for all statuses, merging with existing content
      const allContents: PageContent[] = SELLING_STATUSES.map((statusValue) => {
        const existing = contents.find((c: PageContent) => c.pageValue === statusValue)
        return existing || {
          id: `new-${statusValue}`,
          pageType: "status",
          pageValue: statusValue,
          title: null,
          description: null,
          isPublished: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      })
      
      setPageContents(allContents)
      return data
    })
  }

  const filteredContents = pageContents.filter((content) =>
    content.pageValue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatStatusLabel(content.pageValue).toLowerCase().includes(searchTerm.toLowerCase())
  )

  const columns: Column<PageContent>[] = [
    {
      key: "pageValue",
      header: "Selling Status",
      render: (content) => (
        <div className="font-medium">{formatStatusLabel(content.pageValue)}</div>
      ),
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
            onClick={() => router.push(`/dashboard/admin/pre-con-projects/by-selling-status/${encodeURIComponent(content.pageValue)}/edit`)}
          >
            <Edit className="h-4 w-4" />
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
          <h1 className="text-3xl font-bold">Selling Status Pages</h1>
          <p className="text-muted-foreground mt-1">
            Manage content for selling status pages
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search selling statuses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
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
        emptyMessage="No selling statuses found"
      />
    </div>
  )
}

