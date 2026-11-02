"use client"

// "glass" decoration set (theme glass): stained-glass doors, leaded roses, pane borders, oval window.
// Lead/bronze lines use palette.gold, glass panes use blush/soft/sage. Drawn here in SVG/CSS.
import { useState } from "react"
import { glassTexture } from "@/lib/inviteThemes"
import { useIV } from "./Ornaments"

function useLead(): [string, string, string] {
  const IV = useIV()
  return IV.gold ?? [IV.line, IV.rose, IV.wine]
}

/** One leaded rose (about 60×60 around the origin) */
function Rose({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  const IV = useIV()
  const lead = useLead()
  const petals = [0, 72, 144, 216, 288]
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      {petals.map((a, i) => (
        <ellipse key={a} cx={16 * Math.cos((a * Math.PI) / 180)} cy={16 * Math.sin((a * Math.PI) / 180)} rx="14" ry="11" transform={`rotate(${a + 90} ${16 * Math.cos((a * Math.PI) / 180)} ${16 * Math.sin((a * Math.PI) / 180)})`} fill={i % 2 ? IV.blush : IV.soft} stroke={lead[2]} strokeWidth="1.6" />
      ))}
      <circle r="13" fill={IV.blush} stroke={lead[2]} strokeWidth="1.6" />
      <path d="M0 -8 C 8 -8 10 2 3 5 C -3 7 -7 1 -3 -3 C 0 -5 4 -2 2 1" fill="none" stroke={lead[2]} strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="-4" cy="-3" rx="3" ry="2" fill="#fff" opacity="0.45" />
    </g>
  )
}

/** Pointed leaf with a vein, pointing right from the origin */
function Leaf({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  const IV = useIV()
  const lead = useLead()
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0 C 8 -10 24 -10 34 0 C 24 10 8 10 0 0 Z" fill={IV.sage} stroke={lead[2]} strokeWidth="1.5" />
      <path d="M2 0 H30" stroke={lead[2]} strokeWidth="1" />
    </g>
  )
}

/** Cluster of roses and leaves for a corner (viewBox 0 0 160 160, anchored top-left) */
export function RoseCorner({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 160 160" className={className} style={style} aria-hidden>
      <Leaf x={60} y={40} r={20} s={1.1} />
      <Leaf x={30} y={70} r={80} s={1.1} />
      <Leaf x={95} y={18} r={-10} s={0.9} />
      <Leaf x={18} y={110} r={95} s={0.9} />
      <Rose x={34} y={34} s={1.25} />
      <Rose x={92} y={30} s={0.75} r={30} />
      <Rose x={28} y={98} s={0.8} r={-20} />
    </svg>
  )
}

/** Leaded window seal: rosette of glass petals with the initials */
export function GlassSeal({ text, size = 120 }: { text: string; size?: number }) {
  const IV = useIV()
  const lead = useLead()
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      {Array.from({ length: 10 }).map((_, i) => {
        const a = i * 36
        const cx = 50 + 32 * Math.cos((a * Math.PI) / 180)
        const cy = 50 + 32 * Math.sin((a * Math.PI) / 180)
        return <ellipse key={a} cx={cx.toFixed(2)} cy={cy.toFixed(2)} rx="12" ry="15" transform={`rotate(${a + 90} ${cx.toFixed(2)} ${cy.toFixed(2)})`} fill={i % 2 ? IV.sage : IV.blush} stroke={lead[2]} strokeWidth="1.6" />
      })}
      <circle cx="50" cy="50" r="27" fill={IV.paper} stroke={lead[2]} strokeWidth="2" />
      <circle cx="50" cy="50" r="23" fill="none" stroke={lead[1]} strokeWidth="0.8" />
      <text x="50" y="57" textAnchor="middle" fontSize="19" fontStyle="italic" fill={IV.wine} style={{ fontFamily: "var(--iv-serif)" }}>
        {text}
      </text>
    </svg>
  )
}

/** Garland replacement: lead line with leaves and a rose in the middle */
export function GlassArch({ className = "" }: { className?: string }) {
  const lead = useLead()
  return (
    <svg viewBox="0 0 300 70" className={"w-full h-auto " + className} aria-hidden>
      <path d="M10 14 Q 150 70 290 14" fill="none" stroke={lead[2]} strokeWidth="2" />
      <path d="M10 18 Q 150 74 290 18" fill="none" stroke={lead[1]} strokeWidth="0.8" />
      <Leaf x={150} y={40} r={200} s={0.9} />
      <Leaf x={150} y={40} r={-20} s={0.9} />
      <Leaf x={80} y={34} r={160} s={0.6} />
      <Leaf x={220} y={34} r={20} s={0.6} />
      <Rose x={150} y={40} s={0.7} />
    </svg>
  )
}

/** Divider: thin lead line with a small rose */
export function GlassDivider({ className = "" }: { className?: string }) {
  const lead = useLead()
  return (
    <svg viewBox="0 0 200 24" className={"w-40 h-auto mx-auto " + className} aria-hidden>
      <line x1="8" y1="12" x2="84" y2="12" stroke={lead[2]} strokeWidth="1" />
      <line x1="116" y1="12" x2="192" y2="12" stroke={lead[2]} strokeWidth="1" />
      <Leaf x={88} y={12} r={180} s={0.35} />
      <Leaf x={112} y={12} s={0.35} />
      <Rose x={100} y={12} s={0.3} />
    </svg>
  )
}

/** Stained-glass pane strip as a repeating CSS background */
function paneBorder(IV: ReturnType<typeof useIV>, lead: [string, string, string]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><rect width="28" height="28" fill="${IV.blush}"/><polygon points="14,1 27,14 14,27 1,14" fill="${IV.soft}" stroke="${lead[2]}" stroke-width="1.4"/><circle cx="14" cy="14" r="3" fill="${IV.sage}" stroke="${lead[2]}" stroke-width="1"/><rect x="0.5" y="0.5" width="27" height="27" fill="none" stroke="${lead[2]}" stroke-width="1"/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/** Card framed by a border of glass panes */
export function GlassFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const IV = useIV()
  const lead = useLead()
  return (
    <div className={"p-[12px] " + className} style={{ backgroundImage: paneBorder(IV, lead), backgroundSize: "28px 28px", border: `2px solid ${lead[2]}`, borderRadius: 6 }}>
      <div className="p-6" style={{ background: IV.paper, border: `2px solid ${lead[2]}`, borderRadius: 3 }}>
        {children}
      </div>
    </div>
  )
}

/** Gothic arch of lead lines over the hero (stretches with the section) */
export function LeadArch() {
  const lead = useLead()
  const v = { vectorEffect: "non-scaling-stroke" as const }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
      <path d="M5 100 V34 Q5 10 50 4 Q95 10 95 34 V100" fill="none" stroke={lead[2]} strokeWidth="3" style={v} />
      <path d="M7.5 100 V35 Q7.5 13 50 7 Q92.5 13 92.5 35 V100" fill="none" stroke={lead[1]} strokeWidth="1" style={v} />
    </svg>
  )
}

/** Oval window with a leaded border of roses; shows a photo inside */
export function OvalWindow({ photo, children }: { photo?: string; children?: React.ReactNode }) {
  const IV = useIV()
  const lead = useLead()
  return (
    <div className="relative mx-auto w-[72%] aspect-[3/4]">
      <div className="absolute inset-0 rounded-[50%]" style={{ background: glassTexture(IV), border: `3px solid ${lead[2]}` }} />
      <div className="absolute inset-[9%] rounded-[50%] overflow-hidden flex items-center justify-center" style={{ border: `3px solid ${lead[2]}`, background: IV.paper }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="w-full h-full object-cover" />
        ) : (
          children
        )}
      </div>
      <RoseCorner className="absolute -top-[6%] -left-[10%] w-[46%]" />
      <RoseCorner className="absolute -bottom-[6%] -right-[10%] w-[46%]" style={{ transform: "rotate(180deg)" }} />
    </div>
  )
}

/** Two frosted stained-glass doors that swing open */
export function DoorsIntro({ initials, onOpened }: { initials: string; onOpened: () => void }) {
  const IV = useIV()
  const lead = useLead()
  const [opening, setOpening] = useState(false)

  function open() {
    if (opening) return
    setOpening(true)
    setTimeout(onOpened, 1600)
  }

  const door = (side: "left" | "right") => (
    <div
      className="absolute inset-y-0 w-1/2 overflow-hidden transition-transform duration-[1500ms] ease-in-out motion-reduce:duration-0"
      style={{
        [side]: 0,
        background: glassTexture(IV),
        transformOrigin: side,
        transform: opening ? `rotateY(${side === "left" ? 105 : -105}deg)` : "none",
        borderLeft: side === "right" ? `3px solid ${lead[2]}` : undefined,
        borderRight: side === "left" ? `3px solid ${lead[2]}` : undefined,
        boxShadow: side === "left" ? `inset -2px 0 0 ${lead[1]}` : `inset 2px 0 0 ${lead[1]}`,
      }}
    >
      <RoseCorner className="absolute w-[85%] max-w-[240px]" style={side === "left" ? { top: -12, left: -12 } : { top: -12, right: -12, transform: "scaleX(-1)" }} />
      <RoseCorner className="absolute w-[85%] max-w-[240px]" style={side === "left" ? { bottom: -12, left: -12, transform: "scaleY(-1)" } : { bottom: -12, right: -12, transform: "scale(-1)" }} />
      <div className="absolute inset-3 pointer-events-none" style={{ border: `1px solid ${lead[1]}`, opacity: 0.6 }} />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 cursor-pointer select-none overflow-hidden" style={{ background: IV.deep ?? IV.wine, perspective: 1600 }} onClick={open} role="button" aria-label="Mở thiệp mời">
      {door("left")}
      {door("right")}
      <div className={"absolute inset-0 flex flex-col items-center justify-center gap-3 transition-all duration-500 " + (opening ? "opacity-0 scale-90" : "")}>
        <div className="drop-shadow-md animate-[ivPulse_2.6s_ease-in-out_infinite]">
          <GlassSeal text={initials} size={132} />
        </div>
        <p className="text-sm tracking-[0.25em] uppercase px-3 py-1 rounded" style={{ color: IV.wine, background: "rgba(255,255,255,0.55)", fontFamily: "var(--iv-sans)" }}>
          Chạm để mở thiệp
        </p>
      </div>
      <style>{`@keyframes ivPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}`}</style>
    </div>
  )
}
