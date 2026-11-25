"use client"

import { useEffect, useState } from "react"

type Guest = {
  dietary?: string
  side?: string
  rsvp_note?: string
  id: string
  name: string
  phone: string
  code: string
  table_id: string | null
  companions: number
  confirmed: boolean
  no_show: boolean
  checked_in: boolean
}

type Table = { id: string; name: string }

function CompanionsInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [v, setV] = useState(String(value))

  useEffect(() => {
    setV(String(value))
  }, [value])

  useEffect(() => {
    const n = Number(v)
    if (v === "" || Number.isNaN(n) || n === value || n < 0) return
    const t = setTimeout(() => onChange(n), 500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v])

  return (
    <input
      type="number"
      min={0}
      className="border border-border rounded-card text-xs px-2 py-1 w-16"
      value={v}
      onChange={(e) => setV(e.target.value)}
    />
  )
}

export default function GuestTable({
  guests,
  tables,
  onAssignTable,
  onToggleNoShow,
  onRemind,
  onDelete,
  onQr,
  onCompanions,
}: {
  guests: Guest[]
  tables: Table[]
  onAssignTable: (guestId: string, tableId: string) => void
  onToggleNoShow: (guestId: string, value: boolean) => void
  onRemind: (guestId: string) => void
  onDelete: (guestId: string) => void
  onQr?: (guest: Guest) => void
  onCompanions?: (guestId: string, value: number) => void
}) {
  const pill = "inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap "
  const badge = (g: Guest) =>
    g.checked_in ? (
      <span className={pill + "bg-success text-white"}>✓ Đã đến</span>
    ) : g.no_show ? (
      <span className={pill + "bg-surface-alt text-muted"}>Không đến</span>
    ) : g.confirmed ? (
      <span className={pill + "bg-success/10 text-success"}>Đã xác nhận</span>
    ) : (
      <span className={pill + "bg-warning/10 text-warning"}>Chưa phản hồi</span>
    )
  const act = "h-8 px-2.5 rounded-md text-[13px] text-text hover:bg-surface-alt transition-colors"
  const del = "h-8 px-2.5 rounded-md text-[13px] text-muted hover:text-error hover:bg-error/10 transition-colors"

  return (
    <>
      <div className="md:hidden flex flex-col gap-2">
        {guests.length === 0 && <p className="text-center text-muted text-sm py-6">Không có khách nào.</p>}
        {guests.map((g) => (
          <div key={g.id} className="bg-surface border border-border rounded-card p-3 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 shrink-0 rounded-full bg-pr-l text-pr-d flex items-center justify-center text-xs font-semibold">
                  {g.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-text font-medium truncate">{g.name}</div>
                  <div className="text-muted text-xs">
                    {g.phone} · {g.code}
                    {g.side === "groom" ? " · Khách nhà trai" : g.side === "bride" ? " · Khách nhà gái" : ""}
                  </div>
                  {(g.dietary || g.rsvp_note) && (
                    <div className="text-xs text-pr-d mt-0.5 max-w-[260px]" title={[g.dietary, g.rsvp_note].filter(Boolean).join(" · ")}>
                      {g.dietary && <span>Ăn uống: {g.dietary}</span>}
                      {g.dietary && g.rsvp_note && " · "}
                      {g.rsvp_note && <span className="italic text-muted">“{g.rsvp_note}”</span>}
                    </div>
                  )}
                </div>
              </div>
              {badge(g)}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                className="border border-border rounded-card text-xs px-2 py-1.5 flex-1 min-w-[120px]"
                value={g.table_id ?? ""}
                onChange={(e) => onAssignTable(g.id, e.target.value)}
              >
                <option value="">-- Chưa gán bàn --</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted">Đi kèm</span>
              {onCompanions ? <CompanionsInput value={g.companions} onChange={(v) => onCompanions(g.id, v)} /> : <span>{g.companions}</span>}
            </div>
            <div className="flex gap-1 pt-1 border-t border-border -mx-1">
              {onQr && (
                <button className={act + " h-10"} onClick={() => onQr(g)} aria-label={`Mã QR của ${g.name}`}>
                  QR
                </button>
              )}
              <button className={act + " h-10"} onClick={() => onRemind(g.id)}>
                Nhắc
              </button>
              <button className={act + " h-10"} onClick={() => onToggleNoShow(g.id, !g.no_show)}>
                {g.no_show ? "Có đến" : "Vắng"}
              </button>
              <button className={del + " h-10 ml-auto"} onClick={() => onDelete(g.id)} aria-label={`Xóa ${g.name}`}>
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

    <div className="hidden md:block bg-surface border border-border rounded-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted">
            <th className="px-4 py-3 font-medium">Khách</th>
            <th className="px-4 py-3 font-medium">Trạng thái</th>
            <th className="px-4 py-3 font-medium">Bàn</th>
            <th className="px-4 py-3 font-medium">Đi kèm</th>
            <th className="px-4 py-3 font-medium">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {guests.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted">
                Không có khách nào.
              </td>
            </tr>
          )}
          {guests.map((g) => (
            <tr key={g.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pr-l text-pr-d flex items-center justify-center text-xs font-semibold">
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-text font-medium">{g.name}</div>
                    <div className="text-muted text-xs">
                      {g.phone} · {g.code}
                    {g.side === "groom" ? " · Khách nhà trai" : g.side === "bride" ? " · Khách nhà gái" : ""}
                    </div>
                    {(g.dietary || g.rsvp_note) && (
                      <div className="text-xs text-pr-d mt-0.5 max-w-[260px]" title={[g.dietary, g.rsvp_note].filter(Boolean).join(" · ")}>
                        {g.dietary && <span>Ăn uống: {g.dietary}</span>}
                        {g.dietary && g.rsvp_note && " · "}
                        {g.rsvp_note && <span className="italic text-muted">“{g.rsvp_note}”</span>}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                {g.checked_in || g.no_show || g.confirmed ? (
                  badge(g)
                ) : (
                  <span className="text-xs bg-muted/10 text-muted px-2 py-1 rounded-pill">Chưa phản hồi</span>
                )}
              </td>
              <td className="px-4 py-3">
                <select
                  className="border border-border rounded-card text-xs px-2 py-1"
                  value={g.table_id ?? ""}
                  onChange={(e) => onAssignTable(g.id, e.target.value)}
                >
                  <option value="">-- Chưa gán --</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3 text-text">
                {onCompanions ? (
                  <CompanionsInput value={g.companions} onChange={(v) => onCompanions(g.id, v)} />
                ) : (
                  g.companions
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1 -ml-2.5">
                  {onQr && (
                    <button className={act} onClick={() => onQr(g)} aria-label={`Mã QR của ${g.name}`}>
                      QR
                    </button>
                  )}
                  <button className={act} onClick={() => onRemind(g.id)}>
                    Nhắc
                  </button>
                  <button className={act} onClick={() => onToggleNoShow(g.id, !g.no_show)}>
                    {g.no_show ? "Có đến" : "Vắng"}
                  </button>
                  <button className={del} onClick={() => onDelete(g.id)} aria-label={`Xóa ${g.name}`}>
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  )
}
