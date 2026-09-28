"use client"

import { useEffect, useRef, useState } from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { TouchBackend } from "react-dnd-touch-backend"

type Table = { id: string; name: string; seats: number; x_pct: number; y_pct: number; vip: boolean }
type Guest = { id: string; table_id: string | null; companions: number; no_show: boolean }
type Element = { id: string; type: "stage" | "path" | "decor"; label: string; x_pct: number; y_pct: number; w_pct: number; h_pct: number }

function occupiedSeats(guests: Guest[], tableId: string) {
  return guests.filter((g) => g.table_id === tableId && !g.no_show).reduce((sum, g) => sum + 1 + (g.companions ?? 0), 0)
}

function TableNode({
  table,
  occupied,
  selected,
  selectMode,
  onClick,
}: {
  table: Table
  occupied: number
  selected: boolean
  selectMode: boolean
  onClick: () => void
}) {
  const [{ isDragging }, drag] = useDrag({
    type: "TABLE",
    item: { id: table.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  })

  const full = occupied >= table.seats

  return (
    <div
      ref={drag as any}
      onClick={onClick}
      style={{
        position: "absolute",
        left: `${table.x_pct}%`,
        top: `${table.y_pct}%`,
        transform: "translate(-50%, -50%)",
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
        touchAction: "none",
      }}
      className={
        "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex flex-col items-center justify-center text-[11px] sm:text-xs font-medium select-none " +
        (selected
          ? "border-ink ring-2 ring-ink bg-pr-l"
          : table.vip
          ? "border-pr bg-pr-l text-pr-d"
          : full
          ? "border-rose bg-rose/10 text-rose"
          : "border-border bg-surface text-text")
      }
    >
      {selectMode && (
        <span className={"absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border text-[9px] flex items-center justify-center bg-surface " + (selected ? "border-ink bg-ink text-white" : "border-muted")}>
          {selected ? "✓" : ""}
        </span>
      )}
      <span>{table.name}</span>
      <span className="text-[10px] text-muted">
        {occupied}/{table.seats}
      </span>
    </div>
  )
}

const TYPE_ICON: Record<string, string> = { stage: "🎤", path: "↕", decor: "✦" }

function BlockNode({
  el,
  selected,
  selectMode,
  onClick,
  onResize,
}: {
  el: Element
  selected: boolean
  selectMode: boolean
  onClick: () => void
  onResize: (w_pct: number, h_pct: number) => void
}) {
  const [{ isDragging }, drag] = useDrag({
    type: "BLOCK",
    item: { id: el.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  })
  const ref = useRef<HTMLDivElement | null>(null)

  function startResize(e: React.PointerEvent) {
    e.stopPropagation()
    e.preventDefault()
    const parent = ref.current?.parentElement
    if (!parent) return
    const rect = parent.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const startW = el.w_pct
    const startH = el.h_pct
    function onMove(ev: PointerEvent) {
      const dW = ((ev.clientX - startX) / rect.width) * 100
      const dH = ((ev.clientY - startY) / rect.height) * 100
      onResize(Math.max(6, startW + dW), Math.max(6, startH + dH))
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  return (
    <div
      ref={(node) => {
        ref.current = node
        drag(node as any)
      }}
      onClick={onClick}
      style={{
        position: "absolute",
        left: `${el.x_pct}%`,
        top: `${el.y_pct}%`,
        width: `${el.w_pct}%`,
        height: `${el.h_pct}%`,
        transform: "translate(-50%, -50%)",
        opacity: isDragging ? 0.5 : 1,
        touchAction: "none",
      }}
      className={
        "flex items-center justify-center gap-1 rounded-card border-2 border-dashed text-xs font-medium select-none cursor-grab " +
        (selected ? "border-ink bg-ink/10 text-ink" : "border-muted/60 bg-muted/10 text-muted")
      }
    >
      <span>{TYPE_ICON[el.type] ?? "▭"}</span>
      <span className="truncate max-w-[80%]">{el.label}</span>
      {selectMode && (
        <span className={"absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full border text-[9px] flex items-center justify-center bg-surface " + (selected ? "border-ink bg-ink text-white" : "border-muted")}>
          {selected ? "✓" : ""}
        </span>
      )}
      {!selectMode && (
        <div
          onPointerDown={startResize}
          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full bg-ink cursor-nwse-resize"
        />
      )}
    </div>
  )
}

type CanvasProps = {
  tables: Table[]
  guests: Guest[]
  elements: Element[]
  backgroundUrl?: string
  backgroundOpacity?: number
  onTableMove: (id: string, x_pct: number, y_pct: number) => void
  onElementMove: (id: string, x_pct: number, y_pct: number) => void
  onElementResize: (id: string, w_pct: number, h_pct: number) => void
  onTableClick?: (table: Table) => void
  onElementClick?: (el: Element) => void
  selectMode?: boolean
  selected?: Set<string>
}

export default function SeatingCanvas(props: CanvasProps) {
  const [touch, setTouch] = useState<boolean | null>(null)

  useEffect(() => {
    setTouch("ontouchstart" in window || navigator.maxTouchPoints > 0)
  }, [])

  if (touch === null) return <div className="w-full h-[420px] sm:h-[600px] bg-surface border border-border rounded-card" />

  return (
    <DndProvider
      backend={(touch ? TouchBackend : HTML5Backend) as any}
      options={touch ? { enableMouseEvents: true, delayTouchStart: 120 } : undefined}
    >
      <Canvas {...props} />
    </DndProvider>
  )
}

function Canvas({
  tables,
  guests,
  elements,
  backgroundUrl,
  backgroundOpacity = 0.4,
  onTableMove,
  onElementMove,
  onElementResize,
  onTableClick,
  onElementClick,
  selectMode = false,
  selected = new Set(),
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null)

  const [, drop] = useDrop({
    accept: ["TABLE", "BLOCK"],
    drop: (item: { id: string }, monitor) => {
      const type = monitor.getItemType()
      const offset = monitor.getClientOffset()
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!offset || !rect) return
      const x_pct = ((offset.x - rect.left) / rect.width) * 100
      const y_pct = ((offset.y - rect.top) / rect.height) * 100
      const cx = Math.max(0, Math.min(100, x_pct))
      const cy = Math.max(0, Math.min(100, y_pct))
      if (type === "BLOCK") onElementMove(item.id, cx, cy)
      else onTableMove(item.id, cx, cy)
    },
  })

  return (
    <div
      ref={(node) => {
        canvasRef.current = node
        drop(node as any)
      }}
      className="relative w-full h-[420px] sm:h-[600px] bg-surface border border-border rounded-card overflow-hidden"
    >
      {backgroundUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: backgroundOpacity }} />
      )}
      {elements.map((el) => (
        <BlockNode
          key={el.id}
          el={el}
          selected={selected.has("el:" + el.id)}
          selectMode={selectMode}
          onClick={() => onElementClick?.(el)}
          onResize={(w, h) => onElementResize(el.id, w, h)}
        />
      ))}
      {tables.map((table) => (
        <TableNode
          key={table.id}
          table={table}
          occupied={occupiedSeats(guests, table.id)}
          selected={selected.has("t:" + table.id)}
          selectMode={selectMode}
          onClick={() => onTableClick?.(table)}
        />
      ))}
    </div>
  )
}
