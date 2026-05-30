'use client'

import { useState, useEffect, useCallback } from 'react'
import type { InboxItem } from '../lib/types'
import { MOCK_INBOX_ITEMS } from '../lib/mock-data'
import * as api from '../lib/api'

type FilterType = 'all' | 'violations' | 'approvals' | 'resolved'

export function useInbox() {
  const [items, setItems] = useState<InboxItem[]>(MOCK_INBOX_ITEMS)
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    api.getInboxItems()
      .then(data => { if (!cancelled && data.length > 0) setItems(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const selectItem = useCallback((item: InboxItem | null) => {
    setSelectedItem(item)
    if (item) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, isRead: true } : i))
    }
  }, [])

  const resolveItem = useCallback((id: string, action: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, isResolved: true } : i))
    setSelectedItem(null)
    api.resolveInboxItem(id, action).catch(() => {})
  }, [])

  return { items, selectedItem, selectItem, resolveItem, filter, setFilter, isLoading }
}
