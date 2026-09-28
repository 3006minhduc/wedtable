"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import SeatingCanvas from "@/components/seating/SeatingCanvas"
import { resizeImage } from "@/lib/image"
import { computeLayout, stageElement, TEMPLATES } from "@/lib/seatingTemplates"
import type { TemplateKey } from "@/lib/seatingTemplates"
import { createClient } from "@/lib/supabase/client"
import { seatsUsed, useEvents } from "@/lib/useEvents"

const BUCKET = "wedding-media"
const BLOCK_TYPES: { type: string; label: string }[] = [
  { type: "stage", label: "Sân khấu" },
  { type: "path", label: "Lối đi" },
  { type: "decor", label: "Khu vực khác" },
]
const TYPE_ICON_MAP: Record<string, string> = { stage: "🎤", path: "↕", decor: "✦" }

export default function SeatingPage() {
  const { eventId, loading } = useEvents()
  const [detail, setDetail] = useState<any>(null)
  const [floorId, setFloorId] = useState<string | null>(null)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [selectedElId, setSelectedElId] = useState<string | null>(null)
  const [edit, setEdit] = useState({ name: "", seats: 10, vip: false })
  const [elEdit, setElEdit] = useState({ label: "" })
  const [msg, setMsg] = useState("")
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showTemplates, setShowTemplates] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)

  const debounceRef = useRef<any>(null)
  const pendingTables = useRef<Record<string, { id: string; x_pct: number; y_pct: number }>>({})
  const elDebounceRef = useRef<any>(null)
  const bgDebounceRef = useRef<any>(null)

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
  const elements: any[] = floor?.elements ?? []
  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null
  const selectedEl = elements.find((e) => e.id === selectedElId) ?? null

  function updateFloorLocal(patch: any) {
    setDetail((prev: any) => ({
      ...prev,
      floors: prev.floors.map((f: any) => (f.id === floorId ? { ...f, ...patch } : f)),
    }))
  }

  async function saveFloor(body: any) {
    return fetch(`/api/events/${eventId}/floors/${floorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  function selectTable(t: any) {
    if (selectMode) {
      toggleSelect("t:" + t.id)
      return
    }
    setSelectedElId(null)
    setSelectedTableId(t.id)
    setEdit({ name: t.name, seats: t.seats, vip: t.vip })
    setMsg("")
  }

  function selectEl(el: any) {
    if (selectMode) {
      toggleSelect("el:" + el.id)
      return
    }
    setSelectedTableId(null)
    setSelectedElId(el.id)
    setElEdit({ label: el.label })
  }

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleTableMove(id: string, x_pct: number, y_pct: number) {
    setDetail((prev: any) => ({
      ...prev,
      floors: prev.floors.map((f: any) => ({
        ...f,
        tables: f.tables.map((t: any) => (t.id === id ? { ...t, x_pct, y_pct } : t)),
      })),
    }))
    pendingTables.current[id] = { id, x_pct, y_pct }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const positions = Object.values(pendingTables.current)
      pendingTables.current = {}
      await fetch(`/api/events/${eventId}/tables/batch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions }),
      })
    }, 500)
  }

  function saveElementsDebounced(nextElements: any[]) {
    updateFloorLocal({ elements: nextElements })
    if (elDebounceRef.current) clearTimeout(elDebounceRef.current)
    elDebounceRef.current = setTimeout(() => saveFloor({ elements: nextElements }), 500)
  }

  function handleElementMove(id: string, x_pct: number, y_pct: number) {
    saveElementsDebounced(elements.map((e) => (e.id === id ? { ...e, x_pct, y_pct } : e)))
  }

  function handleElementResize(id: string, w_pct: number, h_pct: number) {
    saveElementsDebounced(elements.map((e) => (e.id === id ? { ...e, w_pct, h_pct } : e)))
  }

  function addBlock(type: string, label: string) {
    const el = { id: "el-" + Date.now(), type, label, x_pct: 50, y_pct: 50, w_pct: 24, h_pct: 10 }
    saveElementsDebounced([...elements, el])
    setSelectedElId(el.id)
    setElEdit({ label })
  }

  async function saveElLabel() {
    const next = elements.map((e) => (e.id === selectedElId ? { ...e, label: elEdit.label } : e))
    updateFloorLocal({ elements: next })
    await saveFloor({ elements: next })
    setMsg("Đã lưu")
  }

  async function deleteEl() {
    if (!selectedEl) return
    const next = elements.filter((e) => e.id !== selectedEl.id)
    updateFloorLocal({ elements: next })
    await saveFloor({ elements: next })
    setSelectedElId(null)
  }

  async function applyTemplate(key: TemplateKey) {
    setShowTemplates(false)
    const hasStage = elements.some((e: any) => e.type === "stage")
    const nextElements = hasStage ? elements : [...elements, stageElement()]
    updateFloorLocal({ elements: nextElements, layout_template: key })
    await saveFloor({ elements: nextElements, layout_template: key })

    if (key !== "custom" && tables.length > 0) {
      const { positions } = computeLayout(key, tables.map((t) => t.id))
      setDetail((prev: any) => ({
        ...prev,
        floors: prev.floors.map((f: any) =>
          f.id === floorId
            ? { ...f, tables: f.tables.map((t: any) => ({ ...t, ...positions.find((p) => p.id === t.id) })) }
            : f
        ),
      }))
      await fetch(`/api/events/${eventId}/tables/batch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions }),
      })
    }
    setMsg("Đã áp dụng bố cục")
  }

  async function uploadBackground(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !floorId) return
    setUploadingBg(true)
    setMsg("")
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Chưa đăng nhập")
      const blob = await resizeImage(file, 1600)
      const path = `${user.id}/${eventId}/floor-bg-${floorId}-${Date.now()}.jpg`
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" })
      if (error) throw new Error(error.message)
      const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      updateFloorLocal({ background_url: url })
      await saveFloor({ background_url: url })
      setMsg("Đã tải nền lên")
    } catch (err: any) {
      setMsg(err.message ?? "Lỗi tải ảnh nền")
    }
    setUploadingBg(false)
    e.target.value = ""
  }

  async function removeBackground() {
    updateFloorLocal({ background_url: "" })
    await saveFloor({ background_url: "" })
  }

  function setBgOpacity(v: number) {
    updateFloorLocal({ background_opacity: v })
    if (bgDebounceRef.current) clearTimeout(bgDebounceRef.current)
    bgDebounceRef.current = setTimeout(() => saveFloor({ background_opacity: v }), 400)
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
        y_pct: 35 + Math.random() * 50,
      }),
    })
    if (res.ok) {
      const t = await res.json()
      await load()
      selectTable(t)
    }
  }

  async function saveTable() {
    if (!selectedTable) return
    const res = await fetch(`/api/events/${eventId}/tables/${selectedTable.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: edit.name, seats: Number(edit.seats), vip: edit.vip }),
    })
    const data = await res.json()
    setMsg(res.ok ? "Đã lưu" : data.message ?? "Lỗi")
    if (res.ok) load()
  }

  async function deleteTable() {
    if (!selectedTable || !confirm(`Xóa ${selectedTable.name}? Khách ở bàn này sẽ thành chưa có bàn.`)) return
    await fetch(`/api/events/${eventId}/tables/${selectedTable.id}`, { method: "DELETE" })
    setSelectedTableId(null)
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
    await saveFloor({ name })
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

  // Alignment / distribute tools over multi-selected tables + blocks
  function getSelectedItems() {
    const items: { key: string; kind: "t" | "el"; id: string; x_pct: number; y_pct: number }[] = []
    selected.forEach((key) => {
      const [kind, id] = key.split(":") as ["t" | "el", string]
      const src = kind === "t" ? tables.find((t) => t.id === id) : elements.find((e) => e.id === id)
      if (src) items.push({ key, kind, id, x_pct: src.x_pct, y_pct: src.y_pct })
    })
    return items
  }

  async function applyPositions(items: { kind: "t" | "el"; id: string; x_pct: number; y_pct: number }[]) {
    const tablePositions = items.filter((i) => i.kind === "t").map((i) => ({ id: i.id, x_pct: i.x_pct, y_pct: i.y_pct }))
    const elPatches = items.filter((i) => i.kind === "el")
    setDetail((prev: any) => ({
      ...prev,
      floors: prev.floors.map((f: any) =>
        f.id === floorId
          ? {
              ...f,
              tables: f.tables.map((t: any) => {
                const p = tablePositions.find((x) => x.id === t.id)
                return p ? { ...t, x_pct: p.x_pct, y_pct: p.y_pct } : t
              }),
              elements: f.elements.map((e: any) => {
                const p = elPatches.find((x) => x.id === e.id)
                return p ? { ...e, x_pct: p.x_pct, y_pct: p.y_pct } : e
              }),
            }
          : f
      ),
    }))
    if (tablePositions.length > 0) {
      await fetch(`/api/events/${eventId}/tables/batch`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions: tablePositions }),
      })
    }
    if (elPatches.length > 0) {
      const nextElements = elements.map((e) => {
        const p = elPatches.find((x) => x.id === e.id)
        return p ? { ...e, x_pct: p.x_pct, y_pct: p.y_pct } : e
      })
      await saveFloor({ elements: nextElements })
    }
  }

  function align(kind: "left" | "right" | "top" | "bottom" | "centerX" | "centerY") {
    const items = getSelectedItems()
    if (items.length < 2) return
    let value: number
    if (kind === "left") value = Math.min(...items.map((i) => i.x_pct))
    else if (kind === "right") value = Math.max(...items.map((i) => i.x_pct))
    else if (kind === "top") value = Math.min(...items.map((i) => i.y_pct))
    else if (kind === "bottom") value = Math.max(...items.map((i) => i.y_pct))
    else if (kind === "centerX") value = items.reduce((s, i) => s + i.x_pct, 0) / items.length
    else value = items.reduce((s, i) => s + i.y_pct, 0) / items.length

    const isX = kind === "left" || kind === "right" || kind === "centerX"
    applyPositions(items.map((i) => ({ kind: i.kind, id: i.id, x_pct: isX ? value : i.x_pct, y_pct: isX ? i.y_pct : value })))
  }

  function distribute(axis: "x" | "y") {
    const items = getSelectedItems()
    if (items.length < 3) return
    const sorted = [...items].sort((a, b) => (axis === "x" ? a.x_pct - b.x_pct : a.y_pct - b.y_pct))
    const min = axis === "x" ? sorted[0].x_pct : sorted[0].y_pct
    const max = axis === "x" ? sorted[sorted.length - 1].x_pct : sorted[sorted.length - 1].y_pct
    const step = (max - min) / (sorted.length - 1)
    applyPositions(
      sorted.map((i, idx) => ({
        kind: i.kind,
        id: i.id,
        x_pct: axis === "x" ? min + step * idx : i.x_pct,
        y_pct: axis === "y" ? min + step * idx : i.y_pct,
      }))
    )
  }

  if (loading) return <p className="text-muted">Đang tải...</p>
  if (!eventId) return <p className="text-muted">Bạn chưa có sự kiện nào. Tạo ở trang Tổng quan.</p>
  if (!detail) return <p className="text-muted">Đang tải...</p>

  const seatedHere = selectedTable ? guests.filter((g: any) => g.table_id === selectedTable.id) : []
  const unseated = guests.filter((g: any) => !g.table_id && !g.no_show)
  const used = selectedTable ? seatsUsed(guests, selectedTable.id) : 0
  const input = "border border-border rounded-card px-3 py-2 text-sm w-full"
  const templateLabel = TEMPLATES.find((t) => t.key === (floor?.layout_template ?? "custom"))?.label ?? "Tự do"

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold text-text mr-2">Sơ đồ bàn</h1>
          {floors.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setFloorId(f.id)
                setSelectedTableId(null)
                setSelectedElId(null)
                setSelected(new Set())
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

      <div className="flex items-center gap-2 flex-wrap mb-3 bg-surface border border-border rounded-card p-2">
        <div className="relative">
          <button onClick={() => setShowTemplates((s) => !s)} className="border border-border rounded-pill px-3 py-1.5 text-sm">
            Bố cục: {templateLabel} ▾
          </button>
          {showTemplates && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} />
              <div className="absolute left-0 mt-2 w-72 bg-surface border border-border rounded-card shadow-lg z-20 overflow-hidden">
                {TEMPLATES.map((t) => (
                  <button key={t.key} className="w-full text-left px-4 py-3 text-sm hover:bg-bg" onClick={() => applyTemplate(t.key)}>
                    <div className="font-medium text-text">{t.label}</div>
                    <div className="text-xs text-muted">{t.desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative group">
          <button className="border border-border rounded-pill px-3 py-1.5 text-sm">+ Thêm khối ▾</button>
          <div className="hidden group-hover:block absolute left-0 mt-1 w-44 bg-surface border border-border rounded-card shadow-lg z-20">
            {BLOCK_TYPES.map((b) => (
              <button key={b.type} className="w-full text-left px-3 py-2 text-sm hover:bg-bg" onClick={() => addBlock(b.type, b.label)}>
                {TYPE_ICON_MAP[b.type]} {b.label}
              </button>
            ))}
          </div>
        </div>

        <label className="border border-border rounded-pill px-3 py-1.5 text-sm cursor-pointer">
          {uploadingBg ? "Đang tải..." : "Tải ảnh nền"}
          <input type="file" accept="image/*" className="hidden" disabled={uploadingBg} onChange={uploadBackground} />
        </label>
        {floor?.background_url && (
          <>
            <div className="flex items-center gap-1 text-xs text-muted">
              <span>Độ mờ nền</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                defaultValue={floor.background_opacity ?? 0.4}
                onChange={(e) => setBgOpacity(Number(e.target.value))}
              />
            </div>
            <button onClick={removeBackground} className="text-xs text-rose hover:underline">
              Xóa nền
            </button>
          </>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              setSelectMode((s) => !s)
              setSelected(new Set())
              setSelectedTableId(null)
              setSelectedElId(null)
            }}
            className={"rounded-pill px-3 py-1.5 text-sm border " + (selectMode ? "bg-ink text-white border-ink" : "border-border text-muted")}
          >
            {selectMode ? "Đang chọn nhiều ✕" : "Chọn nhiều để căn chỉnh"}
          </button>
        </div>
      </div>

      {selectMode && (
        <div className="flex items-center gap-2 flex-wrap mb-3 bg-ink text-white rounded-card p-2 text-xs">
          <span className="px-2">{selected.size} mục đã chọn</span>
          <button onClick={() => align("left")} className="border border-white/30 rounded-pill px-2 py-1 hover:bg-white/10">
            Căn trái
          </button>
          <button onClick={() => align("centerX")} className="border border-white/30 rounded-pill px-2 py-1 hover:bg-white/10">
            Căn giữa dọc
          </button>
          <button onClick={() => align("right")} className="border border-white/30 rounded-pill px-2 py-1 hover:bg-white/10">
            Căn phải
          </button>
          <button onClick={() => align("top")} className="border border-white/30 rounded-pill px-2 py-1 hover:bg-white/10">
            Căn trên
          </button>
          <button onClick={() => align("centerY")} className="border border-white/30 rounded-pill px-2 py-1 hover:bg-white/10">
            Căn giữa ngang
          </button>
          <button onClick={() => align("bottom")} className="border border-white/30 rounded-pill px-2 py-1 hover:bg-white/10">
            Căn dưới
          </button>
          <button onClick={() => distribute("x")} className="border border-white/30 rounded-pill px-2 py-1 hover:bg-white/10">
            Giãn đều ngang
          </button>
          <button onClick={() => distribute("y")} className="border border-white/30 rounded-pill px-2 py-1 hover:bg-white/10">
            Giãn đều dọc
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <SeatingCanvas
          tables={tables}
          guests={guests}
          elements={elements}
          backgroundUrl={floor?.background_url}
          backgroundOpacity={floor?.background_opacity ?? 0.4}
          onTableMove={handleTableMove}
          onElementMove={handleElementMove}
          onElementResize={handleElementResize}
          onTableClick={selectTable}
          onElementClick={selectEl}
          selectMode={selectMode}
          selected={selected}
        />

        <div className="bg-surface border border-border rounded-card p-4 h-fit">
          {!selectedTable && !selectedEl && (
            <p className="text-sm text-muted">
              {selectMode
                ? "Bấm chọn từ 2 bàn/khối trở lên rồi dùng thanh công cụ phía trên để căn chỉnh."
                : "Bấm vào một bàn hoặc khối để sửa. Kéo để đổi vị trí, chọn bố cục mẫu ở trên để sắp xếp nhanh."}
            </p>
          )}

          {selectedEl && (
            <div className="flex flex-col gap-3">
              <h2 className="font-semibold text-text">
                {TYPE_ICON_MAP[selectedEl.type]} {selectedEl.label}
              </h2>
              <input className={input} value={elEdit.label} onChange={(e) => setElEdit({ label: e.target.value })} />
              <div className="flex gap-2">
                <button onClick={saveElLabel} className="bg-pr text-ink rounded-pill px-4 py-1.5 text-sm font-medium">
                  Lưu
                </button>
                <button onClick={deleteEl} className="border border-border text-rose rounded-pill px-4 py-1.5 text-sm">
                  Xóa khối
                </button>
              </div>
              <p className="text-xs text-muted">Kéo để di chuyển, kéo chấm tròn góc dưới phải để đổi kích thước.</p>
            </div>
          )}

          {selectedTable && (
            <div className="flex flex-col gap-3">
              <h2 className="font-semibold text-text">{selectedTable.name}</h2>
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
                  Khách ngồi bàn ({used}/{selectedTable.seats})
                </div>
                {seatedHere.length === 0 && <p className="text-xs text-muted">Chưa có khách.</p>}
                {seatedHere.map((g: any) => (
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
                    onChange={(e) => e.target.value && assignGuest(e.target.value, selectedTable.id)}
                  >
                    <option value="">+ Thêm khách chưa có bàn...</option>
                    {unseated.map((g: any) => (
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
