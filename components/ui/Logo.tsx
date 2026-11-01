// WedTable logo (approved 2026-11-02): round banquet table seen from above,
// 8 pen-stroke chairs, a two-layer camellia in the middle; wordmark "Wed" + "Table"
// both in italic Newsreader ("Wed" in brand red).

const PETAL = "M0,-1 C-4.6,-3.4 -5,-10 0,-12 C5,-10 4.6,-3.4 0,-1 Z"
const CHAIR = "M-5,-24 Q0,-26.8 5,-24"
const ANGLES = [0, 72, 144, 216, 288]

/** The round-table mark on its own. `light` = for dark/photo backgrounds. */
export function LogoMark({ size = 28, light = false, className = "" }: { size?: number; light?: boolean; className?: string }) {
  const line = light ? "rgb(var(--brand-soft-rgb))" : "rgb(var(--brand-rgb))"
  const petalFill = light ? "rgb(var(--brand-rgb) / 0.35)" : "rgb(var(--brand-soft-rgb))"
  const innerFill = light ? "rgb(var(--ink-rgb))" : "rgb(var(--surface-rgb))"
  return (
    <svg width={size} height={size} viewBox="-32 -32 64 64" aria-hidden className={"shrink-0 " + className}>
      <circle r="17" fill="none" stroke={line} strokeWidth="1" />
      <g fill="none" stroke={line} strokeWidth="1.7" strokeLinecap="round">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <path key={a} d={CHAIR} transform={`rotate(${a})`} />
        ))}
      </g>
      <g stroke={line} strokeWidth="0.9" fill={petalFill} strokeLinejoin="round">
        {ANGLES.map((a) => (
          <path key={a} d={PETAL} transform={`rotate(${a})`} />
        ))}
      </g>
      <g transform="rotate(36) scale(0.58)" stroke={line} strokeWidth="1.3" fill={innerFill} strokeLinejoin="round">
        {ANGLES.map((a) => (
          <path key={a} d={PETAL} transform={`rotate(${a})`} />
        ))}
      </g>
      <circle r="1.6" fill={line} />
    </svg>
  )
}

/** Wordmark: both words italic so they flow without touching */
export function LogoWordmark({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <span className={"font-serif italic font-light leading-none tracking-[-0.012em] whitespace-nowrap " + className}>
      <span className={light ? "text-brand-soft" : "text-brand"}>Wed</span>
      <span className={light ? "text-white" : "text-text"} style={{ marginLeft: "0.04em" }}>
        Table
      </span>
    </span>
  )
}

/** Horizontal logo (default) or stacked logo with tagline */
export default function Logo({
  className = "",
  light = false,
  stacked = false,
  size,
}: {
  className?: string
  light?: boolean
  stacked?: boolean
  size?: number
}) {
  if (stacked) {
    return (
      <span className={"inline-flex flex-col items-center gap-2.5 " + className}>
        <LogoMark size={size ?? 72} light={light} />
        <LogoWordmark light={light} className="text-[34px]" />
        <span className={"text-xs " + (light ? "text-white/70" : "text-muted")}>Mỗi vị khách, một chỗ ngồi đúng</span>
      </span>
    )
  }
  return (
    <span className={"inline-flex items-center gap-2 " + className}>
      <LogoMark size={size ?? 30} light={light} />
      <LogoWordmark light={light} className="text-[23px]" />
    </span>
  )
}
