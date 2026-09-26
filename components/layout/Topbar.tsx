"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { daysLeft, useEvents } from "@/lib/useEvents"

function Pill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="hidden md:flex items-center gap-1 bg-pr-l text-pr-d rounded-pill px-3 py-1 text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

export default function Topbar({ onMenu }: { onMenu?: () => void }) {
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

  async function logout() {
    await createClient().auth.signOut()
    window.location.href = "/login"
  }

  const stats = detail?._stats
  const tablesCount = (detail?.floors ?? []).reduce((s: number, f: any) => s + (f.tables?.length ?? 0), 0)
  const left = daysLeft(detail?.event_date)
  const pct = stats && stats.total ? Math.round((stats.confirmed / stats.total) * 100) : 0

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-3 md:px-6 sticky top-0 z-10 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenu}
          aria-label="Mở menu"
          className="md:hidden border border-border rounded-card w-9 h-9 flex items-center justify-center text-lg"
        >
          ☰
        </button>

        {events.length > 0 ? (
          <select
            className="border border-border rounded-card px-2 py-1 text-sm max-w-[150px] sm:max-w-[220px]"
            value={eventId ?? ""}
            onChange={(e) => setEventId(e.target.value)}
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.bride_name || "?"} &amp; {e.groom_name || "?"}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-medium text-text">Dashboard</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {stats && (
          <>
            {left !== null && <Pill label="Còn" value={left >= 0 ? `${left} ngày` : "đã qua"} />}
            <Pill label="Xác nhận" value={`${pct}%`} />
            <Pill label="Khách" value={stats.total} />
            <Pill label="Bàn" value={tablesCount} />
            <Pill label="Check-in" value={stats.checked_in} />
          </>
        )}
        <button
          onClick={logout}
          className="text-xs text-muted hover:text-text border border-border rounded-pill px-3 py-1"
        >
          Đăng xuất
        </button>
      </div>
    </header>
  )
}
