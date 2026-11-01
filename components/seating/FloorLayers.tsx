import Icon from "@/components/ui/Icon"
// Read-only background + layout blocks (stage / path / decor) for public views.
// Uses the same % coordinates as SeatingCanvas, so positions match the dashboard.

type Block = { id: string; type: string; label: string; x_pct: number; y_pct: number; w_pct: number; h_pct: number }

const ICON: Record<string, string> = { stage: "stage", path: "aisle", decor: "zone" }

// Brand tokens (DESIGN.md §2)
const THEME = {
  dark: {
    stage: "bg-brand/40 border-brand text-white",
    path: "bg-white/5 border-white/30 border-dashed text-white/70",
    decor: "bg-success/20 border-success/60 text-white/85",
    fallback: "bg-white/10 text-white",
  },
  light: {
    stage: "bg-ink text-white border-ink",
    path: "bg-faint/10 border-faint/60 border-dashed text-muted",
    decor: "bg-success/10 border-success/40 text-text",
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
            <Icon name={ICON[b.type] ?? "zone"} size={14} />
            <span className="truncate">{b.label}</span>
          </div>
        ))
      )}
    </>
  )
}
