import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

interface SavedProperty {
  id: string
  userId: string
  mlsNumber: string
  notes: string | null
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export function useSavedProperties() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Get all saved properties
  const { data: savedProperties = [], isLoading } = useQuery<SavedProperty[]>({
    queryKey: ['savedProperties', session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/properties/saved')
      if (!response.ok) throw new Error('Failed to fetch saved properties')
      const data = await response.json()
      return data.savedProperties || []
    },
    enabled: !!session?.user?.id,
  })

  // Check if a specific property is saved
  const checkIsSaved = (mlsNumber: string): boolean => {
    return savedProperties.some((sp) => sp.mlsNumber === mlsNumber.toString())
  }

  // Save property mutation
  const savePropertyMutation = useMutation({
    mutationFn: async ({ mlsNumber, notes, tags }: { mlsNumber: string; notes?: string; tags?: string[] }) => {
      const response = await fetch('/api/properties/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mlsNumber, notes, tags }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save property')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedProperties', session?.user?.id] })
    },
  })

  // Unsave property mutation
  const unsavePropertyMutation = useMutation({
    mutationFn: async (mlsNumber: string) => {
      const response = await fetch(`/api/properties/unsave?mlsNumber=${mlsNumber}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unsave property')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedProperties', session?.user?.id] })
    },
  })

  return {
    savedProperties,
    isLoading,
    checkIsSaved,
    saveProperty: savePropertyMutation.mutateAsync,
    unsaveProperty: unsavePropertyMutation.mutateAsync,
    isSaving: savePropertyMutation.isPending,
    isUnsaving: unsavePropertyMutation.isPending,
  }
}

