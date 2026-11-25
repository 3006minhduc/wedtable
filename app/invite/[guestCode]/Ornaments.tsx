"use client"

// Hand-built decorations for the invite (no external artwork).
import { createContext, useContext, useEffect, useRef, useState } from "react"

import { THEMES } from "@/lib/inviteThemes"
import type { Palette } from "@/lib/inviteThemes"
export { THEMES }

const PaletteCtx = createContext<Palette>(THEMES.blush.p)
export const PaletteProvider = PaletteCtx.Provider
export const useIV = () => useContext(PaletteCtx)

/**
 * How body sections enter when scrolled into view, one style per template so the motion matches its
 * material: ivory is pressed into the paper, lacquer gets a gold-leaf wipe, film flickers in like a
 * frame, silk unfurls from the middle like a ribbon, the veil lifts, a record swings in, scrapbook
 * pieces get stuck onto the page, daisies bloom. CSS lives in REVEAL_CSS.
 */
export type RevealStyle = "fade" | "press" | "gold" | "flicker" | "unfurl" | "lift" | "swing" | "stick" | "bloom"
const RevealCtx = createContext<RevealStyle>("fade")
export const RevealProvider = RevealCtx.Provider

export const REVEAL_CSS = `
.wt-rv{opacity:0;will-change:opacity,transform}
.wt-rv.wt-on{opacity:1;transition:opacity .9s ease-out,transform 1s cubic-bezier(.2,.7,.2,1),filter 1s ease-out,clip-path 1.1s cubic-bezier(.65,0,.35,1)}
.wt-rv-press{transform:translateY(8px) scale(1.02);filter:blur(5px)}
.wt-rv-press.wt-on{transform:none;filter:none}
.wt-rv-gold{position:relative;clip-path:inset(0 100% 0 0)}
.wt-rv-gold.wt-on{clip-path:inset(0 0 0 0);transition-duration:.5s,1s,1s,1.3s}
.wt-rv-gold.wt-on::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 30%,rgba(255,236,180,.55) 48%,transparent 66%);background-size:250% 100%;animation:wtShine 1.6s .5s ease-out both;mix-blend-mode:soft-light}
@keyframes wtShine{from{background-position:120% 0}to{background-position:-60% 0}}
.wt-rv-flicker.wt-on{animation:wtFlicker .7s steps(1) both}
@keyframes wtFlicker{0%{opacity:0;transform:translateY(6px)}20%{opacity:.7;transform:translateY(3px)}35%{opacity:.25}55%{opacity:.9;transform:none}70%{opacity:.6}100%{opacity:1}}
.wt-rv-unfurl{clip-path:inset(0 50% 0 50%)}
.wt-rv-unfurl.wt-on{clip-path:inset(0 0 0 0)}
.wt-rv-lift{transform:translateY(22px);filter:blur(7px)}
.wt-rv-lift.wt-on{transform:none;filter:none;transition-duration:1.3s,1.4s,1.4s,1s}
.wt-rv-swing{transform:translateY(18px) rotate(-2.5deg);transform-origin:0 100%}
.wt-rv-swing.wt-on{transform:none}
.wt-rv-stick{transform:translateY(-14px) rotate(-2deg) scale(1.04)}
.wt-rv-stick.wt-on{transform:none;transition:opacity .35s ease-out,transform .65s cubic-bezier(.3,1.55,.5,1)}
.wt-rv-bloom{transform:translateY(14px) scale(.94)}
.wt-rv-bloom.wt-on{transform:none;transition:opacity .8s ease-out,transform .9s cubic-bezier(.3,1.4,.5,1)}
@media (prefers-reduced-motion: reduce){.wt-rv,.wt-rv.wt-on{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important;animation:none!important;transition:none!important}.wt-rv.wt-on::after{display:none}}
`

/** Wavy-edged wax seal with the couple's initials */
export function Seal({ text, size = 120 }: { text: string; size?: number }) {
  const IV = useIV()
  const r = 46
  const pts: string[] = []
  for (let i = 0; i <= 360; i += 3) {
    const a = (i * Math.PI) / 180
    const rr = r + 2.6 * Math.cos(a * 14)
    pts.push(`${(50 + rr * Math.cos(a)).toFixed(2)},${(50 + rr * Math.sin(a)).toFixed(2)}`)
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <polygon points={pts.join(" ")} fill={IV.blush} stroke={IV.rose} strokeWidth="1" />
      <circle cx="50" cy="50" r="36" fill="none" stroke={IV.rose} strokeWidth="0.6" strokeDasharray="1.5 1.5" />
      <circle cx="50" cy="50" r="32" fill="none" stroke={IV.wine} strokeWidth="0.4" opacity="0.5" />
      <text x="50" y="57" textAnchor="middle" fontSize="20" fontStyle="italic" fill={IV.wine} style={{ fontFamily: "var(--iv-serif)" }}>
        {text}
      </text>
    </svg>
  )
}

/** Small leaf + bud sprig used in garlands */
function Sprig({ x, y, r, s = 1, flip = false }: { x: number; y: number; r: number; s?: number; flip?: boolean }) {
  const IV = useIV()
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${flip ? -s : s} ${s})`}>
      <path d="M0 0 C 6 -4, 14 -4, 22 0" stroke={IV.leaf} strokeWidth="0.8" fill="none" />
      <ellipse cx="7" cy="-3.2" rx="4.2" ry="1.7" transform="rotate(-25 7 -3.2)" fill={IV.sage} />
      <ellipse cx="14" cy="-4.2" rx="4" ry="1.6" transform="rotate(-10 14 -4.2)" fill={IV.leaf} opacity="0.85" />
      <ellipse cx="9" cy="2.2" rx="3.6" ry="1.5" transform="rotate(25 9 2.2)" fill={IV.leaf} opacity="0.75" />
      <circle cx="22" cy="0" r="2.2" fill={IV.rose} />
      <circle cx="22" cy="0" r="1" fill={IV.wine} opacity="0.5" />
    </g>
  )
}

/** Hanging garland across the top of a section */
export function Garland({ className = "" }: { className?: string }) {
  const IV = useIV()
  const sprigs = []
  for (let i = 0; i < 9; i++) {
    const t = i / 8
    const x = 10 + t * 280
    const y = 10 + Math.sin(t * Math.PI) * 26
    sprigs.push(<Sprig key={i} x={x} y={y} r={60 + (i % 2 ? 20 : -20)} s={0.9} flip={i % 2 === 0} />)
  }
  return (
    <svg viewBox="0 0 300 70" className={"w-full h-auto " + className} aria-hidden>
      <path d="M0 8 Q 150 70 300 8" stroke={IV.leaf} strokeWidth="1" fill="none" />
      {Array.from({ length: 22 }).map((_, i) => {
        const t = i / 21
        const x = t * 300
        const y = 8 + 2 * (1 - t) * t * 62
        return <circle key={i} cx={x} cy={y + 3} r="1.4" fill="#fff" stroke={IV.blush} strokeWidth="0.5" />
      })}
      {sprigs}
    </svg>
  )
}

/** Thin ornamental divider */
export function Divider({ className = "" }: { className?: string }) {
  const IV = useIV()
  return (
    <svg viewBox="0 0 200 20" className={"w-40 h-auto mx-auto " + className} aria-hidden>
      <line x1="10" y1="10" x2="82" y2="10" stroke={IV.rose} strokeWidth="0.6" />
      <line x1="118" y1="10" x2="190" y2="10" stroke={IV.rose} strokeWidth="0.6" />
      <Sprig x={100} y={10} r={180} s={0.7} />
      <Sprig x={100} y={10} r={0} s={0.7} />
      <circle cx="100" cy="10" r="2.6" fill={IV.wine} />
    </svg>
  )
}

/** Corner flourishes for framed boxes */
export function Frame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const IV = useIV()
  const corner = (rot: number, pos: string) => (
    <svg viewBox="0 0 40 40" className={"absolute w-10 h-10 " + pos} style={{ transform: `rotate(${rot}deg)` }} aria-hidden>
      <path d="M4 36 C 4 14, 14 4, 36 4" stroke={IV.rose} strokeWidth="1" fill="none" />
      <Sprig x={6} y={30} r={-70} s={0.55} />
      <Sprig x={10} y={8} r={-20} s={0.55} />
    </svg>
  )
  return (
    <div className={"relative border rounded-[18px] p-6 " + className} style={{ background: IV.paper, borderColor: IV.line }}>
      <div className="absolute inset-1.5 border rounded-[14px] pointer-events-none" style={{ borderColor: IV.soft }} />
      {corner(0, "-top-1 -left-1")}
      {corner(90, "-top-1 -right-1")}
      {corner(270, "-bottom-1 -left-1")}
      {corner(180, "-bottom-1 -right-1")}
      <div className="relative">{children}</div>
    </div>
  )
}

/** Fades + lifts children in when scrolled into view */
export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const kind = useContext(RevealCtx)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    // the observed wrapper is never clipped: IntersectionObserver treats a clip-path'd element as unseen
    <div ref={ref} className={className}>
      <div className={`wt-rv wt-rv-${kind} ${shown ? "wt-on" : ""}`} style={{ transitionDelay: `${delay}ms`, animationDelay: `${delay}ms` }}>
        {children}
      </div>
    </div>
  )
}

/** Opening curtain with the seal; tap anywhere to open */
export function CurtainIntro({ initials, onOpened }: { initials: string; onOpened: () => void }) {
  const IV = useIV()
  const [opening, setOpening] = useState(false)

  function open() {
    if (opening) return
    setOpening(true)
    setTimeout(onOpened, 1500)
  }

  const panel: React.CSSProperties = {
    backgroundColor: IV.blush,
    backgroundImage:
      "repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 6px, rgba(126,65,82,0.07) 6px 14px, rgba(255,255,255,0.15) 14px 22px)",
  }

  return (
    <div className="fixed inset-0 z-50 cursor-pointer select-none overflow-hidden" onClick={open} role="button" aria-label="Mở thiệp mời">
      <div
        className={"absolute inset-y-0 left-0 w-1/2 transition-transform duration-[1400ms] ease-in-out motion-reduce:duration-0 " + (opening ? "-translate-x-full" : "")}
        style={{ ...panel, boxShadow: "inset -18px 0 30px rgba(126,65,82,0.12)" }}
      />
      <div
        className={"absolute inset-y-0 right-0 w-1/2 transition-transform duration-[1400ms] ease-in-out motion-reduce:duration-0 " + (opening ? "translate-x-full" : "")}
        style={{ ...panel, boxShadow: "inset 18px 0 30px rgba(126,65,82,0.12)" }}
      />
      {/* Valance */}
      <svg
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        className={"absolute top-0 left-0 w-full h-12 transition-opacity duration-700 " + (opening ? "opacity-0" : "")}
        aria-hidden
      >
        <path d="M0 0 H400 V18 Q 375 40 350 18 Q 325 40 300 18 Q 275 40 250 18 Q 225 40 200 18 Q 175 40 150 18 Q 125 40 100 18 Q 75 40 50 18 Q 25 40 0 18 Z" fill={IV.line} />
        {Array.from({ length: 40 }).map((_, i) => (
          <circle key={i} cx={5 + i * 10} cy={20 + Math.abs(Math.sin((i * Math.PI) / 5)) * 10} r="1.3" fill="#fff" />
        ))}
      </svg>
      <div className={"absolute inset-0 flex flex-col items-center justify-center gap-3 transition-all duration-700 " + (opening ? "opacity-0 scale-90" : "")}>
        <div className="drop-shadow-md animate-[ivPulse_2.6s_ease-in-out_infinite]">
          <Seal text={initials} size={132} />
        </div>
        <p className="text-sm tracking-[0.25em] uppercase" style={{ color: IV.wine, fontFamily: "var(--iv-sans)" }}>
          Chạm để mở thiệp
        </p>
      </div>
      <style>{`@keyframes ivPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}`}</style>
    </div>
  )
}

/**
 * A few pieces drifting down over the invitation while it is read: daisy heads, rose petals, white
 * tulle petals or gold flecks. Few on purpose (it must never get in the way of reading), deterministic
 * positions so server and client agree, and hidden when the visitor prefers less motion.
 */
export function Drift({ kind, colors, count = 9 }: { kind: "daisy" | "petal" | "fleck"; colors: string[]; count?: number }) {
  const pieces = Array.from({ length: count }, (_, i) => {
    const r = (n: number) => {
      const x = Math.sin((i + 1) * 9301 + n * 49297) * 233280
      return x - Math.floor(x)
    }
    return { left: r(1) * 100, size: kind === "fleck" ? 3 + r(2) * 4 : 10 + r(2) * 10, dur: 16 + r(3) * 14, delay: -r(4) * 30, sway: 20 + r(5) * 40, rot: r(6) * 360, color: colors[i % colors.length], op: 0.45 + r(7) * 0.4 }
  })
  return (
    <div aria-hidden className="wt-drift pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pieces.map((p, i) => (
        <span key={i} className="absolute -top-8 block" style={{ left: `${p.left}%`, animation: `wtFall ${p.dur}s linear ${p.delay}s infinite`, opacity: p.op }}>
          <span className="block" style={{ animation: `wtSway ${p.dur / 3}s ease-in-out ${p.delay}s infinite alternate`, ["--sw" as any]: `${p.sway}px` }}>
            {kind === "fleck" ? (
              <span className="block rounded-full" style={{ width: p.size, height: p.size, background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }} />
            ) : kind === "daisy" ? (
              <svg width={p.size * 1.4} height={p.size * 1.4} viewBox="-10 -10 20 20" style={{ transform: `rotate(${p.rot}deg)` }}>
                {Array.from({ length: 8 }, (_, k) => (
                  <ellipse key={k} cx="0" cy="-5" rx="2.1" ry="4.6" fill="#fff" stroke="rgba(0,0,0,.08)" strokeWidth=".3" transform={`rotate(${k * 45})`} />
                ))}
                <circle r="2.6" fill={p.color} />
              </svg>
            ) : (
              <svg width={p.size} height={p.size * 1.25} viewBox="0 0 20 25" style={{ transform: `rotate(${p.rot}deg)` }}>
                <path d="M10 1 C17 6 19 15 10 24 C1 15 3 6 10 1Z" fill={p.color} />
                <path d="M10 3 C12 10 12 16 10 22" stroke="rgba(255,255,255,.45)" strokeWidth=".8" fill="none" />
              </svg>
            )}
          </span>
        </span>
      ))}
      <style>{`@keyframes wtFall{from{transform:translateY(-5vh)}to{transform:translateY(110vh)}}@keyframes wtSway{from{transform:translateX(calc(var(--sw) * -1)) rotate(-25deg)}to{transform:translateX(var(--sw)) rotate(25deg)}}@media (prefers-reduced-motion: reduce){.wt-drift{display:none}}`}</style>
    </div>
  )
}
