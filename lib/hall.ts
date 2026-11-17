// Hall (floor) size in metres. Positions stay in % of the hall; the canvas is drawn at a fixed
// scale so tables keep their real size and a bigger hall fits more tables.

export const PX_PER_M = 32 // editor scale at 100% zoom (a round table ≈ 2.25 m)
export const HALL_MIN = 6
export const HALL_MAX = 150
export const DEFAULT_HALL = { w: 24, h: 16 }

export const HALL_PRESETS = [
  { label: "Nhỏ", w: 18, h: 12 },
  { label: "Vừa", w: 24, h: 16 },
  { label: "Lớn", w: 32, h: 20 },
  { label: "Rất lớn", w: 45, h: 28 },
]

export function hallOf(floor: any) {
  const w = Number(floor?.hall_w)
  const h = Number(floor?.hall_h)
  return { w: w > 0 ? w : DEFAULT_HALL.w, h: h > 0 ? h : DEFAULT_HALL.h }
}

export const clampHall = (v: number) => Math.round(Math.min(HALL_MAX, Math.max(HALL_MIN, v)) * 10) / 10

/** Rough count of 10-seat round tables that fit, leaving room for a stage and aisles (≈ 3.2 m per table) */
export function estimateTables(w: number, h: number) {
  const cols = Math.floor((w - 2) / 3.2)
  const rows = Math.floor((h - 5) / 3.2) // ~5 m kept for the stage
  return Math.max(0, cols * rows)
}

/**
 * Sample floor plan: a stage across the top and round tables in a centred grid, ~3.2 m apart,
 * with a centre aisle when there are 4+ columns. Positions are % of the hall.
 */
export function sampleLayout(count: number, w: number, h: number) {
  const GAP = 3.2
  const top = 5.5 // metres kept for the stage
  const maxCols = Math.max(1, Math.floor((w - 2) / GAP))
  let cols = Math.min(maxCols, Math.max(1, Math.ceil(Math.sqrt((count * (w - 2)) / Math.max(1, h - top)))))
  cols = Math.min(cols, count)
  const rows = Math.max(1, Math.ceil(count / cols))
  const aisle = cols >= 4 ? 1.4 : 0
  const sx = Math.min(GAP, (w - 2 - aisle) / cols)
  const sy = Math.min(GAP, (h - top - 1.2) / rows)
  const width = sx * cols + aisle
  const x0 = (w - width) / 2 + sx / 2
  const pct = (v: number, of: number) => Math.round((v / of) * 10000) / 100
  const positions: { x_pct: number; y_pct: number }[] = []
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols)
    const c = i % cols
    const x = x0 + c * sx + (aisle && c >= cols / 2 ? aisle : 0)
    const y = top + sy / 2 + r * sy
    positions.push({ x_pct: Math.min(98, Math.max(2, pct(x, w))), y_pct: Math.min(98, Math.max(2, pct(y, h))) })
  }
  const stage = { id: "stage-" + Date.now(), type: "stage", label: "Sân khấu", x_pct: 50, y_pct: pct(2.2, h), w_pct: Math.min(50, pct(10, w)), h_pct: pct(2.6, h) }
  return { positions, stage, fits: count <= estimateTables(w, h) }
}
