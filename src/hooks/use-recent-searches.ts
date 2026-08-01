"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "bms-recent-searches"
const MAX_SEARCHES = 5

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoaded(true)
  }, [])

  const addSearch = useCallback((term: string) => {
    if (!term.trim()) return
    setRecentSearches(prev => {
      const updated = [term, ...prev.filter(s => s !== term)].slice(0, MAX_SEARCHES)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const removeSearch = useCallback((term: string) => {
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== term)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearSearches = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { recentSearches, addSearch, removeSearch, clearSearches, isLoaded }
}
