"use client"

import { useCallback, useEffect, useState } from "react"

const KEY = "wt_event"
const EVT = "wt-event-change"

function readSaved(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function useEvents() {
  const [events, setEvents] = useState<any[]>([])
  const [eventId, setEventIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch("/api/events")
    if (res.status === 401) {
      window.location.href = "/login"
      return
    }
    const data = await res.json()
    const list: any[] = Array.isArray(data) ? data : []
    setEvents(list)
    const saved = readSaved()
    const pick = list.find((e) => e.id === saved)?.id ?? list[0]?.id ?? null
    setEventIdState(pick)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    function onChange() {
      const saved = readSaved()
      if (saved) setEventIdState(saved)
    }
    window.addEventListener(EVT, onChange)
    return () => window.removeEventListener(EVT, onChange)
  }, [])

  function setEventId(id: string) {
    try {
      localStorage.setItem(KEY, id)
    } catch {}
    setEventIdState(id)
    window.dispatchEvent(new Event(EVT))
  }

  return { events, eventId, setEventId, loading, reload: load }
}

export function daysLeft(date: string | null | undefined) {
  if (!date) return null
  const diff = new Date(date).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export function seatsUsed(guests: any[], tableId: string) {
  return guests
    .filter((g) => g.table_id === tableId && !g.no_show)
    .reduce((s, g) => s + 1 + (g.companions ?? 0), 0)
}
