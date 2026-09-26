"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

function used(guests: any[], tableId: string, onlyCheckedIn = false) {
  return guests
    .filter((g) => g.table_id === tableId && !g.no_show && (!onlyCheckedIn || g.checked_in))
    .reduce((s, g) => s + 1 + (g.companions ?? 0), 0)
}

export default function DisplayPage({ params }: { params: { eventId: string } }) {
  const [event, setEvent] = useState<any>(null)
  const [error, setError] = useState("")
  const [floorIdx, setFloorIdx] = useState(0)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("events")
      .select("*, floors(*, tables(*)), guests(*)")
      .eq("id", params.eventId)
      .single()
    if (error || !data) {
      setError("Không tìm thấy sự kiện hoặc sự kiện chưa được publish.")
      return
    }
    data.floors = [...(data.floors ?? [])].sort((a: any, b: any) => a.order_index - b.order_index)
    setEvent(data)
  }, [params.eventId])

  useEffect(() => {
    load()
    const supabase = createClient()
    const channel = (supabase.channel("display-" + params.eventId) as any)
      .on("postgres_changes", { event: "*", schema: "public", table: "guests", filter: `event_id=eq.${params.eventId}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "tables", filter: `event_id=eq.${params.eventId}` }, () => load())
      .subscribe()
    const poll = setInterval(load, 15000)
    return () => {
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [load, params.eventId])

  if (error) return <div className="min-h-screen flex items-center justify-center text-muted">{error}</div>
  if (!event) return <div className="min-h-screen flex items-center justify-center text-muted">Đang tải...</div>

  const floors: any[] = event.floors ?? []
  const floor = floors[Math.min(floorIdx, floors.length - 1)]
  const guests: any[] = event.guests ?? []
  const checkedPeople = guests.filter((g) => g.checked_in).reduce((s, g) => s + 1 + (g.companions ?? 0), 0)
  const expected = guests.filter((g) => !g.no_show).reduce((s, g) => s + 1 + (g.companions ?? 0), 0)

  return (
    <div className="min-h-screen bg-ink text-white p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {event.bride_name} &amp; {event.groom_name}
          </h1>
          <p className="text-white/60 text-sm">
            {event.event_date} · {event.venue_name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-3xl font-semibold text-pr">
              {checkedPeople}
              <span className="text-white/50 text-lg">/{expected}</span>
            </div>
            <div className="text-xs text-white/60">khách đã có mặt</div>
          </div>
          <button
            className="border border-white/30 rounded-pill px-3 py-1.5 text-sm"
            onClick={() => document.documentElement.requestFullscreen?.()}
          >
            Toàn màn hình
          </button>
        </div>
      </div>

      {floors.length > 1 && (
        <div className="flex gap-2 mb-3">
          {floors.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setFloorIdx(i)}
              className={"rounded-pill px-3 py-1 text-sm border " + (i === floorIdx ? "bg-pr border-pr text-ink" : "border-white/30 text-white/70")}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}

      <div className="relative w-full h-[70vh] bg-white/5 border border-white/10 rounded-card overflow-hidden">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-white/10 text-xs px-4 py-2 rounded-card">Sân khấu</div>
        {(floor?.tables ?? []).map((t: any) => {
          const total = used(guests, t.id)
          const here = used(guests, t.id, true)
          const pct = Math.min(100, Math.round((here / Math.max(1, t.seats)) * 100))
          const names = guests.filter((g) => g.table_id === t.id && !g.no_show).map((g) => g.name)
          return (
            <div
              key={t.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: `${t.x_pct}%`, top: `${t.y_pct}%` }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: `conic-gradient(var(--pr) ${pct}%, rgba(255,255,255,0.15) 0)` }}
              >
                <div className={"w-16 h-16 rounded-full flex flex-col items-center justify-center text-xs " + (t.vip ? "bg-pr-d" : "bg-ink")}>
                  <span className="font-medium">{t.name}</span>
                  <span className="text-white/60 text-[10px]">
                    {here}/{total || t.seats}
                  </span>
                </div>
              </div>
              {event.show_guest_names_on_map && names.length > 0 && (
                <div className="text-[10px] text-white/60 mt-1 max-w-[110px] text-center leading-tight">{names.slice(0, 4).join(", ")}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
