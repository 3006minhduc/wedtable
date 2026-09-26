"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { daysLeft, useEvents } from "@/lib/useEvents"
import UserMenu from "./UserMenu"

function Pill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="hidden lg:flex items-center gap-1 bg-pr-l text-pr-d rounded-pill px-3 py-1 text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

export default function Navbar({ onMenu }: { onMenu?: () => void }) {
  const { events, eventId, setEventId } = useEvents()
  const [detail, setDetail] = useState<any>(null)

  const fetchDetail = useCallback(async () => {
    if (!eventId) {
      setDetail(null)
      return
    }
    const res = await fetch(`/api/events/${eventId}`)
    if (res.ok) setDetail(await res.json())
  }, [eventId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  useEffect(() => {
    if (!eventId) return
    const supabase = createClient()
    const channel = (supabase.channel("guests-stats-" + eventId) as any)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guests", filter: `event_id=eq.${eventId}` },
        () => fetchDetail()
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, fetchDetail])

  const stats = detail?._stats
  const tablesCount = (detail?.floors ?? []).reduce((s: number, f: any) => s + (f.tables?.length ?? 0), 0)
  const left = daysLeft(detail?.event_date)
  const pct = stats && stats.total ? Math.round((stats.confirmed / stats.total) * 100) : 0

  return (
    <header className="h-14 sticky top-0 z-40 bg-surface border-b border-border flex items-center gap-3 px-3 md:px-5">
      <button
        onClick={onMenu}
        aria-label="Mở menu"
        className="md:hidden border border-border rounded-card w-9 h-9 flex items-center justify-center text-lg shrink-0"
      >
        ☰
      </button>

      <Link href="/" className="flex items-center gap-2 shrink-0 md:w-[210px]">
        <span className="w-8 h-8 rounded-card bg-pr text-ink font-bold flex items-center justify-center">W</span>
        <span className="font-semibold text-text text-base">WedTable</span>
      </Link>

      <div className="flex-1 flex items-center gap-2 min-w-0">
        {events.length > 0 && (
          <select
            className="border border-border rounded-card px-2 py-1.5 text-sm max-w-[140px] sm:max-w-[240px] min-w-0"
            value={eventId ?? ""}
            onChange={(e) => setEventId(e.target.value)}
            aria-label="Chọn đám cưới"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.bride_name || "?"} &amp; {e.groom_name || "?"}
              </option>
            ))}
          </select>
        )}
        {stats && (
          <div className="flex items-center gap-2 ml-1">
            {left !== null && <Pill label="Còn" value={left >= 0 ? `${left} ngày` : "đã qua"} />}
            <Pill label="Xác nhận" value={`${pct}%`} />
            <Pill label="Khách" value={stats.total} />
            <Pill label="Bàn" value={tablesCount} />
            <Pill label="Check-in" value={stats.checked_in} />
          </div>
        )}
      </div>

      <UserMenu />
    </header>
  )
}
