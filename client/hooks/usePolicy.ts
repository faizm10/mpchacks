'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PolicyRule } from '../lib/types'
import { MOCK_POLICY_RULES } from '../lib/mock-data'
import * as api from '../lib/api'

export function usePolicy() {
  const [rules, setRules] = useState<PolicyRule[]>(MOCK_POLICY_RULES)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    api.getPolicyRules()
      .then(data => { if (!cancelled && data.length > 0) setRules(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const toggleRule = useCallback((id: string, isActive: boolean) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive } : r))
    api.togglePolicyRule(id, isActive).catch(() => {
      setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !isActive } : r))
    })
  }, [])

  return { rules, isLoading, toggleRule }
}
