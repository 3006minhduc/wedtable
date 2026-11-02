"use client"

import { useCallback, useEffect, useState } from "react"
import Icon from "@/components/ui/Icon"
import { isPremium, PROMO_END_TEXT } from "@/lib/plan"
import { daysLeft, seatsUsed, useEvents } from "@/lib/useEvents"

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

  const input = "border border-border hover:border-border-hover focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/10 rounded-lg h-10 px-3 text-sm w-full bg-surface"
  return (
    <div className="bg-surface border border-border rounded-card p-5 max-w-lg">
      <h2 className="font-semibold text-[15px] text-text mb-4">Tạo đám cưới mới</h2>
      {error && <p className="text-sm text-error mb-2">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <input className={input} placeholder="Tên cô dâu" value={form.bride_name} onChange={(e) => setForm({ ...form, bride_name: e.target.value })} />
        <input className={input} placeholder="Tên chú rể" value={form.groom_name} onChange={(e) => setForm({ ...form, groom_name: e.target.value })} />
        <input className={input} type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
        <input className={input} placeholder="Địa điểm" value={form.venue_name} onChange={(e) => setForm({ ...form, venue_name: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <button disabled={saving} onClick={submit} className="bg-brand text-white hover:bg-brand-hover font-medium rounded-lg h-10 px-4 text-sm disabled:opacity-50">
          {saving ? "Đang tạo..." : "Tạo đám cưới"}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="h-10 px-4 rounded-lg text-sm text-muted hover:bg-surface-alt hover:text-text">
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
      <div className="max-w-lg">
        <h1 className="font-serif text-[34px] leading-tight text-text mb-2">Chào mừng tới WedTable</h1>
        <p className="text-muted mb-6">Tạo đám cưới đầu tiên. Bạn có thể sửa mọi thông tin sau.</p>
        <CreateEventForm onCreated={handleCreated} />
      </div>
    )
  }

  return <Overview detail={detail} events={events} eventId={eventId} setEventId={setEventId} creating={creating} setCreating={setCreating} onCreated={handleCreated} />
}

function Overview({
  detail,
  events,
  eventId,
  setEventId,
  creating,
  setCreating,
  onCreated,
}: {
  detail: any
  events: any[]
  eventId: string | null
  setEventId: (id: string) => void
  creating: boolean
  setCreating: (v: boolean) => void
  onCreated: (id: string) => void
}) {
  if (!detail) return <p className="text-muted">Đang tải...</p>

  const stats = detail._stats ?? { total: 0, confirmed: 0, pending: 0, no_show: 0, checked_in: 0 }
  const floors: any[] = detail.floors ?? []
  const guests: any[] = detail.guests ?? []
  const tables = floors.flatMap((f) => f.tables ?? [])
  const totalSeats = tables.reduce((s: number, t: any) => s + t.seats, 0)
  const seated = tables.reduce((s: number, t: any) => s + seatsUsed(guests, t.id), 0)
  const unseated = guests.filter((g) => !g.table_id && !g.no_show).length
  const left = daysLeft(detail.event_date)
  const cover = Array.isArray(detail.gallery) ? detail.gallery[0] : null
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0)

  const todos = [
    !tables.length && { t: "Tạo bàn đầu tiên", d: "Vẽ sơ đồ sảnh tiệc để khách chọn chỗ.", href: "/seating" },
    !guests.length && { t: "Thêm khách mời", d: "Nhập từ Excel hoặc thêm từng người.", href: "/guests" },
    !detail.published && { t: "Publish thiệp mời", d: "Khách chỉ mở được thiệp sau khi publish.", href: "/settings" },
    !cover && { t: "Tải ảnh cưới", d: "Ảnh đầu tiên sẽ làm ảnh bìa thiệp.", href: "/invitation" },
    unseated > 0 && { t: `${unseated} khách chưa có bàn`, d: "Kéo tên khách vào bàn trên sơ đồ.", href: "/seating" },
    stats.pending > 0 && { t: `${stats.pending} khách chưa hồi âm`, d: "Gửi lại link thiệp cho họ.", href: "/guests" },
  ].filter(Boolean) as { t: string; d: string; href: string }[]

  const dateText = detail.event_date
    ? new Date(detail.event_date + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "Chưa đặt ngày"

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-surface border border-border rounded-card overflow-hidden grid md:grid-cols-[1fr_280px]">
        <div className="p-6 md:p-8 flex flex-col">
          <p className="text-sm text-muted">
            {left === null ? "Đám cưới của bạn" : left > 0 ? `Còn ${left} ngày` : left === 0 ? "Hôm nay là ngày cưới" : "Đã diễn ra"}
          </p>
          <h1 className="font-serif text-[34px] md:text-[40px] leading-[1.1] tracking-[-0.01em] text-text mt-1">
            {detail.bride_name || "Cô dâu"} &amp; {detail.groom_name || "Chú rể"}
          </h1>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 text-sm text-muted">
            <span className="flex items-center gap-1.5 first-letter:uppercase">
              <Icon name="calendar" size={16} className="text-faint" />
              {dateText}
              {detail.event_time ? ` · ${String(detail.event_time).slice(0, 5)}` : ""}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="pin" size={16} className="text-faint" />
              {detail.venue_name || "Chưa có địa điểm"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-6">
            <span className={"inline-flex items-center h-6 px-2 rounded-md text-xs font-medium " + (detail.published ? "bg-success/10 text-success" : "bg-surface-alt text-muted")}>
              {detail.published ? "Thiệp đã publish" : "Thiệp chưa publish"}
            </span>
            {isPremium(detail) ? (
              <span
                className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-xs font-medium bg-brand-soft text-brand"
                title={detail.plan_source === "promo" ? `Ưu đãi ra mắt: miễn phí cho đám cưới tạo trước ${PROMO_END_TEXT}` : undefined}
              >
                <Icon name="sparkle" size={12} /> {detail.plan_source === "promo" ? "Premium · ưu đãi ra mắt" : "Premium"}
              </span>
            ) : (
              <a href="/welcome#bang-gia" className="inline-flex items-center h-6 px-2 rounded-md text-xs font-medium bg-surface-alt text-muted hover:text-text">
                Gói Miễn phí · Nâng cấp
              </a>
            )}
            <button onClick={() => setCreating(true)} className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-sm text-text hover:bg-surface-hover hover:border-border-hover">
              <Icon name="plus" size={16} /> Đám cưới mới
            </button>
          </div>
        </div>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="Ảnh cưới" className="hidden md:block w-full h-full object-cover" />
        ) : (
          <a href="/invitation" className="hidden md:flex flex-col items-center justify-center gap-2 bg-surface-alt text-sm text-muted hover:text-text border-l border-border">
            <Icon name="plus" size={20} />
            Thêm ảnh bìa
          </a>
        )}
      </div>

      {creating && <CreateEventForm onCreated={onCreated} onCancel={() => setCreating(false)} />}

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="flex flex-col gap-6">
          {/* RSVP */}
          <section className="bg-surface border border-border rounded-card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold text-[15px]">Hồi âm của khách</h2>
              <a href="/guests" className="text-sm text-brand hover:underline underline-offset-4">Xem danh sách</a>
            </div>
            <p className="font-serif text-4xl mt-3 tabular-nums">
              {stats.confirmed}
              <span className="text-faint text-2xl"> / {stats.total} khách</span>
            </p>
            <div className="flex h-2 rounded-full overflow-hidden bg-surface-alt mt-4" aria-hidden>
              <div className="bg-brand" style={{ width: `${pct(stats.confirmed, stats.total)}%` }} />
              <div className="bg-border-hover" style={{ width: `${pct(stats.no_show, stats.total)}%` }} />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-muted">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand" /> Đã xác nhận {stats.confirmed}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-surface-alt border border-border-hover" /> Chưa hồi âm {stats.pending}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-border-hover" /> Không đến {stats.no_show}</span>
              <span className="flex items-center gap-1.5"><Icon name="check" size={14} className="text-success" /> Đã check-in {stats.checked_in}</span>
            </div>
          </section>

          {/* Seating */}
          <section className="bg-surface border border-border rounded-card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold text-[15px]">Chỗ ngồi</h2>
              <a href="/seating" className="text-sm text-brand hover:underline underline-offset-4">Mở sơ đồ</a>
            </div>
            <p className="font-serif text-4xl mt-3 tabular-nums">
              {seated}
              <span className="text-faint text-2xl"> / {totalSeats} ghế đã có khách</span>
            </p>
            <p className="text-sm text-muted mt-1">
              {tables.length} bàn{unseated > 0 ? ` · ${unseated} khách chưa có bàn` : ""}
            </p>
            {tables.length === 0 ? (
              <p className="text-sm text-muted mt-4">Chưa có bàn nào.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5 mt-5">
                {tables.map((t: any) => {
                  const used = seatsUsed(guests, t.id)
                  const w = Math.min(100, Math.round((used / t.seats) * 100))
                  const over = used > t.seats
                  return (
                    <div key={t.id} className="flex items-center gap-3 text-sm">
                      <div className="w-24 truncate">{t.name}</div>
                      <div className="flex-1 h-1.5 bg-surface-alt rounded-full overflow-hidden">
                        <div className={"h-full rounded-full " + (over ? "bg-error" : "bg-brand")} style={{ width: `${w}%` }} />
                      </div>
                      <div className={"w-12 text-right text-xs tabular-nums " + (over ? "text-error" : "text-muted")}>
                        {used}/{t.seats}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* Next steps */}
        <aside className="flex flex-col gap-6">
          <section className="bg-surface border border-border rounded-card p-5">
            <h2 className="font-semibold text-[15px]">Việc cần làm tiếp</h2>
            {todos.length === 0 ? (
              <p className="text-sm text-muted mt-3 flex items-center gap-2">
                <Icon name="check" size={16} className="text-success" /> Mọi thứ đã sẵn sàng.
              </p>
            ) : (
              <div className="mt-2 -mx-2">
                {todos.map((x) => (
                  <a key={x.t} href={x.href} className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-hover group">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-text">{x.t}</span>
                      <span className="block text-xs text-muted mt-0.5">{x.d}</span>
                    </span>
                    <Icon name="chevronRight" size={16} className="text-faint mt-0.5 group-hover:text-text" />
                  </a>
                ))}
              </div>
            )}
          </section>

          {events.length > 1 && (
            <section className="bg-surface border border-border rounded-card p-5">
              <h2 className="font-semibold text-[15px] mb-2">Tất cả đám cưới</h2>
              <div className="-mx-2 flex flex-col">
                {events.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setEventId(e.id)}
                    className={"text-left text-sm px-2 py-2 rounded-lg " + (e.id === eventId ? "bg-brand-soft text-brand font-medium" : "hover:bg-surface-hover text-text")}
                  >
                    {e.bride_name} &amp; {e.groom_name}
                    <span className="block text-xs text-muted font-normal">{e.event_date ?? "Chưa có ngày"}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
