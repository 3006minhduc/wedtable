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
