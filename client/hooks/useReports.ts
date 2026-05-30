'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Trip } from '../lib/types'
import { MOCK_TRIPS } from '../lib/mock-data'
import * as api from '../lib/api'

export function useReports() {
  const [trips, setTrips] = useState<Trip[]>(MOCK_TRIPS)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    api.getTrips()
      .then(data => { if (!cancelled && data.length > 0) setTrips(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const selectTrip = useCallback((trip: Trip | null) => setSelectedTrip(trip), [])

  const refreshTrips = useCallback(() => {
    setIsLoading(true)
    api.getTrips()
      .then(data => { if (data.length > 0) setTrips(data) })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return { trips, selectedTrip, selectTrip, refreshTrips, isLoading }
}
