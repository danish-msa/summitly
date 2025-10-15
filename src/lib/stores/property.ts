import { create } from 'zustand'
import { PropertyListing, PropertyFilters } from '@/lib/types'

interface PropertyState {
  properties: PropertyListing[]
  favorites: string[]
  searchFilters: PropertyFilters
  isLoading: boolean
  error: string | null
  
  // Actions
  setProperties: (properties: PropertyListing[]) => void
  addToFavorites: (propertyId: string) => void
  removeFromFavorites: (propertyId: string) => void
  setSearchFilters: (filters: PropertyFilters) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearFilters: () => void
}

const defaultFilters: PropertyFilters = {
  page: 1,
  limit: 12,
  sortBy: 'relevance',
  sortOrder: 'desc'
}

export const usePropertyStore = create<PropertyState>((set) => ({
  properties: [],
  favorites: [],
  searchFilters: defaultFilters,
  isLoading: false,
  error: null,
  
  setProperties: (properties) => set({ properties }),
  addToFavorites: (propertyId) => set((state) => ({
    favorites: [...state.favorites, propertyId]
  })),
  removeFromFavorites: (propertyId) => set((state) => ({
    favorites: state.favorites.filter(id => id !== propertyId)
  })),
  setSearchFilters: (filters) => set({ searchFilters: { ...defaultFilters, ...filters } }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearFilters: () => set({ searchFilters: defaultFilters }),
}))
