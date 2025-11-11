import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

interface PropertyWatchlist {
  id: string
  userId: string
  mlsNumber: string | null
  cityName: string | null
  neighborhood: string | null
  propertyType: string | null
  watchProperty: boolean
  newProperties: boolean
  soldListings: boolean
  expiredListings: boolean
  createdAt: Date
  updatedAt: Date
}

interface SaveAlertData {
  mlsNumber?: string
  cityName?: string
  neighborhood?: string
  propertyType?: string
  watchProperty?: boolean
  newProperties?: boolean
  soldListings?: boolean
  expiredListings?: boolean
}

export function usePropertyAlerts(mlsNumber?: string, cityName?: string, neighborhood?: string) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Get alerts for current property/area
  const { data: alerts = [], isLoading } = useQuery<PropertyWatchlist[]>({
    queryKey: ['propertyAlerts', session?.user?.id, mlsNumber, cityName, neighborhood],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (mlsNumber) params.append('mlsNumber', mlsNumber)
      if (cityName) params.append('cityName', cityName)
      if (neighborhood) params.append('neighborhood', neighborhood)
      
      const response = await fetch(`/api/alerts?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch alerts')
      const data = await response.json()
      return data.alerts || []
    },
    enabled: !!session?.user?.id,
  })

  // Get current alert (if exists)
  const currentAlert = alerts.length > 0 ? alerts[0] : null

  // Save/Update alert mutation
  const saveAlertMutation = useMutation({
    mutationFn: async (data: SaveAlertData) => {
      const response = await fetch('/api/alerts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save alert')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyAlerts', session?.user?.id] })
      queryClient.invalidateQueries({ queryKey: ['allPropertyAlerts', session?.user?.id] })
    },
  })

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (id?: string, mlsNum?: string) => {
      const params = new URLSearchParams()
      if (id) params.append('id', id)
      if (mlsNum) params.append('mlsNumber', mlsNum)
      
      const response = await fetch(`/api/alerts/delete?${params.toString()}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete alert')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['propertyAlerts', session?.user?.id] })
      queryClient.invalidateQueries({ queryKey: ['allPropertyAlerts', session?.user?.id] })
    },
  })

  return {
    alerts,
    currentAlert,
    isLoading,
    saveAlert: saveAlertMutation.mutateAsync,
    deleteAlert: deleteAlertMutation.mutateAsync,
    isSaving: saveAlertMutation.isPending,
    isDeleting: deleteAlertMutation.isPending,
  }
}

// Hook to get all user's alerts (for dashboard)
export function useAllPropertyAlerts() {
  const { data: session } = useSession()

  const { data: alerts = [], isLoading } = useQuery<PropertyWatchlist[]>({
    queryKey: ['allPropertyAlerts', session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/alerts')
      if (!response.ok) throw new Error('Failed to fetch alerts')
      const data = await response.json()
      return data.alerts || []
    },
    enabled: !!session?.user?.id,
  })

  return {
    alerts,
    isLoading,
  }
}

