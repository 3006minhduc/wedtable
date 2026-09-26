"use client"

import { useRef } from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

type Table = {
  id: string
  name: string
  seats: number
  x_pct: number
  y_pct: number
  vip: boolean
}

type Guest = {
  id: string
  table_id: string | null
  companions: number
  no_show: boolean
}

function occupiedSeats(guests: Guest[], tableId: string) {
  return guests
    .filter((g) => g.table_id === tableId && !g.no_show)
    .reduce((sum, g) => sum + 1 + (g.companions ?? 0), 0)
}

function TableNode({
  table,
  occupied,
  onClick,
}: {
  table: Table
  occupied: number
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
      }}
      className={
        "w-20 h-20 rounded-full border-2 flex flex-col items-center justify-center text-xs font-medium " +
        (table.vip
          ? "border-pr bg-pr-l text-pr-d"
          : full
          ? "border-rose bg-rose/10 text-rose"
          : "border-border bg-surface text-text")
      }
    >
      <span>{table.name}</span>
      <span className="text-[10px] text-muted">
        {occupied}/{table.seats}
      </span>
    </div>
  )
}

export default function SeatingCanvas({
  tables,
  guests,
  onTableMove,
  onTableClick,
}: {
  tables: Table[]
  guests: Guest[]
  onTableMove: (id: string, x_pct: number, y_pct: number) => void
  onTableClick?: (table: Table) => void
}) {
  const canvasRef = useRef<HTMLDivElement | null>(null)

  const [, drop] = useDrop({
    accept: "TABLE",
    drop: (item: { id: string }, monitor) => {
      const offset = monitor.getClientOffset()
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!offset || !rect) return
      const x_pct = ((offset.x - rect.left) / rect.width) * 100
      const y_pct = ((offset.y - rect.top) / rect.height) * 100
      onTableMove(item.id, Math.max(0, Math.min(100, x_pct)), Math.max(0, Math.min(100, y_pct)))
    },
  })

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        ref={(node) => {
          canvasRef.current = node
          drop(node as any)
        }}
        className="relative w-full h-[600px] bg-surface border border-border rounded-card overflow-hidden"
      >
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-ink text-white text-xs px-4 py-2 rounded-card">
          Sân khấu
        </div>
        {tables.map((table) => (
          <TableNode
            key={table.id}
            table={table}
            occupied={occupiedSeats(guests, table.id)}
            onClick={() => onTableClick?.(table)}
          />
        ))}
      </div>
    </DndProvider>
  )
}
