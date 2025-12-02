import { useEffect, useRef, useCallback } from 'react'

interface UseAutoSaveOptions<T> {
  data: T
  onSave: (data: T) => Promise<void> | void
  debounceMs?: number
  storageKey?: string
  enabled?: boolean
}

/**
 * Custom hook for auto-saving form data
 * - Saves to localStorage for recovery
 * - Calls onSave callback for backend auto-save (optional)
 */
export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 2000, // 2 seconds debounce
  storageKey,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedRef = useRef<string>('')
  const isSavingRef = useRef(false)

  // Serialize data for comparison
  const serializeData = useCallback((data: T): string => {
    try {
      return JSON.stringify(data)
    } catch (error) {
      console.error('Error serializing data:', error)
      return ''
    }
  }, [])

  // Save to localStorage
  const saveToStorage = useCallback(
    (data: T) => {
      if (!storageKey) return
      try {
        const serialized = serializeData(data)
        localStorage.setItem(storageKey, serialized)
        localStorage.setItem(`${storageKey}_timestamp`, new Date().toISOString())
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    },
    [storageKey, serializeData]
  )

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return

    const currentSerialized = serializeData(data)
    
    // Skip if data hasn't changed
    if (currentSerialized === lastSavedRef.current) {
      return
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Save to localStorage immediately (for recovery)
    saveToStorage(data)

    // Debounce backend save
    timeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return
      
      try {
        isSavingRef.current = true
        await onSave(data)
        lastSavedRef.current = currentSerialized
      } catch (error) {
        console.error('Auto-save error:', error)
        // Don't update lastSavedRef on error so it will retry
      } finally {
        isSavingRef.current = false
      }
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, onSave, debounceMs, enabled, saveToStorage, serializeData])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
}

/**
 * Hook to load saved data from localStorage
 */
export function useLoadSavedData<T>(storageKey: string | null): T | null {
  if (!storageKey) return null

  try {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      return JSON.parse(saved) as T
    }
  } catch (error) {
    console.error('Error loading saved data:', error)
  }

  return null
}

/**
 * Hook to clear saved data from localStorage
 */
export function useClearSavedData(storageKey: string | null) {
  return useCallback(() => {
    if (!storageKey) return
    try {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(`${storageKey}_timestamp`)
    } catch (error) {
      console.error('Error clearing saved data:', error)
    }
  }, [storageKey])
}

/**
 * Get saved data timestamp
 */
export function getSavedDataTimestamp(storageKey: string | null): string | null {
  if (!storageKey) return null
  try {
    return localStorage.getItem(`${storageKey}_timestamp`)
  } catch {
    return null
  }
}

