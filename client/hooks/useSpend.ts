'use client'

import { useState, useEffect } from 'react'
import type { SpendSummary } from '../lib/types'
import { MOCK_SPEND_SUMMARY } from '../lib/mock-data'
import * as api from '../lib/api'

type Tab = 'category' | 'time' | 'merchants' | 'card'

export function useSpend() {
  const [summary, setSummary] = useState<SpendSummary | null>(MOCK_SPEND_SUMMARY)
  const [activeTab, setActiveTab] = useState<Tab>('category')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    api.getSpendSummary()
      .then(data => { if (!cancelled) setSummary(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { summary, activeTab, setActiveTab, isLoading }
}
