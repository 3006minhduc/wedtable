"use client"

// Seating editor canvas. Pointer-event based (mouse + touch): drag to move,
// Shift/click to multi-select, drag on empty space for a selection box,
// snap to grid, zoom, resize blocks, drop guests onto tables.
// Positions are % of the canvas, same as public views (FloorLayers).

import { useRef, useState } from "react"

export type Table = { id: string; name: string; seats: number; x_pct: number; y_pct: number; vip: boolean; shape?: string }
export type Guest = { id: string; table_id: string | null; companions: number; no_show: boolean }
export type Block = { id: string; type: string; label: string; x_pct: number; y_pct: number; w_pct: number; h_pct: number }
export type Tool = "select" | "round" | "rect" | "stage" | "path" | "decor"
export type Move = { key: string; x_pct: number; y_pct: number }

export const BASE_HEIGHT = 600
export const GRID_PX = 20

export function occupiedSeats(guests: Guest[], tableId: string) {
  return guests.filter((g) => g.table_id === tableId && !g.no_show).reduce((sum, g) => sum + 1 + (g.companions ?? 0), 0)
}

export function tableSize(t: Table) {
  return t.shape === "rect" ? { w: 132, h: 52 } : { w: 72, h: 72 }
}

const BLOCK_STYLE: Record<string, string> = {
  stage: "bg-pr/20 border-pr text-pr-d",
  path: "bg-surface/60 border-muted/60 border-dashed text-muted",
  decor: "bg-sage/10 border-sage/60 text-sage",
}
const BLOCK_ICON: Record<string, string> = { stage: "🎤", path: "↕", decor: "✦" }

type Props = {
  tables: Table[]
  guests: Guest[]
  elements: Block[]
  backgroundUrl?: string
  backgroundOpacity?: number
  tool: Tool
  zoom: number
  snap: boolean
  selected: Set<string>
  onSelect: (keys: Set<string>) => void
  onMove: (moves: Move[], done: boolean) => void
  onResize: (id: string, w_pct: number, h_pct: number, done: boolean) => void
  onPlace: (tool: Tool, x_pct: number, y_pct: number) => void
  onDropGuest: (guestId: string, tableId: string) => void
}

type Drag =
  | { kind: "move"; startX: number; startY: number; rect: DOMRect; origin: Move[]; moved: boolean; clickKey: string; shift: boolean }
  | { kind: "box"; startX: number; startY: number; rect: DOMRect; shift: boolean; curX: number; curY: number }
  | { kind: "resize"; id: string; startX: number; startY: number; rect: DOMRect; w: number; h: number }

export default function SeatingCanvas(p: Props) {
  const worldRef = useRef<HTMLDivElement | null>(null)
  const drag = useRef<Drag | null>(null)
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  const height = BASE_HEIGHT * p.zoom
  const gridPx = GRID_PX * p.zoom

  function pos(key: string) {
    const [kind, id] = key.split(":")
    const src: any = kind === "t" ? p.tables.find((t) => t.id === id) : p.elements.find((e) => e.id === id)
    return src ? { key, x_pct: src.x_pct, y_pct: src.y_pct } : null
  }

  function snapPct(v: number, sizePx: number) {
    if (!p.snap) return v
    const step = (gridPx / sizePx) * 100
    return Math.round(v / step) * step
  }

  const clamp = (v: number) => Math.max(1, Math.min(99, v))

  function itemDown(e: React.PointerEvent, key: string) {
    if (p.tool !== "select") return
    e.stopPropagation()
    const rect = worldRef.current!.getBoundingClientRect()
    let sel = p.selected
    if (e.shiftKey) {
      sel = new Set(sel)
      if (sel.has(key)) sel.delete(key)
      else sel.add(key)
      p.onSelect(sel)
    } else if (!sel.has(key)) {
      sel = new Set([key])
      p.onSelect(sel)
    }
    const origin = Array.from(sel).map(pos).filter(Boolean) as Move[]
    drag.current = { kind: "move", startX: e.clientX, startY: e.clientY, rect, origin, moved: false, clickKey: key, shift: e.shiftKey }
    worldRef.current!.setPointerCapture(e.pointerId)
  }

  function resizeDown(e: React.PointerEvent, b: Block) {
    e.stopPropagation()
    const rect = worldRef.current!.getBoundingClientRect()
    drag.current = { kind: "resize", id: b.id, startX: e.clientX, startY: e.clientY, rect, w: b.w_pct, h: b.h_pct }
    worldRef.current!.setPointerCapture(e.pointerId)
  }

  function worldDown(e: React.PointerEvent) {
    const rect = worldRef.current!.getBoundingClientRect()
    const x_pct = ((e.clientX - rect.left) / rect.width) * 100
    const y_pct = ((e.clientY - rect.top) / rect.height) * 100
    if (p.tool !== "select") {
      p.onPlace(p.tool, clamp(snapPct(x_pct, rect.width)), clamp(snapPct(y_pct, rect.height)))
      return
    }
    drag.current = { kind: "box", startX: e.clientX, startY: e.clientY, rect, shift: e.shiftKey, curX: e.clientX, curY: e.clientY }
    worldRef.current!.setPointerCapture(e.pointerId)
  }

  function onMove(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (d.kind === "move") {
      if (!d.moved && Math.abs(dx) + Math.abs(dy) < 4) return
      d.moved = true
      const dxp = (dx / d.rect.width) * 100
      const dyp = (dy / d.rect.height) * 100
      // Snap the grabbed item; move the rest of the group by the same offset
      const anchor = d.origin.find((o) => o.key === d.clickKey) ?? d.origin[0]
      const ax = clamp(snapPct(anchor.x_pct + dxp, d.rect.width))
      const ay = clamp(snapPct(anchor.y_pct + dyp, d.rect.height))
      const ox = ax - anchor.x_pct
      const oy = ay - anchor.y_pct
      p.onMove(d.origin.map((o) => ({ key: o.key, x_pct: clamp(o.x_pct + ox), y_pct: clamp(o.y_pct + oy) })), false)
    } else if (d.kind === "resize") {
      const w = Math.max(4, d.w + (dx / d.rect.width) * 200)
      const h = Math.max(4, d.h + (dy / d.rect.height) * 200)
      p.onResize(d.id, snapPct(w, d.rect.width), snapPct(h, d.rect.height), false)
    } else {
      d.curX = e.clientX
      d.curY = e.clientY
      setBox({
        x: Math.min(d.startX, e.clientX) - d.rect.left,
        y: Math.min(d.startY, e.clientY) - d.rect.top,
        w: Math.abs(dx),
        h: Math.abs(dy),
      })
    }
  }

  function onUp(e: React.PointerEvent) {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (d.kind === "move") {
      if (d.moved) {
        const last = d.origin.map((o) => pos(o.key)).filter(Boolean) as Move[]
        p.onMove(last, true)
      } else if (!d.shift) {
        p.onSelect(new Set([d.clickKey]))
      }
    } else if (d.kind === "resize") {
      const b = p.elements.find((x) => x.id === d.id)
      if (b) p.onResize(b.id, b.w_pct, b.h_pct, true)
    } else {
      setBox(null)
      const x1 = ((Math.min(d.startX, d.curX) - d.rect.left) / d.rect.width) * 100
      const x2 = ((Math.max(d.startX, d.curX) - d.rect.left) / d.rect.width) * 100
      const y1 = ((Math.min(d.startY, d.curY) - d.rect.top) / d.rect.height) * 100
      const y2 = ((Math.max(d.startY, d.curY) - d.rect.top) / d.rect.height) * 100
      const tiny = Math.abs(d.curX - d.startX) + Math.abs(d.curY - d.startY) < 4
      if (tiny) {
        if (!d.shift) p.onSelect(new Set())
        return
      }
      const inside = (x: number, y: number) => x >= x1 && x <= x2 && y >= y1 && y <= y2
      const next = new Set(d.shift ? p.selected : [])
      p.tables.forEach((t) => inside(t.x_pct, t.y_pct) && next.add("t:" + t.id))
      p.elements.forEach((b) => inside(b.x_pct, b.y_pct) && next.add("el:" + b.id))
      p.onSelect(next)
    }
  }

  const single = p.selected.size === 1 ? Array.from(p.selected)[0] : null

  return (
    <div className="relative w-full overflow-auto rounded-card border border-border bg-bg" style={{ height: "min(70vh, 640px)", minHeight: 380 }}>
      <div
        ref={worldRef}
        onPointerDown={worldDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={"relative select-none " + (p.tool === "select" ? "cursor-default" : "cursor-crosshair")}
        style={{
          width: `${p.zoom * 100}%`,
          minWidth: 560 * p.zoom,
          height,
          touchAction: "none",
          backgroundColor: "rgb(var(--surface-rgb))",
          backgroundImage: "radial-gradient(rgb(var(--muted-rgb) / 0.28) 1px, transparent 1px)",
          backgroundSize: `${gridPx}px ${gridPx}px`,
        }}
      >
        {p.backgroundUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={{ opacity: p.backgroundOpacity ?? 0.4 }} />
        )}

        {p.elements.map((b) => {
          const key = "el:" + b.id
          const sel = p.selected.has(key)
          return (
            <div
              key={b.id}
              onPointerDown={(e) => itemDown(e, key)}
              className={
                "absolute flex items-center justify-center gap-1.5 rounded-card border-2 text-xs font-medium overflow-hidden " +
                (BLOCK_STYLE[b.type] ?? BLOCK_STYLE.decor) +
                (sel ? " ring-2 ring-ink ring-offset-2" : "") +
                (p.tool === "select" ? " cursor-move" : "")
              }
              style={{ left: `${b.x_pct}%`, top: `${b.y_pct}%`, width: `${b.w_pct}%`, height: `${b.h_pct}%`, transform: "translate(-50%, -50%)" }}
            >
              <span aria-hidden>{BLOCK_ICON[b.type] ?? "▭"}</span>
              <span className="truncate">{b.label}</span>
              {sel && single === key && (
                <div
                  onPointerDown={(e) => resizeDown(e, b)}
                  className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-sm bg-ink cursor-nwse-resize"
                  title="Kéo để đổi kích thước"
                />
              )}
            </div>
          )
        })}

        {p.tables.map((t) => {
          const key = "t:" + t.id
          const sel = p.selected.has(key)
          const used = occupiedSeats(p.guests, t.id)
          const { w, h } = tableSize(t)
          const over = used > t.seats
          const empty = used === 0
          const tone = over
            ? "border-rose bg-rose/10 text-rose"
            : t.vip
            ? "border-pr bg-pr-l text-pr-d"
            : empty
            ? "border-muted/50 border-dashed bg-surface text-muted"
            : "border-ink/30 bg-surface text-text"
          return (
            <div
              key={t.id}
              onPointerDown={(e) => itemDown(e, key)}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes("text/guest")) {
                  e.preventDefault()
                  setDropTarget(t.id)
                }
              }}
              onDragLeave={() => setDropTarget((cur) => (cur === t.id ? null : cur))}
              onDrop={(e) => {
                const gid = e.dataTransfer.getData("text/guest")
                setDropTarget(null)
                if (gid) p.onDropGuest(gid, t.id)
              }}
              className={
                "absolute flex flex-col items-center justify-center border-2 leading-tight transition-shadow " +
                (t.shape === "rect" ? "rounded-card " : "rounded-full ") +
                tone +
                (sel ? " ring-2 ring-ink ring-offset-2" : "") +
                (dropTarget === t.id ? " ring-4 ring-sage/60" : "") +
                (p.tool === "select" ? " cursor-move" : "")
              }
              style={{ left: `${t.x_pct}%`, top: `${t.y_pct}%`, width: w * p.zoom, height: h * p.zoom, transform: "translate(-50%, -50%)" }}
            >
              <SeatDots table={t} used={used} w={w * p.zoom} h={h * p.zoom} />
              <span className="font-medium truncate max-w-[90%]" style={{ fontSize: 12 * Math.min(1.2, Math.max(0.8, p.zoom)) }}>
                {t.name}
              </span>
              <span className="opacity-80" style={{ fontSize: 11 * Math.min(1.2, Math.max(0.8, p.zoom)) }}>
                {used}/{t.seats}
              </span>
            </div>
          )
        })}

        {box && <div className="absolute border border-ink/60 bg-ink/5 pointer-events-none" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} />}
      </div>
    </div>
  )
}

// Small dots around the table: filled = taken seat, hollow = free seat
function SeatDots({ table, used, w, h }: { table: Table; used: number; w: number; h: number }) {
  const n = Math.min(table.seats, 20)
  const dots = []
  for (let i = 0; i < n; i++) {
    let x: number, y: number
    if (table.shape === "rect") {
      const top = Math.ceil(n / 2)
      const onTop = i < top
      const count = onTop ? top : n - top
      const idx = onTop ? i : i - top
      x = ((idx + 0.5) / count) * w
      y = onTop ? -6 : h + 6
    } else {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2
      x = w / 2 + Math.cos(a) * (w / 2 + 6)
      y = h / 2 + Math.sin(a) * (h / 2 + 6)
    }
    const taken = i < used
    dots.push(
      <span
        key={i}
        className={"absolute w-[7px] h-[7px] rounded-full -translate-x-1/2 -translate-y-1/2 " + (taken ? "bg-ink/70" : "border border-muted/60 bg-surface")}
        style={{ left: x, top: y }}
      />
    )
  }
  return <>{dots}</>
}
