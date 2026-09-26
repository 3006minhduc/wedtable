"use client"

import { useEffect, useState } from "react"
import { confirmSeat, markViewed } from "./actions"

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
  const [giftAmount, setGiftAmount] = useState(500000)
  const [giftMsg, setGiftMsg] = useState("")
  const [giftLoading, setGiftLoading] = useState(false)

  async function handleGift() {
    setGiftLoading(true)
    setGiftMsg("")
    const res = await fetch("/api/payment/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: event.id,
        amount: giftAmount,
        message: `Mung cuoi ${event.bride_name} va ${event.groom_name} - ${guest.name}`,
      }),
    })
    const d = await res.json()
    setGiftLoading(false)
    if (res.ok && d.payment_url) {
      window.location.href = d.payment_url
    } else {
      setGiftMsg(d.message ?? "Không tạo được thanh toán.")
    }
  }

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
        </div>

        {locked ? (
          <div className="text-sm text-rose bg-rose/10 rounded-card px-3 py-2">
            Danh sách đã khóa, không thể thay đổi lựa chọn.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <select
              className="border border-border rounded-card px-3 py-2 text-sm"
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
            >
              <option value="">-- Chọn bàn --</option>
              {allTables.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              className="border border-border rounded-card px-3 py-2 text-sm"
              placeholder="Số người đi kèm"
              value={companions}
              onChange={(e) => setCompanions(Number(e.target.value))}
            />
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

        {event.video_url && (
          <a href={event.video_url} target="_blank" rel="noreferrer" className="block mt-4 text-sm text-pr-d underline">
            Xem video cưới
          </a>
        )}

        <div className="mt-6 pt-4 border-t border-border text-left">
          <p className="text-sm font-medium text-text mb-2">Mừng cưới online</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={10000}
              step={10000}
              className="border border-border rounded-card px-3 py-2 text-sm flex-1"
              value={giftAmount}
              onChange={(e) => setGiftAmount(Number(e.target.value))}
            />
            <button
              className="bg-ink text-white rounded-pill px-4 py-2 text-sm disabled:opacity-50"
              disabled={giftLoading}
              onClick={handleGift}
            >
              {giftLoading ? "..." : "Mừng qua VNPay"}
            </button>
          </div>
          {giftMsg && <p className="text-xs text-rose mt-2">{giftMsg}</p>}
        </div>
      </div>
    </div>
  )
}
