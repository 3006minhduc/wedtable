"use client"

import { useCallback, useEffect, useState } from "react"
import { daysLeft, seatsUsed, useEvents } from "@/lib/useEvents"

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-card p-4">
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="text-2xl font-semibold text-text">{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  )
}

function CreateEventForm({ onCreated, onCancel }: { onCreated: (id: string) => void; onCancel?: () => void }) {
  const [form, setForm] = useState({ bride_name: "", groom_name: "", event_date: "", venue_name: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function submit() {
    setSaving(true)
    setError("")
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, event_date: form.event_date || null }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(data.message ?? "Không tạo được sự kiện")
      return
    }
    onCreated(data.id)
  }

  const input = "border border-border rounded-card px-3 py-2 text-sm w-full"
  return (
    <div className="bg-surface border border-border rounded-card p-4 max-w-lg">
      <h2 className="font-semibold text-text mb-3">Tạo đám cưới mới</h2>
      {error && <p className="text-sm text-rose mb-2">{error}</p>}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input className={input} placeholder="Tên cô dâu" value={form.bride_name} onChange={(e) => setForm({ ...form, bride_name: e.target.value })} />
        <input className={input} placeholder="Tên chú rể" value={form.groom_name} onChange={(e) => setForm({ ...form, groom_name: e.target.value })} />
        <input className={input} type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
        <input className={input} placeholder="Địa điểm" value={form.venue_name} onChange={(e) => setForm({ ...form, venue_name: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <button disabled={saving} onClick={submit} className="bg-pr text-ink font-medium rounded-pill px-4 py-2 text-sm disabled:opacity-50">
          {saving ? "Đang tạo..." : "Tạo sự kiện"}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="border border-border rounded-pill px-4 py-2 text-sm text-muted">
            Hủy
          </button>
        )}
      </div>
    </div>
  )
}

export default function DashboardHome() {
  const { events, eventId, setEventId, loading, reload } = useEvents()
  const [detail, setDetail] = useState<any>(null)
  const [creating, setCreating] = useState(false)

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

  async function handleCreated(id: string) {
    setEventId(id)
    setCreating(false)
    await reload()
  }

  if (loading) return <p className="text-muted">Đang tải...</p>

  if (events.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-text mb-2">Chào mừng đến WebTable</h1>
        <p className="text-muted mb-4">Bạn chưa có sự kiện nào. Tạo đám cưới đầu tiên để bắt đầu.</p>
        <CreateEventForm onCreated={handleCreated} />
      </div>
    )
  }

  const stats = detail?._stats
  const floors: any[] = detail?.floors ?? []
  const guests: any[] = detail?.guests ?? []
  const tables = floors.flatMap((f) => f.tables ?? [])
  const totalSeats = tables.reduce((s: number, t: any) => s + t.seats, 0)
  const seated = tables.reduce((s: number, t: any) => s + seatsUsed(guests, t.id), 0)
  const unseated = guests.filter((g) => !g.table_id && !g.no_show).length
  const left = daysLeft(detail?.event_date)
  const pct = stats && stats.total ? Math.round((stats.confirmed / stats.total) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">
            {detail?.bride_name} &amp; {detail?.groom_name}
          </h1>
          <p className="text-sm text-muted">
            {detail?.event_date ?? "Chưa đặt ngày"} · {detail?.venue_name || "Chưa có địa điểm"}
            {left !== null && ` · ${left >= 0 ? `còn ${left} ngày` : "đã diễn ra"}`}
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="bg-pr text-ink font-medium rounded-pill px-4 py-2 text-sm">
          + Đám cưới mới
        </button>
      </div>

      {creating && <CreateEventForm onCreated={handleCreated} onCancel={() => setCreating(false)} />}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Tổng khách" value={stats.total} />
          <StatCard label="Đã xác nhận" value={stats.confirmed} sub={`${pct}%`} />
          <StatCard label="Chưa phản hồi" value={stats.pending} />
          <StatCard label="Không đến" value={stats.no_show} />
          <StatCard label="Đã check-in" value={stats.checked_in} />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        <StatCard label="Số bàn" value={tables.length} sub={`${totalSeats} chỗ`} />
        <StatCard label="Đã xếp chỗ" value={`${seated}/${totalSeats}`} />
        <StatCard label="Khách chưa có bàn" value={unseated} />
      </div>

      <div className="bg-surface border border-border rounded-card p-4">
        <h2 className="font-semibold text-text mb-3">Mức lấp đầy từng bàn</h2>
        {tables.length === 0 ? (
          <p className="text-sm text-muted">Chưa có bàn nào. Vào Sơ đồ bàn để thêm.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tables.map((t: any) => {
              const used = seatsUsed(guests, t.id)
              const w = Math.min(100, Math.round((used / t.seats) * 100))
              return (
                <div key={t.id} className="flex items-center gap-3 text-sm">
                  <div className="w-24 text-text truncate">{t.name}</div>
                  <div className="flex-1 h-2 bg-bg rounded-pill overflow-hidden">
                    <div className={"h-full " + (used > t.seats ? "bg-rose" : "bg-pr")} style={{ width: `${w}%` }} />
                  </div>
                  <div className="w-14 text-right text-muted text-xs">
                    {used}/{t.seats}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {events.length > 1 && (
        <div className="bg-surface border border-border rounded-card p-4">
          <h2 className="font-semibold text-text mb-3">Tất cả đám cưới</h2>
          <div className="flex flex-col gap-1">
            {events.map((e) => (
              <button
                key={e.id}
                onClick={() => setEventId(e.id)}
                className={"text-left text-sm px-3 py-2 rounded-card " + (e.id === eventId ? "bg-pr-l text-pr-d" : "hover:bg-bg text-text")}
              >
                {e.bride_name} &amp; {e.groom_name} · {e.event_date ?? "chưa có ngày"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
