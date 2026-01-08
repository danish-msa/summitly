import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

interface SavedComparable {
  id: string
  userId: string
  basePropertyMlsNumber: string
  mlsNumber: string
  createdAt: Date
  updatedAt: Date
}

export function useSavedComparables(basePropertyMlsNumber?: string) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Get saved comparables (optionally filtered by base property)
  const { data: savedComparables = [], isLoading } = useQuery<SavedComparable[]>({
    queryKey: ['savedComparables', session?.user?.id, basePropertyMlsNumber],
    queryFn: async () => {
      const url = basePropertyMlsNumber 
        ? `/api/comparables/saved?basePropertyMlsNumber=${basePropertyMlsNumber}`
        : '/api/comparables/saved'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch saved comparables')
      const data = await response.json()
      return data.savedComparables || []
    },
    enabled: !!session?.user?.id,
  })

  // Check if a specific property is saved as comparable
  const checkIsSaved = (mlsNumber: string): boolean => {
    if (!basePropertyMlsNumber) return false
    return savedComparables.some(
      (sc) => sc.mlsNumber === mlsNumber.toString() && sc.basePropertyMlsNumber === basePropertyMlsNumber.toString()
    )
  }

  // Save comparable mutation
  const saveComparableMutation = useMutation({
    mutationFn: async (mlsNumber: string) => {
      if (!basePropertyMlsNumber) {
        throw new Error('Base property MLS number is required')
      }
      const response = await fetch('/api/comparables/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mlsNumber, basePropertyMlsNumber }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save comparable')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedComparables', session?.user?.id, basePropertyMlsNumber] })
      queryClient.invalidateQueries({ queryKey: ['savedComparables', session?.user?.id] })
    },
  })

  // Unsave comparable mutation
  const unsaveComparableMutation = useMutation({
    mutationFn: async (mlsNumber: string) => {
      if (!basePropertyMlsNumber) {
        throw new Error('Base property MLS number is required')
      }
      const response = await fetch(`/api/comparables/unsave?mlsNumber=${mlsNumber}&basePropertyMlsNumber=${basePropertyMlsNumber}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to unsave comparable')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedComparables', session?.user?.id, basePropertyMlsNumber] })
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

