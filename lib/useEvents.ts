"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const KEY = "wt_event"
const EVT = "wt-event-change"
let claimed = false
// Every component on a page (navbar, sidebar, shell, the page itself) calls useEvents.
// Share one request and a short cache so a page load makes one /api/events call, not five.
let inflight: Promise<any[] | null> | null = null
let cached: { list: any[]; at: number } | null = null
const FRESH_MS = 15000

async function fetchEvents(force: boolean): Promise<any[] | null> {
  if (!force && cached && Date.now() - cached.at < FRESH_MS) return cached.list
  if (inflight) return inflight
  inflight = (async () => {
    if (!claimed) {
      claimed = true
      try {
        await createClient().rpc("claim_invites")
      } catch {}
    }
    const res = await fetch("/api/events")
    if (res.status === 401) {
      window.location.href = "/login"
      return null
    }
    const data = await res.json().catch(() => [])
    const list: any[] = Array.isArray(data) ? data : []
    cached = { list, at: Date.now() }
    return list
  })()
  try {
    return await inflight
  } finally {
    inflight = null
  }
}

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

  const load = useCallback(async (force?: unknown) => {
    const list = await fetchEvents(force === true || (typeof force === "object" && force !== null))
    if (!list) return
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
      if (!saved) return
      setEventIdState(saved)
      // another part of the page may have created or deleted a wedding: refresh this instance's list too (e.g. the navbar)
      load(true)
    }
    window.addEventListener(EVT, onChange)
    return () => window.removeEventListener(EVT, onChange)
  }, [load])

  function setEventId(id: string) {
    try {
      localStorage.setItem(KEY, id)
    } catch {}
    setEventIdState(id)
    window.dispatchEvent(new Event(EVT))
  }

  const role: string = events.find((e) => e.id === eventId)?._role ?? "owner"

  return { events, eventId, setEventId, loading, reload: () => load(true), role }
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
  owner: ["/", "/checklist", "/invitation", "/seating", "/guests", "/checkin", "/settings"],
  design: ["/checklist", "/invitation", "/seating", "/settings"],
  setup: ["/checklist", "/seating", "/guests"],
  checkin: ["/checkin"],
  member: [],
}

// Routes reachable regardless of role (not part of the role-gated sidebar nav)
export const EXEMPT_ROUTES = ["/profile"]
