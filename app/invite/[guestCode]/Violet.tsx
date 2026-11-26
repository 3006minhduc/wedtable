"use client"

// "Vườn tím" (violet garden, gold columns). Style study of the user's reference video 9 (style only):
// a scallop-edged gatefold printed with tulips, tied with a cream ribbon and a gold wax heart; the
// gates swing open onto screen-sized "pages" on a silver ground: cream frames with cut corners,
// purple roses climbing up the sides as each page arrives, a gilded fountain under a glass dome,
// gold columns wrapped in roses, an oval wreath, gold butterflies drifting across, and every line of
// text arriving one after another. All drawings are generated here.
import { useMemo, useState } from "react"
import { lunarLine } from "@/lib/lunar"
import { videoEmbed } from "@/lib/videoEmbed"
import type { Palette } from "@/lib/inviteThemes"
import { LineIcon } from "./Ivory"
import { PaletteProvider } from "./Ornaments"
import { GiftAccounts, Guestbook, Milestones } from "./Sections"
import { FaqList, MusicToggle } from "./Extras"
import { Lightbox } from "./Album"
import { Core, Raised, RsvpForm, eventStart, googleCalendarUrl, p2, useCountdown, useOpening, useSeen, weekday } from "./kit"

const C = {
  plum: "#4E2A4F",
  purple: "#6B3B6E",
  rose1: "#5E1A60",
  rose2: "#86368A",
  rose3: "#B56BB7",
  leaf: "#7F8A6A",
  leafDark: "#56603F",
  gold: "#C9A15A",
  goldLight: "#EBD29A",
  goldDark: "#8C6A2F",
  cream: "#F8F0E8",
  silverTop: "#D4D3D9",
  silverBot: "#F1F1F3",
  ink: "#3C2440",
  muted: "#7A6A7C",
  line: "#E3D6DE",
}
const PAL: Palette = {
  bg: C.cream,
  paper: "#FFFFFF",
  blush: "#F1E4EE",
  rose: C.rose2,
  wine: C.purple,
  sage: C.leaf,
  leaf: C.purple,
  ink: C.ink,
  muted: C.muted,
  line: C.line,
  soft: "#FBF6F2",
  okBg: "#F1E8F1",
  deep: C.plum,
  gold: [C.goldLight, C.gold, C.goldDark],
}
const INK_PAL: Palette = { ...PAL, ink: C.purple }

const SCRIPT = "var(--iv-pinyon), cursive"
const SC = "var(--iv-sc), serif"
const SERIF = "var(--iv-serif), serif"
const SILVER = `linear-gradient(180deg, ${C.silverTop}, ${C.silverBot} 55%, #E4E3E8)`

// ---------------------------------------------------------------- drawings

export function VioletDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <radialGradient id="vtR1" cx="40%" cy="35%" r="75%">
          <stop offset="0" stopColor={C.rose3} />
          <stop offset=".6" stopColor={C.rose2} />
          <stop offset="1" stopColor={C.rose1} />
        </radialGradient>
        <radialGradient id="vtR2" cx="45%" cy="40%" r="70%">
          <stop offset="0" stopColor={C.rose2} />
          <stop offset="1" stopColor="#3E0E40" />
        </radialGradient>
        <linearGradient id="vtGold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.goldDark} />
          <stop offset=".35" stopColor={C.goldLight} />
          <stop offset=".6" stopColor={C.gold} />
          <stop offset="1" stopColor={C.goldDark} />
        </linearGradient>
        <linearGradient id="vtLeaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A4AE8C" />
          <stop offset="1" stopColor={C.leafDark} />
        </linearGradient>
      </defs>
    </svg>
  )
}

/** A purple rose seen from the front: rings of rounded petals around a tight bud */
function Rose({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d="M0 -2 C -12 -4 -16 -18 -6 -22 C -2 -24 2 -24 6 -22 C 16 -18 12 -4 0 -2Z" transform={`rotate(${a})`} fill="url(#vtR1)" stroke={C.rose1} strokeWidth=".6" />
      ))}
      {[36, 108, 180, 252, 324].map((a) => (
        <path key={"b" + a} d="M0 -2 C -12 -4 -16 -18 -6 -22 C -2 -24 2 -24 6 -22 C 16 -18 12 -4 0 -2Z" transform={`rotate(${a}) scale(.62)`} fill="url(#vtR2)" stroke={C.rose1} strokeWidth=".6" />
      ))}
      <path d="M-5 0 C -5 -7 5 -7 5 0 C 5 4 -1 5 -2 1" fill="none" stroke="#2C0830" strokeWidth="1.1" />
    </g>
  )
}
function Leaf({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0 C 8 -6 20 -6 28 0 C 20 6 8 6 0 0Z" fill="url(#vtLeaf)" />
      <path d="M2 0 H26" stroke="#4A5236" strokeWidth=".6" />
    </g>
  )
}
function Bud({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M-5 2 C -7 -6 -1 -11 0 -12 C 1 -11 7 -6 5 2 C 2 5 -2 5 -5 2Z" fill="url(#vtR2)" />
      <path d="M-5 2 C -3 7 3 7 5 2 C 2 1 -2 1 -5 2Z" fill="url(#vtLeaf)" />
    </g>
  )
}

/** A climbing rose vine: a wavy stem from (0,h) upwards with leaves, buds and roses along it.
 *  Grows when `on` (stem draws, flowers pop in order). */
function Vine({ h, flip = false, on, seed = 1, roses = 6 }: { h: number; flip?: boolean; on: boolean; seed?: number; roses?: number }) {
  const parts = useMemo(() => {
    let k = seed
    const rnd = () => ((k = (k * 9301 + 49297) % 233280) / 233280)
    const pts: [number, number][] = []
    for (let i = 0; i <= 12; i++) pts.push([30 + Math.sin(i * 1.3 + seed) * 16, h - (i / 12) * (h - 20)])
    let d = `M${pts[0][0]} ${pts[0][1]}`
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]
      d += ` Q${x0 + (rnd() - 0.5) * 30} ${(y0 + y1) / 2} ${x1} ${y1}`
    }
    const items: { kind: "rose" | "leaf" | "bud"; x: number; y: number; s: number; r: number; i: number }[] = []
    pts.forEach(([x, y], i) => {
      if (i === 0) return
      items.push({ kind: "leaf", x, y, s: 0.9 + rnd() * 0.5, r: (i % 2 ? 200 : -20) + rnd() * 30, i })
      if (i % 2 === 0 && items.filter((t) => t.kind === "rose").length < roses) items.push({ kind: "rose", x: x + (rnd() - 0.5) * 18, y, s: 0.55 + rnd() * 0.45, r: rnd() * 60, i })
      else if (i % 3 === 0) items.push({ kind: "bud", x: x + 10, y: y - 8, s: 1, r: 20 + rnd() * 40, i })
    })
    return { d, items }
  }, [h, seed, roses])
  return (
    <svg viewBox={`0 0 70 ${h}`} width="70" height={h} style={{ transform: flip ? "scaleX(-1)" : undefined, overflow: "visible" }} aria-hidden>
      <path d={parts.d} fill="none" stroke={C.leafDark} strokeWidth="2" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={on ? 0 : 1} style={{ transition: "stroke-dashoffset 2.4s ease" }} />
      {parts.items.map((it, n) => {
        const delay = 0.2 + (it.i / 12) * 2
        const el = it.kind === "rose" ? <Rose x={0} y={0} s={it.s} r={it.r} /> : it.kind === "bud" ? <Bud x={0} y={0} r={it.r} /> : <Leaf x={0} y={0} s={it.s} r={it.r} />
        return (
          <g key={n} transform={`translate(${it.x} ${it.y})`}>
            <g style={{ transform: on ? "scale(1)" : "scale(0)", transformBox: "fill-box", transformOrigin: "center", transition: `transform .6s cubic-bezier(.3,1.5,.5,1) ${delay}s` }}>{el}</g>
          </g>
        )
      })}
    </svg>
  )
}

/** A corner spray: three roses with buds and leaves, ~110px; grows in when `on` */
function Corner({ on, rot = 0, flip = false, delay = 0, size = 120 }: { on: boolean; rot?: number; flip?: boolean; delay?: number; size?: number }) {
  return (
    <svg viewBox="-60 -60 120 120" width={size} height={size} aria-hidden style={{ overflow: "visible", transform: `rotate(${rot}deg) scaleX(${flip ? -1 : 1}) scale(${on ? 1 : 0.3})`, opacity: on ? 1 : 0, transition: `transform .9s cubic-bezier(.3,1.4,.5,1) ${delay}s, opacity .6s ease ${delay}s` }}>
      <Leaf x={-30} y={4} s={1.3} r={160} />
      <Leaf x={8} y={10} s={1.2} r={30} />
      <Leaf x={-6} y={-30} s={1.1} r={-110} />
      <Leaf x={22} y={-14} s={1} r={-30} />
      <Bud x={-40} y={-22} s={1.2} r={-50} />
      <Bud x={36} y={16} s={1.1} r={70} />
      <Rose x={18} y={-20} s={0.75} r={20} />
      <Rose x={-22} y={18} s={0.85} r={-30} />
      <Rose x={0} y={0} s={1.15} r={10} />
    </svg>
  )
}

/** Gold butterflies drifting slowly across the page (few, behind the text) */
function Butterflies({ n = 5 }: { n?: number }) {
  const bs = useMemo(() => Array.from({ length: n }, (_, i) => ({ top: 8 + ((i * 37) % 80), dur: 18 + (i % 3) * 6, delay: -i * 4.3, s: 0.7 + (i % 3) * 0.2, dir: i % 2 ? 1 : -1 })), [n])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden vt-bflies" aria-hidden>
      {bs.map((b, i) => (
        <span key={i} className="absolute" style={{ top: `${b.top}%`, left: b.dir > 0 ? "-10%" : "110%", animation: `vtFly${b.dir > 0 ? "R" : "L"} ${b.dur}s linear ${b.delay}s infinite` }}>
          <svg width={26 * b.s} height={22 * b.s} viewBox="-13 -11 26 22" style={{ animation: "vtFlap .5s ease-in-out infinite alternate", transformOrigin: "center", display: "block", transform: b.dir < 0 ? "scaleX(-1)" : undefined }}>
            <path d="M0 0 C -4 -10 -13 -11 -12 -3 C -11 2 -4 3 0 0 C -3 3 -9 8 -6 10 C -3 11 -1 5 0 0Z" fill="url(#vtGold)" />
            <path d="M0 0 C 4 -10 13 -11 12 -3 C 11 2 4 3 0 0 C 3 3 9 8 6 10 C 3 11 1 5 0 0Z" fill="url(#vtGold)" />
            <path d="M0 -4 V5" stroke={C.goldDark} strokeWidth="1.2" />
          </svg>
        </span>
      ))}
    </div>
  )
}

function Fountain() {
  return (
    <svg viewBox="0 0 140 120" width="130" aria-hidden>
      <path d="M20 112 C 20 40 120 40 120 112" fill="rgba(255,255,255,.35)" stroke="#BFC3CC" strokeWidth="1.4" />
      <path d="M34 112 C 34 56 106 56 106 112" fill="none" stroke="#fff" strokeWidth="1" opacity=".7" />
      <rect x="62" y="20" width="16" height="8" rx="3" fill="#E9EEF3" stroke="#BFC3CC" />
      <g fill="url(#vtGold)" stroke={C.goldDark} strokeWidth=".6">
        <path d="M48 70 H92 L86 78 H54Z" />
        <path d="M64 78 H76 V96 H64Z" />
        <path d="M58 56 H82 L78 62 H62Z" />
        <path d="M67 40 H73 V56 H67Z" />
        <path d="M40 96 H100 L96 104 H44Z" />
        <circle cx="70" cy="38" r="4" />
      </g>
      <path d="M70 34 C 66 26 60 24 56 30 M70 34 C 74 26 80 24 84 30" fill="none" stroke="#9FC4E0" strokeWidth="1.2" />
      <rect x="16" y="110" width="108" height="6" rx="3" fill="#E3E4EA" stroke="#BFC3CC" />
    </svg>
  )
}

function Column({ h }: { h: number }) {
  return (
    <svg viewBox={`0 0 44 ${h}`} width="44" height={h} aria-hidden>
      <rect x="4" y="0" width="36" height="14" fill="url(#vtGold)" />
      <path d={`M2 14 H42 L38 22 H6Z`} fill="url(#vtGold)" />
      <rect x="9" y="22" width="26" height={h - 44} fill="url(#vtGold)" />
      {[13, 19, 25, 31].map((x) => (
        <path key={x} d={`M${x} 24 V${h - 24}`} stroke={C.goldDark} strokeWidth="1" opacity=".55" />
      ))}
      <path d={`M6 ${h - 22} H38 L42 ${h - 12} H2Z`} fill="url(#vtGold)" />
      <rect x="0" y={h - 12} width="44" height="12" fill="url(#vtGold)" />
    </svg>
  )
}

/** Cream card with concave cut corners (the bracket shape of the reference) */
const BRACKET = "polygon(18px 0, calc(100% - 18px) 0, calc(100% - 18px) 4px, calc(100% - 4px) 18px, 100% 18px, 100% calc(100% - 18px), calc(100% - 4px) calc(100% - 18px), calc(100% - 18px) calc(100% - 4px), calc(100% - 18px) 100%, 18px 100%, 18px calc(100% - 4px), 4px calc(100% - 18px), 0 calc(100% - 18px), 0 18px, 4px 18px, 18px 4px)"

/** Lines of text arriving one by one (soft blur → sharp) */
function Lines({ on, children, start = 0.2, step = 0.18, className = "" }: { on: boolean; children: React.ReactNode[]; start?: number; step?: number; className?: string }) {
  return (
    <div className={className}>
      {children.filter(Boolean).map((c, i) => (
        <div key={i} style={{ opacity: on ? 1 : 0, filter: on ? "none" : "blur(6px)", transform: on ? "none" : "translateY(6px)", transition: `opacity .9s ease ${start + i * step}s, filter .9s ease ${start + i * step}s, transform .9s ease ${start + i * step}s` }}>
          {c}
        </div>
      ))}
    </div>
  )
}

/** One screen-sized page: silver ground, cream frame, vines growing up both sides */
function Page({ children, frame = "bracket", roses = 6, minH = true, className = "" }: { children: (on: boolean) => React.ReactNode; frame?: "bracket" | "arch" | "oval" | "columns"; roses?: number; minH?: boolean; className?: string }) {
  const [ref, on] = useSeen<HTMLElement>(0.28)
  const vh = 560
  return (
    <section ref={ref as any} className={"relative flex items-center justify-center px-4 py-12 overflow-hidden " + (minH ? "min-h-[100svh] " : "") + className} style={{ background: SILVER }}>
      <div className="absolute left-0 bottom-0 pointer-events-none" style={{ height: vh }}>
        <Vine h={vh} on={on} seed={3} roses={roses} />
      </div>
      <div className="absolute right-0 bottom-0 pointer-events-none" style={{ height: vh }}>
        <Vine h={vh} on={on} seed={8} roses={roses} flip />
      </div>
      {frame === "columns" && (
        <>
          <div className="absolute left-3 bottom-8 pointer-events-none vt-col" style={{ transform: on ? "none" : "translateY(40px)", opacity: on ? 1 : 0, transition: "transform 1.2s ease, opacity 1s ease" }}>
            <Column h={460} />
          </div>
          <div className="absolute right-3 bottom-8 pointer-events-none" style={{ transform: on ? "none" : "translateY(40px)", opacity: on ? 1 : 0, transition: "transform 1.2s ease .1s, opacity 1s ease .1s" }}>
            <Column h={460} />
          </div>
        </>
      )}
      <Raised max={5} thick={1.3} className="w-full max-w-[340px]"><div className="relative w-full max-w-[340px]">
      <div
        className="relative w-full text-center flex flex-col justify-center"
        style={{
          minHeight: frame === "oval" ? 520 : "62svh",
          background: C.cream,
          clipPath: frame === "bracket" || frame === "columns" ? BRACKET : undefined,
          borderRadius: frame === "arch" ? "170px 170px 10px 10px" : frame === "oval" ? "50%" : undefined,
          padding: frame === "oval" ? "84px 38px" : frame === "arch" ? "70px 26px 34px" : "40px 26px",
          boxShadow: `0 0 0 1px ${C.gold}, inset 0 2px 3px rgba(255,255,255,.85), inset 0 -2px 4px rgba(60,30,40,.12), inset 3px 0 6px rgba(60,30,40,.06), inset -3px 0 6px rgba(60,30,40,.06)`,
          outline: frame === "bracket" || frame === "columns" ? `1px solid ${C.gold}` : undefined,
          opacity: on ? 1 : 0,
          transform: on ? "none" : "scale(.97)",
          transition: "opacity .9s ease, transform 1s ease",
        }}
      >
        {children(on)}
      </div>
      {frame !== "columns" && (
        <>
          <div className="absolute -top-12 -left-10 pointer-events-none">
            <Corner on={on} rot={-10} delay={0.5} />
          </div>
          <div className="absolute -top-12 -right-10 pointer-events-none">
            <Corner on={on} rot={10} flip delay={0.65} />
          </div>
        </>
      )}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 pointer-events-none">
        <Corner on={on} rot={180} delay={0.8} size={130} />
      </div>
      </div></Raised>
    </section>
  )
}

const kick = "text-[13px] tracking-[0.28em] uppercase"
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className={kick} style={{ fontFamily: SC, fontWeight: 700, color: C.gold }}>
      {children}
    </p>
  )
}
function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[44px] leading-[1.05]" style={{ fontFamily: SCRIPT, color: C.purple }}>
      {children}
    </h2>
  )
}
function Btn({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-11 px-5 rounded-full text-[13px] tracking-[0.14em] uppercase" style={{ background: C.purple, color: C.cream, fontFamily: SC, fontWeight: 700 }}>
      {children}
    </a>
  )
}

// ---------------------------------------------------------------- opening: the gatefold

function Tulip({ x, y, s = 1, r = 0, c = "#9A6BB0" }: { x: number; y: number; s?: number; r?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0 C 2 14 0 30 -2 44" stroke="#6E8456" strokeWidth="1.6" fill="none" />
      <path d="M-1 30 C -14 24 -18 12 -16 4 C -8 10 -4 18 -1 30Z" fill="#7E9466" />
      <path d="M-9 0 C -12 -10 -8 -18 -4 -20 C -2 -14 0 -12 0 -12 C 0 -12 2 -14 4 -20 C 8 -18 12 -10 9 0 C 5 5 -5 5 -9 0Z" fill={c} />
      <path d="M-3 -2 C -4 -10 -2 -16 0 -18 C 2 -16 4 -10 3 -2Z" fill="#fff" opacity=".18" />
    </g>
  )
}

function GatePanel({ side }: { side: "l" | "r" }) {
  const tulips = useMemo(() => {
    let k = side === "l" ? 5 : 11
    const rnd = () => ((k = (k * 9301 + 49297) % 233280) / 233280)
    return Array.from({ length: 16 }, () => ({ x: 20 + rnd() * 180, y: 40 + rnd() * 740, s: 0.8 + rnd() * 0.7, r: (rnd() - 0.5) * 40, c: ["#9A6BB0", "#B48AC6", "#7D4E95", "#C9A8D6"][Math.floor(rnd() * 4)] }))
  }, [side])
  // scalloped inner edge: round bites along the edge where the two gates meet
  const mask = `radial-gradient(circle 13px at ${side === "l" ? "100%" : "0"} 50%, transparent 97%, #000 100%) 0 0 / 100% 44px repeat-y`
  return (
    <div className={"absolute inset-y-0 w-1/2 vt-gate vt-gate-" + side} style={{ [side === "l" ? "left" : "right"]: 0, transformOrigin: side === "l" ? "0 50%" : "100% 50%" } as any}>
      <div className="absolute inset-0" style={{ WebkitMask: mask, mask, background: `radial-gradient(120% 60% at ${side === "l" ? "30%" : "70%"} 40%, ${C.purple}, ${C.plum})`, boxShadow: "inset 0 0 60px rgba(0,0,0,.25)" }}>
        <svg viewBox="0 0 240 820" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden>
          {tulips.map((t, i) => (
            <Tulip key={i} {...t} />
          ))}
          {Array.from({ length: 40 }, (_, i) => (
            <circle key={"d" + i} cx={(i * 53) % 240} cy={(i * 97) % 820} r={1.2} fill="#fff" opacity=".55" />
          ))}
        </svg>
      </div>
    </div>
  )
}

export function VioletIntro({ core, onOpened, onReveal }: { core: Core; onOpened: () => void; onReveal: () => void }) {
  const { phase, tap } = useOpening(2900, onOpened, 1300, onReveal)
  return (
    <div className={"fixed inset-0 z-50 overflow-hidden select-none vt-intro " + (phase !== "idle" ? "vt-run " : "") + (phase === "out" ? "vt-out" : "")} onClick={tap} role="button" aria-label="Mở thiệp mời">
      <VioletDefs />
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[480px]" style={{ perspective: 1300 }}>
        <GatePanel side="l" />
        <GatePanel side="r" />
        {/* ribbon + wax heart */}
        <div className="absolute inset-x-0 top-[50%] -translate-y-1/2 h-[46px] vt-ribbon" style={{ background: `linear-gradient(180deg, rgba(0,0,0,.08), rgba(255,255,255,.55) 45%, rgba(0,0,0,.06)), #EFE6D8`, boxShadow: "0 6px 10px rgba(0,0,0,.25)" }}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92px] h-[92px] rounded-full flex items-center justify-center" style={{ background: `radial-gradient(circle at 35% 30%, ${C.goldLight}, ${C.gold} 55%, ${C.goldDark})`, boxShadow: "0 6px 12px rgba(0,0,0,.35), inset 0 0 0 6px rgba(255,255,255,.18)" }}>
            <svg viewBox="0 0 40 36" width="38" aria-hidden>
              <path d="M20 34 C 4 22 0 14 4 7 C 8 0 16 2 20 9 C 24 2 32 0 36 7 C 40 14 36 22 20 34Z" fill={C.goldDark} opacity=".75" />
            </svg>
          </div>
        </div>
        <div className="absolute inset-x-0 top-[17%] text-center pointer-events-none vt-who">
          <p className="text-[26px]" style={{ fontFamily: SCRIPT, color: C.goldLight }}>
            Kính gửi
          </p>
          <p className="mt-1 text-[18px] tracking-[0.1em] px-6" style={{ fontFamily: SC, fontWeight: 700, color: "#fff" }}>
            {core.guest.name}
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-[7%] flex justify-center pointer-events-none vt-hint">
          <span className="rounded-full px-5 py-2.5 text-[12px] tracking-[0.2em] uppercase" style={{ background: "rgba(248,240,232,.9)", color: C.purple, fontFamily: SC, fontWeight: 700 }}>
            Chạm để mở thiệp
          </span>
        </div>
      </div>
      <style>{`
        .vt-intro{transition:opacity .6s ease}
        .vt-out{opacity:0;pointer-events:none}
        .vt-ribbon{transition:transform .9s cubic-bezier(.6,0,.3,1),opacity .4s ease .7s}
        .vt-run .vt-ribbon{transform:translate(110%,-50%);opacity:0}
        .vt-gate{transition:transform 1.6s cubic-bezier(.55,.05,.25,1) .8s}
        .vt-run .vt-gate-l{transform:rotateY(-104deg)}
        .vt-run .vt-gate-r{transform:rotateY(104deg)}
        .vt-who,.vt-hint{transition:opacity .4s ease}
        .vt-run .vt-who,.vt-run .vt-hint{opacity:0}
        .vt-hint span{animation:vtNudge 2.2s ease-in-out infinite}
        @keyframes vtNudge{50%{transform:translateY(-3px)}}
        @media (prefers-reduced-motion: reduce){.vt-hint span{animation:none}}
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------- cover page

function Cover({ c, opened }: { c: { bride: string; groom: string; start: Date | null }; opened: boolean }) {
  const s = c.start
  const ini = (n: string) => (n.split(/\s+/).pop() || "").charAt(0)
  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-4 pt-10 pb-4 overflow-hidden" style={{ background: SILVER }}>
      <div className="absolute left-0 bottom-0 pointer-events-none" style={{ height: 620 }}>
        <Vine h={620} on={opened} seed={2} roses={7} />
      </div>
      <div className="absolute right-0 bottom-0 pointer-events-none" style={{ height: 620 }}>
        <Vine h={620} on={opened} seed={9} roses={7} flip />
      </div>
      <Raised max={5} thick={1.4} className="w-full max-w-[320px]"><div className="relative w-full max-w-[320px]">
      <div className="relative w-full text-center px-6 pt-14 pb-6 flex flex-col items-center" style={{ minHeight: "70svh", background: C.cream, clipPath: BRACKET, outline: `1px solid ${C.gold}` }}>
        <p className="text-[12px] tracking-[0.3em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: C.gold, opacity: opened ? 1 : 0, transition: "opacity 1s ease .4s" }}>
          Trân trọng báo tin lễ thành hôn
        </p>
        <div className="flex-1 flex flex-col justify-center">
        <Lines on={opened} start={0.6} step={0.35}>
          {[
            <p key="m" className="text-[78px] leading-[0.9]" style={{ fontFamily: SCRIPT, color: C.purple }}>
              {ini(c.bride)}
              <span className="text-[44px] mx-1" style={{ color: C.gold }}>
                &
              </span>
              {ini(c.groom)}
            </p>,
            <p key="n" className="mt-4 text-[19px] tracking-[0.12em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: C.ink }}>
              {c.bride} <span style={{ color: C.gold }}>|</span> {c.groom}
            </p>,
            s ? (
              <p key="d" className="mt-2 text-[14px] tracking-[0.18em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: C.muted }}>
                {weekday(s)} · {p2(s.getDate())}.{p2(s.getMonth() + 1)}.{s.getFullYear()}
              </p>
            ) : null,
          ]}
        </Lines>
        </div>
        <div className="relative" style={{ opacity: opened ? 1 : 0, transform: opened ? "none" : "translateY(20px)", transition: "opacity 1s ease 1.4s, transform 1.2s ease 1.4s" }}>
          <Fountain />
        </div>
      </div>
      <div className="absolute -top-14 -left-12 pointer-events-none">
        <Corner on={opened} rot={-10} delay={0.9} size={140} />
      </div>
      <div className="absolute -top-14 -right-12 pointer-events-none">
        <Corner on={opened} rot={10} flip delay={1.05} size={140} />
      </div>
      <div className="absolute -bottom-10 -left-12 pointer-events-none">
        <Corner on={opened} rot={200} delay={1.2} size={130} />
      </div>
      <div className="absolute -bottom-10 -right-12 pointer-events-none">
        <Corner on={opened} rot={160} flip delay={1.3} size={130} />
      </div>
      </div></Raised>
      <Butterflies n={5} />
    </section>
  )
}

// ---------------------------------------------------------------- the page

export function VioletPage({ core, opened }: { core: Core; opened: boolean }) {
  const s = core.start
  const cd = useCountdown(s)
  const [viewer, setViewer] = useState<number | null>(null)
  const video = videoEmbed(core.event.video_url)
  const album = core.gallery
  const tone = { ink: C.ink, muted: C.muted, line: C.line, field: "#FFFFFF", accent: C.purple, onAccent: C.cream, ok: C.purple, okBg: "#F1E8F1", palette: PAL }
  const q = core.mapQuery
  const families = [
    { k: "Nhà gái", v: core.event.bride_family, role: "Con gái", name: core.event.bride_full_name || core.bride },
    { k: "Nhà trai", v: core.event.groom_family, role: "Con trai", name: core.event.groom_full_name || core.groom },
  ]
  const hasFamilies = !!(core.event.bride_family || core.event.groom_family)

  return (
    <PaletteProvider value={PAL}>
      <VioletDefs />
      <div className="min-h-screen" style={{ background: "#E7E6EB", color: C.ink, fontFamily: SERIF }}>
        <main className="relative mx-auto max-w-[480px] overflow-hidden" style={{ boxShadow: "0 0 60px rgba(60,30,70,.15)" }}>
          <Cover c={core} opened={opened} />

          {/* invitation between gold columns */}
          <Page frame="columns" roses={5}>
            {(on) => (
              <Lines on={on} start={0.5} step={0.22}>
                {[
                  <p key="k" className="text-[26px]" style={{ fontFamily: SCRIPT, color: C.gold }}>
                    Trân trọng kính mời
                  </p>,
                  <p key="g" className="mt-1 text-[22px] tracking-[0.06em]" style={{ fontFamily: SC, fontWeight: 700, color: C.purple }}>
                    {core.guest.name}
                  </p>,
                  <div key="r" className="my-5 mx-auto w-16 h-px" style={{ background: C.gold }} />,
                  <p key="m" className="text-[17px] leading-relaxed">
                    {core.message}
                  </p>,
                ]}
              </Lines>
            )}
          </Page>

          {/* families */}
          {hasFamilies && (
            <Page frame="bracket" roses={5}>
              {(on) => (
                <Lines on={on} start={0.3} step={0.2}>
                  {[
                    <Kicker key="k">Hai gia đình</Kicker>,
                    <Title key="t">Trân trọng báo tin</Title>,
                    <div key="f" className="mt-6 flex flex-col gap-6">
                      {families.map((fm) => (
                        <div key={fm.k}>
                          <p className={kick} style={{ fontFamily: SC, fontWeight: 700, color: C.gold }}>
                            {fm.k}
                          </p>
                          <p className="mt-1 text-[16px] whitespace-pre-line leading-relaxed">{fm.v}</p>
                          {fm.name && (
                            <p className="mt-2 text-[28px] leading-tight" style={{ fontFamily: SCRIPT, color: C.purple }}>
                              {fm.role} {fm.name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>,
                  ]}
                </Lines>
              )}
            </Page>
          )}

          {/* the couple and the day, in an oval wreath */}
          <Page frame="oval" roses={7}>
            {(on) => (
              <Lines on={on} start={0.4} step={0.2}>
                {[
                  <p key="a" className="text-[24px] leading-tight tracking-[0.06em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: C.purple }}>
                    {core.event.bride_full_name || core.bride}
                  </p>,
                  <p key="amp" className="text-[30px]" style={{ fontFamily: SCRIPT, color: C.gold }}>
                    &
                  </p>,
                  <p key="b" className="text-[24px] leading-tight tracking-[0.06em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: C.purple }}>
                    {core.event.groom_full_name || core.groom}
                  </p>,
                  s ? (
                    <p key="d" className="mt-4 text-[15px] tracking-[0.12em] uppercase" style={{ fontFamily: SC, fontWeight: 700 }}>
                      {weekday(s)}, {p2(s.getDate())}.{p2(s.getMonth() + 1)}.{s.getFullYear()}
                    </p>
                  ) : null,
                  s ? (
                    <p key="t" className="text-[15px]" style={{ color: C.muted }}>
                      Giờ: {p2(s.getHours())}:{p2(s.getMinutes())} · {lunarLine(s)}
                    </p>
                  ) : null,
                  <p key="v" className="mt-3 text-[17px]" style={{ fontWeight: 500 }}>
                    {core.event.venue_name}
                  </p>,
                  core.event.venue_address ? (
                    <p key="va" className="text-[14px]" style={{ color: C.muted }}>
                      {core.event.venue_address}
                    </p>
                  ) : null,
                  <div key="btn" className="mt-4 flex flex-col gap-2 items-center">
                    {core.mapUrl && <Btn href={core.mapUrl}>Chỉ đường</Btn>}
                    {s && <Btn href={googleCalendarUrl(s, `Đám cưới ${core.couple}`, q)}>Lưu vào lịch</Btn>}
                  </div>,
                ]}
              </Lines>
            )}
          </Page>

          {/* ceremonies */}
          {core.ceremonies.length > 0 && (
            <Page frame="bracket" roses={5}>
              {(on) => (
                <Lines on={on} start={0.3} step={0.22}>
                  {[
                    <Kicker key="k">Lễ nghi</Kicker>,
                    <Title key="t">Các nghi lễ</Title>,
                    ...core.ceremonies.map((c, i) => {
                      const d = c.date ? new Date(`${c.date}T${c.time || "00:00"}:00`) : null
                      const qq = [c.place, c.address].filter(Boolean).join(", ")
                      return (
                        <div key={i} className="mt-6">
                          <p className="text-[30px] leading-tight" style={{ fontFamily: SCRIPT, color: C.purple }}>
                            {c.name}
                          </p>
                          {d && (
                            <p className="text-[14px] tracking-[0.12em] uppercase" style={{ fontFamily: SC, fontWeight: 700 }}>
                              {c.time} · {weekday(d)} {p2(d.getDate())}.{p2(d.getMonth() + 1)}
                            </p>
                          )}
                          <p className="text-[16px] mt-1">{c.place}</p>
                          {c.address && (
                            <p className="text-[14px]" style={{ color: C.muted }}>
                              {c.address}
                            </p>
                          )}
                          {qq && (
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(qq)}`} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[14px] underline underline-offset-4" style={{ color: C.purple }}>
                              Chỉ đường
                            </a>
                          )}
                        </div>
                      )
                    }),
                  ]}
                </Lines>
              )}
            </Page>
          )}

          {/* countdown */}
          {s && cd && !cd.over && (
            <Page frame="arch" roses={4}>
              {(on) => (
                <Lines on={on} start={0.3} step={0.2}>
                  {[
                    <Kicker key="k">Còn</Kicker>,
                    <div key="n" className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        [cd.d, "ngày"],
                        [cd.h, "giờ"],
                        [cd.m, "phút"],
                        [cd.s, "giây"],
                      ].map(([v, l]) => (
                        <div key={l as string} className="py-3" style={{ boxShadow: `inset 0 0 0 1px ${C.gold}`, borderRadius: 12 }}>
                          <p className="text-[34px] leading-none tabular-nums" style={{ fontFamily: SERIF, color: C.purple }}>
                            {p2(v as number)}
                          </p>
                          <p className="mt-1 text-[11px] tracking-[0.18em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: C.muted }}>
                            {l}
                          </p>
                        </div>
                      ))}
                    </div>,
                    <p key="t" className="mt-5 text-[30px]" style={{ fontFamily: SCRIPT, color: C.purple }}>
                      đến ngày chung đôi
                    </p>,
                  ]}
                </Lines>
              )}
            </Page>
          )}

          {/* programme between columns */}
          {core.timeline.length > 0 && (
            <Page frame="columns" roses={4}>
              {(on) => (
                <Lines on={on} start={0.3} step={0.16}>
                  {[
                    <Kicker key="k">Chương trình</Kicker>,
                    <Title key="t">Ngày vui</Title>,
                    ...core.timeline.map((it, i) => (
                      <div key={i} className="mt-4 flex items-center gap-3 text-left">
                        <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center" style={{ boxShadow: `inset 0 0 0 1px ${C.gold}` }}>
                          <PaletteProvider value={INK_PAL}>
                            <LineIcon name={it.icon} on size={24} />
                          </PaletteProvider>
                        </span>
                        <div>
                          <p className="text-[14px] tracking-[0.14em]" style={{ fontFamily: SC, fontWeight: 700, color: C.gold }}>
                            {it.time}
                          </p>
                          <p className="text-[17px] leading-tight" style={{ fontWeight: 500 }}>
                            {it.title}
                          </p>
                        </div>
                      </div>
                    )),
                  ]}
                </Lines>
              )}
            </Page>
          )}

          {/* dress code + story */}
          {(core.dressCode || core.dressColors.length > 0) && (
            <Page frame="arch" roses={4}>
              {(on) => (
                <Lines on={on} start={0.3} step={0.2}>
                  {[
                    <Kicker key="k">Trang phục</Kicker>,
                    <Title key="t">Dress code</Title>,
                    core.dressCode ? (
                      <p key="d" className="mt-3 text-[17px] leading-relaxed">
                        {core.dressCode}
                      </p>
                    ) : null,
                    <div key="c" className="mt-4 flex justify-center gap-3">
                      {core.dressColors.map((c) => (
                        <span key={c} className="w-9 h-9 rounded-full" style={{ background: c, boxShadow: `0 0 0 3px ${C.cream}, 0 0 0 4px ${C.gold}` }} />
                      ))}
                    </div>,
                  ]}
                </Lines>
              )}
            </Page>
          )}
          {(core.story || core.milestones.length > 0) && (
            <Page frame="bracket" roses={5} minH={false}>
              {(on) => (
                <Lines on={on} start={0.3} step={0.2}>
                  {[
                    <Kicker key="k">Câu chuyện</Kicker>,
                    <Title key="t">Chuyện của chúng mình</Title>,
                    core.story ? (
                      <p key="s" className="mt-4 text-[16px] leading-relaxed text-left">
                        {core.story}
                      </p>
                    ) : null,
                    core.milestones.length ? (
                      <div key="m" className="mt-5 text-left">
                        <Milestones items={core.milestones} />
                      </div>
                    ) : null,
                  ]}
                </Lines>
              )}
            </Page>
          )}

          {/* album */}
          {album.length > 1 && (
            <section className="relative px-5 py-14 text-center" style={{ background: SILVER }}>
              <Kicker>Khoảnh khắc</Kicker>
              <Title>Album</Title>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {album.slice(1).map((u, i) => (
                  <button key={u} type="button" onClick={() => setViewer(core.gallery.indexOf(u))} className={"relative overflow-hidden rounded-t-full " + (i % 3 === 0 ? "col-span-2 aspect-[4/3] rounded-t-[160px]" : "aspect-[3/4]")} style={{ boxShadow: `0 0 0 5px ${C.cream}, 0 0 0 6px ${C.gold}` }} aria-label="Xem ảnh">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <Butterflies n={3} />
            </section>
          )}

          {core.faq.length > 0 && (
            <section className="px-5 py-12 text-center" style={{ background: SILVER }}>
              <Raised max={4} thick={1.2}><div className="px-5 py-10" style={{ background: C.cream, clipPath: BRACKET, outline: `1px solid ${C.gold}` }}>
                <Title>Bạn cần biết</Title>
                <div className="mt-5 text-left">
                  <FaqList items={core.faq} />
                </div>
              </div></Raised>
            </section>
          )}
          <section className="px-5 py-14 text-center" style={{ background: SILVER }}>
            <Raised max={4} thick={1.2}><div className="px-5 py-10" style={{ background: C.cream, clipPath: BRACKET }}>
              <Kicker>Hồi âm</Kicker>
              <Title>Xác nhận tham dự</Title>
              <div className="mt-6">
                <RsvpForm core={core} tone={tone} />
              </div>
            </div></Raised>
          </section>

          <section className="px-5 py-12 text-center" style={{ background: SILVER }}>
            <Raised max={4} thick={1.2}><div className="px-5 py-10" style={{ background: C.cream, clipPath: BRACKET, outline: `1px solid ${C.gold}` }}>
              <Kicker>Sổ lưu bút</Kicker>
              <Title>Gửi lời chúc</Title>
              <div className="mt-5">
                <Guestbook code={core.guest.code} guestName={core.guest.name} preview={core.preview} />
              </div>
            </div></Raised>
          </section>
          {video && (
            <section className="px-5 py-12 text-center" style={{ background: SILVER }}>
              <Title>Thước phim</Title>
              <div className="mt-5 aspect-video overflow-hidden rounded-xl" style={{ boxShadow: `0 0 0 5px ${C.cream}, 0 0 0 6px ${C.gold}` }}>
                {video.kind === "iframe" ? <iframe src={video.src} title="Video cưới" className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : video.kind === "file" ? <video src={video.src} controls playsInline className="w-full h-full object-contain bg-black" /> : <a href={video.src} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center underline">Mở video</a>}
              </div>
            </section>
          )}

          {/* gifts, faq, guestbook, rsvp: cream cards on silver */}
          {(core.gifts.length > 0 || core.giftQr) && (
            <section className="px-5 py-14 text-center" style={{ background: SILVER }}>
              <Raised max={4} thick={1.2}><div className="px-5 py-10" style={{ background: C.cream, clipPath: BRACKET, outline: `1px solid ${C.gold}` }}>
                <Kicker>Gửi yêu thương</Kicker>
                <Title>Mừng cưới</Title>
                <div className="mt-6">
                  <GiftAccounts accounts={core.gifts} fallbackQr={core.giftQr} />
                </div>
              </div></Raised>
            </section>
          )}
          <footer className="em-dark relative text-center px-6 pt-14 pb-12 overflow-hidden" style={{ background: C.plum, color: C.cream }}>
            <p className="text-[46px] leading-tight" style={{ fontFamily: SCRIPT, color: C.goldLight }}>
              Hẹn gặp bạn
            </p>
            <p className="mt-2 text-[17px] tracking-[0.12em] uppercase" style={{ fontFamily: SC, fontWeight: 700 }}>
              {core.couple}
            </p>
            {s && (
              <p className="mt-1 text-[14px] tracking-[0.2em]" style={{ fontFamily: SC, fontWeight: 700, color: C.goldLight }}>
                {p2(s.getDate())}.{p2(s.getMonth() + 1)}.{s.getFullYear()}
              </p>
            )}
            <p className="mt-6 text-[12px] opacity-70">Thiệp làm bằng WedTable</p>
            <Butterflies n={3} />
          </footer>
        </main>
      </div>
      {core.musicUrl && opened && <MusicToggle src={core.musicUrl} start={opened} />}
      {viewer !== null && <Lightbox photos={core.gallery} index={viewer} onClose={() => setViewer(null)} onIndex={setViewer} />}
      <style>{`
        @keyframes vtFlyR{0%{transform:translate(0,0)}25%{transform:translate(30vw,-30px)}50%{transform:translate(60vw,20px)}75%{transform:translate(90vw,-20px)}100%{transform:translate(125vw,0)}}
        @keyframes vtFlyL{0%{transform:translate(0,0)}25%{transform:translate(-30vw,25px)}50%{transform:translate(-60vw,-20px)}75%{transform:translate(-90vw,15px)}100%{transform:translate(-125vw,0)}}
        @keyframes vtFlap{from{transform:scaleX(1)}to{transform:scaleX(.35)}}
        @media (prefers-reduced-motion: reduce){.vt-bflies{display:none}}
      `}</style>
    </PaletteProvider>
  )
}

/** Still cover for the template picker */
export function VioletThumb({ event }: { event: any }) {
  const c = { bride: event.bride_name || "", groom: event.groom_name || "", start: eventStart(event.event_date, event.event_time) }
  return (
    <div style={{ fontFamily: SERIF }}>
      <VioletDefs />
      <Cover c={c} opened />
    </div>
  )
}
