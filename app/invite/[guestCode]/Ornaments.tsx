"use client"

// Hand-built decorations for the invite (no external artwork).
import { useEffect, useRef, useState } from "react"

export const IV = {
  bg: "#F7EEEE",
  paper: "#FCF8F6",
  blush: "#EBD3D6",
  rose: "#C48B97",
  wine: "#7E4152",
  sage: "#8A9A82",
  leaf: "#6F8468",
  ink: "#4A3A3F",
  muted: "#8F7C82",
}

/** Wavy-edged wax seal with the couple's initials */
export function Seal({ text, size = 120 }: { text: string; size?: number }) {
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
  const corner = (rot: number, pos: string) => (
    <svg viewBox="0 0 40 40" className={"absolute w-10 h-10 " + pos} style={{ transform: `rotate(${rot}deg)` }} aria-hidden>
      <path d="M4 36 C 4 14, 14 4, 36 4" stroke={IV.rose} strokeWidth="1" fill="none" />
      <Sprig x={6} y={30} r={-70} s={0.55} />
      <Sprig x={10} y={8} r={-20} s={0.55} />
    </svg>
  )
  return (
    <div className={"relative border border-[#E3CCD0] rounded-[18px] p-6 " + className} style={{ background: IV.paper }}>
      <div className="absolute inset-1.5 border border-[#EFDDE0] rounded-[14px] pointer-events-none" />
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
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={"transition-all duration-1000 ease-out motion-reduce:transition-none " + (shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6") + " " + className}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/** Opening curtain with the seal; tap anywhere to open */
export function CurtainIntro({ initials, onOpened }: { initials: string; onOpened: () => void }) {
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
        <path d="M0 0 H400 V18 Q 375 40 350 18 Q 325 40 300 18 Q 275 40 250 18 Q 225 40 200 18 Q 175 40 150 18 Q 125 40 100 18 Q 75 40 50 18 Q 25 40 0 18 Z" fill="#E2C2C7" />
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
