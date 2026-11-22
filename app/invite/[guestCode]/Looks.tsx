"use client"

// Invite looks rebuilt 2026-11-23 (docs/mau-thiep/lam-lai-2026-11-23.md). Each look has one signature
// moment (its opening) and a quiet, photo-led cover; everything else stays restrained.
//   floral → "Thư ngà"   embossed envelope, wax seal, card slides out
//   gilded → "Song hỷ"   vermilion lacquer doors with a gold double-happiness medallion
//   glass  → "Thước phim" letterbox bars open onto a full-screen wedding photo
//   emboss → "Tạp chí"   magazine cover that turns like a page
import { useEffect, useMemo, useRef, useState } from "react"
import { useIV } from "./Ornaments"
import { lunarLine } from "@/lib/lunar"
import type { Palette } from "@/lib/inviteThemes"

export type IntroProps = { event: any; cover?: string; initials: string; date: string; onOpened: () => void; onReveal?: () => void }
export type HeroProps = { event: any; cover?: string; second?: string; start: Date | null; date: string; opened: boolean; initials: string }

const SCRIPT = "var(--iv-script), cursive"
const CAPS = "var(--iv-caps), serif"
const DISPLAY = "var(--iv-display), serif"
const HAN = '"Noto Serif SC","Noto Serif CJK SC","Songti SC","STSong","SimSun","PMingLiU",serif'
const WEEKDAYS = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]

export const dotDate = (d: Date | null) =>
  d ? `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}` : ""

function useReduced() {
  const [r, setR] = useState(false)
  useEffect(() => setR(!!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches), [])
  return r
}

/** Shared opening controller: idle → run (animation) → out (fade) → onOpened. A second tap skips. */
function useOpening(total: number, onOpened: () => void, onReveal?: () => void, revealAt = total) {
  const [phase, setPhase] = useState<"idle" | "run" | "out">("idle")
  const timers = useRef<number[]>([])
  const reduce = useReduced()
  const tapRef = useRef<() => void>(() => {})
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  // guests who don't notice the hint (often older relatives) still get in after a few seconds
  useEffect(() => {
    if (phase !== "idle") return
    const t = window.setTimeout(() => tapRef.current(), 7000)
    return () => clearTimeout(t)
  }, [phase])
  function finish(ms: number) {
    timers.current.forEach(clearTimeout)
    setPhase("out")
    timers.current = [window.setTimeout(onOpened, ms)]
  }
  function tap() {
    if (phase === "out") return
    if (phase === "run" || reduce) {
      onReveal?.()
      return finish(650)
    }
    setPhase("run")
    timers.current.push(window.setTimeout(() => onReveal?.(), revealAt))
    timers.current.push(window.setTimeout(() => setPhase("out"), total))
    timers.current.push(window.setTimeout(onOpened, total + 650))
  }
  tapRef.current = tap
  return { phase, tap }
}

/** "Chạm để mở thiệp" label: readable on any opening (light pill), gently pulsing, gone once opening starts */
function TapHint({ hidden, text = "Chạm để mở thiệp", className = "bottom-[7%]" }: { hidden: boolean; text?: string; className?: string }) {
  return (
    <div className={"absolute inset-x-0 z-[6] flex justify-center pointer-events-none transition-opacity duration-300 " + className} style={{ opacity: hidden ? 0 : 1 }}>
      <span className="wt-hint inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-medium" style={{ background: "rgba(255,255,255,.92)", color: "#2A2220", boxShadow: "0 4px 14px rgba(0,0,0,.18)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5A5.5 5.5 0 0 1 12.5 20h-1a5 5 0 0 1-4-2l-2.6-3.5a1.5 1.5 0 0 1 2.3-1.9L9 14.5" />
        </svg>
        {text}
      </span>
      <style>{`@media (prefers-reduced-motion: no-preference){.wt-hint{animation:wtHint 2.4s ease-in-out infinite}}@keyframes wtHint{50%{transform:translateY(-3px)}}`}</style>
    </div>
  )
}

/** Staggered entrance for the cover once the invite is open (the one orchestrated sequence) */
const enter = (opened: boolean, i: number, base = 0.25): React.CSSProperties => ({
  opacity: opened ? 1 : 0,
  transform: opened ? "none" : "translateY(8px)",
  transition: `opacity 1s ease ${base + i * 0.16}s, transform 1s ease ${base + i * 0.16}s`,
})

// ---------------------------------------------------------------- shared Vietnamese blocks

/** "Lễ thành hôn" block the way Vietnamese invites set it: time / weekday | big day | month / year, then the lunar date */
export function EventDate({ start, tone = "light" }: { start: Date | null; tone?: "light" | "dark" }) {
  const IV = useIV()
  if (!start) return null
  const ink = tone === "dark" ? IV.gold[0] : IV.ink
  const accent = tone === "dark" ? IV.gold[0] : IV.wine
  const rule = tone === "dark" ? "rgba(255,255,255,.28)" : IV.line
  const time = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`
  return (
    <div className="text-center">
      <div className="flex items-stretch justify-center">
        <div className="w-[38%] flex flex-col justify-center items-end pr-4 text-[15px] leading-snug" style={{ color: ink, fontFamily: CAPS, fontWeight: 600 }}>
          <span>{time}</span>
          <span>{WEEKDAYS[start.getDay()]}</span>
        </div>
        <div className="px-4 border-x flex items-center" style={{ borderColor: rule }}>
          <span className="text-[56px] leading-none tabular-nums" style={{ color: accent, fontFamily: DISPLAY }}>
            {start.getDate()}
          </span>
        </div>
        <div className="w-[38%] flex flex-col justify-center items-start pl-4 text-[15px] leading-snug" style={{ color: ink, fontFamily: CAPS, fontWeight: 600 }}>
          <span>Tháng {start.getMonth() + 1}</span>
          <span>Năm {start.getFullYear()}</span>
        </div>
      </div>
      <p className="mt-3 text-[15px]" style={{ color: tone === "dark" ? "rgba(255,255,255,.8)" : IV.muted }}>
        {lunarLine(start)}
      </p>
    </div>
  )
}

/** Three photos printed with day / month / year (Vietnamese "save the date" strip) */
export function DateStrip({ start, photos, onOpen }: { start: Date | null; photos: string[]; onOpen?: (url: string) => void }) {
  if (!start || photos.length < 3) return null
  const parts = [String(start.getDate()).padStart(2, "0"), String(start.getMonth() + 1).padStart(2, "0"), String(start.getFullYear())]
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {photos.slice(0, 3).map((src, i) => (
        <button key={i} type="button" onClick={() => onOpen?.(src)} className="relative aspect-[3/4] overflow-hidden rounded-[3px] bg-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <span className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.45), rgba(0,0,0,0) 55%)" }} />
          <span className={"absolute inset-x-0 bottom-2 text-center text-white leading-none " + (i === 2 ? "text-[30px]" : "text-[40px]")} style={{ fontFamily: DISPLAY, fontStyle: "italic" }}>
            {parts[i]}
          </span>
        </button>
      ))}
    </div>
  )
}

/** Wax seal, colored from the palette, with initials pressed in */
export function WaxSeal({ text, size = 92, color }: { text: string; size?: number; color?: string }) {
  const IV = useIV()
  const wax = color ?? IV.wine
  const blob = useMemo(() => {
    const pts: string[] = []
    for (let i = 0; i <= 360; i += 4) {
      const a = (i * Math.PI) / 180
      const r = 44 + 2.4 * Math.sin(a * 7) + 1.4 * Math.sin(a * 13 + 1)
      pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`)
    }
    return pts.join(" ")
  }, [])
  const id = "wx" + wax.replace(/[^a-z0-9]/gi, "")
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ filter: "drop-shadow(0 3px 4px rgba(0,0,0,.28))" }}>
      <defs>
        <radialGradient id={id} cx="38%" cy="32%" r="75%">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset=".45" stopColor={wax} stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".35" />
        </radialGradient>
      </defs>
      <polygon points={blob} fill={wax} />
      <polygon points={blob} fill={`url(#${id})`} />
      <circle cx="50" cy="50" r="31" fill="none" stroke="#000" strokeOpacity=".22" strokeWidth="3" />
      <circle cx="50" cy="50" r="29.5" fill="none" stroke="#fff" strokeOpacity=".28" strokeWidth="1" />
      <text x="50" y="58" textAnchor="middle" fontSize="22" fill="#000" fillOpacity=".28" style={{ fontFamily: SCRIPT }}>
        {text}
      </text>
      <text x="49.4" y="57.2" textAnchor="middle" fontSize="22" fill="#fff" fillOpacity=".32" style={{ fontFamily: SCRIPT }}>
        {text}
      </text>
    </svg>
  )
}

/** Embossed leaf damask, neutral highlights/shadows so it works on any paper color */
const EMBOSS_TILE = (() => {
  const motif =
    "M60 14 C70 30 70 44 60 58 C50 44 50 30 60 14Z M60 58 C78 54 92 60 100 74 C84 78 70 72 60 58Z M60 58 C42 54 28 60 20 74 C36 78 50 72 60 58Z M60 58 L60 106 M0 0 C10 16 10 30 0 44 M120 0 C110 16 110 30 120 44 M30 96 C38 104 50 106 60 106 C70 106 82 104 90 96"
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke-width='1.4' stroke-linecap='round'><path d='${motif}' stroke='white' stroke-opacity='.55' transform='translate(-.7 -.7)'/><path d='${motif}' stroke='black' stroke-opacity='.1' transform='translate(.7 .7)'/></g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
})()

// ---------------------------------------------------------------- Thư ngà (floral)

export function LetterIntro({ event, cover, initials, onOpened, onReveal }: IntroProps) {
  const IV = useIV()
  const { phase, tap } = useOpening(2300, onOpened, onReveal, 2000)
  const paper = IV.blush
  return (
    <div
      className={"fixed inset-0 z-50 overflow-hidden select-none cursor-pointer lt-intro " + (phase !== "idle" ? "lt-run " : "") + (phase === "out" ? "lt-out" : "")}
      style={{ background: IV.bg }}
      onClick={tap}
      role="button"
      aria-label="Mở thiệp mời"
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[520px]" style={{ perspective: 1400 }}>
        {/* inside of the envelope */}
        <div className="absolute inset-0" style={{ background: IV.wine, backgroundImage: EMBOSS_TILE, backgroundSize: "60px" }} />
        {/* the card that slides out */}
        <div className="absolute left-[9%] right-[9%] top-[20%] rounded-[3px] lt-card flex flex-col items-center px-6 pt-8 pb-9 gap-4" style={{ background: IV.paper, boxShadow: "0 10px 30px -12px rgba(0,0,0,.35)" }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="w-[58%] aspect-[3/4] object-cover rounded-t-full" />
          ) : (
            <div className="w-[58%] aspect-[3/4] rounded-t-full" style={{ background: IV.blush }} />
          )}
          <p className="text-[34px] leading-none" style={{ fontFamily: SCRIPT, color: IV.wine }}>
            {[event.bride_name, event.groom_name].filter(Boolean).join(" & ")}
          </p>
        </div>
        {/* front pocket: side and bottom flaps */}
        <svg viewBox="0 0 360 640" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }} aria-hidden>
          <path d="M0 0 L176 352 L0 640Z" fill={paper} />
          <path d="M360 0 L184 352 L360 640Z" fill={paper} />
          <path d="M0 640 L180 330 L360 640Z" fill={paper} />
          <path d="M0 640 L180 330 L360 640Z" fill="#000" fillOpacity=".035" />
          <path d="M0 0 L176 352 L0 640Z" fill="#fff" fillOpacity=".05" />
          <path d="M0 640 L180 330 L360 640" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: EMBOSS_TILE, backgroundSize: "120px", zIndex: 2, clipPath: "polygon(0 0, 48.9% 55%, 50% 51.6%, 51.1% 55%, 100% 0, 100% 100%, 0 100%)" }} />
        {/* top flap */}
        <div className="absolute inset-x-0 top-0 h-[56%] lt-flap" style={{ transformOrigin: "50% 0", transformStyle: "preserve-3d" }}>
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", clipPath: "polygon(0 0, 100% 0, 50% 100%)", background: paper, backgroundImage: EMBOSS_TILE, backgroundSize: "120px", filter: "drop-shadow(0 4px 6px rgba(0,0,0,.18))" }} />
          <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)", clipPath: "polygon(0 100%, 100% 100%, 50% 0)", background: IV.soft }} />
        </div>
        {/* seal at the flap point */}
        <div className="absolute left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2 lt-seal z-[5]">
          <WaxSeal text={initials} size={96} />
        </div>
        <TapHint hidden={phase !== "idle"} />
      </div>
      <style>{`
        .lt-card{transform:translateY(40%);z-index:1}
        .lt-flap{z-index:3}
        .lt-run .lt-seal{animation:ltSeal .45s ease-in forwards}
        .lt-run .lt-flap{animation:ltFlap .8s .3s cubic-bezier(.5,.05,.3,1) forwards}
        .lt-run .lt-card{animation:ltCard 1.1s .95s cubic-bezier(.3,.7,.2,1) forwards}
        .lt-intro{transition:opacity .65s ease}
        .lt-out{opacity:0;pointer-events:none}
        @keyframes ltSeal{to{transform:translate(-50%,-30%) scale(.6);opacity:0}}
        @keyframes ltFlap{0%{transform:rotateX(0);z-index:3}49%{z-index:3}50%{z-index:0}100%{transform:rotateX(180deg);z-index:0}}
        @keyframes ltCard{0%{transform:translateY(40%);z-index:1}55%{z-index:1}56%{z-index:4}100%{transform:translateY(-14%) scale(1.04);z-index:4}}
      `}</style>
    </div>
  )
}

export function LetterHero({ event, cover, start, opened, initials }: HeroProps) {
  const IV = useIV()
  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-8 py-12" style={{ background: IV.paper }}>
      <p className="text-[17px] italic" style={{ color: IV.muted, fontFamily: CAPS, ...enter(opened, 0) }}>
        Trân trọng báo tin lễ thành hôn
      </p>
      <div className="relative w-[62%] max-w-[250px] mt-6" style={enter(opened, 1)}>
        <div className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-t-full border" style={{ borderColor: IV.gold[1] }} />
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="relative w-full aspect-[3/4] object-cover rounded-t-full" />
        ) : (
          <div className="relative w-full aspect-[3/4] rounded-t-full flex items-center justify-center" style={{ background: IV.blush }}>
            <WaxSeal text={initials} size={84} />
          </div>
        )}
      </div>
      <h1 className="mt-8 leading-[0.95]" style={{ fontFamily: SCRIPT, color: IV.wine }}>
        <span className="block text-[56px]" style={enter(opened, 2)}>
          {event.bride_name}
        </span>
        <span className="block text-[34px] my-1" style={{ color: IV.gold[1], ...enter(opened, 3) }}>
          &amp;
        </span>
        <span className="block text-[56px]" style={enter(opened, 4)}>
          {event.groom_name}
        </span>
      </h1>
      <div style={enter(opened, 5)}>
        <p className="mt-7 text-[26px] tracking-[0.14em]" style={{ fontFamily: CAPS, fontWeight: 600, color: IV.ink }}>
          {dotDate(start)}
        </p>
        {start && (
          <p className="mt-1 text-[15px] italic" style={{ color: IV.muted, fontFamily: CAPS }}>
            {lunarLine(start)}
          </p>
        )}
        {event.venue_name && (
          <p className="mt-4 text-sm" style={{ color: IV.ink }}>
            {event.venue_name}
          </p>
        )}
      </div>
    </section>
  )
}

export function LetterTitle({ children }: { children: React.ReactNode; kicker?: string }) {
  const IV = useIV()
  const onDark = IV.paper === IV.deep
  return (
    <h2 className="text-center text-[40px] leading-tight mb-7" style={{ fontFamily: SCRIPT, color: onDark ? IV.gold[0] : IV.wine }}>
      {children}
    </h2>
  )
}

// ---------------------------------------------------------------- Song hỷ (gilded)

function Hy({ size, color }: { size: number; color: string }) {
  return (
    <span aria-hidden style={{ fontFamily: HAN, fontSize: size, lineHeight: 1, color, fontWeight: 700 }}>
      囍
    </span>
  )
}

/** Auspicious cloud (tường vân), gold line art */
function Cloud({ className = "", color, flip = false }: { className?: string; color: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 120 60" className={className} style={{ transform: flip ? "scaleX(-1)" : undefined }} aria-hidden>
      <g fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M8 50 H104 C116 50 118 36 108 32 C112 18 94 12 86 22 C84 8 62 4 56 18 C48 8 30 12 32 28 C18 24 10 38 20 44" />
        <path d="M56 18 C60 26 70 26 72 20 C74 14 66 12 64 17" />
        <path d="M32 28 C36 34 44 33 45 28 C46 23 40 22 39 26" />
        <path d="M86 22 C88 30 98 30 98 24 C98 19 92 19 92 23" />
      </g>
    </svg>
  )
}

/** Hồi văn (key-fret) band */
function Fret({ color, className = "" }: { color: string; className?: string }) {
  const tile = `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='14' viewBox='0 0 24 14'><path d='M0 12 H8 V4 H16 V8 H12 V6 H10 V12 H24' fill='none' stroke='${color}' stroke-width='1.4'/></svg>`
  return <div className={"h-[14px] w-full " + className} style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(tile)}")`, backgroundRepeat: "repeat-x" }} aria-hidden />
}

function Lacquer({ IV }: { IV: Palette }) {
  return `radial-gradient(120% 80% at 50% 30%, ${IV.wine} 0%, ${IV.deep} 70%)` as any
}

export function HyIntro({ onOpened, onReveal }: IntroProps) {
  const IV = useIV()
  const { phase, tap } = useOpening(1900, onOpened, onReveal, 550)
  const gold = IV.gold
  const door = (side: "l" | "r") => (
    <div
      className={"absolute inset-y-0 w-1/2 hy-door-" + side}
      style={{ [side === "l" ? "left" : "right"]: 0, transformOrigin: side === "l" ? "0 50%" : "100% 50%", background: Lacquer({ IV }), boxShadow: "inset 0 0 60px rgba(0,0,0,.35)" } as React.CSSProperties}
    >
      <div className="absolute inset-[14px] border" style={{ borderColor: gold[1] }} />
      <div className="absolute inset-[20px] border" style={{ borderColor: gold[1], opacity: 0.5 }} />
      <Cloud color={gold[1]} className="absolute top-[9%] w-[62%] opacity-70" flip={side === "r"} />
      <Cloud color={gold[1]} className="absolute bottom-[9%] w-[62%] opacity-70 rotate-180" flip={side === "l"} />
      <style>{`.hy-door-l>svg{left:12%}.hy-door-r>svg{right:12%}`}</style>
    </div>
  )
  return (
    <div className={"fixed inset-0 z-50 overflow-hidden cursor-pointer select-none hy-intro " + (phase !== "idle" ? "hy-run " : "") + (phase === "out" ? "hy-out" : "")} style={{ background: phase === "idle" ? IV.deep : "transparent" }} onClick={tap} role="button" aria-label="Mở thiệp mời">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[520px]" style={{ perspective: 1300 }}>
        {door("l")}
        {door("r")}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[128px] h-[128px] rounded-full flex items-center justify-center hy-medal" style={{ background: `radial-gradient(circle at 35% 30%, ${gold[0]}, ${gold[1]} 55%, ${gold[2]})`, boxShadow: "0 6px 20px rgba(0,0,0,.4), inset 0 0 0 4px rgba(255,255,255,.25)" }}>
          <div className="absolute inset-[9px] rounded-full border" style={{ borderColor: IV.deep, opacity: 0.45 }} />
          <Hy size={62} color={IV.deep} />
        </div>
        <TapHint hidden={phase !== "idle"} />
      </div>
      <style>{`
        .hy-run .hy-medal{animation:hyMedal .55s ease-in forwards}
        .hy-run .hy-door-l{animation:hyL 1.1s .45s cubic-bezier(.6,.05,.3,1) forwards}
        .hy-run .hy-door-r{animation:hyR 1.1s .45s cubic-bezier(.6,.05,.3,1) forwards}
        .hy-intro{transition:opacity .6s ease}
        .hy-out{opacity:0;pointer-events:none}
        @keyframes hyMedal{40%{transform:translate(-50%,-50%) scale(1.08);filter:brightness(1.25)}100%{transform:translate(-50%,-50%) scale(.2);opacity:0}}
        @keyframes hyL{to{transform:rotateY(-108deg)}}
        @keyframes hyR{to{transform:rotateY(108deg)}}
      `}</style>
    </div>
  )
}

/** Small double-happiness characters drifting down once, after the doors open */
function HyRain({ on }: { on: boolean }) {
  const IV = useIV()
  const bits = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ left: i % 2 ? 84 + ((i * 7) % 12) : 3 + ((i * 5) % 12), delay: i * 0.3, dur: 4 + (i % 3), size: 14 + (i % 3) * 4, rot: (i * 37) % 60 - 30 })), [])
  if (!on) return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span key={i} className="absolute -top-10 hy-fall" style={{ left: `${b.left}%`, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, ["--r" as any]: `${b.rot}deg` }}>
          <Hy size={b.size} color={IV.gold[1]} />
        </span>
      ))}
      <style>{`.hy-fall{opacity:0;animation:hyFall linear forwards}@keyframes hyFall{0%{opacity:0;transform:translateY(0) rotate(var(--r))}10%{opacity:.9}100%{opacity:0;transform:translateY(105svh) rotate(calc(var(--r) * -1))}}@media (prefers-reduced-motion: reduce){.hy-fall{display:none}}`}</style>
    </div>
  )
}

export function HyHero({ event, start, opened }: HeroProps) {
  const IV = useIV()
  const gold = IV.gold
  const foil: React.CSSProperties = { backgroundImage: `linear-gradient(100deg, ${gold[2]} 0%, ${gold[0]} 35%, ${gold[1]} 60%, ${gold[0]} 80%, ${gold[2]} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
  return (
    <section className="relative min-h-[100svh] overflow-hidden flex flex-col items-center justify-center text-center px-8 py-16" style={{ background: Lacquer({ IV }) }}>
      <Cloud color={gold[1]} className="absolute top-6 left-4 w-28 opacity-40" />
      <Cloud color={gold[1]} className="absolute top-6 right-4 w-28 opacity-40" flip />
      <HyRain on={opened} />
      <div style={{ borderColor: gold[1], ...enter(opened, 0) }} className="w-[112px] h-[112px] rounded-full flex items-center justify-center border">
        <Hy size={78} color={gold[1]} />
      </div>
      <p className="mt-6 text-[17px]" style={{ color: gold[0], fontFamily: CAPS, fontWeight: 600, ...enter(opened, 1) }}>
        Lễ thành hôn
      </p>
      <h1 className="mt-4 leading-[1.05] uppercase" style={{ fontFamily: DISPLAY, fontWeight: 600, letterSpacing: "0.04em" }}>
        <span className="block text-[44px] pb-1" style={{ ...foil, ...enter(opened, 2) }}>
          {event.bride_name}
        </span>
        <span className="block text-[26px] my-1 normal-case" style={{ color: gold[1], fontStyle: "italic", ...enter(opened, 3) }}>
          và
        </span>
        <span className="block text-[44px] pb-1" style={{ ...foil, ...enter(opened, 4) }}>
          {event.groom_name}
        </span>
      </h1>
      <div className="mt-8 w-full max-w-[340px]" style={enter(opened, 5)}>
        <EventDate start={start} tone="dark" />
      </div>
      <div className="absolute inset-x-0 bottom-0 px-6 pb-6 opacity-70">
        <Fret color={gold[1]} />
      </div>
    </section>
  )
}

export function HyTitle({ children }: { children: React.ReactNode; kicker?: string }) {
  const IV = useIV()
  const onDark = IV.paper === IV.deep
  return (
    <div className="text-center mb-7">
      <h2 className="text-[30px] leading-tight" style={{ fontFamily: CAPS, fontWeight: 600, color: onDark ? IV.gold[0] : IV.wine }}>
        {children}
      </h2>
      <div className="mx-auto mt-3 w-16 h-[5px] border-y" style={{ borderColor: IV.gold[1] }} />
    </div>
  )
}

// ---------------------------------------------------------------- Thước phim (glass)

export function FilmIntro({ event, cover, onOpened, onReveal }: IntroProps) {
  const IV = useIV()
  const { phase, tap } = useOpening(1500, onOpened, onReveal, 1300)
  return (
    <div className={"fixed inset-0 z-50 overflow-hidden cursor-pointer select-none fm-intro " + (phase !== "idle" ? "fm-run " : "") + (phase === "out" ? "fm-out" : "")} style={{ background: "#000" }} onClick={tap} role="button" aria-label="Mở thiệp mời">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[520px] overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover fm-photo" />
        ) : (
          <div className="absolute inset-0 fm-photo" style={{ background: IV.deep }} />
        )}
        <div className="absolute inset-x-0 top-0 h-[47%] bg-black fm-bar-t" />
        <div className="absolute inset-x-0 bottom-0 h-[47%] bg-black fm-bar-b" />
        <div className="absolute inset-x-0 top-[23%] text-center text-white fm-title">
          <p className="text-[34px] leading-tight" style={{ fontFamily: DISPLAY }}>
            {event.bride_name} &amp; {event.groom_name}
          </p>
        </div>
        <TapHint hidden={phase !== "idle"} className="bottom-[10%]" />
      </div>
      <style>{`
        .fm-photo{transform:scale(1.1);filter:brightness(.7)}
        .fm-run .fm-bar-t{animation:fmT 1.3s cubic-bezier(.7,0,.2,1) forwards}
        .fm-run .fm-bar-b{animation:fmB 1.3s cubic-bezier(.7,0,.2,1) forwards}
        .fm-run .fm-photo{transition:transform 1.6s cubic-bezier(.2,.7,.2,1),filter 1.6s;transform:scale(1.04);filter:brightness(1)}
        .fm-run .fm-title{opacity:0;transition:opacity .4s}
        .fm-intro{transition:opacity .6s ease}
        .fm-out{opacity:0;pointer-events:none}
        @keyframes fmT{to{transform:translateY(-100%)}}
        @keyframes fmB{to{transform:translateY(100%)}}
      `}</style>
    </div>
  )
}

export function FilmHero({ event, cover, start, opened }: HeroProps) {
  const IV = useIV()
  return (
    <section className="relative min-h-[100svh] overflow-hidden flex flex-col justify-end text-white" style={{ background: IV.deep }}>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover fm-ken" />
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.82) 0%, rgba(0,0,0,.35) 45%, rgba(0,0,0,0) 70%)" }} />
      <div className="relative px-7 pb-16">
        <p className="text-[17px] text-white/85" style={enter(opened, 0)}>
          Chúng mình cưới
        </p>
        <h1 className="mt-2 text-[50px] leading-[1.02]" style={{ fontFamily: DISPLAY, fontWeight: 500 }}>
          <span className="block" style={enter(opened, 1)}>
            {event.bride_name}
          </span>
          <span className="block" style={enter(opened, 2)}>
            &amp; {event.groom_name}
          </span>
        </h1>
        <div className="mt-6 flex items-end gap-4" style={enter(opened, 3)}>
          <p className="text-[30px] leading-none tabular-nums" style={{ fontFamily: DISPLAY }}>
            {dotDate(start)}
          </p>
        </div>
        {start && (
          <p className="mt-2 text-[14px] text-white/75" style={enter(opened, 4)}>
            {lunarLine(start)}
            {event.venue_name ? `, ${event.venue_name}` : ""}
          </p>
        )}
      </div>
      <style>{`.fm-ken{animation:fmKen 14s ease-out both}@keyframes fmKen{from{transform:scale(1.04)}to{transform:scale(1.12)}}@media (prefers-reduced-motion: reduce){.fm-ken{animation:none}}`}</style>
    </section>
  )
}

export function FilmTitle({ children }: { children: React.ReactNode; kicker?: string }) {
  const IV = useIV()
  const onDark = IV.paper === IV.deep
  return (
    <div className="text-center mb-7">
      <h2 className="text-[34px] leading-tight" style={{ fontFamily: DISPLAY, fontWeight: 500, color: onDark ? IV.gold[0] : IV.ink }}>
        {children}
      </h2>
      <div className="mx-auto mt-3 h-px w-10" style={{ background: onDark ? IV.gold[1] : IV.wine }} />
    </div>
  )
}

// ---------------------------------------------------------------- Tạp chí (emboss)

function Masthead({ event }: { event: any }) {
  const names = [event.bride_name, event.groom_name].filter(Boolean).join(" & ")
  const size = names.length > 16 ? 44 : names.length > 11 ? 56 : 68
  return (
    <p className="leading-[0.9] tracking-[-0.02em] uppercase" style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: size }}>
      {names}
    </p>
  )
}

export function MagIntro({ event, cover, date, onOpened, onReveal }: IntroProps) {
  const IV = useIV()
  const { phase, tap } = useOpening(1300, onOpened, onReveal, 250)
  return (
    <div className={"fixed inset-0 z-50 overflow-hidden cursor-pointer select-none mg-intro " + (phase !== "idle" ? "mg-run " : "") + (phase === "out" ? "mg-out" : "")} style={{ background: phase === "idle" ? IV.bg : "transparent" }} onClick={tap} role="button" aria-label="Mở thiệp mời">
      <TapHint hidden={phase !== "idle"} className="bottom-[3%]" />
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[520px]" style={{ perspective: 1600 }}>
        <div className="absolute inset-0 mg-cover overflow-hidden" style={{ transformOrigin: "0 50%", background: IV.deep }}>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,.55))" }} />
          <div className="absolute inset-x-6 top-8 text-white text-center">
            <Masthead event={event} />
          </div>
          <div className="absolute left-6 bottom-20 text-white max-w-[70%]">
            <p className="text-[13px] font-medium" style={{ color: IV.gold[0] }}>
              Số đặc biệt
            </p>
            <p className="text-[26px] leading-tight mt-1" style={{ fontFamily: DISPLAY, fontStyle: "italic" }}>
              Ngày chung đôi {date}
            </p>
            {event.venue_name && <p className="text-[14px] mt-2 text-white/85">{event.venue_name}</p>}
          </div>
          <div className="absolute inset-y-0 right-0 w-10" style={{ background: "linear-gradient(to left, rgba(0,0,0,.25), rgba(0,0,0,0))" }} />

        </div>
      </div>
      <style>{`
        .mg-run .mg-cover{animation:mgTurn 1.15s cubic-bezier(.55,.05,.3,1) forwards}
        .mg-intro{transition:opacity .6s ease}
        .mg-out{opacity:0;pointer-events:none}
        @keyframes mgTurn{0%{transform:rotateY(0);box-shadow:0 0 0 rgba(0,0,0,0)}60%{box-shadow:-30px 0 60px rgba(0,0,0,.35)}100%{transform:rotateY(-100deg)}}
      `}</style>
    </div>
  )
}

export function MagHero({ event, cover, second, start, opened }: HeroProps) {
  const IV = useIV()
  const photo = second || cover
  return (
    <section className="relative min-h-[100svh] px-7 pt-12 pb-14 flex flex-col" style={{ background: IV.paper }}>
      <div className="flex items-baseline justify-between text-[13px]" style={{ color: IV.muted, ...enter(opened, 0) }}>
        <span>Thư mời cưới</span>
        <span>{dotDate(start)}</span>
      </div>
      <div className="h-px mt-3" style={{ background: IV.ink }} />
      {start && (
        <div className="mt-6 flex items-start gap-3" style={enter(opened, 1)}>
          <span className="text-[132px] leading-[0.8] tabular-nums" style={{ fontFamily: DISPLAY, color: IV.wine }}>
            {String(start.getDate()).padStart(2, "0")}
          </span>
          <span className="pt-2 text-[22px] leading-tight" style={{ fontFamily: DISPLAY, color: IV.ink }}>
            tháng {start.getMonth() + 1}
            <br />
            {start.getFullYear()}
          </span>
        </div>
      )}
      <h1 className="mt-8 text-[44px] leading-[1.02]" style={{ fontFamily: DISPLAY, color: IV.ink }}>
        <span className="block" style={enter(opened, 2)}>
          {event.bride_name}
        </span>
        <span className="block" style={enter(opened, 3)}>
          <i>và</i> {event.groom_name}
        </span>
      </h1>
      {start && (
        <p className="mt-3 text-[15px]" style={{ color: IV.muted, ...enter(opened, 4) }}>
          {lunarLine(start)}
        </p>
      )}
      {photo && (
        <div className="mt-8 -mx-7" style={enter(opened, 5)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="w-full aspect-[4/5] object-cover" />
          {event.venue_name && (
            <p className="mt-3 px-7 text-[14px] italic" style={{ fontFamily: DISPLAY, color: IV.muted }}>
              {event.venue_name}
            </p>
          )}
        </div>
      )}
    </section>
  )
}

export function MagTitle({ children }: { children: React.ReactNode; kicker?: string }) {
  const IV = useIV()
  const onDark = IV.paper === IV.deep
  const c = onDark ? IV.gold[0] : IV.ink
  return (
    <div className="mb-7">
      <h2 className="text-[36px] leading-[1.05] text-left" style={{ fontFamily: DISPLAY, color: c }}>
        {children}
      </h2>
    </div>
  )
}
