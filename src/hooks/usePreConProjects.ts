import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api/client'
import type { PropertyListing } from '@/lib/types'

export interface PreConProjectsParams {
  city?: string
  status?: string
  propertyType?: string
  subPropertyType?: string
  completionYear?: string
  developer?: string
  featured?: boolean
  page?: number
  limit?: number
}

export interface UsePreConProjectsResult {
  projects: PropertyListing[]
  loading: boolean
  error: string | null
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  refetch: () => Promise<void>
}

/**
 * Hook to fetch pre-construction projects using v1 API
 */
export function usePreConProjects(params?: PreConProjectsParams): UsePreConProjectsResult {
  const [projects, setProjects] = useState<PropertyListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<UsePreConProjectsResult['pagination']>()

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build params object, converting boolean to string for API
      const apiParams: Record<string, string | number> = {}
      if (params?.city) apiParams.city = params.city
      if (params?.status) apiParams.status = params.status
      if (params?.propertyType) apiParams.propertyType = params.propertyType
      if (params?.subPropertyType) apiParams.subPropertyType = params.subPropertyType
      if (params?.completionYear) apiParams.completionYear = params.completionYear
      if (params?.developer) apiParams.developer = params.developer
      if (params?.featured !== undefined) apiParams.featured = params.featured ? 'true' : 'false'
      if (params?.page) apiParams.page = params.page
      if (params?.limit) apiParams.limit = params.limit

      const response = await api.get<{ projects: PropertyListing[] }>('/pre-con-projects', {
        params: apiParams,
      })

      if (response.success && response.data) {
        setProjects(response.data.projects || [])
        setPagination(response.meta?.pagination)
      } else {
        setError(response.error?.message || 'Failed to fetch projects')
        setProjects([])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects'
      setError(errorMessage)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [
    params?.city,
    params?.status,
    params?.propertyType,
    params?.subPropertyType,
    params?.completionYear,
    params?.developer,
    params?.featured,
    params?.page,
    params?.limit,
  ])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return {
    projects,
    loading,
    error,
    pagination,
    refetch: fetchProjects,
  }
}

