export type TemplateKey = "custom" | "circle" | "rows" | "u-shape"

export const TEMPLATES: { key: TemplateKey; label: string; desc: string }[] = [
  { key: "custom", label: "Tự do", desc: "Tự kéo thả, không sắp xếp lại." },
  { key: "rows", label: "Xếp hàng ngang", desc: "Bàn xếp thành các hàng đều nhau." },
  { key: "circle", label: "Tỏa tròn quanh sân khấu", desc: "Bàn tỏa thành vòng cung trước sân khấu." },
  { key: "u-shape", label: "Chữ U quanh sân khấu", desc: "Bàn xếp hai bên và phía cuối, chừa lối đi giữa." },
]

export function stageElement(): any {
  return { id: "stage-" + Date.now(), type: "stage", label: "Sân khấu", x_pct: 50, y_pct: 10, w_pct: 34, h_pct: 11 }
}

const clamp = (v: number, min = 6, max = 94) => Math.min(max, Math.max(min, v))

function rowsLayout(n: number) {
  const perRow = Math.max(1, Math.ceil(Math.sqrt(n)))
  const rows = Math.ceil(n / perRow)
  const positions: { x_pct: number; y_pct: number }[] = []
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / perRow)
    const rowStart = r * perRow
    const countThisRow = Math.min(perRow, n - rowStart)
    const c = i - rowStart
    const x = 12 + (76 / Math.max(1, countThisRow)) * (c + 0.5)
    const y = 28 + (64 / Math.max(1, rows)) * (r + 0.5)
    positions.push({ x_pct: clamp(x), y_pct: clamp(y) })
  }
  return positions
}

function circleLayout(n: number) {
  const positions: { x_pct: number; y_pct: number }[] = []
  const perRing = 8
  let idx = 0
  let ring = 0
  while (idx < n) {
    const remain = n - idx
    const countThisRing = Math.min(perRing, remain)
    const radius = 30 + ring * 20
    for (let j = 0; j < countThisRing; j++) {
      const t = countThisRing === 1 ? 0.5 : j / (countThisRing - 1)
      const angle = Math.PI * (0.08 + 0.84 * t)
      const x = 50 + radius * Math.cos(angle)
      const y = 24 + radius * 0.75 * Math.sin(angle)
      positions.push({ x_pct: clamp(x), y_pct: clamp(y) })
      idx++
    }
    ring++
  }
  return positions
}

function uShapeLayout(n: number) {
  const positions: { x_pct: number; y_pct: number }[] = []
  const side = Math.round(n * 0.28)
  const leftCount = side
  const rightCount = side
  const bottomCount = Math.max(0, n - leftCount - rightCount)
  for (let i = 0; i < leftCount; i++) positions.push({ x_pct: 12, y_pct: clamp(28 + (58 / Math.max(1, leftCount)) * (i + 0.5)) })
  for (let i = 0; i < bottomCount; i++) positions.push({ x_pct: clamp(16 + (68 / Math.max(1, bottomCount)) * (i + 0.5)), y_pct: 88 })
  for (let i = 0; i < rightCount; i++) positions.push({ x_pct: 88, y_pct: clamp(28 + (58 / Math.max(1, rightCount)) * (i + 0.5)) })
  return positions
}

export function computeLayout(key: TemplateKey, tableIds: string[]) {
  const n = tableIds.length
  let coords: { x_pct: number; y_pct: number }[] = []
  if (key === "rows") coords = rowsLayout(n)
  else if (key === "circle") coords = circleLayout(n)
  else if (key === "u-shape") coords = uShapeLayout(n)
  else return { positions: [] as { id: string; x_pct: number; y_pct: number }[] }

  return { positions: tableIds.map((id, i) => ({ id, ...coords[i] })) }
}
