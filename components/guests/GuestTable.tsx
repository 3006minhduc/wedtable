"use client"

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

export default function GuestTable({
  guests,
  tables,
  onAssignTable,
  onToggleNoShow,
  onRemind,
  onDelete,
}: {
  guests: Guest[]
  tables: Table[]
  onAssignTable: (guestId: string, tableId: string) => void
  onToggleNoShow: (guestId: string, value: boolean) => void
  onRemind: (guestId: string) => void
  onDelete: (guestId: string) => void
}) {
  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
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
          {guests.map((g) => (
            <tr key={g.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pr-l text-pr-d flex items-center justify-center text-xs font-semibold">
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-text font-medium">{g.name}</div>
                    <div className="text-muted text-xs">{g.phone}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                {g.no_show ? (
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
              <td className="px-4 py-3 text-text">{g.companions}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2 text-xs">
                  <button className="text-pr-d hover:underline" onClick={() => onRemind(g.id)}>
                    Nhắc
                  </button>
                  <button
                    className="text-muted hover:underline"
                    onClick={() => onToggleNoShow(g.id, !g.no_show)}
                  >
                    Vắng
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
