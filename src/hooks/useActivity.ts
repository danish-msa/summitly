import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

interface Activity {
  id: string
  type: 'property_saved' | 'tour_scheduled' | 'alert_watch' | 'alert_new'
  action: string
  mlsNumber?: string
  location?: string
  timestamp: Date | string
  tourType?: 'IN_PERSON' | 'VIDEO_CHAT'
}

export function useActivity() {
  const { data: session } = useSession()

  const { data: activities = [], isLoading } = useQuery<Activity[]>({
    queryKey: ['activity', session?.user?.id],
    queryFn: async () => {
      const response = await fetch('/api/activity')
      if (!response.ok) throw new Error('Failed to fetch activity')
      const data = await response.json()
      return data.activities || []
    },
    enabled: !!session?.user?.id,
  })

  return {
    activities,
    isLoading,
  }
}

