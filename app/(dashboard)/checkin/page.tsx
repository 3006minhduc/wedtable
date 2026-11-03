"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Icon from "@/components/ui/Icon"
import PremiumNote from "@/components/ui/PremiumNote"
import { isPremium } from "@/lib/plan"
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
  const [premium, setPremium] = useState(true)
  const [query, setQuery] = useState("")
  const [msg, setMsg] = useState("")
  const [walk, setWalk] = useState({ name: "", phone: "", table_id: "", companions: 0 })

  const load = useCallback(async () => {
    if (!eventId) return
    const res = await fetch(`/api/events/${eventId}`)
    if (!res.ok) return
    const e = await res.json()
    setGuests(e.guests ?? [])
    setPremium(isPremium(e))
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
  // Phone search uses only the last 4 digits; the full number is never shown at the front desk
  const qDigits = /^\d{4}$/.test(q) ? q : ""
  const last4 = (phone?: string | null) => (phone ?? "").replace(/\D/g, "").slice(-4)
  const results = q
    ? guests.filter((g) => g.name.toLowerCase().includes(q) || (qDigits && last4(g.phone) === qDigits) || g.code.toLowerCase() === q).slice(0, 8)
    : []
  const tableName = (id: string | null) => tables.find((t) => t.id === id)?.name ?? "Chưa có bàn"
  const checked = guests.filter((g) => g.checked_in)
  const people = checked.reduce((s, g) => s + 1 + (g.companions ?? 0), 0)
  const expected = guests.filter((g) => !g.no_show).reduce((s, g) => s + 1 + (g.companions ?? 0), 0)
  const pct = expected ? Math.min(100, Math.round((people / expected) * 100)) : 0
  const field = "border border-border hover:border-border-hover focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/10 rounded-lg h-10 px-3 text-sm w-full bg-surface"
  const msgOk = /thành công|Đã check-in|Đã hoàn tác/.test(msg)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-[28px] leading-tight tracking-[-0.01em] text-text">Check-in</h1>
        <p className="text-sm text-muted mt-1">Tìm theo tên, 4 số cuối điện thoại, hoặc quét mã QR trên thiệp của khách.</p>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        {/* Front desk */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-card p-4 sm:p-5 flex flex-col gap-4">
            <div className="relative">
              <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
              <input
                autoFocus
                className="w-full h-14 pl-12 pr-4 rounded-lg border border-border bg-surface text-base hover:border-border-hover focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/10"
                placeholder="Tên khách, 4 số cuối điện thoại hoặc mã QR"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {premium ? (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setScanning((s) => !s)}
                className={
                  "inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium " +
                  (scanning ? "border border-border text-text hover:bg-surface-alt" : "bg-brand text-white hover:bg-brand-hover")
                }
              >
                <Icon name="camera" size={18} />
                {scanning ? "Tắt camera" : "Quét QR bằng camera"}
              </button>
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                <input type="checkbox" checked={autoCheckin} onChange={(e) => setAutoCheckin(e.target.checked)} />
                Tự động check-in khi quét
              </label>
            </div>
            ) : (
              <PremiumNote compact>Quét QR bằng camera có trong gói Premium. Gói Miễn phí check-in bằng tìm tên.</PremiumNote>
            )}
            {scanning && (
              <div className="rounded-lg overflow-hidden border border-border">
                <QrScanner onScan={handleScan} />
              </div>
            )}
          </div>

          {msg && (
            <div
              role="status"
              className={"text-sm rounded-lg px-4 py-3 flex items-center gap-2 " + (msgOk ? "bg-success/10 text-success" : "bg-surface-alt text-text")}
            >
              {msgOk && <Icon name="check" size={16} />}
              <span className="flex-1">{msg}</span>
              <button onClick={() => setMsg("")} aria-label="Đóng thông báo" className="text-current/70 hover:text-current">
                <Icon name="close" size={14} />
              </button>
            </div>
          )}

          {q && results.length === 0 && (
            <p className="text-sm text-muted px-1">Không tìm thấy khách. Có thể thêm khách vãng lai ở khung bên phải.</p>
          )}
          {results.length > 0 && (
            <div className="bg-surface border border-border rounded-card divide-y divide-border">
              {results.map((g) => (
                <div key={g.id} className="flex items-center gap-4 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-full bg-brand-soft text-brand flex items-center justify-center font-medium shrink-0">
                    {(g.name ?? "?").trim().split(/\s+/).pop()?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text truncate">
                      {g.name}
                      {g.companions > 0 && <span className="text-muted font-normal"> +{g.companions}</span>}
                    </p>
                    <p className="text-sm text-muted truncate">
                      <span className="text-text">{tableName(g.table_id)}</span>
                      {last4(g.phone) ? ` · SĐT …${last4(g.phone)}` : ""} · {g.code}
                    </p>
                  </div>
                  {g.checked_in ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 text-sm text-success">
                        <Icon name="check" size={16} /> Đã đến
                      </span>
                      <button onClick={() => checkin(g.id, true)} className="text-xs text-muted hover:text-text underline underline-offset-2">
                        Hoàn tác
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => checkin(g.id)}
                      className="shrink-0 h-11 px-5 rounded-lg bg-text text-surface font-medium text-sm hover:bg-text/90"
                    >
                      Check-in
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side: progress + walk-in */}
        <aside className="flex flex-col gap-6">
          <section className="bg-surface border border-border rounded-card p-5">
            <h2 className="font-semibold text-[15px]">Khách đã đến</h2>
            <p className="font-serif text-4xl mt-3 tabular-nums">
              {people}
              <span className="text-faint text-2xl"> / {expected} người</span>
            </p>
            <div className="h-1.5 rounded-full bg-surface-alt overflow-hidden mt-4">
              <div className="h-full bg-brand rounded-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-sm text-muted mt-2">
              {checked.length} / {guests.length} thiệp đã check-in
            </p>
          </section>

          {premium ? (
          <section className="bg-surface border border-border rounded-card p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Icon name="userPlus" size={18} className="text-faint" />
              <h2 className="font-semibold text-[15px]">Khách vãng lai</h2>
            </div>
            <input className={field} placeholder="Tên khách" value={walk.name} onChange={(e) => setWalk({ ...walk, name: e.target.value })} />
            <input className={field} placeholder="Số điện thoại (không bắt buộc)" value={walk.phone} onChange={(e) => setWalk({ ...walk, phone: e.target.value })} />
            <div className="grid grid-cols-[1fr_96px] gap-2">
              <select className={field} value={walk.table_id} onChange={(e) => setWalk({ ...walk, table_id: e.target.value })}>
                <option value="">Chọn bàn…</option>
                {tables.map((t) => {
                  const left = t.seats - seatsUsed(guests, t.id)
                  return (
                    <option key={t.id} value={t.id} disabled={left < 1 + (Number(walk.companions) || 0)}>
                      {t.name} (còn {Math.max(0, left)} chỗ)
                    </option>
                  )
                })}
              </select>
              <input
                className={field}
                type="number"
                min={0}
                aria-label="Số người đi kèm"
                placeholder="Đi kèm"
                value={walk.companions}
                onChange={(e) => setWalk({ ...walk, companions: Number(e.target.value) })}
              />
            </div>
            <button
              disabled={walkSaving}
              onClick={addWalkin}
              className="h-10 rounded-lg border border-border text-sm font-medium text-text hover:bg-surface-hover hover:border-border-hover disabled:opacity-50"
            >
              {walkSaving ? "Đang thêm..." : "Thêm và check-in"}
            </button>
            {walkMsg && <p className={"text-sm " + (walkMsg.ok ? "text-success" : "text-error")}>{walkMsg.text}</p>}
            {tables.length === 0 && <p className="text-xs text-muted">Chưa có bàn nào, khách sẽ được thêm mà chưa gán bàn.</p>}
          </section>
          ) : (
            <PremiumNote title="Khách vãng lai">Thêm và check-in khách không có trong danh sách là tính năng Premium.</PremiumNote>
          )}
        </aside>
      </div>
    </div>
  )
}
