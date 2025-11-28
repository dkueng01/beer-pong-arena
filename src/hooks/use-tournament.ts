"use client"

import { useState, useEffect, useCallback } from "react"
import type { Tournament } from "@/lib/tournament"

const STORAGE_KEY = "beerpong-tournament"

export function useTournament() {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setTournament(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse tournament data", e)
      }
    }
    setIsLoading(false)
  }, [])

  const saveTournament = useCallback((newTournament: Tournament | null) => {
    setTournament(newTournament)
    if (newTournament) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTournament))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const clearTournament = useCallback(() => {
    setTournament(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    tournament,
    isLoading,
    saveTournament,
    clearTournament,
  }
}
