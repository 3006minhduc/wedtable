"use client"

import { useEffect, useState } from "react"

type Guest = {
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
  return (
    <div className="bg-surface border border-border rounded-card overflow-x-auto">
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
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                {g.checked_in ? (
                  <span className="text-xs bg-pr-l text-pr-d px-2 py-1 rounded-pill">ĐÃ CHECK-IN</span>
                ) : g.no_show ? (
                  <span className="text-xs bg-rose/10 text-rose px-2 py-1 rounded-pill">KHÔNG ĐẾN</span>
                ) : g.confirmed ? (
                  <span className="text-xs bg-sage/10 text-sage px-2 py-1 rounded-pill">ĐÃ XÁC NHẬN</span>
                ) : (
                  <span className="text-xs bg-muted/10 text-muted px-2 py-1 rounded-pill">CHƯA PHẢN HỒI</span>
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
                <div className="flex gap-3 text-xs">
                  {onQr && (
                    <button className="text-pr-d hover:underline" onClick={() => onQr(g)}>
                      QR
                    </button>
                  )}
                  <button className="text-pr-d hover:underline" onClick={() => onRemind(g.id)}>
                    Nhắc
                  </button>
                  <button className="text-muted hover:underline" onClick={() => onToggleNoShow(g.id, !g.no_show)}>
                    {g.no_show ? "Có đến" : "Vắng"}
                  </button>
                  <button className="text-rose hover:underline" onClick={() => onDelete(g.id)}>
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
