"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import SeatingCanvas from "@/components/seating/SeatingCanvas"
import { seatsUsed, useEvents } from "@/lib/useEvents"

export default function SeatingPage() {
  const { eventId, loading } = useEvents()
  const [detail, setDetail] = useState<any>(null)
  const [floorId, setFloorId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [edit, setEdit] = useState({ name: "", seats: 10, vip: false })
  const [msg, setMsg] = useState("")
  const debounceRef = useRef<any>(null)
  const pendingRef = useRef<Record<string, { id: string; x_pct: number; y_pct: number }>>({})

  const load = useCallback(async () => {
    if (!eventId) return
    const res = await fetch(`/api/events/${eventId}`)
    if (!res.ok) return
    const data = await res.json()
    setDetail(data)
    setFloorId((cur) => (cur && data.floors?.some((f: any) => f.id === cur) ? cur : data.floors?.[0]?.id ?? null))
  }, [eventId])

  useEffect(() => {
    load()
  }, [load])

  const floors: any[] = detail?.floors ?? []
  const guests: any[] = detail?.guests ?? []
  const floor = floors.find((f) => f.id === floorId)
  const tables: any[] = floor?.tables ?? []
  const selected = tables.find((t) => t.id === selectedId) ?? null

  function selectTable(t: any) {
    setSelectedId(t.id)
    setEdit({ name: t.name, seats: t.seats, vip: t.vip })
    setMsg("")
  }

  function handleTableMove(id: string, x_pct: number, y_pct: number) {
    setDetail((prev: any) => ({
      ...prev,
      floors: prev.floors.map((f: any) => ({
        ...f,
        tables: f.tables.map((t: any) => (t.id === id ? { ...t, x_pct, y_pct } : t)),
      })),
    }))
    pendingRef.current[id] = { id, x_pct, y_pct }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const positions = Object.values(pendingRef.current)
      pendingRef.current = {}
      await fetch(`/api/events/${eventId}/tables/batch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions }),
      })
    }, 500)
  }

  async function addTable() {
    if (!floorId) return
    const res = await fetch(`/api/events/${eventId}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        floor_id: floorId,
        name: `Bàn ${tables.length + 1}`,
        seats: 10,
        x_pct: 20 + Math.random() * 60,
        y_pct: 25 + Math.random() * 55,
      }),
    })
    if (res.ok) {
      const t = await res.json()
      await load()
      selectTable(t)
    }
  }

  async function saveTable() {
    if (!selected) return
    const res = await fetch(`/api/events/${eventId}/tables/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: edit.name, seats: Number(edit.seats), vip: edit.vip }),
    })
    const data = await res.json()
    setMsg(res.ok ? "Đã lưu" : data.message ?? "Lỗi")
    if (res.ok) load()
  }

  async function deleteTable() {
    if (!selected || !confirm(`Xóa ${selected.name}? Khách ở bàn này sẽ thành chưa có bàn.`)) return
    await fetch(`/api/events/${eventId}/tables/${selected.id}`, { method: "DELETE" })
    setSelectedId(null)
    load()
  }

  async function addFloor() {
    const name = prompt("Tên tầng mới", `Tầng ${floors.length + 1}`)
    if (!name) return
    const res = await fetch(`/api/events/${eventId}/floors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    const data = await res.json()
    if (!res.ok) {
      alert(data.message)
      return
    }
    await load()
    setFloorId(data.id)
  }

  async function renameFloor() {
    if (!floor) return
    const name = prompt("Đổi tên tầng", floor.name)
    if (!name) return
    await fetch(`/api/events/${eventId}/floors/${floor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
    load()
  }

  async function assignGuest(guestId: string, tableId: string | null) {
    await fetch(`/api/events/${eventId}/guests/${guestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_id: tableId }),
    })
    load()
  }

  if (loading) return <p className="text-muted">Đang tải...</p>
  if (!eventId) return <p className="text-muted">Bạn chưa có sự kiện nào. Tạo ở trang Tổng quan.</p>
  if (!detail) return <p className="text-muted">Đang tải...</p>

  const seatedHere = selected ? guests.filter((g) => g.table_id === selected.id) : []
  const unseated = guests.filter((g) => !g.table_id && !g.no_show)
  const used = selected ? seatsUsed(guests, selected.id) : 0
  const input = "border border-border rounded-card px-3 py-2 text-sm w-full"

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold text-text mr-2">Sơ đồ bàn</h1>
          {floors.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFloorId(f.id)
                setSelectedId(null)
              }}
              className={"rounded-pill px-3 py-1 text-sm border " + (f.id === floorId ? "bg-pr border-pr text-ink" : "border-border text-muted")}
            >
              {f.name}
            </button>
          ))}
          {floors.length < 3 && (
            <button onClick={addFloor} className="text-sm text-pr-d hover:underline">
              + Tầng
            </button>
          )}
          {floor && (
            <button onClick={renameFloor} className="text-xs text-muted hover:underline">
              đổi tên tầng
            </button>
          )}
        </div>
        <button onClick={addTable} className="bg-pr text-ink font-medium rounded-pill px-4 py-2 text-sm">
          + Thêm bàn
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <SeatingCanvas tables={tables} guests={guests} onTableMove={handleTableMove} onTableClick={selectTable} />

        <div className="bg-surface border border-border rounded-card p-4 h-fit">
          {!selected ? (
            <p className="text-sm text-muted">Bấm vào một bàn để sửa hoặc xếp khách. Kéo bàn để đổi vị trí.</p>
          ) : (
            <div className="flex flex-col gap-3">
              <h2 className="font-semibold text-text">{selected.name}</h2>
              <input className={input} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted">Số ghế</label>
                <input
                  className={input}
                  type="number"
                  min={2}
                  max={30}
                  value={edit.seats}
                  onChange={(e) => setEdit({ ...edit, seats: Number(e.target.value) })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={edit.vip} onChange={(e) => setEdit({ ...edit, vip: e.target.checked })} />
                Bàn VIP
              </label>
              <div className="flex gap-2">
                <button onClick={saveTable} className="bg-pr text-ink rounded-pill px-4 py-1.5 text-sm font-medium">
                  Lưu
                </button>
                <button onClick={deleteTable} className="border border-border text-rose rounded-pill px-4 py-1.5 text-sm">
                  Xóa
                </button>
              </div>
              {msg && <p className="text-xs text-sage">{msg}</p>}

              <div className="border-t border-border pt-3">
                <div className="text-sm font-medium text-text mb-2">
                  Khách ngồi bàn ({used}/{selected.seats})
                </div>
                {seatedHere.length === 0 && <p className="text-xs text-muted">Chưa có khách.</p>}
                {seatedHere.map((g) => (
                  <div key={g.id} className="flex items-center justify-between text-sm py-1">
                    <span className={g.no_show ? "line-through text-muted" : "text-text"}>
                      {g.name}
                      {g.companions > 0 && ` +${g.companions}`}
                    </span>
                    <button onClick={() => assignGuest(g.id, null)} className="text-xs text-rose hover:underline">
                      bỏ
                    </button>
                  </div>
                ))}
                {unseated.length > 0 && (
                  <select
                    className="border border-border rounded-card text-sm px-2 py-1 mt-2 w-full"
                    value=""
                    onChange={(e) => e.target.value && assignGuest(e.target.value, selected.id)}
                  >
                    <option value="">+ Thêm khách chưa có bàn...</option>
                    {unseated.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                        {g.companions > 0 ? ` (+${g.companions})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
