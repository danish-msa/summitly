"use client"

import { useBackgroundRefresh } from '@/contexts/BackgroundRefreshContext'

export function BackgroundRefreshIndicator() {
  const { isRefreshing } = useBackgroundRefresh()

  if (!isRefreshing) return null

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span>Refreshing...</span>
    </div>
  )
}

