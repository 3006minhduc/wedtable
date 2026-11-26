"use client"

// Seat picker on the invite: the hall map (real proportions, scrolls sideways on big halls)
// or a plain list, which is easier on small phones. VIP tables are reserved: only a guest the
// couple already put there can pick them (the database enforces the same rule in confirm_seat).
import { useEffect, useState } from "react"
import FloorLayers from "@/components/seating/FloorLayers"
import { hallOf } from "@/lib/hall"
import { useIV } from "./Ornaments"

type Props = { floors: any[]; value: string; companions: number; onChange: (id: string) => void; mine?: string | null }

const natural = (a: any, b: any) => String(a.name).localeCompare(String(b.name), "vi", { numeric: true, sensitivity: "base" })
const shortName = (n: string) => String(n).replace(/^bàn\s+/i, "")

export default function TablePicker({ floors, value, companions, onChange, mine }: Props) {
  const IV = useIV()
  const initial = Math.max(0, floors.findIndex((f) => (f.tables ?? []).some((t: any) => t.id === value)))
  const [floorIdx, setFloorIdx] = useState(initial)
  const [mode, setMode] = useState<"map" | "list">("map")
  // narrow phones start on the list: the map's tables get too small to read
  useEffect(() => {
    if (window.innerWidth < 360) setMode("list")
  }, [])
  const floor = floors[Math.min(floorIdx, floors.length - 1)]
  if (!floor) return null
  const hall = hallOf(floor)

  const state = (t: any) => {
    const left = Math.max(0, t.seats - (t.used ?? 0))
    const selected = t.id === value
    const reserved = !!t.vip && t.id !== mine
    const full = left < 1 + companions
    return { left, selected, reserved, full, blocked: !selected && (reserved || full) }
  }
  const note = (s: ReturnType<typeof state>) => (s.reserved ? "dành riêng" : s.full && !s.selected ? "đã đủ chỗ" : `còn ${s.left} chỗ`)
  const look = (t: any, s: ReturnType<typeof state>): React.CSSProperties =>
    s.selected
      ? { background: IV.wine, borderColor: IV.wine, color: "#fff" }
      : s.reserved
      ? { background: "#F6EFE3", borderColor: "#D9C49A", color: "#8A7550", borderStyle: "dashed" }
      : s.full
      ? { background: "#fff", borderColor: IV.line, color: IV.muted, opacity: 0.5 }
      : { background: "#fff", borderColor: IV.sage, color: IV.ink }

  const seg = (on: boolean): React.CSSProperties => (on ? { background: IV.wine, color: "#fff", borderColor: IV.wine } : { background: "#fff", color: IV.ink, borderColor: IV.line })

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="inline-flex rounded-lg border overflow-hidden" role="tablist" style={{ borderColor: IV.line }}>
          {(["map", "list"] as const).map((m) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className="h-10 px-4 text-[14px] border-0" style={seg(mode === m)}>
              {m === "map" ? "Sơ đồ" : "Danh sách"}
            </button>
          ))}
        </div>
        {floors.length > 1 && mode === "map" && (
          <div className="flex gap-1.5 flex-wrap">
            {floors.map((f, i) => (
              <button key={f.id} type="button" onClick={() => setFloorIdx(i)} className="rounded-lg px-3 h-10 text-[14px] border" style={seg(i === floorIdx)}>
                {f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === "map" ? (
        <>
          <div
            ref={(el) => {
              if (el && !el.dataset.centred) {
                el.dataset.centred = "1"
                el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
              }
            }}
            className="w-full rounded-2xl overflow-auto border"
            style={{ background: IV.paper, borderColor: IV.line }}
          >
            <div className="relative" style={{ width: `max(100%, ${hall.w * 18}px)`, aspectRatio: `${hall.w} / ${hall.h}`, color: IV.wine }}>
              <FloorLayers floor={floor} theme="paper" />
              {(floor.tables ?? []).map((t: any) => {
                const s = state(t)
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={s.blocked}
                    aria-pressed={s.selected}
                    aria-label={`${t.name}${t.vip ? ", bàn VIP" : ""}, ${note(s)}`}
                    onClick={() => onChange(t.id)}
                    style={{ left: `${t.x_pct}%`, top: `${t.y_pct}%`, transform: `translate(-50%, -50%)${s.selected ? " scale(1.08)" : ""}`, ...look(t, s) }}
                    className={
                      "absolute border-[1.5px] flex flex-col items-center justify-center leading-tight shadow-sm transition-transform active:scale-95 " +
                      (t.shape === "rect" ? "w-[84px] h-11 rounded-xl " : "w-14 h-14 rounded-full ")
                    }
                  >
                    <span className={"max-w-[52px] truncate text-[13px] " + (s.selected ? "font-semibold" : "font-medium")}>{shortName(t.name)}</span>
                    <span className="text-[10px] opacity-85">{s.reserved ? "VIP" : s.full && !s.selected ? "đầy" : `còn ${s.left}`}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <p className="text-[13px] mt-2 leading-snug" style={{ color: IV.muted }}>
            Chạm vào bàn để chọn. Bàn mờ đã đủ chỗ cho nhóm của bạn, bàn viền đứt dành riêng cho gia đình.{hall.w > 18 ? " Vuốt ngang để xem hết sơ đồ." : ""}
          </p>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          {floors.map((f) => {
            const tables = [...(f.tables ?? [])].sort(natural)
            if (!tables.length) return null
            return (
              <div key={f.id}>
                {floors.length > 1 && (
                  <p className="text-[13px] mb-1.5" style={{ color: IV.muted }}>
                    {f.name}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {tables.map((t: any) => {
                    const s = state(t)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={s.blocked}
                        aria-pressed={s.selected}
                        onClick={() => onChange(t.id)}
                        className="min-h-[56px] rounded-xl border-[1.5px] px-3 py-2 text-left flex flex-col justify-center"
                        style={look(t, s)}
                      >
                        <span className="text-[15px] leading-tight font-medium">{t.name}</span>
                        <span className="text-[12px] mt-0.5 opacity-85">{note(s)}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
