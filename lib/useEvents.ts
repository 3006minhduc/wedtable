"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const KEY = "wt_event"
const EVT = "wt-event-change"
let claimed = false

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
    if (!claimed) {
      claimed = true
      try {
        await createClient().rpc("claim_invites")
      } catch {}
    }
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

  const role: string = events.find((e) => e.id === eventId)?._role ?? "owner"

  return { events, eventId, setEventId, loading, reload: load, role }
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

export const ROLE_LABEL: Record<string, string> = {
  owner: "Chủ sự kiện",
  design: "Thiết kế",
  setup: "Setup",
  checkin: "Check-in",
  member: "Thành viên",
}

export const NAV_BY_ROLE: Record<string, string[]> = {
  owner: ["/", "/seating", "/guests", "/checkin", "/settings"],
  design: ["/seating", "/settings"],
  setup: ["/seating", "/guests"],
  checkin: ["/checkin"],
  member: [],
}

// Routes reachable regardless of role (not part of the role-gated sidebar nav)
export const EXEMPT_ROUTES = ["/profile"]
