"use client"

import { useCallback, useEffect, useState } from "react"
import Icon from "@/components/ui/Icon"
import { JourneyCard, SuggestionList } from "@/components/overview/Guide"
import CreateWizard from "@/components/overview/CreateWizard"
import { isPremium, PROMO_END_TEXT } from "@/lib/plan"
import { daysLeft, seatsUsed, useEvents } from "@/lib/useEvents"

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

  // Sample wedding to click around in (one per account)
  const [demoBusy, setDemoBusy] = useState(false)
  async function handleDemo() {
    setDemoBusy(true)
    const res = await fetch("/api/events/demo", { method: "POST" })
    const d = await res.json().catch(() => ({}))
    setDemoBusy(false)
    if (!res.ok) return alert(d.message ?? "Không tạo được đám cưới mẫu")
    await handleCreated(d.id)
  }

  if (loading) return <p className="text-muted">Đang tải...</p>

  if (events.length === 0) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-serif text-[34px] leading-tight text-text mb-2">Chào mừng tới WedTable</h1>
        <p className="text-muted mb-6">Trả lời 4 câu ngắn, WedTable dựng sẵn đám cưới, sơ đồ bàn và thiệp cho bạn. Sửa được mọi thứ sau.</p>
        {demoBusy ? <p className="text-sm text-muted">Đang tạo đám cưới mẫu…</p> : <CreateWizard onCreated={handleCreated} onDemo={handleDemo} />}
      </div>
    )
  }

  return (
    <Overview
      detail={detail}
      events={events}
      eventId={eventId}
      setEventId={setEventId}
      creating={creating}
      setCreating={setCreating}
      onCreated={handleCreated}
      onDemo={handleDemo}
      onDeleted={async () => {
        const other = events.find((e) => e.id !== eventId)
        if (other) setEventId(other.id)
        await reload()
      }}
    />
  )
}

function Overview({
  detail,
  events,
  eventId,
  setEventId,
  creating,
  setCreating,
  onCreated,
  onDemo,
  onDeleted,
}: {
  detail: any
  events: any[]
  eventId: string | null
  setEventId: (id: string) => void
  creating: boolean
  setCreating: (v: boolean) => void
  onCreated: (id: string) => void
  onDemo: () => void
  onDeleted: () => void
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

      {detail.is_demo && (
        <div className="rounded-card border border-brand/30 bg-brand-soft px-4 py-3 flex items-center gap-3 flex-wrap text-sm">
          <Icon name="sparkle" size={18} className="text-brand shrink-0" />
          <span className="flex-1 min-w-[220px] text-text">
            <b className="font-medium">Đây là đám cưới mẫu.</b> Cứ bấm thử mọi thứ: thiệp, sơ đồ, khách, check-in, trình chiếu. Đám cưới mẫu không gửi được cho khách và không tính vào gói của bạn.
          </span>
          <button onClick={() => setCreating(true)} className="h-9 px-3 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover">
            Tạo đám cưới thật
          </button>
          <button
            onClick={async () => {
              if (!confirm("Xoá đám cưới mẫu? Mọi dữ liệu mẫu sẽ mất.")) return
              await fetch(`/api/events/${detail.id}`, { method: "DELETE" })
              onDeleted()
            }}
            className="h-9 px-3 rounded-lg text-muted hover:text-text hover:bg-surface"
          >
            Xoá đám cưới mẫu
          </button>
        </div>
      )}

      {creating && <CreateWizard onCreated={onCreated} onCancel={() => setCreating(false)} onDemo={events.some((e) => e.is_demo) ? undefined : onDemo} />}

      <JourneyCard ev={detail} />

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
          <SuggestionList ev={detail} />

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
