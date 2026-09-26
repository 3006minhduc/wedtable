"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import * as XLSX from "xlsx"
import QRCode from "qrcode"
import GuestTable from "@/components/guests/GuestTable"
import { useEvents } from "@/lib/useEvents"

const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "confirmed", label: "Đã xác nhận" },
  { key: "pending", label: "Chưa phản hồi" },
  { key: "checked_in", label: "Đã check-in" },
  { key: "no_show", label: "Không đến" },
]

export default function GuestsPage() {
  const { eventId, loading: eventsLoading } = useEvents()
  const [guests, setGuests] = useState<any[]>([])
  const [tables, setTables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [notice, setNotice] = useState("")
  const [importMenu, setImportMenu] = useState(false)
  const [qr, setQr] = useState<{ guest: any; url: string; img: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!eventId) return
    const [eventRes, guestsRes] = await Promise.all([
      fetch(`/api/events/${eventId}`),
      fetch(`/api/events/${eventId}/guests`),
    ])
    const event = await eventRes.json()
    const guestsData = await guestsRes.json()
    setTables((event.floors ?? []).flatMap((f: any) => f.tables ?? []))
    setGuests(guestsData.guests ?? [])
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    load()
  }, [load])

  function patchGuest(guestId: string, body: any) {
    setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, ...body } : g)))
    return fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  function downloadTemplate() {
    const rows = [
      { "Tên": "Nguyễn Văn A", "SĐT": "0901234567" },
      { "Tên": "Trần Thị B", "SĐT": "0912345678" },
      { "Tên": "Lê Văn C", "SĐT": "" },
    ]
    const sheet = XLSX.utils.json_to_sheet(rows)
    sheet["!cols"] = [{ wch: 28 }, { wch: 16 }]
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, "Khach moi")
    XLSX.writeFile(book, "mau-danh-sach-khach-moi.xlsx")
    setImportMenu(false)
  }

  async function handleAdd() {
    if (!newName.trim()) {
      setNotice("Vui lòng nhập tên khách.")
      return
    }
    const res = await fetch(`/api/events/${eventId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() }),
    })
    if (res.ok) {
      setNewName("")
      setNewPhone("")
      load()
    } else {
      const d = await res.json()
      setNotice(d.message ?? "Không thêm được khách")
    }
  }

  async function handleRemind(guestId: string) {
    const res = await fetch(`/api/events/${eventId}/guests/remind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_ids: [guestId] }),
    })
    const d = await res.json()
    setNotice(res.ok ? `Đã gửi ${d.sent}, lỗi ${d.failed}` : d.message ?? "Lỗi nhắc")
    load()
  }

  async function handleRemindAll() {
    if (!confirm("Nhắc tất cả khách chưa xác nhận qua Zalo?")) return
    const res = await fetch(`/api/events/${eventId}/guests/remind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
    const d = await res.json()
    setNotice(res.ok ? `Đã gửi ${d.sent}, lỗi ${d.failed}` : d.message ?? "Lỗi nhắc")
    load()
  }

  async function handleDelete(guestId: string) {
    if (!confirm("Xóa khách này?")) return
    setGuests((prev) => prev.filter((g) => g.id !== guestId))
    await fetch(`/api/events/${eventId}/guests/${guestId}`, { method: "DELETE" })
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !eventId) return
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet)
    const parsed = rows.map((r) => ({
      name: String(r.Ten ?? r["Tên"] ?? r.Name ?? r.name ?? "").trim(),
      phone: String(r.SDT ?? r["SĐT"] ?? r.Phone ?? r.phone ?? "").trim(),
    }))
    const res = await fetch(`/api/events/${eventId}/guests/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guests: parsed }),
    })
    const d = await res.json()
    setNotice(res.ok ? `Import: thêm ${d.added}, bỏ qua ${d.skipped}` : d.message ?? "Lỗi import")
    if (fileInputRef.current) fileInputRef.current.value = ""
    load()
  }

  async function openQr(guest: any) {
    const url = `${window.location.origin}/invite/${guest.code}`
    const img = await QRCode.toDataURL(url, { width: 240, margin: 1 })
    setQr({ guest, url, img })
  }

  const visible = guests.filter((g) => {
    if (filter === "confirmed" && !g.confirmed) return false
    if (filter === "pending" && (g.confirmed || g.no_show)) return false
    if (filter === "checked_in" && !g.checked_in) return false
    if (filter === "no_show" && !g.no_show) return false
    const q = search.trim().toLowerCase()
    if (q && !(g.name.toLowerCase().includes(q) || (g.phone ?? "").includes(q) || g.code.toLowerCase().includes(q))) return false
    return true
  })

  if (eventsLoading || loading) return <p className="text-muted">Đang tải...</p>
  if (!eventId) return <p className="text-muted">Bạn chưa có sự kiện nào. Tạo ở trang Tổng quan.</p>

  const input = "border border-border rounded-card px-3 py-2 text-sm"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-text">Khách mời ({guests.length})</h1>
        <div className="flex gap-2 flex-wrap">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
          <div className="relative">
            <button className="border border-border rounded-pill px-3 py-1.5 text-sm" onClick={() => setImportMenu((o) => !o)}>
              Import Excel ▾
            </button>
            {importMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setImportMenu(false)} />
                <div className="absolute left-0 mt-2 w-72 bg-surface border border-border rounded-card shadow-lg z-20 overflow-hidden">
                  <button
                    className="w-full text-left px-4 py-3 text-sm text-text hover:bg-bg"
                    onClick={() => {
                      setImportMenu(false)
                      fileInputRef.current?.click()
                    }}
                  >
                    <div className="font-medium">Chọn file để import</div>
                    <div className="text-xs text-muted">Hỗ trợ .xlsx, .xls, .csv</div>
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm text-text hover:bg-bg border-t border-border" onClick={downloadTemplate}>
                    <div className="font-medium">Tải file mẫu</div>
                    <div className="text-xs text-muted">File Excel có sẵn cột Tên, SĐT. Xóa các dòng mẫu trước khi import.</div>
                  </button>
                </div>
              </>
            )}
          </div>
          <a className="border border-border rounded-pill px-3 py-1.5 text-sm" href={`/api/events/${eventId}/guests/export?format=xlsx`}>
            Xuất Excel
          </a>
          <a className="border border-border rounded-pill px-3 py-1.5 text-sm" href={`/api/events/${eventId}/guests/export?format=csv`}>
            Xuất CSV
          </a>
          <button className="bg-pr text-ink font-medium rounded-pill px-3 py-1.5 text-sm" onClick={handleRemindAll}>
            Nhắc tất cả chưa xác nhận
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap items-center bg-surface border border-border rounded-card p-3">
        <input className={input} placeholder="Tên khách" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input className={input} placeholder="Số điện thoại" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
        <button className="bg-pr text-ink font-medium rounded-pill px-4 py-2 text-sm" onClick={handleAdd}>
          + Thêm khách
        </button>
      </div>

      {notice && (
        <div className="text-sm bg-pr-l text-pr-d rounded-card px-3 py-2 flex justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>✕</button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={"rounded-pill px-3 py-1 text-sm border " + (filter === f.key ? "bg-pr border-pr text-ink" : "border-border text-muted")}
          >
            {f.label}
          </button>
        ))}
        <input className={input + " ml-auto"} placeholder="Tìm tên / SĐT / mã..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <GuestTable
        guests={visible}
        tables={tables}
        onAssignTable={(id, tableId) => patchGuest(id, { table_id: tableId || null })}
        onToggleNoShow={(id, v) => patchGuest(id, { no_show: v })}
        onCompanions={(id, v) => patchGuest(id, { companions: v })}
        onRemind={handleRemind}
        onDelete={handleDelete}
        onQr={openQr}
      />

      {qr && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20" onClick={() => setQr(null)}>
          <div className="bg-surface rounded-card p-6 text-center max-w-xs" onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold text-text mb-1">{qr.guest.name}</div>
            <div className="text-xs text-muted mb-3">Mã: {qr.guest.code}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr.img} alt="QR" className="mx-auto mb-3" />
            <div className="text-xs text-muted break-all mb-3">{qr.url}</div>
            <div className="flex gap-2 justify-center">
              <button
                className="bg-pr text-ink rounded-pill px-3 py-1.5 text-sm"
                onClick={() => navigator.clipboard.writeText(qr.url).then(() => setNotice("Đã copy link mời"))}
              >
                Copy link
              </button>
              <button className="border border-border rounded-pill px-3 py-1.5 text-sm" onClick={() => setQr(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
