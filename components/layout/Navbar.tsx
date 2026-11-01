"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { daysLeft, useEvents } from "@/lib/useEvents"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/ui/Logo"
import UserMenu from "./UserMenu"

export default function Navbar({ onMenu, menuOpen }: { onMenu?: () => void; menuOpen?: boolean }) {
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
      .on("postgres_changes", { event: "*", schema: "public", table: "guests", filter: `event_id=eq.${eventId}` }, () => fetchDetail())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, fetchDetail])

  const stats = detail?._stats
  const left = daysLeft(detail?.event_date)
  const pct = stats && stats.total ? Math.round((stats.confirmed / stats.total) * 100) : 0
  const summary = stats
    ? [left !== null ? (left > 0 ? `Còn ${left} ngày` : left === 0 ? "Hôm nay" : "Đã diễn ra") : null, `${stats.total} khách`, `${pct}% đã xác nhận`, `${stats.checked_in} đã check-in`]
        .filter(Boolean)
        .join(" · ")
    : ""

  return (
    <header className="h-14 sticky top-0 z-40 bg-surface border-b border-border flex items-center gap-3 px-3 md:px-0">
      <button
        onClick={onMenu}
        aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
        aria-expanded={menuOpen}
        className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-muted hover:bg-surface-alt shrink-0"
      >
        <Icon name={menuOpen ? "close" : "menu"} size={20} />
      </button>

      <Link href="/" className="flex items-center shrink-0 md:w-[224px] md:px-6" aria-label="WedTable — Tổng quan">
        <Logo />
      </Link>

      <div className="flex-1 flex items-center gap-4 min-w-0 md:pl-6">
        {events.length > 0 && (
          <div className="relative min-w-0">
            <select
              className="appearance-none bg-surface border border-border hover:border-border-hover rounded-lg pl-3 pr-8 h-9 text-sm font-medium text-text max-w-[150px] sm:max-w-[260px] truncate cursor-pointer"
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
            <Icon name="chevronDown" size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          </div>
        )}
        {summary && <p className="hidden lg:block text-sm text-muted truncate">{summary}</p>}
      </div>

      <div className="md:pr-6">
        <UserMenu />
      </div>
    </header>
  )
}
