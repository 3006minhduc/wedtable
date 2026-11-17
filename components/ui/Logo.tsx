// WedTable logo (2026-11-18): bride and groom at the banquet table, white on a brand-red rounded square.
// The W of "Wed" is the couple (each V a person, a round head above), the middle peak of the W is the
// table's legs with a short bar on top = the T of "Table". Wordmark in Quicksand (rounded, has Vietnamese).
// Master SVGs: public/brand/, design notes and concepts: docs/logo/.

/** Couple + table drawn on the 256 grid (strokes, round caps/joins) */
export function CoupleGlyph({ color = "#fff" }: { color?: string }) {
  return (
    <>
      <g fill="none" stroke={color} strokeWidth="22" strokeLinecap="round" strokeLinejoin="round">
        <path d="M36 104 L78 210 L128 126 L178 210 L220 104" />
        <path d="M100 118 L156 118" />
      </g>
      <g fill={color}>
        <circle cx="78" cy="72" r="21" />
        <circle cx="178" cy="72" r="21" />
      </g>
    </>
  )
}

/** The mark on its own: white couple on a brand-red rounded square */
export function LogoMark({ size = 28, className = "" }: { size?: number; light?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" aria-hidden className={"shrink-0 " + className}>
      <rect width="256" height="256" rx="60" fill="rgb(var(--brand-rgb))" />
      <g transform="translate(128 132) scale(0.72) translate(-128 -140)">
        <CoupleGlyph />
      </g>
    </svg>
  )
}

/** Wordmark: rounded Quicksand, "Wed" in brand red */
export function LogoWordmark({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <span className={"font-logo font-bold leading-none tracking-[-0.02em] whitespace-nowrap " + className}>
      <span className={light ? "text-brand-soft" : "text-brand"}>Wed</span>
      <span className={light ? "text-white" : "text-text"}>Table</span>
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
      <span className={"inline-flex flex-col items-center gap-3 " + className}>
        <LogoMark size={size ?? 72} />
        <LogoWordmark light={light} className="text-[34px]" />
        <span className={"text-xs " + (light ? "text-white/70" : "text-muted")}>Mỗi vị khách, một chỗ ngồi đúng</span>
      </span>
    )
  }
  return (
    <span className={"inline-flex items-center gap-2 " + className}>
      <LogoMark size={size ?? 30} />
      <LogoWordmark light={light} className="text-[22px]" />
    </span>
  )
}
