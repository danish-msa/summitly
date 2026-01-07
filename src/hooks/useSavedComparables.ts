import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

interface SavedComparable {
  id: string
  userId: string
  mlsNumber: string
  createdAt: Date
  updatedAt: Date
}

export function useSavedComparables() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Get all saved comparables
  const { data: savedComparables = [], isLoading } = useQuery<SavedComparable[]>({
    queryKey: ['savedComparables', session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/comparables/saved')
      if (!response.ok) throw new Error('Failed to fetch saved comparables')
      const data = await response.json()
      return data.savedComparables || []
    },
    enabled: !!session?.user?.id,
  })

  // Check if a specific property is saved as comparable
  const checkIsSaved = (mlsNumber: string): boolean => {
    return savedComparables.some((sc) => sc.mlsNumber === mlsNumber.toString())
  }

  // Save comparable mutation
  const saveComparableMutation = useMutation({
    mutationFn: async (mlsNumber: string) => {
      const response = await fetch('/api/comparables/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mlsNumber }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save comparable')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedComparables', session?.user?.id] })
    },
  })

  // Unsave comparable mutation
  const unsaveComparableMutation = useMutation({
    mutationFn: async (mlsNumber: string) => {
      const response = await fetch(`/api/comparables/unsave?mlsNumber=${mlsNumber}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unsave comparable')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedComparables', session?.user?.id] })
    },
  })

  return {
    savedComparables,
    isLoading,
    checkIsSaved,
    saveComparable: saveComparableMutation.mutateAsync,
    unsaveComparable: unsaveComparableMutation.mutateAsync,
    isSaving: saveComparableMutation.isPending,
    isUnsaving: unsaveComparableMutation.isPending,
  }
}

