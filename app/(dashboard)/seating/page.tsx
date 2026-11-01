"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Icon from "@/components/ui/Icon"
import SeatingCanvas, { occupiedSeats } from "@/components/seating/SeatingCanvas"
import type { Block, Move, Table, Tool } from "@/components/seating/SeatingCanvas"
import { resizeImage } from "@/lib/image"
import { computeLayout, stageElement, TEMPLATES } from "@/lib/seatingTemplates"
import type { TemplateKey } from "@/lib/seatingTemplates"
import { createClient } from "@/lib/supabase/client"
import { useEvents } from "@/lib/useEvents"

const BUCKET = "wedding-media"

const TOOLS: { tool: Tool; icon: string; label: string }[] = [
  { tool: "select", icon: "pointer", label: "Chọn và kéo (V)" },
  { tool: "round", icon: "tableRound", label: "Thêm bàn tròn" },
  { tool: "rect", icon: "tableRect", label: "Thêm bàn dài" },
  { tool: "stage", icon: "stage", label: "Thêm sân khấu" },
  { tool: "path", icon: "aisle", label: "Thêm lối đi" },
  { tool: "decor", icon: "zone", label: "Thêm khu vực khác" },
]

const BLOCK_TYPES = [
  { type: "stage", label: "Sân khấu" },
  { type: "path", label: "Lối đi" },
  { type: "decor", label: "Khu vực" },
]

const BLOCK_DEFAULT: Record<string, { label: string; w_pct: number; h_pct: number }> = {
  stage: { label: "Sân khấu", w_pct: 30, h_pct: 10 },
  path: { label: "Lối đi", w_pct: 6, h_pct: 40 },
  decor: { label: "Khu vực", w_pct: 16, h_pct: 12 },
}

type Snapshot = { floorId: string; tables: { id: string; x_pct: number; y_pct: number }[]; elements: Block[] }

export default function SeatingPage() {
  const { eventId, loading } = useEvents()
  const [detail, setDetail] = useState<any>(null)
  const [floorId, setFloorId] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>("select")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(1)
  const [snap, setSnap] = useState(true)
  const [saving, setSaving] = useState(0)
  const [saveError, setSaveError] = useState("")
  const [toast, setToast] = useState("")
  const [showTemplates, setShowTemplates] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [history, setHistory] = useState<Snapshot[]>([])

  const preDrag = useRef<Snapshot | null>(null)
  const tableTimers = useRef<Record<string, any>>({})
  const tablePending = useRef<Record<string, any>>({})
  const elTimer = useRef<any>(null)
  const bgTimer = useRef<any>(null)

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
  const tables: Table[] = floor?.tables ?? []
  const elements: Block[] = floor?.elements ?? []

  const selKeys = Array.from(selected)
  const selTables = selKeys.filter((k) => k.startsWith("t:")).map((k) => tables.find((t) => t.id === k.slice(2))).filter(Boolean) as Table[]
  const selBlocks = selKeys.filter((k) => k.startsWith("el:")).map((k) => elements.find((e) => e.id === k.slice(3))).filter(Boolean) as Block[]
  const oneTable = selected.size === 1 ? selTables[0] ?? null : null
  const oneBlock = selected.size === 1 ? selBlocks[0] ?? null : null

  // ---------- saving helpers ----------
  async function track<T>(p: Promise<Response>): Promise<Response | null> {
    setSaving((n) => n + 1)
    try {
      const res = await p
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.message ?? "Không lưu được, thử lại.")
      } else setSaveError("")
      return res
    } catch {
      setSaveError("Mất kết nối, thay đổi chưa được lưu.")
      return null
    } finally {
      setSaving((n) => n - 1)
    }
  }

  function flash(text: string) {
    setToast(text)
    setTimeout(() => setToast((cur) => (cur === text ? "" : cur)), 2500)
  }

  function patchFloorLocal(patch: any, id = floorId) {
    setDetail((prev: any) => ({ ...prev, floors: prev.floors.map((f: any) => (f.id === id ? { ...f, ...patch } : f)) }))
  }

  function saveFloor(body: any, id = floorId) {
    return track(
      fetch(`/api/events/${eventId}/floors/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    )
  }

  function setElements(next: Block[], debounce = true) {
    patchFloorLocal({ elements: next })
    if (elTimer.current) clearTimeout(elTimer.current)
    const id = floorId
    if (!debounce) {
      saveFloor({ elements: next }, id)
      return
    }
    elTimer.current = setTimeout(() => saveFloor({ elements: next }, id), 500)
  }

  function patchTableLocal(id: string, patch: Partial<Table>) {
    setDetail((prev: any) => ({
      ...prev,
      floors: prev.floors.map((f: any) => ({ ...f, tables: f.tables.map((t: any) => (t.id === id ? { ...t, ...patch } : t)) })),
    }))
  }

  function patchTable(id: string, patch: Partial<Table>) {
    patchTableLocal(id, patch)
    tablePending.current[id] = { ...tablePending.current[id], ...patch }
    if (tableTimers.current[id]) clearTimeout(tableTimers.current[id])
    tableTimers.current[id] = setTimeout(() => {
      const body = tablePending.current[id]
      delete tablePending.current[id]
      track(fetch(`/api/events/${eventId}/tables/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }))
    }, 500)
  }

  function saveTablePositions(positions: { id: string; x_pct: number; y_pct: number }[]) {
    if (positions.length === 0) return
    track(fetch(`/api/events/${eventId}/tables/batch`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ positions }) }))
  }

  // ---------- undo ----------
  function snapshot(): Snapshot | null {
    if (!floorId) return null
    return { floorId, tables: tables.map((t) => ({ id: t.id, x_pct: t.x_pct, y_pct: t.y_pct })), elements: elements.map((e) => ({ ...e })) }
  }

  function pushHistory(s: Snapshot | null = snapshot()) {
    if (s) setHistory((h) => [...h.slice(-29), s])
  }

  function undo() {
    const last = history[history.length - 1]
    if (!last) return
    setHistory((h) => h.slice(0, -1))
    const f = floors.find((x) => x.id === last.floorId)
    if (!f) return
    const ids = new Set(f.tables.map((t: any) => t.id))
    const positions = last.tables.filter((t) => ids.has(t.id))
    setDetail((prev: any) => ({
      ...prev,
      floors: prev.floors.map((fl: any) =>
        fl.id === last.floorId
          ? { ...fl, elements: last.elements, tables: fl.tables.map((t: any) => ({ ...t, ...positions.find((p) => p.id === t.id) })) }
          : fl
      ),
    }))
    saveTablePositions(positions)
    saveFloor({ elements: last.elements }, last.floorId)
    flash("Đã hoàn tác")
  }

  // ---------- canvas callbacks ----------
  function applyMoves(moves: Move[]) {
    setDetail((prev: any) => ({
      ...prev,
      floors: prev.floors.map((f: any) =>
        f.id !== floorId
          ? f
          : {
              ...f,
              tables: f.tables.map((t: any) => {
                const m = moves.find((x) => x.key === "t:" + t.id)
                return m ? { ...t, x_pct: m.x_pct, y_pct: m.y_pct } : t
              }),
              elements: (f.elements ?? []).map((e: any) => {
                const m = moves.find((x) => x.key === "el:" + e.id)
                return m ? { ...e, x_pct: m.x_pct, y_pct: m.y_pct } : e
              }),
            }
      ),
    }))
  }

  function handleMove(moves: Move[], done: boolean) {
    if (!done) {
      if (!preDrag.current) preDrag.current = snapshot()
      applyMoves(moves)
      return
    }
    pushHistory(preDrag.current)
    preDrag.current = null
    commitMoves(moves)
  }

  function commitMoves(moves: Move[]) {
    applyMoves(moves)
    saveTablePositions(moves.filter((m) => m.key.startsWith("t:")).map((m) => ({ id: m.key.slice(2), x_pct: m.x_pct, y_pct: m.y_pct })))
    const blockMoves = moves.filter((m) => m.key.startsWith("el:"))
    if (blockMoves.length > 0) {
      const next = elements.map((e) => {
        const m = blockMoves.find((x) => x.key === "el:" + e.id)
        return m ? { ...e, x_pct: m.x_pct, y_pct: m.y_pct } : e
      })
      setElements(next, false)
    }
  }

  function handleResize(id: string, w_pct: number, h_pct: number, done: boolean) {
    if (!done && !preDrag.current) preDrag.current = snapshot()
    const next = elements.map((e) => (e.id === id ? { ...e, w_pct, h_pct } : e))
    if (!done) {
      patchFloorLocal({ elements: next })
      return
    }
    pushHistory(preDrag.current)
    preDrag.current = null
    setElements(next, false)
  }

  async function handlePlace(t: Tool, x_pct: number, y_pct: number) {
    setTool("select")
    if (t === "round" || t === "rect") {
      const total = floors.reduce((s, f) => s + (f.tables?.length ?? 0), 0)
      const res = await track(
        fetch(`/api/events/${eventId}/tables`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ floor_id: floorId, name: `Bàn ${total + 1}`, seats: t === "rect" ? 12 : 10, x_pct, y_pct, shape: t }),
        })
      )
      if (res?.ok) {
        const row = await res.json()
        setDetail((prev: any) => ({ ...prev, floors: prev.floors.map((f: any) => (f.id === floorId ? { ...f, tables: [...f.tables, row] } : f)) }))
        setSelected(new Set(["t:" + row.id]))
      }
      return
    }
    pushHistory()
    const d = BLOCK_DEFAULT[t]
    const el: Block = { id: "el-" + Date.now(), type: t, label: d.label, x_pct, y_pct, w_pct: d.w_pct, h_pct: d.h_pct }
    setElements([...elements, el], false)
    setSelected(new Set(["el:" + el.id]))
  }

  async function assignGuest(guestId: string, tableId: string | null) {
    const g = guests.find((x) => x.id === guestId)
    if (tableId && g) {
      const t = tables.find((x) => x.id === tableId)
      const used = occupiedSeats(guests, tableId)
      if (t && used + 1 + (g.companions ?? 0) > t.seats) flash(`${t.name} sẽ vượt số ghế`)
    }
    setDetail((prev: any) => ({ ...prev, guests: prev.guests.map((x: any) => (x.id === guestId ? { ...x, table_id: tableId } : x)) }))
    await track(
      fetch(`/api/events/${eventId}/guests/${guestId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table_id: tableId }) })
    )
  }

  // ---------- delete ----------
  async function deleteSelected() {
    if (selected.size === 0) return
    if (selTables.length > 0) {
      const names = selTables.map((t) => t.name).join(", ")
      if (!confirm(`Xóa ${names}? Khách ở các bàn này sẽ thành chưa có bàn.`)) return
      for (const t of selTables) await track(fetch(`/api/events/${eventId}/tables/${t.id}`, { method: "DELETE" }))
    }
    if (selBlocks.length > 0) {
      pushHistory()
      const ids = new Set(selBlocks.map((b) => b.id))
      setElements(elements.filter((e) => !ids.has(e.id)), false)
    }
    setSelected(new Set())
    if (selTables.length > 0) load()
  }

  // ---------- align ----------
  function align(kind: "left" | "right" | "top" | "bottom" | "centerX" | "centerY") {
    const items = selKeys.map((k) => {
      const src: any = k.startsWith("t:") ? tables.find((t) => t.id === k.slice(2)) : elements.find((e) => e.id === k.slice(3))
      return src ? { key: k, x_pct: src.x_pct, y_pct: src.y_pct } : null
    }).filter(Boolean) as Move[]
    if (items.length < 2) return
    const xs = items.map((i) => i.x_pct)
    const ys = items.map((i) => i.y_pct)
    const v =
      kind === "left" ? Math.min(...xs) : kind === "right" ? Math.max(...xs) : kind === "top" ? Math.min(...ys) : kind === "bottom" ? Math.max(...ys)
      : kind === "centerX" ? xs.reduce((a, b) => a + b, 0) / xs.length : ys.reduce((a, b) => a + b, 0) / ys.length
    const isX = kind === "left" || kind === "right" || kind === "centerX"
    pushHistory()
    commitMoves(items.map((i) => ({ key: i.key, x_pct: isX ? v : i.x_pct, y_pct: isX ? i.y_pct : v })))
  }

  function distribute(axis: "x" | "y") {
    const items = selKeys.map((k) => {
      const src: any = k.startsWith("t:") ? tables.find((t) => t.id === k.slice(2)) : elements.find((e) => e.id === k.slice(3))
      return src ? { key: k, x_pct: src.x_pct, y_pct: src.y_pct } : null
    }).filter(Boolean) as Move[]
    if (items.length < 3) return
    const sorted = [...items].sort((a, b) => (axis === "x" ? a.x_pct - b.x_pct : a.y_pct - b.y_pct))
    const first = axis === "x" ? sorted[0].x_pct : sorted[0].y_pct
    const last = axis === "x" ? sorted[sorted.length - 1].x_pct : sorted[sorted.length - 1].y_pct
    const step = (last - first) / (sorted.length - 1)
    pushHistory()
    commitMoves(sorted.map((i, idx) => ({ key: i.key, x_pct: axis === "x" ? first + step * idx : i.x_pct, y_pct: axis === "y" ? first + step * idx : i.y_pct })))
  }

  // ---------- templates / floors / background ----------
  async function applyTemplate(key: TemplateKey) {
    setShowTemplates(false)
    pushHistory()
    const nextElements = elements.some((e) => e.type === "stage") ? elements : [...elements, stageElement()]
    patchFloorLocal({ elements: nextElements, layout_template: key })
    saveFloor({ elements: nextElements, layout_template: key })
    if (key !== "custom" && tables.length > 0) {
      const { positions } = computeLayout(key, tables.map((t) => t.id))
      commitMoves(positions.map((p) => ({ key: "t:" + p.id, x_pct: p.x_pct, y_pct: p.y_pct })))
    }
    flash("Đã áp dụng bố cục")
  }

  async function addFloor() {
    const name = prompt("Tên tầng mới", `Tầng ${floors.length + 1}`)
    if (!name) return
    const res = await track(fetch(`/api/events/${eventId}/floors`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) }))
    if (!res?.ok) return
    const data = await res.json()
    await load()
    switchFloor(data.id)
  }

  async function renameFloor(f: any) {
    const name = prompt("Đổi tên tầng", f.name)
    if (!name || name === f.name) return
    patchFloorLocal({ name }, f.id)
    saveFloor({ name }, f.id)
  }

  function switchFloor(id: string) {
    setFloorId(id)
    setSelected(new Set())
    setTool("select")
  }

  async function uploadBackground(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file || !floorId) return
    setUploadingBg(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Chưa đăng nhập")
      const blob = await resizeImage(file, 1600)
      const path = `${user.id}/${eventId}/floor-bg-${floorId}-${Date.now()}.jpg`
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" })
      if (error) throw new Error(error.message)
      const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      patchFloorLocal({ background_url: url })
      saveFloor({ background_url: url })
      flash("Đã tải ảnh nền")
    } catch (err: any) {
      setSaveError(err.message ?? "Không tải được ảnh nền")
    }
    setUploadingBg(false)
  }

  function setBgOpacity(v: number) {
    patchFloorLocal({ background_opacity: v })
    if (bgTimer.current) clearTimeout(bgTimer.current)
    bgTimer.current = setTimeout(() => saveFloor({ background_opacity: v }), 400)
  }

  // ---------- keyboard ----------
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {})
  keyRef.current = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault()
      undo()
    } else if (e.key === "Delete" || e.key === "Backspace") {
      if (selected.size) {
        e.preventDefault()
        deleteSelected()
      }
    } else if (e.key === "Escape") {
      setSelected(new Set())
      setTool("select")
    } else if (e.key.toLowerCase() === "v") {
      setTool("select")
    } else if (e.key.startsWith("Arrow") && selected.size) {
      e.preventDefault()
      const step = e.shiftKey ? 2 : 0.5
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0
      const moves = selKeys.map((k) => {
        const src: any = k.startsWith("t:") ? tables.find((t) => t.id === k.slice(2)) : elements.find((x) => x.id === k.slice(3))
        return src ? { key: k, x_pct: Math.max(1, Math.min(99, src.x_pct + dx)), y_pct: Math.max(1, Math.min(99, src.y_pct + dy)) } : null
      }).filter(Boolean) as Move[]
      commitMoves(moves)
    }
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [])

  if (loading) return <p className="text-muted">Đang tải...</p>
  if (!eventId) return <p className="text-muted">Bạn chưa có sự kiện nào. Tạo ở trang Tổng quan.</p>
  if (!detail) return <p className="text-muted">Đang tải...</p>

  const floorSeats = tables.reduce((s, t) => s + t.seats, 0)
  const floorUsed = tables.reduce((s, t) => s + occupiedSeats(guests, t.id), 0)
  const unseated = guests.filter((g: any) => !g.table_id && !g.no_show)
  const templateLabel = TEMPLATES.find((t) => t.key === (floor?.layout_template ?? "custom"))?.label ?? "Tự do"
  const status = saveError ? (
    <span className="text-rose">{saveError}</span>
  ) : saving > 0 ? (
    <span className="text-muted">Đang lưu…</span>
  ) : (
    <span className="text-sage inline-flex items-center gap-1"><Icon name="check" size={13} /> Đã lưu</span>
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Header: floors, stats, save status, templates */}
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="font-serif text-[28px] leading-tight tracking-[-0.01em] text-text mr-1">Sơ đồ bàn</h1>
        <div className="flex items-center gap-1 bg-surface border border-border rounded-pill p-0.5">
          {floors.map((f) => (
            <button
              key={f.id}
              onClick={() => switchFloor(f.id)}
              onDoubleClick={() => renameFloor(f)}
              title="Bấm đúp để đổi tên"
              className={"rounded-pill px-3 py-1 text-sm " + (f.id === floorId ? "bg-text text-surface font-medium" : "text-muted hover:text-text")}
            >
              {f.name}
            </button>
          ))}
          {floors.length < 3 && (
            <button onClick={addFloor} className="rounded-pill px-2.5 py-1 text-sm text-muted hover:text-text" title="Thêm tầng">
              +
            </button>
          )}
        </div>
        <span className="text-xs text-muted hidden sm:inline">
          {tables.length} bàn · {floorUsed}/{floorSeats} ghế · {status}
        </span>
        <div className="ml-auto relative">
          <button onClick={() => setShowTemplates((s) => !s)} className="border border-border bg-surface rounded-pill px-3 py-1.5 text-sm hover:bg-bg">
            <span className="inline-flex items-center gap-1.5">Bố cục mẫu: {templateLabel} <Icon name="chevronDown" size={14} /></span>
          </button>
          {showTemplates && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowTemplates(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded-card shadow-lg z-20 overflow-hidden">
                {TEMPLATES.map((t) => (
                  <button key={t.key} className="w-full text-left px-4 py-3 text-sm hover:bg-bg" onClick={() => applyTemplate(t.key)}>
                    <div className="font-medium text-text">{t.label}</div>
                    <div className="text-xs text-muted">{t.desc}</div>
                  </button>
                ))}
                <p className="px-4 py-2 text-xs text-muted border-t border-border">Sắp xếp lại toàn bộ bàn của tầng này. Có thể hoàn tác bằng Ctrl+Z.</p>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="text-xs text-muted sm:hidden">
        {tables.length} bàn · {floorUsed}/{floorSeats} ghế · {status}
      </div>

      <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_288px]">
        {/* Tool rail */}
        <div className="flex lg:flex-col gap-1 bg-surface border border-border rounded-card p-1.5 h-fit overflow-x-auto">
          {TOOLS.map((t, i) => (
            <div key={t.tool} className="contents">
              {i === 3 && <div className="w-px lg:w-auto lg:h-px bg-border mx-1 lg:mx-0 lg:my-1 self-stretch" />}
              <button
                onClick={() => setTool(t.tool)}
                title={t.label}
                aria-label={t.label}
                className={"w-10 h-10 shrink-0 rounded-card flex items-center justify-center text-lg " + (tool === t.tool ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-alt hover:text-text")}
              >
                <Icon name={t.icon} size={20} />
              </button>
            </div>
          ))}
          <div className="w-px lg:w-auto lg:h-px bg-border mx-1 lg:mx-0 lg:my-1 self-stretch" />
          <label title="Ảnh nền (sơ đồ mặt bằng)" className="w-10 h-10 shrink-0 rounded-card flex items-center justify-center text-lg text-muted hover:bg-bg hover:text-text cursor-pointer">
            {uploadingBg ? "…" : <Icon name="image" size={20} />}
            <input type="file" accept="image/*" className="hidden" disabled={uploadingBg} onChange={uploadBackground} />
          </label>
          <button
            onClick={undo}
            disabled={history.length === 0}
            title="Hoàn tác (Ctrl+Z)"
            aria-label="Hoàn tác"
            className="w-10 h-10 shrink-0 rounded-card flex items-center justify-center text-lg text-muted hover:bg-bg hover:text-text disabled:opacity-30"
          >
            <Icon name="undo" size={20} />
          </button>
        </div>

        {/* Canvas + bottom bar */}
        <div className="flex flex-col gap-2 min-w-0">
          {tool !== "select" && (
            <div className="text-xs bg-ink text-white rounded-card px-3 py-2 flex items-center gap-2">
              <span>Bấm vào sơ đồ để đặt {TOOLS.find((t) => t.tool === tool)?.label.replace("Thêm ", "")}.</span>
              <button className="ml-auto underline" onClick={() => setTool("select")}>
                Hủy (Esc)
              </button>
            </div>
          )}
          <SeatingCanvas
            tables={tables}
            guests={guests}
            elements={elements}
            backgroundUrl={floor?.background_url}
            backgroundOpacity={floor?.background_opacity ?? 0.4}
            tool={tool}
            zoom={zoom}
            snap={snap}
            selected={selected}
            onSelect={setSelected}
            onMove={handleMove}
            onResize={handleResize}
            onPlace={handlePlace}
            onDropGuest={(gid, tid) => assignGuest(gid, tid)}
          />
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center bg-surface border border-border rounded-pill">
              <button className="px-2.5 py-1 hover:bg-bg rounded-l-pill" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))} aria-label="Thu nhỏ">
                −
              </button>
              <button className="px-1 py-1 w-12 text-center" onClick={() => setZoom(1)} title="Về 100%">
                {Math.round(zoom * 100)}%
              </button>
              <button className="px-2.5 py-1 hover:bg-bg rounded-r-pill" onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))} aria-label="Phóng to">
                +
              </button>
            </div>
            <button
              onClick={() => setSnap((s) => !s)}
              className={"rounded-pill px-3 py-1 border " + (snap ? "bg-brand-soft border-brand/30 text-brand" : "bg-surface border-border text-muted")}
            >
              <span className="inline-flex items-center gap-1">{snap && <Icon name="check" size={13} />}Bắt lưới</span>
            </button>
            <div className="flex items-center gap-3 text-muted ml-1">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-pr" /> VIP</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full border border-dashed border-muted" /> Trống</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose" /> Quá chỗ</span>
            </div>
            <span className="ml-auto text-muted hidden md:inline">Shift + bấm hoặc kéo khung để chọn nhiều · phím mũi tên để dịch nhẹ · Delete để xóa</span>
          </div>
        </div>

        {/* Properties panel */}
        <div className="bg-surface border border-border rounded-card p-4 h-fit flex flex-col gap-4">
          {selected.size > 1 && (
            <MultiPanel
              count={selected.size}
              onAlign={align}
              onDistribute={distribute}
              onDelete={deleteSelected}
              onClear={() => setSelected(new Set())}
            />
          )}

          {oneTable && (
            <TablePanel
              key={oneTable.id}
              table={oneTable}
              guests={guests}
              unseated={unseated}
              onPatch={(patch) => patchTable(oneTable.id, patch)}
              onAssign={assignGuest}
              onDelete={deleteSelected}
            />
          )}

          {oneBlock && (
            <BlockPanel
              key={oneBlock.id}
              block={oneBlock}
              onChange={(patch) => {
                if (patch.type) pushHistory()
                setElements(elements.map((e) => (e.id === oneBlock.id ? { ...e, ...patch } : e)))
              }}
              onDelete={deleteSelected}
            />
          )}

          {selected.size === 0 && (
            <>
              <div>
                <h2 className="font-semibold text-text text-sm mb-1">{floor?.name ?? "Tầng"}</h2>
                <p className="text-xs text-muted">Chọn công cụ bên trái rồi bấm vào sơ đồ để thêm bàn hoặc khối. Bấm vào một bàn để sửa.</p>
              </div>

              <div>
                <div className="text-xs font-medium text-muted mb-1.5">Ảnh nền mặt bằng</div>
                {floor?.background_url ? (
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-xs text-muted">
                      Độ mờ
                      <input type="range" min={0.1} max={1} step={0.05} value={floor.background_opacity ?? 0.4} onChange={(e) => setBgOpacity(Number(e.target.value))} className="flex-1" />
                    </label>
                    <button
                      onClick={() => {
                        patchFloorLocal({ background_url: "" })
                        saveFloor({ background_url: "" })
                      }}
                      className="text-xs text-rose self-start hover:underline"
                    >
                      Xóa ảnh nền
                    </button>
                  </div>
                ) : (
                  <label className="text-xs border border-dashed border-border rounded-card px-3 py-3 block text-center text-muted cursor-pointer hover:bg-bg">
                    {uploadingBg ? "Đang tải…" : "Tải ảnh sơ đồ nhà hàng lên để vẽ theo"}
                    <input type="file" accept="image/*" className="hidden" disabled={uploadingBg} onChange={uploadBackground} />
                  </label>
                )}
              </div>

              <UnseatedList unseated={unseated} hint="Kéo tên khách thả vào bàn trên sơ đồ." />
            </>
          )}
        </div>
      </div>

      {toast && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-ink text-white text-sm rounded-pill px-4 py-2 shadow-lg z-30">{toast}</div>}
    </div>
  )
}

// ---------- panels ----------

const field = "border border-border rounded-card px-3 py-2 text-sm w-full bg-surface"

function TablePanel({
  table,
  guests,
  unseated,
  onPatch,
  onAssign,
  onDelete,
}: {
  table: Table
  guests: any[]
  unseated: any[]
  onPatch: (p: Partial<Table>) => void
  onAssign: (guestId: string, tableId: string | null) => void
  onDelete: () => void
}) {
  const [name, setName] = useState(table.name)
  const seated = guests.filter((g) => g.table_id === table.id)
  const used = occupiedSeats(guests, table.id)

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text">{table.name}</h2>
        <button onClick={onDelete} className="text-xs text-rose hover:underline">
          Xóa bàn
        </button>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">Tên bàn</span>
        <input
          className={field}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (e.target.value.trim()) onPatch({ name: e.target.value })
          }}
        />
      </label>

      <div className="flex items-end gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">Số ghế</span>
          <div className="flex items-center border border-border rounded-pill">
            <button className="w-8 h-8 rounded-l-pill hover:bg-bg" onClick={() => onPatch({ seats: Math.max(1, table.seats - 1) })} aria-label="Bớt ghế">
              −
            </button>
            <span className="w-8 text-center text-sm font-medium">{table.seats}</span>
            <button className="w-8 h-8 rounded-r-pill hover:bg-bg" onClick={() => onPatch({ seats: Math.min(30, table.seats + 1) })} aria-label="Thêm ghế">
              +
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">Hình dạng</span>
          <div className="flex border border-border rounded-pill p-0.5">
            {[
              { v: "round", l: "Tròn" },
              { v: "rect", l: "Dài" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => onPatch({ shape: o.v })}
                className={"px-3 py-1 text-xs rounded-pill " + ((table.shape ?? "round") === o.v ? "bg-ink text-white" : "text-muted")}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span>Bàn VIP</span>
        <button
          role="switch"
          aria-checked={table.vip}
          onClick={() => onPatch({ vip: !table.vip })}
          className={"w-10 h-6 rounded-pill relative transition-colors " + (table.vip ? "bg-pr" : "bg-border")}
        >
          <span className={"absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all " + (table.vip ? "left-5" : "left-1")} />
        </button>
      </div>

      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted">Khách ngồi bàn</span>
          <span className={"text-xs font-medium " + (used > table.seats ? "text-rose" : "text-text")}>
            {used}/{table.seats} ghế
          </span>
        </div>
        {seated.length === 0 && <p className="text-xs text-muted">Chưa có khách. Kéo tên khách từ danh sách bên dưới vào bàn, hoặc chọn ở ô dưới.</p>}
        <div className="flex flex-col">
          {seated.map((g) => (
            <div key={g.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
              <span className={g.no_show ? "line-through text-muted" : "text-text"}>
                {g.name}
                {g.companions > 0 && <span className="text-muted"> +{g.companions}</span>}
              </span>
              <button onClick={() => onAssign(g.id, null)} className="text-muted hover:text-rose px-1" aria-label={`Bỏ ${g.name} khỏi bàn`}>
                <Icon name="close" size={14} />
              </button>
            </div>
          ))}
        </div>
        {unseated.length > 0 && (
          <select className={field + " mt-2 text-xs"} value="" onChange={(e) => e.target.value && onAssign(e.target.value, table.id)}>
            <option value="">+ Thêm khách chưa có bàn…</option>
            {unseated.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
                {g.companions > 0 ? ` (+${g.companions})` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      <UnseatedList unseated={unseated} hint="Kéo vào bất kỳ bàn nào." compact />
    </>
  )
}

function BlockPanel({ block, onChange, onDelete }: { block: Block; onChange: (p: Partial<Block>) => void; onDelete: () => void }) {
  const [label, setLabel] = useState(block.label)
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text">{block.label}</h2>
        <button onClick={onDelete} className="text-xs text-rose hover:underline">
          Xóa khối
        </button>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">Loại khối</span>
        <div className="flex border border-border rounded-pill p-0.5">
          {BLOCK_TYPES.map((o) => (
            <button
              key={o.type}
              onClick={() => onChange({ type: o.type })}
              className={"flex-1 px-2 py-1 text-xs rounded-pill " + (block.type === o.type ? "bg-ink text-white" : "text-muted")}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">Nhãn hiển thị</span>
        <input
          className={field}
          value={label}
          onChange={(e) => {
            setLabel(e.target.value)
            onChange({ label: e.target.value })
          }}
        />
      </label>
      <p className="text-xs text-muted">Kéo để di chuyển. Kéo ô vuông nhỏ ở góc dưới phải để đổi kích thước.</p>
    </>
  )
}

function MultiPanel({
  count,
  onAlign,
  onDistribute,
  onDelete,
  onClear,
}: {
  count: number
  onAlign: (k: "left" | "right" | "top" | "bottom" | "centerX" | "centerY") => void
  onDistribute: (a: "x" | "y") => void
  onDelete: () => void
  onClear: () => void
}) {
  const btn = "border border-border rounded-card px-2 py-2 text-xs hover:bg-bg"
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-text">{count} mục đã chọn</h2>
        <button onClick={onClear} className="text-xs text-muted hover:underline">
          Bỏ chọn
        </button>
      </div>
      <div>
        <div className="text-xs font-medium text-muted mb-1.5">Căn chỉnh</div>
        <div className="grid grid-cols-3 gap-1.5">
          <button className={btn} onClick={() => onAlign("left")}><Icon name="alignLeft" size={16} className="mx-auto mb-1" />Trái</button>
          <button className={btn} onClick={() => onAlign("centerX")}><Icon name="alignCenterX" size={16} className="mx-auto mb-1" />Giữa dọc</button>
          <button className={btn} onClick={() => onAlign("right")}><Icon name="alignRight" size={16} className="mx-auto mb-1" />Phải</button>
          <button className={btn} onClick={() => onAlign("top")}><Icon name="alignTop" size={16} className="mx-auto mb-1" />Trên</button>
          <button className={btn} onClick={() => onAlign("centerY")}><Icon name="alignCenterY" size={16} className="mx-auto mb-1" />Giữa ngang</button>
          <button className={btn} onClick={() => onAlign("bottom")}><Icon name="alignBottom" size={16} className="mx-auto mb-1" />Dưới</button>
        </div>
      </div>
      <div>
        <div className="text-xs font-medium text-muted mb-1.5">Giãn đều (từ 3 mục)</div>
        <div className="grid grid-cols-2 gap-1.5">
          <button className={btn} onClick={() => onDistribute("x")} disabled={count < 3}>Theo hàng ngang</button>
          <button className={btn} onClick={() => onDistribute("y")} disabled={count < 3}>Theo cột dọc</button>
        </div>
      </div>
      <button onClick={onDelete} className="text-xs text-rose self-start hover:underline">
        Xóa các mục đã chọn
      </button>
    </>
  )
}

function UnseatedList({ unseated, hint, compact = false }: { unseated: any[]; hint: string; compact?: boolean }) {
  if (unseated.length === 0) return compact ? null : <p className="text-xs text-sage flex items-center gap-1.5"><Icon name="check" size={14} /> Mọi khách đều đã có bàn.</p>
  return (
    <div className={compact ? "border-t border-border pt-3" : ""}>
      <div className="text-xs font-medium text-muted mb-1">Chưa có bàn ({unseated.length})</div>
      <p className="text-xs text-muted mb-2">{hint}</p>
      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
        {unseated.map((g) => (
          <span
            key={g.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/guest", g.id)
              e.dataTransfer.effectAllowed = "move"
            }}
            className="inline-flex items-center gap-1 bg-bg border border-border rounded-pill px-2.5 py-1 text-xs cursor-grab active:cursor-grabbing"
          >
            <Icon name="grip" size={12} className="text-faint" />
            {g.name}
            {g.companions > 0 && <span className="text-muted">+{g.companions}</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
