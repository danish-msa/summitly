import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

interface Tour {
  id: string
  userId: string
  mlsNumber: string
  tourType: 'IN_PERSON' | 'VIDEO_CHAT' | 'SELF_GUIDED'
  scheduledDate: Date | string
  name: string
  phone: string
  email: string
  preApproval: boolean
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  notes?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

interface CreateTourData {
  mlsNumber: string
  tourType?: 'IN_PERSON' | 'VIDEO_CHAT' | 'SELF_GUIDED'
  scheduledDate: string // ISO date string
  name: string
  phone: string
  email: string
  preApproval?: boolean
  notes?: string
}

export function useTours() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  // Get all tours for the user
  const { data: tours = [], isLoading } = useQuery<Tour[]>({
    queryKey: ['tours', session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/tours')
      if (!response.ok) throw new Error('Failed to fetch tours')
      const data = await response.json()
      return data.tours || []
    },
    enabled: !!session?.user?.id,
  })

  // Create tour mutation
  const createTourMutation = useMutation({
    mutationFn: async (data: CreateTourData) => {
      const response = await fetch('/api/tours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create tour')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours', session?.user?.id] })
    },
  })

  // Delete tour mutation
  const deleteTourMutation = useMutation({
    mutationFn: async (tourId: string) => {
      const response = await fetch(`/api/tours/${tourId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete tour')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours', session?.user?.id] })
    },
  })

  // Update tour mutation
  const updateTourMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTourData & { status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' }> }) => {
      const response = await fetch(`/api/tours/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tour')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours', session?.user?.id] })
    },
  })

  return {
    tours,
    isLoading,
    createTour: createTourMutation.mutateAsync,
    deleteTour: deleteTourMutation.mutateAsync,
    updateTour: updateTourMutation.mutateAsync,
    isCreating: createTourMutation.isPending,
    isDeleting: deleteTourMutation.isPending,
    isUpdating: updateTourMutation.isPending,
  }
}

