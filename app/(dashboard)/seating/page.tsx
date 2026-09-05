"use client"

import { useEffect, useRef, useState } from "react"
import SeatingCanvas from "@/components/seating/SeatingCanvas"

export default function SeatingPage() {
  const [eventId, setEventId] = useState<string | null>(null)
  const [tables, setTables] = useState<any[]>([])
  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<any>(null)
  const pendingRef = useRef<Record<string, { id: string; x_pct: number; y_pct: number }>>({})

  useEffect(() => {
    async function init() {
      const eventsRes = await fetch("/api/events")
      const events = await eventsRes.json()
      if (!Array.isArray(events) || events.length === 0) {
        setLoading(false)
        return
      }
      const id = events[0].id
      setEventId(id)
      const eventRes = await fetch(`/api/events/${id}`)
      const event = await eventRes.json()
      const allTables = (event.floors ?? []).flatMap((f: any) => f.tables ?? [])
      setTables(allTables)
      setGuests(event.guests ?? [])
      setLoading(false)
    }
    init()
  }, [])

  function handleTableMove(id: string, x_pct: number, y_pct: number) {
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, x_pct, y_pct } : t)))
    pendingRef.current[id] = { id, x_pct, y_pct }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!eventId) return
      const positions = Object.values(pendingRef.current)
      pendingRef.current = {}
      await fetch(`/api/events/${eventId}/tables/batch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions }),
      })
    }, 500)
  }

  if (loading) return <p className="text-muted">Đang tải...</p>
  if (!eventId) return <p className="text-muted">Bạn chưa có sự kiện nào.</p>

  return (
    <div>
      <h1 className="text-xl font-semibold text-text mb-4">Sơ đồ bàn</h1>
      <SeatingCanvas tables={tables} guests={guests} onTableMove={handleTableMove} />
    </div>
  )
}
