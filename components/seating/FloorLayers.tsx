// Read-only background + layout blocks (stage / path / decor) for public views.
// Uses the same % coordinates as SeatingCanvas, so positions match the dashboard.

type Block = { id: string; type: string; label: string; x_pct: number; y_pct: number; w_pct: number; h_pct: number }

const ICON: Record<string, string> = { stage: "🎤", path: "↕", decor: "✦" }

// Hex literals (= --pr, --sage, --muted): Tailwind can't add /opacity to var()-based theme colors.
const THEME = {
  dark: {
    stage: "bg-[#C8A24A]/25 border-[#C8A24A]/60 text-white",
    path: "bg-white/5 border-white/30 border-dashed text-white/70",
    decor: "bg-[#52A56E]/20 border-[#52A56E]/50 text-white/80",
    fallback: "bg-white/10 text-white",
  },
  light: {
    stage: "bg-ink text-white border-ink",
    path: "bg-[#6B7280]/10 border-[#6B7280]/50 border-dashed text-muted",
    decor: "bg-[#52A56E]/15 border-[#52A56E]/40 text-text",
    fallback: "bg-ink text-white",
  },
}

export default function FloorLayers({ floor, theme = "light" }: { floor: any; theme?: "light" | "dark" }) {
  const blocks: Block[] = Array.isArray(floor?.elements) ? floor.elements : []
  const t = THEME[theme]

  return (
    <>
      {floor?.background_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={floor.background_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: Number(floor.background_opacity ?? 0.4) }}
        />
      )}

      {blocks.length === 0 ? (
        // Older floors without custom blocks: keep the default stage label
        <div className={"absolute top-2 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs px-3 py-1 rounded-card pointer-events-none " + t.fallback}>
          Sân khấu
        </div>
      ) : (
        blocks.map((b) => (
          <div
            key={b.id}
            className={
              "absolute flex items-center justify-center gap-1 rounded-card border-2 text-[10px] sm:text-xs font-medium pointer-events-none overflow-hidden " +
              ((t as any)[b.type] ?? t.decor)
            }
            style={{
              left: `${b.x_pct}%`,
              top: `${b.y_pct}%`,
              width: `${b.w_pct}%`,
              height: `${b.h_pct}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span>{ICON[b.type] ?? "▭"}</span>
            <span className="truncate">{b.label}</span>
          </div>
        ))
      )}
    </>
  )
}
