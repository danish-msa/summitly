"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface BackgroundRefreshContextType {
  isRefreshing: boolean
  startRefreshing: () => () => void // Returns a function to stop refreshing
}

const BackgroundRefreshContext = createContext<
  BackgroundRefreshContextType | undefined
>(undefined)

export function BackgroundRefreshProvider({
  children,
}: {
  children: ReactNode
}) {
  const [refreshCount, setRefreshCount] = useState(0)

  const startRefreshing = useCallback(() => {
    setRefreshCount((prev) => prev + 1)
    // Return a function to stop refreshing
    return () => {
      setRefreshCount((prev) => Math.max(0, prev - 1))
    }
  }, [])

  return (
    <BackgroundRefreshContext.Provider
      value={{
        isRefreshing: refreshCount > 0,
        startRefreshing,
      }}
    >
      {children}
    </BackgroundRefreshContext.Provider>
  )
}

export function useBackgroundRefresh() {
  const context = useContext(BackgroundRefreshContext)
  if (context === undefined) {
    throw new Error(
      'useBackgroundRefresh must be used within a BackgroundRefreshProvider'
    )
  }
  return context
}

/**
 * Safe version that returns null if context is not available
 */
export function useBackgroundRefreshSafe() {
  const context = useContext(BackgroundRefreshContext)
  return context
}

