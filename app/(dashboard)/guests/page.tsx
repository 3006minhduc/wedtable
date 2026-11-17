"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Icon from "@/components/ui/Icon"
import { FREE_LIMITS, isPremium } from "@/lib/plan"
import * as XLSX from "xlsx"
import QRCode from "qrcode"
import GuestTable from "@/components/guests/GuestTable"
import Link from "next/link"
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
  const [published, setPublished] = useState(true)
  const [premium, setPremium] = useState(true)
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
    setPublished(!!event.published)
    setPremium(isPremium(event))
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
      {!published && (
        <div className="bg-rose/10 border border-rose/30 text-rose rounded-card px-4 py-3 text-sm flex items-center justify-between gap-3 flex-wrap">
          <span>
            <strong>Sự kiện chưa Publish.</strong> Khách bấm vào link mời sẽ chưa xem được thiệp.
          </span>
          <Link href="/settings" className="underline font-medium whitespace-nowrap">
            Vào Cài đặt để Publish
          </Link>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="font-serif text-[28px] leading-tight tracking-[-0.01em] text-text">Khách mời ({guests.length})</h1>
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
          {premium ? (
            <>
              <a className="border border-border bg-surface hover:bg-surface-hover hover:border-border-hover rounded-pill px-3 py-1.5 text-sm" href={`/api/events/${eventId}/guests/export?format=xlsx`}>
                Xuất Excel
              </a>
              <a className="border border-border bg-surface hover:bg-surface-hover hover:border-border-hover rounded-pill px-3 py-1.5 text-sm" href={`/api/events/${eventId}/guests/export?format=csv`}>
                Xuất CSV
              </a>
            </>
          ) : (
            <a href="/welcome#bang-gia" title="Tính năng Premium" className="inline-flex items-center gap-1.5 border border-dashed border-border-hover rounded-pill px-3 py-1.5 text-sm text-muted hover:text-text">
              <Icon name="lock" size={14} /> Xuất Excel
            </a>
          )}
          <button className="border border-border bg-surface hover:bg-surface-hover hover:border-border-hover rounded-pill px-3 py-1.5 text-sm" onClick={handleRemindAll}>
            Nhắc khách chưa xác nhận
          </button>
        </div>
      </div>

      {!premium && (
        <p className="text-sm text-muted -mb-2">
          Gói Miễn phí: <span className="text-text font-medium tabular-nums">{guests.length}/{FREE_LIMITS.guests}</span> khách.{" "}
          <a href="/welcome#bang-gia" className="text-brand hover:underline underline-offset-4">Nâng cấp Premium</a> để thêm không giới hạn.
        </p>
      )}
      <div className="flex gap-2 flex-wrap items-center bg-surface border border-border rounded-card p-3">
        <input className={input} placeholder="Tên khách" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <input className={input} placeholder="Số điện thoại" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
        <button className="bg-brand text-white hover:bg-brand-hover font-medium rounded-pill px-4 py-2 text-sm" onClick={handleAdd}>
          + Thêm khách
        </button>
      </div>

      {notice && (
        <div className="text-sm bg-pr-l text-pr-d rounded-card px-3 py-2 flex justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}><Icon name="close" size={14} /></button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap items-center">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={"rounded-pill px-3 py-1 text-sm border " + (filter === f.key ? "bg-text border-text text-surface" : "border-border text-muted hover:text-text hover:border-border-hover bg-surface")}
          >
            {f.label}
          </button>
        ))}
        <input className={input + " ml-auto"} placeholder="Tìm tên / SĐT / mã..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {guests.length === 0 ? (
        <EmptyGuests
          onPickFile={() => fileInputRef.current?.click()}
          onTemplate={downloadTemplate}
          onPaste={async (rows) => {
            const res = await fetch(`/api/events/${eventId}/guests/import`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ guests: rows }),
            })
            const d = await res.json()
            setNotice(res.ok ? `Đã thêm ${d.added} khách${d.skipped ? `, bỏ qua ${d.skipped}` : ""}` : d.message ?? "Lỗi thêm khách")
            load()
          }}
        />
      ) : (
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
      )}

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
                className="bg-brand text-white hover:bg-brand-hover rounded-pill px-3 py-1.5 text-sm"
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

/** First-run guest list: import a file, get the template, or paste names straight from Zalo/Excel */
function EmptyGuests({ onPickFile, onTemplate, onPaste }: { onPickFile: () => void; onTemplate: () => void; onPaste: (rows: { name: string; phone: string }[]) => Promise<void> }) {
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const rows = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      // "Tên, SĐT" / "Tên<TAB>SĐT" / "Tên 0912…": the phone is the trailing run of digits
      const m = l.match(/^(.*?)[\s,;\t-]*((?:\+?84|0)[\d .]{8,})$/)
      return m ? { name: m[1].replace(/[,;\t]+$/, "").trim(), phone: m[2].replace(/\D/g, "") } : { name: l.replace(/[,;\t]+$/, ""), phone: "" }
    })
    .filter((r) => r.name)
  return (
    <div className="bg-surface border border-border rounded-card p-6">
      <span className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
        <Icon name="guests" size={20} />
      </span>
      <h2 className="font-semibold text-[17px] text-text mt-3">Thêm khách mời đầu tiên</h2>
      <p className="text-sm text-muted mt-1">Mỗi khách có một link thiệp và mã QR riêng. Chọn cách nhanh nhất với bạn:</p>
      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        <button onClick={onPickFile} className="text-left rounded-lg border border-border p-4 hover:bg-surface-hover hover:border-border-hover">
          <p className="text-sm font-medium text-text">Nhập từ file Excel</p>
          <p className="text-xs text-muted mt-1">File .xlsx, .xls hoặc .csv có cột Tên và SĐT.</p>
        </button>
        <button onClick={onTemplate} className="text-left rounded-lg border border-border p-4 hover:bg-surface-hover hover:border-border-hover">
          <p className="text-sm font-medium text-text">Tải file Excel mẫu</p>
          <p className="text-xs text-muted mt-1">Điền danh sách vào file mẫu rồi nhập lại.</p>
        </button>
      </div>
      <div className="mt-5">
        <p className="text-sm font-medium text-text">Hoặc dán danh sách</p>
        <p className="text-xs text-muted mt-0.5">Mỗi dòng một khách, số điện thoại để cuối dòng (có thể bỏ trống). Dán thẳng từ Zalo, Excel hay ghi chú đều được.</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={"Bác Hùng 0912345678\nCô Lan, 0987654321\nAnh Tuấn"}
          className="mt-2 w-full border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:border-brand focus:outline-none"
        />
        <div className="flex items-center gap-3 mt-2">
          <button
            disabled={!rows.length || busy}
            onClick={async () => {
              setBusy(true)
              await onPaste(rows)
              setBusy(false)
              setText("")
            }}
            className="h-10 px-4 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
          >
            {busy ? "Đang thêm…" : rows.length ? `Thêm ${rows.length} khách` : "Thêm khách"}
          </button>
          {rows.length > 0 && <span className="text-xs text-muted">{rows.filter((r) => r.phone).length} khách có số điện thoại</span>}
        </div>
      </div>
    </div>
  )
}
