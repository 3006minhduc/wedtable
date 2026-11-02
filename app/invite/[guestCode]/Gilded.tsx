"use client"

// "gilded" decoration set (theme bordeaux): gold baroque frame, wax-sealed envelope intro, photobooth strip.
// All drawn here in SVG/CSS, colors come from the palette (lib/inviteThemes.ts).
import { useEffect, useId, useState } from "react"
import { useIV } from "./Ornaments"

function useGold(): [string, string, string] {
  const IV = useIV()
  return IV.gold ?? [IV.blush, IV.rose, IV.wine]
}

function useGradId() {
  return "g" + useId().replace(/[^a-zA-Z0-9]/g, "")
}

function GoldDefs({ id }: { id: string }) {
  const g = useGold()
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={g[2]} />
        <stop offset="0.3" stopColor={g[1]} />
        <stop offset="0.5" stopColor={g[0]} />
        <stop offset="0.7" stopColor={g[1]} />
        <stop offset="1" stopColor={g[2]} />
      </linearGradient>
    </defs>
  )
}

/** Rect with concave (scooped) corners, the classic cartouche outline */
function scoop(x: number, y: number, w: number, h: number, r: number) {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 0 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 0 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 0 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 0 ${x + r} ${y}Z`
}

/** One C-scroll with an acanthus leaf, drawn pointing right from the origin */
function Scroll({ x, y, r = 0, s = 1, flip = false, fill }: { x: number; y: number; r?: number; s?: number; flip?: boolean; fill: string }) {
  const g = useGold()
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${flip ? -s : s} ${s})`}>
      <path d="M0 0 C 2 -9, 12 -14, 22 -10 C 30 -6, 30 4, 23 6 C 17 8, 13 2, 17 -1 C 19 -3, 22 -1, 21 1" fill="none" stroke={fill} strokeWidth="3" strokeLinecap="round" />
      <path d="M0 0 C 2 -9, 12 -14, 22 -10 C 30 -6, 30 4, 23 6 C 17 8, 13 2, 17 -1" fill="none" stroke={g[2]} strokeWidth="0.6" opacity="0.7" />
      <path d="M2 2 C 8 10, 18 12, 26 10 C 18 6, 10 4, 2 2 Z" fill={fill} stroke={g[2]} strokeWidth="0.4" />
    </g>
  )
}

/** Shell / fan used as top and bottom crest */
function Shell({ x, y, s = 1, down = false, fill }: { x: number; y: number; s?: number; down?: boolean; fill: string }) {
  const g = useGold()
  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${down ? -s : s})`}>
      {[-60, -40, -20, 0, 20, 40, 60].map((a) => (
        <ellipse key={a} cx="0" cy="-12" rx="4.2" ry="13" transform={`rotate(${a} 0 0)`} fill={fill} stroke={g[2]} strokeWidth="0.5" />
      ))}
      <circle cx="0" cy="0" r="4" fill={fill} stroke={g[2]} strokeWidth="0.6" />
    </g>
  )
}

/** Gold crest with scrolls, replaces the floral garland at the top/bottom of a section */
export function GiltCrest({ className = "" }: { className?: string }) {
  const id = useGradId()
  const g = useGold()
  const f = `url(#${id})`
  return (
    <svg viewBox="0 0 300 70" className={"w-full h-auto " + className} aria-hidden>
      <GoldDefs id={id} />
      <line x1="20" y1="44" x2="112" y2="44" stroke={g[1]} strokeWidth="0.8" />
      <line x1="188" y1="44" x2="280" y2="44" stroke={g[1]} strokeWidth="0.8" />
      {[30, 50, 70, 90, 210, 230, 250, 270].map((x) => (
        <circle key={x} cx={x} cy="44" r="1.3" fill={f} />
      ))}
      <Scroll x={138} y={46} r={180} s={0.9} fill={f} />
      <Scroll x={162} y={46} s={0.9} fill={f} />
      <Shell x={150} y={44} s={1.1} fill={f} />
    </svg>
  )
}

/** Thin gold divider with a lozenge */
export function GiltDivider({ className = "" }: { className?: string }) {
  const id = useGradId()
  const g = useGold()
  return (
    <svg viewBox="0 0 200 20" className={"w-40 h-auto mx-auto " + className} aria-hidden>
      <GoldDefs id={id} />
      <line x1="8" y1="10" x2="84" y2="10" stroke={g[1]} strokeWidth="0.7" />
      <line x1="116" y1="10" x2="192" y2="10" stroke={g[1]} strokeWidth="0.7" />
      <Scroll x={92} y={11} r={180} s={0.35} fill={`url(#${id})`} />
      <Scroll x={108} y={11} s={0.35} fill={`url(#${id})`} />
      <path d="M100 3 L106 10 L100 17 L94 10 Z" fill={`url(#${id})`} stroke={g[2]} strokeWidth="0.5" />
    </svg>
  )
}

/** Champagne card with a double gold rule and scroll corners */
export function GiltFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const IV = useIV()
  const g = useGold()
  const id = useGradId()
  const corner = (rot: number, pos: string) => (
    <svg viewBox="0 0 40 40" className={"absolute w-11 h-11 " + pos} style={{ transform: `rotate(${rot}deg)` }} aria-hidden>
      <GoldDefs id={id + rot} />
      <Scroll x={5} y={8} r={0} s={0.6} fill={`url(#${id + rot})`} />
      <Scroll x={8} y={5} r={90} s={0.6} flip fill={`url(#${id + rot})`} />
    </svg>
  )
  return (
    <div className={"relative p-7 " + className} style={{ background: IV.paper, border: `1.5px solid ${g[1]}`, borderRadius: 4 }}>
      <div className="absolute inset-[6px] pointer-events-none" style={{ border: `0.75px solid ${g[1]}`, opacity: 0.7 }} />
      {corner(0, "-top-1.5 -left-1.5")}
      {corner(90, "-top-1.5 -right-1.5")}
      {corner(270, "-bottom-1.5 -left-1.5")}
      {corner(180, "-bottom-1.5 -right-1.5")}
      <div className="relative">{children}</div>
    </div>
  )
}

/** Gold wax seal; shows the cover photo in the middle when there is one */
export function GiltSeal({ text, size = 120, photo }: { text: string; size?: number; photo?: string }) {
  const IV = useIV()
  const g = useGold()
  const id = useGradId()
  const pts: string[] = []
  for (let i = 0; i <= 360; i += 3) {
    const a = (i * Math.PI) / 180
    const rr = 46 + 2.4 * Math.cos(a * 11) + 1.2 * Math.sin(a * 5)
    pts.push(`${(50 + rr * Math.cos(a)).toFixed(2)},${(50 + rr * Math.sin(a)).toFixed(2)}`)
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <GoldDefs id={id} />
      <clipPath id={id + "c"}>
        <circle cx="50" cy="50" r="31" />
      </clipPath>
      <polygon points={pts.join(" ")} fill={`url(#${id})`} stroke={g[2]} strokeWidth="0.8" />
      <circle cx="50" cy="50" r="36" fill="none" stroke={g[2]} strokeWidth="0.8" opacity="0.6" />
      <circle cx="50" cy="50" r="33" fill="none" stroke={g[0]} strokeWidth="0.6" />
      {photo ? (
        <image href={photo} x="19" y="19" width="62" height="62" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id}c)`} />
      ) : (
        <text x="50" y="57" textAnchor="middle" fontSize="20" fontStyle="italic" fill={IV.wine} style={{ fontFamily: "var(--iv-serif)" }}>
          {text}
        </text>
      )}
    </svg>
  )
}

/** Slot position inside the cartouche, as a fraction of its height (the strip slides out from here) */
const SLOT_Y = 0.84

/** Ornate gold cartouche frame; children are laid over the champagne panel */
export function Cartouche({ children, slot = false }: { children: React.ReactNode; slot?: boolean }) {
  const IV = useIV()
  const g = useGold()
  const id = useGradId()
  const f = `url(#${id})`
  return (
    <div className="relative w-full" style={{ aspectRatio: "300 / 420" }}>
      <svg viewBox="0 0 300 420" className="absolute inset-0 w-full h-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]" aria-hidden>
        <GoldDefs id={id} />
        <path d={scoop(10, 28, 280, 364, 26)} fill={f} stroke={g[2]} strokeWidth="1" />
        <path d={scoop(17, 35, 266, 350, 22)} fill="none" stroke={g[0]} strokeWidth="0.8" opacity="0.8" />
        <path d={scoop(24, 42, 252, 336, 18)} fill={IV.paper} stroke={g[2]} strokeWidth="0.8" />
        <path d={scoop(31, 49, 238, 322, 14)} fill="none" stroke={g[1]} strokeWidth="0.6" />
        {/* crests */}
        <Scroll x={128} y={30} r={200} s={1.1} fill={f} />
        <Scroll x={172} y={30} r={-20} s={1.1} fill={f} />
        <Shell x={150} y={28} s={1.3} fill={f} />
        <Scroll x={128} y={390} r={160} s={1.1} fill={f} />
        <Scroll x={172} y={390} r={20} s={1.1} fill={f} />
        <Shell x={150} y={392} s={1.3} down fill={f} />
        {/* corner scrolls */}
        <Scroll x={14} y={50} r={-90} s={0.9} fill={f} />
        <Scroll x={286} y={50} r={-90} s={0.9} flip fill={f} />
        <Scroll x={14} y={370} r={90} s={0.9} flip fill={f} />
        <Scroll x={286} y={370} r={90} s={0.9} fill={f} />
        {/* side medallions */}
        <ellipse cx="10" cy="210" rx="7" ry="16" fill={f} stroke={g[2]} strokeWidth="0.8" />
        <ellipse cx="290" cy="210" rx="7" ry="16" fill={f} stroke={g[2]} strokeWidth="0.8" />
        {slot && <rect x="95" y={420 * SLOT_Y - 3} width="110" height="6" rx="3" fill={IV.deep ?? IV.ink} />}
      </svg>
      <div className="absolute inset-x-[13%] top-[15%] flex flex-col items-center text-center" style={{ bottom: slot ? `${(1 - SLOT_Y) * 100 + 4}%` : "13%" }}>
        {children}
      </div>
    </div>
  )
}

/** Photobooth strip that slides out of the cartouche slot. Place right after <Cartouche slot>, inside the same width box. */
export function PhotoStrip({ photos, start }: { photos: string[]; start: boolean }) {
  const [out, setOut] = useState(false)
  useEffect(() => {
    if (!start) return
    const t = setTimeout(() => setOut(true), 700)
    return () => clearTimeout(t)
  }, [start])
  if (photos.length === 0) return null
  return (
    // Negative margin moves the clip box up to the slot; the strip starts hidden above it
    <div className="relative z-10 flex justify-center" style={{ marginTop: `calc(-1 * 420 / 300 * ${1 - SLOT_Y} * 100%)` }}>
      <div className="overflow-hidden w-[38%] -mt-[3px]">
        <div
          className="bg-white p-[6%] pb-[14%] flex flex-col gap-[5%] shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-transform duration-[2200ms] ease-out motion-reduce:duration-0"
          style={{ transform: out ? "translateY(0)" : "translateY(-101%)" }}
        >
          {photos.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="w-full aspect-[4/3] object-cover" style={{ filter: "grayscale(0.85) contrast(1.05)" }} />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Full-screen wax-sealed envelope; tap to lift the flap and slide it away */
export function EnvelopeIntro({ initials, photo, onOpened }: { initials: string; photo?: string; onOpened: () => void }) {
  const IV = useIV()
  const [phase, setPhase] = useState(0)

  function open() {
    if (phase) return
    setPhase(1)
    setTimeout(() => setPhase(2), 800)
    setTimeout(onOpened, 1800)
  }

  const crease = { vectorEffect: "non-scaling-stroke" as const }
  return (
    <div className="fixed inset-0 z-50 cursor-pointer select-none overflow-hidden" style={{ background: IV.deep ?? IV.wine }} onClick={open} role="button" aria-label="Mở thiệp mời">
      <div
        className="absolute inset-0 transition-transform duration-[1000ms] ease-in motion-reduce:duration-0"
        style={{ transform: phase === 2 ? "translateY(105%)" : "none", perspective: 1400 }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden>
          <rect width="100" height="100" fill={IV.blush} />
          <polygon points="0,0 50,56 0,100" fill={IV.soft} />
          <polygon points="100,0 50,56 100,100" fill={IV.soft} />
          <polygon points="0,100 50,54 100,100" fill={IV.blush} stroke={IV.line} strokeWidth="1" style={crease} />
          <line x1="0" y1="0" x2="50" y2="56" stroke={IV.line} strokeWidth="1" style={crease} />
          <line x1="100" y1="0" x2="50" y2="56" stroke={IV.line} strokeWidth="1" style={crease} />
        </svg>
        {/* Paper grain */}
        <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)", backgroundSize: "3px 3px" }} />
        {/* Top flap */}
        <div
          className="absolute inset-x-0 top-0 h-[58%] transition-transform duration-[800ms] ease-in-out motion-reduce:duration-0"
          style={{ transformOrigin: "top", transform: phase >= 1 ? "rotateX(180deg)" : "none", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.18))" }}
        >
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full" aria-hidden>
            <polygon points="0,0 100,0 50,100" fill={IV.blush} stroke={IV.line} strokeWidth="1" style={crease} />
          </svg>
        </div>
        <div className={"absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 transition-all duration-500 " + (phase >= 1 ? "opacity-0 scale-75" : "")}>
          <div className="drop-shadow-lg animate-[ivPulse_2.6s_ease-in-out_infinite]">
            <GiltSeal text={initials} size={128} photo={photo} />
          </div>
        </div>
        <p
          className={"absolute inset-x-0 top-[74%] text-center text-sm tracking-[0.25em] uppercase transition-opacity duration-300 " + (phase ? "opacity-0" : "")}
          style={{ color: IV.wine, fontFamily: "var(--iv-sans)" }}
        >
          Chạm để mở thiệp
        </p>
      </div>
      <style>{`@keyframes ivPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}`}</style>
    </div>
  )
}
