"use client"

import { useState, useEffect, useCallback } from "react"
import type { RecentSearch } from "@/lib/types"

const STORAGE_KEY = "recentSearches"
const MAX_ITEMS = 5

function readFromStorage(): RecentSearch[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RecentSearch[]) : []
  } catch {
    return []
  }
}

function writeToStorage(items: RecentSearch[]) {
  if (items.length === 0) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function useRecentSearches() {
  const [searches, setSearches] = useState<RecentSearch[]>([])

  useEffect(() => {
    const stored = readFromStorage().slice(0, MAX_ITEMS)
    writeToStorage(stored)
    setSearches(stored)
  }, [])

  const add = useCallback((entry: Omit<RecentSearch, "id" | "ts">) => {
    const next: RecentSearch = {
      ...entry,
      id: crypto.randomUUID(),
      ts: Date.now(),
    }
    setSearches((prev) => {
      const updated = [next, ...prev].slice(0, MAX_ITEMS)
      writeToStorage(updated)
      return updated
    })
  }, [])

  const remove = useCallback((id: string) => {
    setSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      writeToStorage(updated)
      return updated
    })
  }, [])

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setSearches([])
  }, [])

  return { searches, add, remove, clear }
}
