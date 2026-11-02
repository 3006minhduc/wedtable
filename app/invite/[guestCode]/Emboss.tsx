"use client"

// "emboss" decoration set (theme mauve): raised-paper roses and frames, mauve wax seal, satin ribbon that unties.
// The raised look = shapes in the paper color + a light shadow top-left and a dark shadow bottom-right (derived from the palette).
import { useEffect, useState } from "react"
import { useIV } from "./Ornaments"

function useTones(): [string, string, string] {
  const IV = useIV()
  // highlight, mid, shadow — derived from the palette so every color set can be embossed
  return ["rgba(255,255,255,0.8)", IV.line, IV.muted + "99"]
}

/** CSS filter that makes same-color shapes look pressed up out of the paper */
export function useRaised(depth = 1): React.CSSProperties {
  const t = useTones()
  return { filter: `drop-shadow(${-depth}px ${-depth}px 0 ${t[0]}) drop-shadow(${depth * 1.2}px ${depth * 1.6}px ${depth}px ${t[2]})` }
}

/** Monochrome rose for embossing (about 60×60 around the origin) */
function ERose({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  const IV = useIV()
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => {
        const cx = 15 * Math.cos((a * Math.PI) / 180)
        const cy = 15 * Math.sin((a * Math.PI) / 180)
        return <ellipse key={a} cx={cx.toFixed(2)} cy={cy.toFixed(2)} rx="13" ry="10" transform={`rotate(${a + 90} ${cx.toFixed(2)} ${cy.toFixed(2)})`} fill={IV.paper} stroke={IV.line} strokeWidth="0.8" />
      })}
      <circle r="12" fill={IV.paper} stroke={IV.line} strokeWidth="0.8" />
      <path d="M0 -7 C 7 -7 9 2 3 5 C -3 7 -6 1 -3 -3 C 0 -5 4 -2 2 1" fill="none" stroke={IV.line} strokeWidth="1.2" strokeLinecap="round" />
    </g>
  )
}

function ELeaf({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  const IV = useIV()
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0 C 8 -10 26 -10 38 0 C 26 10 8 10 0 0 Z" fill={IV.paper} stroke={IV.line} strokeWidth="0.8" />
      <path d="M3 0 H34 M12 0 L18 -4 M20 0 L26 -4 M12 0 L18 4 M20 0 L26 4" stroke={IV.line} strokeWidth="0.7" fill="none" />
    </g>
  )
}

/** Raised rose cluster for a corner (viewBox 0 0 160 160, anchored top-left) */
export function ERoseCorner({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  const raised = useRaised(1)
  return (
    <svg viewBox="0 0 160 160" className={className} style={{ ...raised, ...style }} aria-hidden>
      <ELeaf x={58} y={42} r={18} s={1.1} />
      <ELeaf x={30} y={66} r={82} s={1.1} />
      <ELeaf x={98} y={20} r={-8} s={0.85} />
      <ELeaf x={20} y={108} r={96} s={0.85} />
      <ERose x={34} y={34} s={1.25} />
      <ERose x={94} y={30} s={0.72} r={30} />
      <ERose x={28} y={100} s={0.78} r={-20} />
    </svg>
  )
}

/** Raised vine with a rose, replaces the garland */
export function EmbossVine({ className = "" }: { className?: string }) {
  const IV = useIV()
  const raised = useRaised(1)
  return (
    <svg viewBox="0 0 300 70" className={"w-full h-auto " + className} style={raised} aria-hidden>
      <path d="M8 20 C 70 60, 110 10, 150 40 C 190 10, 230 60, 292 20" fill="none" stroke={IV.paper} strokeWidth="3" />
      <ELeaf x={60} y={38} r={-30} s={0.6} />
      <ELeaf x={100} y={30} r={200} s={0.6} />
      <ELeaf x={200} y={30} r={-20} s={0.6} />
      <ELeaf x={240} y={38} r={210} s={0.6} />
      <ERose x={150} y={38} s={0.75} />
    </svg>
  )
}

/** Raised line with a small rose */
export function EmbossDivider({ className = "" }: { className?: string }) {
  const IV = useIV()
  const raised = useRaised(0.8)
  return (
    <svg viewBox="0 0 200 24" className={"w-40 h-auto mx-auto " + className} style={raised} aria-hidden>
      <line x1="8" y1="12" x2="86" y2="12" stroke={IV.paper} strokeWidth="2" />
      <line x1="114" y1="12" x2="192" y2="12" stroke={IV.paper} strokeWidth="2" />
      <ERose x={100} y={12} s={0.32} />
    </svg>
  )
}

/** Card pressed into the paper with a raised inner border and roses at top and bottom */
export function EmbossFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const IV = useIV()
  const t = useTones()
  return (
    <div className={"relative px-7 py-9 rounded-[22px] " + className} style={{ background: IV.paper, boxShadow: `inset 2px 3px 4px ${t[2]}, inset -2px -2px 3px ${t[0]}` }}>
      <div className="absolute inset-[9px] rounded-[16px] pointer-events-none" style={{ boxShadow: `1.5px 2px 2px ${t[2]}, -1px -1px 1px ${t[0]}, inset 1.5px 2px 2px ${t[2]}, inset -1px -1px 1px ${t[0]}` }} />
      <ERoseCorner className="absolute -top-5 left-1/2 -translate-x-1/2 w-14" />
      <ERoseCorner className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-14" style={{ transform: "translateX(-50%) rotate(180deg)" }} />
      <div className="relative">{children}</div>
    </div>
  )
}

/** Mauve wax seal with raised initials */
export function EmbossSeal({ text, size = 120 }: { text: string; size?: number }) {
  const IV = useIV()
  const t = useTones()
  const pts: string[] = []
  for (let i = 0; i <= 360; i += 3) {
    const a = (i * Math.PI) / 180
    const rr = 46 + 2.6 * Math.cos(a * 9) + 1.4 * Math.sin(a * 4)
    pts.push(`${(50 + rr * Math.cos(a)).toFixed(2)},${(50 + rr * Math.sin(a)).toFixed(2)}`)
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <polygon points={pts.join(" ")} fill={IV.sage} />
      <circle cx="50" cy="50" r="35" fill={IV.sage} style={{ filter: `drop-shadow(1px 1.5px 1px ${t[2]}) drop-shadow(-0.8px -0.8px 0 ${t[0]})` }} />
      <circle cx="50" cy="50" r="31" fill="none" stroke={IV.blush} strokeWidth="0.8" />
      <text x="50" y="58" textAnchor="middle" fontSize="22" fontStyle="italic" fill={IV.blush} style={{ fontFamily: "var(--iv-serif)", filter: `drop-shadow(0.8px 1px 0.6px ${t[2]})` }}>
        {text}
      </text>
    </svg>
  )
}

/** Satin ribbon with a bow tied across the hero; slides away once `start` turns true */
export function Ribbon({ start }: { start: boolean }) {
  const IV = useIV()
  const [off, setOff] = useState(false)
  useEffect(() => {
    if (!start) return
    const t = setTimeout(() => setOff(true), 500)
    return () => clearTimeout(t)
  }, [start])
  const satin = `linear-gradient(180deg, ${IV.blush} 0%, ${IV.paper} 35%, ${IV.sage} 60%, ${IV.blush} 100%)`
  const satinV = `linear-gradient(90deg, ${IV.blush} 0%, ${IV.paper} 35%, ${IV.sage} 60%, ${IV.blush} 100%)`
  const ease = "transition-all duration-[1400ms] ease-in-out motion-reduce:duration-0"
  return (
    <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden" aria-hidden>
      <div className={"absolute left-0 right-0 top-[46%] h-9 shadow-md " + ease} style={{ background: satin, transform: off ? "translateX(105%)" : "none", opacity: off ? 0 : 1 }} />
      <div className={"absolute top-0 bottom-0 left-1/2 -ml-[18px] w-9 shadow-md " + ease} style={{ background: satinV, transform: off ? "translateY(-105%)" : "none", opacity: off ? 0 : 1 }} />
      <svg viewBox="0 0 160 120" className={"absolute left-1/2 top-[46%] w-40 -translate-x-1/2 -translate-y-[38%] " + ease} style={{ transform: `translate(-50%, -38%) scale(${off ? 0.2 : 1}) rotate(${off ? 40 : 0}deg)`, opacity: off ? 0 : 1, filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.18))" }}>
        <defs>
          <linearGradient id="wt-satin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={IV.paper} />
            <stop offset="0.5" stopColor={IV.blush} />
            <stop offset="1" stopColor={IV.sage} />
          </linearGradient>
        </defs>
        <path d="M80 50 C 40 10, 6 22, 14 48 C 20 70, 56 64, 80 50 Z" fill="url(#wt-satin)" stroke={IV.sage} strokeWidth="1" />
        <path d="M80 50 C 120 10, 154 22, 146 48 C 140 70, 104 64, 80 50 Z" fill="url(#wt-satin)" stroke={IV.sage} strokeWidth="1" />
        <path d="M74 54 C 64 80, 52 100, 40 116 L 54 112 L 58 120 C 70 100, 78 80, 80 56 Z" fill="url(#wt-satin)" stroke={IV.sage} strokeWidth="1" />
        <path d="M86 54 C 96 80, 108 100, 120 116 L 106 112 L 102 120 C 90 100, 82 80, 80 56 Z" fill="url(#wt-satin)" stroke={IV.sage} strokeWidth="1" />
        <ellipse cx="80" cy="51" rx="11" ry="9" fill="url(#wt-satin)" stroke={IV.sage} strokeWidth="1" />
      </svg>
    </div>
  )
}
