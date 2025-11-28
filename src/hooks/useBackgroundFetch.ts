import { useState, useRef, useCallback, useEffect } from 'react'
import { useBackgroundRefreshSafe } from '@/contexts/BackgroundRefreshContext'

interface UseBackgroundFetchOptions {
  /**
   * Whether to show loading on initial mount
   * @default true
   */
  initialLoading?: boolean
}

interface UseBackgroundFetchReturn<T> {
  /**
   * True when loading for the first time (no data yet)
   */
  loading: boolean
  /**
   * True when refreshing in the background (data already exists)
   */
  refreshing: boolean
  /**
   * True if either loading or refreshing
   */
  isLoading: boolean
  /**
   * Error state
   */
  error: string | null
  /**
   * Set error state
   */
  setError: (error: string | null) => void
  /**
   * Execute a fetch function with background loading support
   * @param fetchFn The async function to execute
   * @param isInitialLoad Whether this is the initial load (defaults to auto-detect)
   */
  fetchData: (
    fetchFn: () => Promise<T | null>,
    isInitialLoad?: boolean
  ) => Promise<T | null>
  /**
   * Manually set loading state
   */
  setLoading: (loading: boolean) => void
  /**
   * Manually set refreshing state
   */
  setRefreshing: (refreshing: boolean) => void
}

/**
 * Hook for managing background data fetching.
 * Shows full loading screen only on initial load, then refreshes in background.
 * 
 * @example
 * const { loading, refreshing, fetchData } = useBackgroundFetch()
 * 
 * useEffect(() => {
 *   fetchData(async () => {
 *     const response = await fetch('/api/data')
 *     return response.json()
 *   })
 * }, [])
 */
export function useBackgroundFetch<T = unknown>(
  options: UseBackgroundFetchOptions = {}
): UseBackgroundFetchReturn<T> {
  const { initialLoading = true } = options
  const [loading, setLoading] = useState(initialLoading)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedOnce = useRef(false)
  
  // Get context if available (for pages within dashboard)
  const refreshContext = useBackgroundRefreshSafe()
  const stopRefreshingRef = useRef<(() => void) | null>(null)

  // Sync refreshing state with global context
  useEffect(() => {
    if (!refreshContext) return

    if (refreshing) {
      // Start refreshing if not already
      if (!stopRefreshingRef.current) {
        stopRefreshingRef.current = refreshContext.startRefreshing()
      }
    } else {
      // Stop refreshing
      if (stopRefreshingRef.current) {
        stopRefreshingRef.current()
        stopRefreshingRef.current = null
      }
    }

    // Cleanup on unmount
    return () => {
      if (stopRefreshingRef.current) {
        stopRefreshingRef.current()
        stopRefreshingRef.current = null
      }
    }
  }, [refreshing, refreshContext])

  const fetchData = useCallback(
    async (
      fetchFn: () => Promise<T | null>,
      isInitialLoad?: boolean
    ): Promise<T | null> => {
      // Determine if this is initial load
      const isInitial = isInitialLoad ?? !hasLoadedOnce.current
      const hasExistingData = hasLoadedOnce.current

      try {
        // Set appropriate loading state
        if (isInitial || !hasExistingData) {
          setLoading(true)
        } else {
          setRefreshing(true)
        }

        // Execute the fetch function
        const result = await fetchFn()

        // Mark as loaded
        hasLoadedOnce.current = true
        setError(null)

        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    []
  )

  return {
    loading,
    refreshing,
    isLoading: loading || refreshing,
    error,
    setError,
    fetchData,
    setLoading,
    setRefreshing,
  }
}

