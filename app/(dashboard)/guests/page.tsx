"use client"

import { useEffect, useRef, useState } from "react"
import * as XLSX from "xlsx"
import GuestTable from "@/components/guests/GuestTable"

export default function GuestsPage() {
  const [eventId, setEventId] = useState<string | null>(null)
  const [guests, setGuests] = useState<any[]>([])
  const [tables, setTables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    setLoading(true)
    const eventsRes = await fetch("/api/events")
    const events = await eventsRes.json()
    if (!Array.isArray(events) || events.length === 0) {
      setLoading(false)
      return
    }
    const id = events[0].id
    setEventId(id)
    const eventRes = await fetch(`/api/events/${id}`)
    const event = await eventRes.json()
    setTables((event.floors ?? []).flatMap((f: any) => f.tables ?? []))
    const guestsRes = await fetch(`/api/events/${id}/guests`)
    const guestsData = await guestsRes.json()
    setGuests(guestsData.guests ?? [])
    setLoading(false)
  }

  async function handleAssignTable(guestId: string, tableId: string) {
    if (!eventId) return
    setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, table_id: tableId || null } : g)))
    await fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_id: tableId || null }),
    })
  }

  async function handleToggleNoShow(guestId: string, value: boolean) {
    if (!eventId) return
    setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, no_show: value } : g)))
    await fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ no_show: value }),
    })
  }

  async function handleRemind(guestId: string) {
    if (!eventId) return
    await fetch(`/api/events/${eventId}/guests/remind`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_ids: [guestId] }),
    })
  }

  async function handleDelete(guestId: string) {
    if (!eventId) return
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
      name: r.Ten ?? r.Name ?? r.name ?? "",
      phone: r.SDT ?? r.Phone ?? r.phone ?? "",
    }))
    await fetch(`/api/events/${eventId}/guests/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guests: parsed }),
    })
    if (fileInputRef.current) fileInputRef.current.value = ""
    init()
  }

  if (loading) return <p className="text-muted">Đang tải...</p>
  if (!eventId) return <p className="text-muted">Bạn chưa có sự kiện nào.</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-text">Khách mời</h1>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            className="bg-pr text-ink font-medium rounded-pill px-4 py-2 text-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Import Excel
          </button>
        </div>
      </div>
      <GuestTable
        guests={guests}
        tables={tables}
        onAssignTable={handleAssignTable}
        onToggleNoShow={handleToggleNoShow}
        onRemind={handleRemind}
        onDelete={handleDelete}
      />
    </div>
  )
}
