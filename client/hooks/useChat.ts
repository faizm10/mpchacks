'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { ChatMessage } from '../lib/types'
import * as api from '../lib/api'

let idCounter = 0
const uid = () => `msg-${++idCounter}`

export function useChat(initialQuery?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const initialSent = useRef(false)

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return
    setInput('')

    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }
    const loadingMsg: ChatMessage = {
      id: uid(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }

    setMessages(prev => [...prev, userMsg, loadingMsg])
    setIsLoading(true)

    try {
      const resp = await api.sendChatMessage(text.trim(), messages)
      const assistantMsg: ChatMessage = {
        id: loadingMsg.id,
        role: 'assistant',
        content: resp.content,
        transactions: resp.transactions,
        chartData: resp.chartData
          ? { ...resp.chartData, type: resp.chartData.type as 'bar' | 'line' | 'pie' }
          : undefined,
        timestamp: new Date(),
      }
      setMessages(prev => prev.map(m => m.id === loadingMsg.id ? assistantMsg : m))
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === loadingMsg.id
          ? { ...m, isLoading: false, content: 'Something went wrong. Please try again.' }
          : m
      ))
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, messages])

  useEffect(() => {
    if (initialQuery && !initialSent.current) {
      initialSent.current = true
      sendMessage(initialQuery)
    }
  }, [initialQuery, sendMessage])

  return { messages, isLoading, input, setInput, sendMessage }
}
