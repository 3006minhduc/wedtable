"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import QrScanner from "@/components/checkin/QrScanner"
import { seatsUsed, useEvents } from "@/lib/useEvents"

function extractCode(text: string) {
  const t = text.trim()
  const m = t.match(/\/invite\/([A-Za-z0-9]+)/)
  return (m ? m[1] : t).toUpperCase()
}

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

  const [scanning, setScanning] = useState(false)
  const [autoCheckin, setAutoCheckin] = useState(true)
  const lastScan = useRef<{ code: string; at: number }>({ code: "", at: 0 })
  const guestsRef = useRef<any[]>([])
  guestsRef.current = guests

  function handleScan(text: string) {
    const code = extractCode(text)
    const now = Date.now()
    if (lastScan.current.code === code && now - lastScan.current.at < 4000) return
    lastScan.current = { code, at: now }

    const g = guestsRef.current.find((x) => x.code === code)
    if (!g) {
      setMsg(`Không tìm thấy khách với mã ${code}`)
      return
    }
    if (g.checked_in) {
      setMsg(`${g.name} đã check-in trước đó`)
      setQuery(g.code)
      return
    }
    if (autoCheckin) {
      checkin(g.id)
      setMsg(`Đã check-in: ${g.name}`)
    } else {
      setScanning(false)
      setQuery(g.code)
    }
  }

  const [walkMsg, setWalkMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [walkSaving, setWalkSaving] = useState(false)

  async function addWalkin() {
    if (!walk.name.trim()) {
      setWalkMsg({ ok: false, text: "Vui lòng nhập tên khách." })
      return
    }
    if (tables.length > 0 && !walk.table_id) {
      setWalkMsg({ ok: false, text: "Vui lòng chọn bàn cho khách." })
      return
    }
    setWalkSaving(true)
    setWalkMsg(null)
    try {
      const res = await fetch("/api/checkin/walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, ...walk, name: walk.name.trim(), companions: Number(walk.companions) || 0 }),
      })
      const d = await res.json()
      if (res.ok) {
        setWalkMsg({ ok: true, text: `Đã thêm và check-in: ${walk.name.trim()}` })
        setWalk({ name: "", phone: "", table_id: "", companions: 0 })
        load()
      } else {
        setWalkMsg({ ok: false, text: d.message ?? "Không thêm được khách." })
      }
    } catch {
      setWalkMsg({ ok: false, text: "Lỗi kết nối, vui lòng thử lại." })
    }
    setWalkSaving(false)
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

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setScanning((s) => !s)}
            className={"rounded-pill px-4 py-2 text-sm font-medium " + (scanning ? "border border-border text-muted" : "bg-pr text-ink")}
          >
            {scanning ? "Tắt camera" : "Quét QR bằng camera"}
          </button>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={autoCheckin} onChange={(e) => setAutoCheckin(e.target.checked)} />
            Tự động check-in khi quét
          </label>
        </div>
        {scanning && <QrScanner onScan={handleScan} />}
      </div>

      <input
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className={input} placeholder="Tên khách" value={walk.name} onChange={(e) => setWalk({ ...walk, name: e.target.value })} />
          <input className={input} placeholder="Số điện thoại (không bắt buộc)" value={walk.phone} onChange={(e) => setWalk({ ...walk, phone: e.target.value })} />
          <select className={input} value={walk.table_id} onChange={(e) => setWalk({ ...walk, table_id: e.target.value })}>
            <option value="">-- Chọn bàn --</option>
            {tables.map((t) => {
              const left = t.seats - seatsUsed(guests, t.id)
              return (
                <option key={t.id} value={t.id} disabled={left < 1 + (Number(walk.companions) || 0)}>
                  {t.name} (còn {Math.max(0, left)} chỗ)
                </option>
              )
            })}
          </select>
          <input className={input} type="number" min={0} placeholder="Người đi kèm" value={walk.companions} onChange={(e) => setWalk({ ...walk, companions: Number(e.target.value) })} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button disabled={walkSaving} onClick={addWalkin} className="bg-pr text-ink font-medium rounded-pill px-4 py-2 text-sm disabled:opacity-50">
            {walkSaving ? "Đang thêm..." : "Thêm và check-in"}
          </button>
          {walkMsg && <span className={"text-sm " + (walkMsg.ok ? "text-sage" : "text-rose")}>{walkMsg.text}</span>}
        </div>
        {tables.length === 0 && <p className="text-xs text-muted">Chưa có bàn nào, khách sẽ được thêm mà chưa gán bàn.</p>}
      </section>
    </div>
  )
}
