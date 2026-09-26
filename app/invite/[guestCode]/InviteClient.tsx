"use client"

import { useEffect, useState } from "react"
import { confirmSeat, markViewed } from "./actions"

function TableMap({
  floors,
  value,
  companions,
  onChange,
}: {
  floors: any[]
  value: string
  companions: number
  onChange: (id: string) => void
}) {
  const initial = Math.max(0, floors.findIndex((f) => (f.tables ?? []).some((t: any) => t.id === value)))
  const [floorIdx, setFloorIdx] = useState(initial)
  const floor = floors[Math.min(floorIdx, floors.length - 1)]
  if (!floor) return null

  return (
    <div>
      {floors.length > 1 && (
        <div className="flex gap-2 mb-2 justify-center flex-wrap">
          {floors.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFloorIdx(i)}
              className={"rounded-pill px-3 py-1 text-xs border " + (i === floorIdx ? "bg-pr border-pr text-ink" : "border-border text-muted")}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}
      <div className="relative w-full h-72 sm:h-80 bg-bg border border-border rounded-card overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-ink text-white text-[10px] px-3 py-1 rounded-card">Sân khấu</div>
        {(floor.tables ?? []).map((t: any) => {
          const left = t.seats - (t.used ?? 0)
          const full = left < 1 + companions
          const selected = t.id === value
          return (
            <button
              key={t.id}
              type="button"
              disabled={full && !selected}
              onClick={() => onChange(t.id)}
              style={{ left: `${t.x_pct}%`, top: `${t.y_pct}%`, transform: "translate(-50%, -50%)" }}
              className={
                "absolute w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center text-[10px] leading-tight " +
                (selected
                  ? "bg-pr border-pr-d text-ink font-semibold"
                  : full
                  ? "bg-surface border-border text-muted opacity-40"
                  : t.vip
                  ? "bg-pr-l border-pr text-pr-d"
                  : "bg-surface border-sage text-text")
              }
            >
              <span className="max-w-[48px] truncate">{t.name}</span>
              <span>{full && !selected ? "đầy" : `còn ${Math.max(0, left)}`}</span>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted mt-1">Chạm vào bàn để chọn. Bàn mờ là đã đủ chỗ cho nhóm của bạn.</p>
    </div>
  )
}

export default function InviteClient({
  guest,
  event,
  floors,
  locked,
}: {
  guest: any
  event: any
  floors: any[]
  locked: boolean
}) {
  const [tableId, setTableId] = useState(guest.table_id ?? "")
  const [companions, setCompanions] = useState(guest.companions ?? 0)
  const [status, setStatus] = useState<{ error?: string; message?: string; success?: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    markViewed(guest.code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const allTables = floors.flatMap((f) => f.tables ?? [])

  async function handleConfirm() {
    if (!tableId) {
      setStatus({ error: "NO_TABLE", message: "Vui lòng chọn bàn." })
      return
    }
    setLoading(true)
    const result = await confirmSeat(guest.code, tableId, Number(companions))
    setLoading(false)
    setStatus(result)
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-card border border-border p-6 text-center">
        <p className="text-pr-d text-sm mb-1">Trân trọng kính mời</p>
        <h1 className="text-2xl font-semibold text-text mb-1">
          {event.bride_name} &amp; {event.groom_name}
        </h1>
        <p className="text-muted text-sm mb-6">
          {event.event_date} · {event.venue_name}
        </p>

        <div className="text-left mb-4">
          <p className="text-sm text-text mb-1">Xin chào, {guest.name}</p>
          <p className="text-xs text-muted">Mã mời: {guest.code}</p>
          {guest.confirmed && <p className="text-xs text-sage mt-1">Bạn đã xác nhận tham dự. Có thể đổi bàn bên dưới.</p>}
        </div>

        {locked ? (
          <div className="text-sm text-rose bg-rose/10 rounded-card px-3 py-2">
            Danh sách đã khóa, không thể thay đổi lựa chọn.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-left">
              <label className="text-sm text-muted whitespace-nowrap">Số người đi kèm</label>
              <input
                type="number"
                min={0}
                max={20}
                className="border border-border rounded-card px-3 py-2 text-sm w-20"
                value={companions}
                onChange={(e) => setCompanions(Math.max(0, Number(e.target.value)))}
              />
            </div>
            <TableMap floors={floors} value={tableId} companions={Number(companions) || 0} onChange={setTableId} />
            <select
              className="border border-border rounded-card px-3 py-2 text-sm"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
            >
              <option value="">-- Chọn bàn --</option>
              {allTables.map((t: any) => (
                <option key={t.id} value={t.id} disabled={t.seats - (t.used ?? 0) < 1}>
                  {t.name} (còn {Math.max(0, t.seats - (t.used ?? 0))} chỗ)
                </option>
              ))}
            </select>
            <button
              className="bg-pr text-ink font-medium rounded-pill px-4 py-2 text-sm disabled:opacity-50"
              disabled={loading}
              onClick={handleConfirm}
            >
              {loading ? "Đang xác nhận..." : "Xác nhận tham dự"}
            </button>
            {status?.error && (
              <p className="text-sm text-rose">{status.message}</p>
            )}
            {status?.success && (
              <p className="text-sm text-sage">Đã xác nhận, hẹn gặp bạn tại tiệc cưới!</p>
            )}
          </div>
        )}

        {Array.isArray(event.gallery) && event.gallery.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-6">
            {event.gallery.map((url: string) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="rounded-card w-full h-32 object-cover" />
            ))}
          </div>
        )}

        {event.menu && (
          <div className="text-left mt-6">
            <p className="text-sm font-medium text-text mb-1">Thực đơn</p>
            <p className="text-sm text-muted whitespace-pre-line">{event.menu}</p>
          </div>
        )}

        {event.gift_qr_url && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm font-medium text-text mb-2">Mừng cưới</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={event.gift_qr_url} alt="QR mừng cưới" className="mx-auto w-48 h-48 object-contain rounded-card border border-border bg-white" />
            <p className="text-xs text-muted mt-2">Quét mã để gửi lời chúc và mừng cưới</p>
          </div>
        )}

        {event.video_url && (
          <a href={event.video_url} target="_blank" rel="noreferrer" className="block mt-4 text-sm text-pr-d underline">
            Xem video cưới
          </a>
        )}

      </div>
    </div>
  )
}
