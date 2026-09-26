"use client"

import { useCallback, useEffect, useState } from "react"
import { seatsUsed, useEvents } from "@/lib/useEvents"

export default function CheckinPage() {
  const { eventId, loading } = useEvents()
  const [guests, setGuests] = useState<any[]>([])
  const [tables, setTables] = useState<any[]>([])
  const [query, setQuery] = useState("")
  const [msg, setMsg] = useState("")
  const [walk, setWalk] = useState({ name: "", phone: "", table_id: "", companions: 0 })

  const load = useCallback(async () => {
    if (!eventId) return
    const res = await fetch(`/api/events/${eventId}`)
    if (!res.ok) return
    const e = await res.json()
    setGuests(e.guests ?? [])
    setTables((e.floors ?? []).flatMap((f: any) => f.tables ?? []))
  }, [eventId])

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [load])

  async function checkin(guestId: string, undo = false) {
    const res = await fetch("/api/checkin/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_id: guestId, event_id: eventId, undo }),
    })
    const d = await res.json()
    setMsg(res.ok ? (undo ? "Đã hoàn tác check-in" : "Check-in thành công") : d.message ?? "Lỗi")
    load()
  }

  async function addWalkin() {
    const res = await fetch("/api/checkin/walkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, ...walk, companions: Number(walk.companions) }),
    })
    const d = await res.json()
    if (res.ok) {
      setMsg(`Đã thêm khách vãng lai: ${walk.name}`)
      setWalk({ name: "", phone: "", table_id: "", companions: 0 })
      load()
    } else {
      setMsg(d.message ?? "Lỗi")
    }
  }

  if (loading) return <p className="text-muted">Đang tải...</p>
  if (!eventId) return <p className="text-muted">Bạn chưa có sự kiện nào. Tạo ở trang Tổng quan.</p>

  const q = query.trim().toLowerCase()
  const results = q
    ? guests.filter((g) => g.name.toLowerCase().includes(q) || (g.phone ?? "").includes(q) || g.code.toLowerCase() === q).slice(0, 8)
    : []
  const tableName = (id: string | null) => tables.find((t) => t.id === id)?.name ?? "Chưa có bàn"
  const checked = guests.filter((g) => g.checked_in)
  const people = checked.reduce((s, g) => s + 1 + (g.companions ?? 0), 0)
  const input = "border border-border rounded-card px-3 py-2 text-sm w-full"

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Check-in</h1>
        <div className="text-sm text-muted">
          {checked.length}/{guests.length} khách · {people} người
        </div>
      </div>

      {msg && (
        <div className="text-sm bg-pr-l text-pr-d rounded-card px-3 py-2 flex justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")}>✕</button>
        </div>
      )}

      <input
        autoFocus
        className={input}
        placeholder="Tìm theo tên, số điện thoại hoặc nhập mã QR của khách..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {q && results.length === 0 && <p className="text-sm text-muted">Không tìm thấy khách. Thêm khách vãng lai bên dưới.</p>}
      <div className="flex flex-col gap-2">
        {results.map((g) => (
          <div key={g.id} className="bg-surface border border-border rounded-card p-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-text">
                {g.name}
                {g.companions > 0 && <span className="text-muted"> +{g.companions}</span>}
              </div>
              <div className="text-xs text-muted">
                {tableName(g.table_id)} · {g.phone} · {g.code}
              </div>
            </div>
            {g.checked_in ? (
              <button onClick={() => checkin(g.id, true)} className="text-xs border border-border rounded-pill px-3 py-1.5 text-muted">
                Đã check-in · hoàn tác
              </button>
            ) : (
              <button onClick={() => checkin(g.id)} className="bg-pr text-ink font-medium rounded-pill px-4 py-1.5 text-sm">
                Check-in
              </button>
            )}
          </div>
        ))}
      </div>

      <section className="bg-surface border border-border rounded-card p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-text">Khách vãng lai</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className={input} placeholder="Tên khách" value={walk.name} onChange={(e) => setWalk({ ...walk, name: e.target.value })} />
          <input className={input} placeholder="Số điện thoại (không bắt buộc)" value={walk.phone} onChange={(e) => setWalk({ ...walk, phone: e.target.value })} />
          <select className={input} value={walk.table_id} onChange={(e) => setWalk({ ...walk, table_id: e.target.value })}>
            <option value="">-- Chọn bàn --</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (còn {t.seats - seatsUsed(guests, t.id)})
              </option>
            ))}
          </select>
          <input className={input} type="number" min={0} placeholder="Người đi kèm" value={walk.companions} onChange={(e) => setWalk({ ...walk, companions: Number(e.target.value) })} />
        </div>
        <button disabled={!walk.name.trim()} onClick={addWalkin} className="bg-pr text-ink font-medium rounded-pill px-4 py-2 text-sm w-fit disabled:opacity-50">
          Thêm và check-in
        </button>
      </section>
    </div>
  )
}
