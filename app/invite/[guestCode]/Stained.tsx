"use client"

// "Kính màu" (stained glass). Style study of the user's reference video 7 (style only, nothing
// copied): frosted pink glass doors with leaded rose panes, an arched glass window cover, an olive
// card with a scratch-off glass mirror over the photo, ceremonies in glass-pane frames with sepia
// line drawings, a champagne stream that draws the programme as you scroll, and an olive RSVP band
// under a scalloped glass border. Every drawing is generated here (SVG/CSS/canvas).
import { useEffect, useMemo, useRef, useState } from "react"
import { lunarLine } from "@/lib/lunar"
import { videoEmbed } from "@/lib/videoEmbed"
import type { Palette } from "@/lib/inviteThemes"
import { Letters } from "./Ivory"
import { LineIcon } from "./Ivory"
import { PaletteProvider } from "./Ornaments"
import { GiftAccounts, Guestbook, Milestones } from "./Sections"
import { FaqList, MusicToggle } from "./Extras"
import { Lightbox } from "./Album"
import { Core, Raised, RsvpForm, eventStart, googleCalendarUrl, p2, useCountdown, useOpening, useScrollProgress, useSeen, weekday } from "./kit"

// ---------------------------------------------------------------- palette

const C = {
  paper: "#FBF4F2",
  blush: "#F6E3E3",
  glass1: "#F3D3D5",
  glass2: "#E9B6BA",
  glass3: "#D99499",
  rose: "#C9787F",
  roseDeep: "#A9545D",
  leaf: "#93A27C",
  leafDeep: "#6E7F58",
  lead: "#B48A4E",
  leadDark: "#8A6534",
  olive: "#4A4D2B",
  oliveSoft: "#5C603A",
  sepia: "#9C5F55",
  ink: "#4A3532",
  muted: "#8A706B",
  cream: "#F7EEE4",
}
const PAL: Palette = {
  bg: C.paper,
  paper: "#FFFFFF",
  blush: C.blush,
  rose: C.rose,
  wine: C.olive,
  sage: C.leaf,
  leaf: C.leafDeep,
  ink: C.ink,
  muted: C.muted,
  line: "#E6D3D1",
  soft: "#FBF1F0",
  okBg: "#EEF0E3",
  deep: C.olive,
  gold: ["#E8CF9A", C.lead, C.leadDark],
}
const SEPIA_PAL: Palette = { ...PAL, ink: C.sepia }

const SCRIPT = "var(--iv-pinyon), cursive"
const SC = "var(--iv-sc), serif"
const SERIF = "var(--iv-serif), serif"

// ---------------------------------------------------------------- glass helpers

/** Frosted glass: pink wash + fine noise + soft light blooms */
const FROST =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E"),` +
  `radial-gradient(60% 40% at 30% 20%, rgba(255,255,255,.55), transparent 70%),` +
  `radial-gradient(50% 35% at 75% 70%, rgba(255,255,255,.35), transparent 70%),` +
  `linear-gradient(160deg, ${C.glass1}, ${C.glass2} 55%, ${C.glass1})`

/** Gradients shared by every glass drawing on the page (rendered once, referenced by id) */
export function GlassDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <radialGradient id="sgP1" cx="38%" cy="32%" r="80%">
          <stop offset="0" stopColor="#FDEDEE" />
          <stop offset=".5" stopColor="#F0BCC1" />
          <stop offset="1" stopColor="#D88E97" />
        </radialGradient>
        <radialGradient id="sgP2" cx="40%" cy="30%" r="80%">
          <stop offset="0" stopColor="#F6C9CE" />
          <stop offset=".55" stopColor="#DA8D96" />
          <stop offset="1" stopColor="#B65866" />
        </radialGradient>
        <radialGradient id="sgP3" cx="45%" cy="35%" r="75%">
          <stop offset="0" stopColor="#E59AA3" />
          <stop offset="1" stopColor="#9C3F4E" />
        </radialGradient>
        <linearGradient id="sgL1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D2DCB6" />
          <stop offset=".55" stopColor="#96A774" />
          <stop offset="1" stopColor="#6A7B4C" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const LEAD = { stroke: C.lead, strokeWidth: 1.6, strokeLinejoin: "round" as const, strokeLinecap: "round" as const }

/** A stained-glass rose seen from the front: two rings of cupped petals, a cup and a spiral heart,
 *  each piece a lit pane (pale centre, deeper rim) held by gold lead, with a glint of light */
function Rose({ x = 0, y = 0, s = 1, r = 0 }: { x?: number; y?: number; s?: number; r?: number }) {
  const lobe = "M0 -6 C -24 -8 -34 -34 -13 -43 C -5 -47 5 -47 13 -43 C 34 -34 24 -8 0 -6Z"
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} {...LEAD}>
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={"a" + a} d={lobe} transform={`rotate(${a})`} fill="url(#sgP1)" />
      ))}
      {[36, 108, 180, 252, 324].map((a) => (
        <path key={"b" + a} d={lobe} transform={`rotate(${a}) scale(.68)`} fill="url(#sgP2)" />
      ))}
      <path d="M-19 5 C -21 -16 21 -16 19 5 C 11 15 -11 15 -19 5Z" fill="url(#sgP2)" />
      <path d="M-11 -2 C -12 -15 12 -15 11 -2 C 10 6 -2 8 -4 1 C -6 -6 5 -8 5 -2" fill="url(#sgP3)" />
      <ellipse cx="-14" cy="-24" rx="6" ry="2.4" transform="rotate(-30 -14 -24)" fill="#fff" opacity=".45" stroke="none" />
    </g>
  )
}

function Leaf({ x = 0, y = 0, s = 1, r = 0 }: { x?: number; y?: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} {...LEAD}>
      <path d="M0 0 C 14 -12 36 -12 50 0 C 36 12 14 12 0 0Z" fill="url(#sgL1)" />
      <path d="M3 0 H46 M16 0 L24 -6 M16 0 L24 6 M30 0 L37 -5 M30 0 L37 5" fill="none" strokeWidth="1" />
    </g>
  )
}

function Bud({ x = 0, y = 0, s = 1, r = 0 }: { x?: number; y?: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} {...LEAD}>
      <path d="M0 18 C -2 8 -4 4 0 0" fill="none" />
      <path d="M-9 4 C -12 -10 -2 -18 0 -20 C 2 -18 12 -10 9 4 C 4 9 -4 9 -9 4Z" fill="url(#sgP2)" />
      <path d="M-9 4 C -6 12 6 12 9 4 C 4 2 -4 2 -9 4Z" fill="url(#sgL1)" />
    </g>
  )
}

/** A cluster: three roses, buds and leaves, ~130px across at the default size */
function Cluster({ size = 130, rot = 0, flip = false }: { size?: number; rot?: number; flip?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="-65 -65 130 130" style={{ transform: `rotate(${rot}deg) scaleX(${flip ? -1 : 1})`, overflow: "visible" }} aria-hidden>
      <Leaf x={-8} y={18} s={0.9} r={150} />
      <Leaf x={14} y={22} s={0.85} r={40} />
      <Leaf x={-30} y={-6} s={0.7} r={200} />
      <Leaf x={30} y={-14} s={0.7} r={-20} />
      <Bud x={-44} y={-30} s={0.9} r={-40} />
      <Bud x={46} y={18} s={0.8} r={60} />
      <Rose x={26} y={-26} s={0.55} r={20} />
      <Rose x={-30} y={22} s={0.62} r={-15} />
      <Rose x={0} y={-2} s={0.85} r={8} />
    </svg>
  )
}

/** Single rose with two leaves (small ornaments) */
function GlassRose({ size = 90, rot = 0, leaves = true }: { size?: number; rot?: number; leaves?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="-55 -55 110 110" style={{ transform: `rotate(${rot}deg)`, overflow: "visible" }} aria-hidden>
      {leaves && (
        <>
          <Leaf x={-6} y={24} s={0.85} r={150} />
          <Leaf x={8} y={26} s={0.8} r={35} />
        </>
      )}
      <Rose s={0.95} />
    </svg>
  )
}

/** Leaded quarry glass: a diamond lattice of slightly different pink panes */
function Lattice({ w, h, seed = 1 }: { w: number; h: number; seed?: number }) {
  const panes = useMemo(() => {
    const out: { d: string; f: string; o: number }[] = []
    const dw = 44, dh = 58
    let k = seed
    const rnd = () => (k = (k * 9301 + 49297) % 233280) / 233280
    const tints = ["#F7DADC", "#F2CDD0", "#FBE6E7", "#EFC3C7", "#F9E1E2"]
    for (let row = -1; row <= h / (dh / 2) + 1; row++) {
      for (let col = -1; col <= w / dw + 1; col++) {
        const cx = col * dw + (row % 2 ? dw / 2 : 0)
        const cy = row * (dh / 2)
        out.push({ d: `M${cx} ${cy - dh / 2}L${cx + dw / 2} ${cy}L${cx} ${cy + dh / 2}L${cx - dw / 2} ${cy}Z`, f: tints[Math.floor(rnd() * tints.length)], o: 0.55 + rnd() * 0.4 })
      }
    }
    return out
  }, [w, h, seed])
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden>
      {panes.map((p, i) => (
        <path key={i} d={p.d} fill={p.f} fillOpacity={p.o} stroke={C.lead} strokeWidth="1.5" strokeOpacity=".85" />
      ))}
    </svg>
  )
}

/** Arch (rectangle with a round top) perimeter point, t in [0,1], inset px from the outer edge */
function archPoint(t: number, w: number, h: number, inset: number): [number, number] {
  const r = w / 2 - inset
  const cx = w / 2
  const cy = w / 2
  const side = h - cy - inset // straight side length
  const arc = Math.PI * r
  const total = side * 2 + arc
  let d = t * total
  if (d < side) return [inset, h - inset - d]
  d -= side
  if (d < arc) {
    const a = Math.PI + d / r
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  }
  d -= arc
  return [w - inset, cy + d]
}

/** The arch border: an outer band of small coloured panes, an inner band of clear panes, and a vine
 *  of glass leaves running along the outside */
function ArchPanes({ w, h, draw = false }: { w: number; h: number; draw?: boolean }) {
  const { outer, inner, leaves } = useMemo(() => {
    const quad = (t0: number, t1: number, i0: number, i1: number) => {
      const a = archPoint(t0, w, h, i0), b = archPoint(t1, w, h, i0), c = archPoint(t1, w, h, i1), d = archPoint(t0, w, h, i1)
      return `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}L${d[0].toFixed(1)} ${d[1].toFixed(1)}Z`
    }
    const outer = Array.from({ length: 70 }, (_, i) => quad(i / 70, (i + 1) / 70, 8, 22))
    const inner = Array.from({ length: 36 }, (_, i) => quad(i / 36, (i + 1) / 36, 22, 32))
    const leaves = Array.from({ length: 34 }, (_, i) => {
      const t = 0.04 + (i / 34) * 0.92
      const p = archPoint(t, w, h, 4), q = archPoint(t + 0.004, w, h, 4)
      const ang = (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI
      return { x: p[0], y: p[1], r: ang + (i % 2 ? 200 : -20), s: 0.34 + (i % 3) * 0.04 }
    })
    return { outer, inner, leaves }
  }, [w, h])
  const fills = ["url(#sgP1)", "#F3D3D5", "url(#sgP2)", "#F7E2E3", "#EDB9BE"]
  return (
    <g>
      <g>
        {leaves.map((l, i) => (
          <Leaf key={i} x={l.x} y={l.y} s={l.s} r={l.r} />
        ))}
      </g>
      <g stroke={C.lead} strokeWidth="1.6" strokeLinejoin="round">
        {outer.map((d, i) => (
          <path key={i} d={d} fill={fills[i % fills.length]} className={draw ? "sg-pane" : ""} style={draw ? { animationDelay: `${0.3 + i * 0.025}s` } : undefined} />
        ))}
        {inner.map((d, i) => (
          <path key={"i" + i} d={d} fill="#FFF7F6" fillOpacity=".85" className={draw ? "sg-pane" : ""} style={draw ? { animationDelay: `${0.6 + i * 0.04}s` } : undefined} />
        ))}
      </g>
    </g>
  )
}

/** Ring of glass panes around an ellipse (the mirror frame) */
function OvalPanes({ rx, ry, band = 18, n = 28 }: { rx: number; ry: number; band?: number; n?: number }) {
  const pt = (t: number, k: number): [number, number] => [Math.cos(t * Math.PI * 2) * (rx - k), Math.sin(t * Math.PI * 2) * (ry - k)]
  const fills = ["url(#sgP1)", "#F3D3D5", "url(#sgP2)", "#F7E2E3"]
  return (
    <g stroke={C.lead} strokeWidth="1.6" strokeLinejoin="round">
      {Array.from({ length: n }, (_, i) => {
        const a = pt(i / n, 0), b = pt((i + 1) / n, 0), c = pt((i + 1) / n, band), d = pt(i / n, band)
        return <path key={i} d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${c[0]} ${c[1]}L${d[0]} ${d[1]}Z`} fill={fills[i % 4]} />
      })}
    </g>
  )
}

/** Nine-slice image for a rectangular glass-pane frame (corners carry a small rose) */
const PANE_FRAME = (() => {
  const s = 72
  const pane = (x: number, y: number, w: number, h: number, f: string) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' fill='${f}'/>`
  let g = ""
  // edges: 24px band split into panes
  for (let i = 0; i < 3; i++) {
    g += pane(24 + i * 8, 0, 8, 24, [C.glass1, C.glass2, C.glass1][i])
    g += pane(24 + i * 8, 48, 8, 24, [C.glass2, C.glass1, C.glass2][i])
    g += pane(0, 24 + i * 8, 24, 8, [C.glass1, C.glass2, C.glass1][i])
    g += pane(48, 24 + i * 8, 24, 8, [C.glass2, C.glass1, C.glass2][i])
  }
  const corner = (x: number, y: number) =>
    `<rect x='${x}' y='${y}' width='24' height='24' fill='${C.glass3}'/><circle cx='${x + 12}' cy='${y + 12}' r='7.5' fill='${C.rose}'/><circle cx='${x + 12}' cy='${y + 12}' r='3.5' fill='${C.roseDeep}'/>`
  g += corner(0, 0) + corner(48, 0) + corner(0, 48) + corner(48, 48)
  const lead = `<g fill='none' stroke='${C.lead}' stroke-width='2'><rect x='1' y='1' width='70' height='70'/><rect x='24' y='24' width='24' height='24'/><path d='M24 0V72M48 0V72M0 24H72M0 48H72M32 0V24M40 0V24M32 48V72M40 48V72M0 32H24M0 40H24M48 32H72M48 40H72'/></g>`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}'>${g}${lead}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
})()

/** Scalloped glass border (top of the RSVP band, footer): repeating arches with a rose bud */
const SCALLOP = (() => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='46'><g stroke='${C.lead}' stroke-width='2' stroke-linejoin='round'><path d='M0 46V22 C 0 6 14 0 40 0 C 66 0 80 6 80 22V46Z' fill='${C.glass1}'/><path d='M10 46V26 C 10 14 20 10 40 10 C 60 10 70 14 70 26V46Z' fill='${C.glass2}'/><circle cx='40' cy='28' r='9' fill='${C.rose}'/><circle cx='40' cy='28' r='4' fill='${C.roseDeep}'/><path d='M22 40 C 26 34 32 34 34 38 M58 40 C 54 34 48 34 46 38' fill='none'/><path d='M20 42 C 24 36 30 36 32 40 Z M60 42 C 56 36 50 36 48 40Z' fill='${C.leaf}'/></g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
})()

// ---------------------------------------------------------------- sepia line drawings

const ink = { fill: "none", stroke: C.sepia, strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }

function Chapel() {
  return (
    <svg viewBox="0 0 160 110" width="170" aria-hidden className="sg-draw">
      <g {...ink}>
        <path d="M30 104V54L80 22L130 54V104Z" />
        <path d="M80 22V6M74 12H86" />
        <path d="M66 104V74 C66 64 94 64 94 74V104" />
        <circle cx="80" cy="46" r="9" />
        <path d="M80 37V55M71 46H89" strokeWidth="0.9" />
        <path d="M40 104V66H54V104M106 104V66H120V104" />
        <path d="M8 104H152" />
        <path d="M14 104 C14 92 22 88 24 96 C26 86 34 88 32 104" fill={C.glass1} />
        <path d="M128 104 C128 92 136 88 138 96 C140 86 148 88 146 104" fill={C.glass1} />
      </g>
    </svg>
  )
}

function Hall() {
  return (
    <svg viewBox="0 0 180 110" width="180" aria-hidden className="sg-draw">
      <g {...ink}>
        <path d="M14 104V44H166V104" />
        <path d="M8 44L90 14L172 44Z" />
        <circle cx="90" cy="32" r="6" />
        {[30, 58, 86, 114, 142].map((x) => (
          <path key={x} d={`M${x} 104V64 C${x} 54 ${x + 10} 54 ${x + 10} 64V104`} />
        ))}
        <path d="M14 56H166" strokeWidth="0.9" />
        <path d="M4 104H176" />
        <path d="M22 104 C22 96 30 92 32 100M150 104 C150 96 158 92 160 100" />
      </g>
    </svg>
  )
}

function Bottle({ tilt = -38 }: { tilt?: number }) {
  return (
    <svg viewBox="0 0 70 150" width="64" aria-hidden style={{ transform: `rotate(${tilt}deg)`, transformOrigin: "50% 80%", overflow: "visible" }}>
      <g {...ink}>
        <path d="M27 6H43V30 C43 40 56 50 56 66V140 C56 144 52 146 48 146H22 C18 146 14 144 14 140V66 C14 50 27 40 27 30Z" fill={C.glass1} />
        <path d="M24 26H46V14H24Z" fill={C.glass3} />
        <path d="M14 84H56V116H14Z" fill={C.cream} />
        <path d="M24 96H46M28 104H42" strokeWidth="0.9" />
      </g>
    </svg>
  )
}

function Coupe() {
  return (
    <svg viewBox="0 0 80 90" width="74" aria-hidden>
      <g {...ink}>
        <path d="M6 16 C 10 40 70 40 74 16Z" fill={C.glass1} />
        <path d="M10 22 C 20 30 60 30 70 22" strokeWidth="0.9" />
        <path d="M40 36V76M24 84 C 30 78 50 78 56 84Z" />
        <circle cx="30" cy="10" r="1.6" fill={C.lead} stroke="none" />
        <circle cx="46" cy="6" r="1.2" fill={C.lead} stroke="none" />
        <circle cx="54" cy="12" r="1.4" fill={C.lead} stroke="none" />
      </g>
    </svg>
  )
}

function GiftBox() {
  return (
    <svg viewBox="0 0 120 120" width="120" aria-hidden className="sg-gift">
      <g {...ink}>
        <path d="M18 54H102V110H18Z" fill={C.glass2} />
        <g className="sg-lid">
          <path d="M12 38H108V54H12Z" fill={C.glass3} />
          <path d="M60 38 C 40 14 22 22 30 34 C 36 40 52 38 60 38Z M60 38 C 80 14 98 22 90 34 C 84 40 68 38 60 38Z" fill={C.glass1} />
        </g>
        <path d="M52 38V110M68 38V110" />
        <path d="M30 70l3 3M88 64l3 3M40 96l3 3" strokeWidth="1" />
      </g>
      <g fill={C.lead}>
        <path className="sg-spark" d="M10 20l2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" />
        <path className="sg-spark" style={{ animationDelay: ".7s" }} d="M108 14l1.6 4.4 4.4 1.6-4.4 1.6L108 26l-1.6-4.4L102 20l4.4-1.6Z" />
      </g>
    </svg>
  )
}

function Attire() {
  return (
    <svg viewBox="0 0 200 130" width="220" aria-hidden className="sg-draw">
      <g {...ink}>
        <path d="M0 10H200" strokeWidth="1" />
        {/* gown on a hanger */}
        <path d="M60 10V16 C60 20 66 20 66 24 M48 30 L66 24 L84 30" />
        <path d="M54 30 C56 40 58 44 56 50 C52 70 36 104 30 124 H102 C96 104 80 70 76 50 C74 44 76 40 78 30" fill={C.glass1} />
        <path d="M56 50 C62 54 70 54 76 50M44 96 C60 100 80 100 92 96" strokeWidth="0.9" />
        {/* suit on a hanger */}
        <path d="M146 10V16 C146 20 152 20 152 24 M132 30 L152 24 L172 30" />
        <path d="M132 30 L124 46 V112 H180 V46 L172 30 L158 40 L152 70 L146 40Z" fill={C.cream} />
        <path d="M152 70V112M146 40 L152 52 L158 40M138 70H144M160 70H166" strokeWidth="0.9" />
        <path d="M148 34 l4 4 4-4" fill={C.olive} />
      </g>
    </svg>
  )
}

function RoseSprig({ w = 90 }: { w?: number }) {
  return (
    <svg viewBox="0 0 120 40" width={w} aria-hidden>
      <g stroke={C.lead} strokeWidth="1.4" strokeLinejoin="round">
        <path d="M10 22 C 40 14 80 14 110 22" fill="none" />
        <path d="M28 20 C 22 10 34 6 36 16Z M84 20 C 90 10 78 6 76 16Z" fill={C.leaf} />
        <circle cx="60" cy="18" r="10" fill={C.glass3} />
        <circle cx="60" cy="18" r="5" fill={C.rose} />
        <circle cx="44" cy="22" r="5" fill={C.glass2} />
        <circle cx="76" cy="22" r="5" fill={C.glass2} />
      </g>
    </svg>
  )
}

/** Festoon of bulbs that light up one after another once seen */
function StringLights() {
  const [ref, seen] = useSeen<HTMLDivElement>(0.4)
  const bulbs = Array.from({ length: 11 }, (_, i) => {
    const x = 10 + i * 30
    const y = 14 + Math.sin((i / 10) * Math.PI) * 26
    return { x, y }
  })
  return (
    <div ref={ref} className="my-6" aria-hidden>
      <svg viewBox="0 0 320 60" className="w-full">
        <path d="M0 10 Q 160 70 320 10" fill="none" stroke={C.sepia} strokeWidth="1.2" />
        {bulbs.map((b, i) => (
          <g key={i}>
            <path d={`M${b.x} ${b.y}v5`} stroke={C.sepia} strokeWidth="1" />
            <circle cx={b.x} cy={b.y + 9} r="4.2" fill={seen ? "#FFE7A8" : C.cream} stroke={C.sepia} strokeWidth="1" style={{ transition: `fill .3s ease ${0.1 + i * 0.12}s`, filter: seen ? "drop-shadow(0 0 4px #FFD36B)" : "none" }} />
          </g>
        ))}
      </svg>
    </div>
  )
}

// ---------------------------------------------------------------- small shared pieces

function Kicker({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className="text-[13px] tracking-[0.28em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: light ? "rgba(247,238,228,.8)" : C.muted }}>
      {children}
    </p>
  )
}
function Title({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <h2 className="text-[46px] leading-[1.05]" style={{ fontFamily: SCRIPT, color: light ? C.cream : C.roseDeep }}>
      {children}
    </h2>
  )
}
function Pill({ href, children, onClick }: { href?: string; children: React.ReactNode; onClick?: () => void }) {
  const cls = "inline-flex items-center justify-center h-11 px-5 rounded-full text-[13px] tracking-[0.16em] uppercase transition-opacity hover:opacity-85"
  const st = { background: C.olive, color: C.cream, fontFamily: SC, fontWeight: 700 }
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls} style={st}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls} style={st}>
      {children}
    </button>
  )
}

/** Section that rises a little and sharpens when it scrolls in */
function Scene({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const [ref, seen] = useSeen<HTMLElement>(0.12)
  return (
    <section ref={ref as any} className={"relative sg-scene " + (seen ? "sg-in " : "") + className} style={style}>
      {children}
    </section>
  )
}

// ---------------------------------------------------------------- opening: the glass doors

export function StainedIntro({ core, onOpened, onReveal }: { core: Core; onOpened: () => void; onReveal: () => void }) {
  const { phase, tap } = useOpening(1900, onOpened, 500, onReveal)
  const initials = `${(core.bride.split(/\s+/).pop() || "").charAt(0)}${(core.groom.split(/\s+/).pop() || "").charAt(0)}`
  const lights = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 61) % 100, s: 26 + ((i * 13) % 44), d: (i % 5) * 0.7 })),
    []
  )
  const door = (side: "l" | "r") => (
    <div className={"absolute inset-y-0 w-1/2 overflow-hidden sg-door sg-door-" + side} style={{ [side === "l" ? "left" : "right"]: 0, backgroundImage: FROST, backgroundSize: "220px 220px, cover, cover, cover" } as any}>
      <Lattice w={240} h={800} seed={side === "l" ? 3 : 7} />
      {/* frame of the door leaf */}
      <div className="absolute inset-[10px] pointer-events-none" style={{ boxShadow: `inset 0 0 0 2px ${C.lead}, inset 0 0 0 8px rgba(255,246,244,.55), inset 0 0 0 10px ${C.lead}` }} />
      {/* roses climbing the outer edge and crowning the top */}
      <div className="absolute" style={{ top: -34, [side === "l" ? "left" : "right"]: -38 } as any}>
        <Cluster size={190} rot={side === "l" ? -10 : 10} flip={side === "r"} />
      </div>
      <div className="absolute top-[30%]" style={{ [side === "l" ? "left" : "right"]: -46 } as any}>
        <Cluster size={130} rot={side === "l" ? 80 : -80} flip={side === "r"} />
      </div>
      <div className="absolute top-[58%]" style={{ [side === "l" ? "left" : "right"]: -40 } as any}>
        <Cluster size={110} rot={side === "l" ? 100 : -100} flip={side === "l"} />
      </div>
      <div className="absolute" style={{ bottom: -40, [side === "l" ? "left" : "right"]: -34 } as any}>
        <Cluster size={200} rot={side === "l" ? 190 : 170} flip={side === "l"} />
      </div>
      {/* lead seam and the half medallion carried by this door */}
      <div className="absolute inset-y-0 w-[3px]" style={{ [side === "l" ? "right" : "left"]: 0, background: `linear-gradient(${C.leadDark}, ${C.lead}, ${C.leadDark})` } as any} />
      <div className="absolute top-1/2 -translate-y-1/2 w-[120px] h-[120px]" style={{ [side === "l" ? "right" : "left"]: -60, clipPath: side === "l" ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)" } as any}>
        <Medallion initials={initials} />
      </div>
    </div>
  )
  return (
    <div className={"fixed inset-0 z-50 overflow-hidden select-none sg-intro " + (phase !== "idle" ? "sg-run " : "") + (phase === "out" ? "sg-out" : "")} onClick={tap} role="button" aria-label="Mở thiệp mời">
      <GlassDefs />
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[480px]">
        {door("l")}
        {door("r")}
        {/* sunlight through the glass */}
        <div className="absolute inset-0 pointer-events-none sg-lights">
          {lights.map((l, i) => (
            <span key={i} className="absolute rounded-full" style={{ left: `${l.x}%`, top: `${l.y}%`, width: l.s, height: l.s, background: "radial-gradient(circle, rgba(255,250,235,.9), rgba(255,240,220,0) 70%)", animation: `sgTwinkle 3.6s ease-in-out ${l.d}s infinite` }} />
          ))}
        </div>
        <div className="absolute inset-x-0 top-[16%] flex justify-center pointer-events-none sg-plaque">
          <div className="px-6 py-3 text-center rounded-[14px]" style={{ background: "rgba(255,255,255,.55)", backdropFilter: "blur(4px)", boxShadow: `inset 0 0 0 1.5px ${C.lead}` }}>
            <p className="text-[24px] leading-none" style={{ fontFamily: SCRIPT, color: C.roseDeep }}>
              Kính gửi
            </p>
            <p className="mt-1.5 text-[17px] tracking-[0.06em]" style={{ fontFamily: SC, fontWeight: 700, color: C.ink }}>
              {core.guest.name}
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-[7%] flex justify-center pointer-events-none sg-hint">
          <span className="rounded-full px-5 py-2.5 text-[12px] tracking-[0.2em] uppercase" style={{ background: "rgba(74,77,43,.85)", color: C.cream, fontFamily: SC, fontWeight: 700 }}>
            Chạm vào huy chương để mở cửa
          </span>
        </div>
      </div>
      <style>{`
        .sg-intro{transition:opacity .6s ease}
        .sg-out{opacity:0;pointer-events:none}
        .sg-door{transition:transform 1.6s cubic-bezier(.65,0,.25,1) .25s;box-shadow:inset 0 0 40px rgba(169,84,93,.25)}
        .sg-run .sg-door-l{transform:translateX(-102%)}
        .sg-run .sg-door-r{transform:translateX(102%)}
        .sg-medal{transition:filter .4s ease, transform .4s ease}
        .sg-run .sg-medal{filter:drop-shadow(0 0 14px #FFE3A3) brightness(1.12);transform:scale(1.04)}
        .sg-plaque,.sg-hint{transition:opacity .4s ease}
        .sg-run .sg-plaque,.sg-run .sg-hint{opacity:0}
        .sg-hint span{animation:sgNudge 2.2s ease-in-out infinite}
        @keyframes sgTwinkle{0%,100%{opacity:.25;transform:scale(.85)}50%{opacity:.95;transform:scale(1.1)}}
        @keyframes sgNudge{50%{transform:translateY(-3px)}}
        @media (prefers-reduced-motion: reduce){.sg-lights span,.sg-hint span{animation:none!important}}
      `}</style>
    </div>
  )
}

function Medallion({ initials }: { initials: string }) {
  const n = 12
  return (
    <svg viewBox="-60 -60 120 120" className="w-full h-full sg-medal" aria-hidden>
      <g stroke={C.lead} strokeWidth="2.2" strokeLinejoin="round">
        {Array.from({ length: n }, (_, i) => {
          const a = (i / n) * Math.PI * 2
          const b = ((i + 1) / n) * Math.PI * 2
          const R = 56, r = 38
          const p = (ang: number, rr: number) => `${(Math.cos(ang) * rr).toFixed(1)} ${(Math.sin(ang) * rr).toFixed(1)}`
          return <path key={i} d={`M${p(a, R)}A${R} ${R} 0 0 1 ${p(b, R)}L${p(b, r)}A${r} ${r} 0 0 0 ${p(a, r)}Z`} fill={i % 2 ? C.glass3 : C.rose} />
        })}
        <circle r="38" fill="#FFF7F3" />
        <circle r="31" fill="none" strokeWidth="1" />
      </g>
      <text y="9" textAnchor="middle" fontSize="27" fill={C.roseDeep} style={{ fontFamily: SCRIPT }}>
        {initials.split("").join("&")}
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------- cover: the arched window

function Cover({ core, opened }: { core: Pick<Core, "bride" | "groom" | "start">; opened: boolean }) {
  const W = 320, H = 470
  const s = core.start
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center px-5 py-10 overflow-hidden" style={{ background: `radial-gradient(120% 80% at 50% 10%, #FFFFFF, ${C.blush})` }}>
      <div className="relative w-full max-w-[360px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden>
          <defs>
            <clipPath id="sgArch">
              <path d={`M30 ${H - 8}V${W / 2} A${W / 2 - 30} ${W / 2 - 30} 0 0 1 ${W - 30} ${W / 2}V${H - 8}Z`} />
            </clipPath>
          </defs>
          <defs>
            <radialGradient id="sgInside" cx="50%" cy="18%" r="85%">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset=".45" stopColor="#FCEDEE" />
              <stop offset="1" stopColor="#F2D4D7" />
            </radialGradient>
          </defs>
          <g clipPath="url(#sgArch)">
            <rect width={W} height={H} fill="url(#sgInside)" />
          </g>
          <g className={opened ? "sg-panes-on" : ""}>
            <ArchPanes w={W} h={H} draw />
          </g>
        </svg>
        {/* climbing roses at the arch springs and the sill */}
        <div className={"absolute -left-9 top-[13%] sg-bloom " + (opened ? "sg-bloom-on" : "")} style={{ transitionDelay: "1s" }}>
          <Cluster size={112} rot={-60} />
        </div>
        <div className={"absolute -right-9 top-[13%] sg-bloom " + (opened ? "sg-bloom-on" : "")} style={{ transitionDelay: "1.15s" }}>
          <Cluster size={112} rot={60} flip />
        </div>
        <div className={"absolute left-1/2 -translate-x-1/2 -top-8 sg-bloom " + (opened ? "sg-bloom-on" : "")} style={{ transitionDelay: "1.25s" }}>
          <Cluster size={120} rot={180} />
        </div>
        <div className={"absolute -left-10 -bottom-10 sg-bloom " + (opened ? "sg-bloom-on" : "")} style={{ transitionDelay: "1.35s" }}>
          <Cluster size={170} rot={200} flip />
        </div>
        <div className={"absolute -right-10 -bottom-10 sg-bloom " + (opened ? "sg-bloom-on" : "")} style={{ transitionDelay: "1.5s" }}>
          <Cluster size={170} rot={160} />
        </div>
        <div className="absolute inset-x-[15%] top-[26%] bottom-[14%] flex flex-col items-center justify-center text-center">
          <p className={"text-[12px] tracking-[0.26em] uppercase sg-fade " + (opened ? "sg-on" : "")} style={{ fontFamily: SC, fontWeight: 700, color: C.muted, transitionDelay: ".9s" }}>
            Trân trọng báo tin lễ thành hôn
          </p>
          <h1 className="mt-4 leading-[1.02]" style={{ fontFamily: SCRIPT, color: C.roseDeep }}>
            <Letters text={core.bride} on={opened} delay={1.3} step={0.07} className="block text-[52px]" />
            <Letters text="&" on={opened} delay={1.6} className="block text-[30px] my-1" style={{ color: C.lead }} />
            <Letters text={core.groom} on={opened} delay={1.9} step={0.07} className="block text-[52px]" />
          </h1>
          {s && (
            <div className={"mt-5 sg-fade " + (opened ? "sg-on" : "")} style={{ transitionDelay: "2.6s" }}>
              <p className="text-[17px] tracking-[0.2em]" style={{ fontFamily: SC, fontWeight: 700, color: C.ink }}>
                {weekday(s)} · {p2(s.getDate())}.{p2(s.getMonth() + 1)}.{s.getFullYear()}
              </p>
              <p className="mt-1 text-[15px] italic" style={{ fontFamily: SERIF, color: C.muted }}>
                {lunarLine(s)}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className={"absolute bottom-5 inset-x-0 text-center sg-fade " + (opened ? "sg-on" : "")} style={{ transitionDelay: "3.2s" }}>
        <span className="text-[12px] tracking-[0.24em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: C.muted }}>
          Cuộn xuống
        </span>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------- olive card with the scratch-off mirror

function ScratchMirror({ photo }: { photo?: string }) {
  const wrap = useRef<HTMLDivElement | null>(null)
  const canvas = useRef<HTMLCanvasElement | null>(null)
  const [done, setDone] = useState(false)
  const [sparks, setSparks] = useState<{ id: number; x: number; y: number; dx: number; dy: number }[]>([])
  const moves = useRef(0)
  const idc = useRef(0)
  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = r.width * dpr
    c.height = r.height * dpr
    const g = c.getContext("2d")!
    g.scale(dpr, dpr)
    const grad = g.createLinearGradient(0, 0, r.width, r.height)
    grad.addColorStop(0, "#F6DCDD")
    grad.addColorStop(0.5, "#EDBFC3")
    grad.addColorStop(1, "#F6DCDD")
    g.fillStyle = grad
    g.fillRect(0, 0, r.width, r.height)
    // frost speckle
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(255,255,255,${Math.random() * 0.35})`
      g.fillRect(Math.random() * r.width, Math.random() * r.height, 1.4, 1.4)
    }
    g.fillStyle = "rgba(169,84,93,.85)"
    g.font = "600 14px 'Be Vietnam Pro', system-ui, sans-serif"
    g.textAlign = "center"
    g.fillText("Vuốt để lau kính", r.width / 2, r.height / 2 - 4)
    g.font = "12px 'Be Vietnam Pro', system-ui, sans-serif"
    g.fillText("và xem ảnh", r.width / 2, r.height / 2 + 14)
  }, [])
  function scratch(e: React.PointerEvent) {
    if (done) return
    const c = canvas.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    const g = c.getContext("2d")!
    g.globalCompositeOperation = "destination-out"
    g.beginPath()
    g.arc(x, y, 24, 0, Math.PI * 2)
    g.fill()
    if (++moves.current % 3 === 0) {
      const id = ++idc.current
      setSparks((s) => [...s.slice(-14), { id, x, y, dx: (Math.random() - 0.5) * 80, dy: -20 - Math.random() * 60 }])
    }
    if (moves.current % 12 === 0) {
      const d = g.getImageData(0, 0, c.width, c.height).data
      let clear = 0
      for (let i = 3; i < d.length; i += 4 * 24) if (d[i] === 0) clear++
      if (clear / (d.length / (4 * 24)) > 0.45) setDone(true)
    }
  }
  return (
    <div ref={wrap} className="relative mx-auto w-[250px] h-[320px] select-none" style={{ WebkitUserSelect: "none", WebkitTouchCallout: "none" } as any}>
      <div className="absolute inset-[22px] rounded-[50%] overflow-hidden" style={{ background: C.blush }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Ảnh cưới" draggable={false} className="w-full h-full object-cover pointer-events-none" />
        )}
        <canvas
          ref={canvas}
          className="absolute inset-0 w-full h-full touch-none"
          style={{ opacity: done ? 0 : 1, transition: "opacity .9s ease", cursor: "grab" }}
          onPointerDown={(e) => {
            e.preventDefault()
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            scratch(e)
          }}
          onPointerMove={(e) => e.buttons && scratch(e)}
          aria-label="Lau lớp kính để xem ảnh"
          role="img"
        />
        {sparks.map((s) => (
          <span key={s.id} className="absolute w-1.5 h-1.5 rounded-full pointer-events-none" style={{ left: s.x, top: s.y, background: "#F4D58D", boxShadow: "0 0 6px #F4D58D", animation: "sgSpark .8s ease-out forwards", ["--dx" as any]: `${s.dx}px`, ["--dy" as any]: `${s.dy}px` }} />
        ))}
      </div>
      <svg viewBox="-125 -160 250 320" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
        <OvalPanes rx={124} ry={158} band={22} n={44} />
      </svg>
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none">
        <Cluster size={120} rot={180} />
      </div>
      <div className="absolute -bottom-12 -left-8 pointer-events-none">
        <Cluster size={120} rot={210} flip />
      </div>
      <div className="absolute -bottom-12 -right-8 pointer-events-none">
        <Cluster size={120} rot={150} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- ceremonies in glass frames

function GlassFrameBox({ children }: { children: React.ReactNode }) {
  return (
    <Raised shine thick={1.2}><div className="relative mx-auto max-w-[360px]" style={{ borderStyle: "solid", borderWidth: 24, borderImageSource: PANE_FRAME, borderImageSlice: 24, borderImageRepeat: "round", background: "#FFFDFC", boxShadow: "inset 0 2px 3px rgba(255,255,255,.85), inset 0 -2px 4px rgba(60,30,40,.12), inset 3px 0 6px rgba(60,30,40,.06), inset -3px 0 6px rgba(60,30,40,.06)" }}>
      <div className="px-5 py-7 text-center">{children}</div>
    </div></Raised>
  )
}

function CeremonyCard({ name, date, time, place, address, kind, core }: { name: string; date?: Date | null; time?: string; place?: string; address?: string; kind: "chapel" | "hall"; core: Core }) {
  const q = [place, address].filter(Boolean).join(", ")
  return (
    <GlassFrameBox>
      <p className="text-[38px] leading-tight" style={{ fontFamily: SCRIPT, color: C.roseDeep }}>
        {name}
      </p>
      {date && (
        <p className="mt-2 text-[15px] tracking-[0.12em]" style={{ fontFamily: SC, fontWeight: 700, color: C.ink }}>
          {time || `${p2(date.getHours())}:${p2(date.getMinutes())}`} · {weekday(date)} {p2(date.getDate())}.{p2(date.getMonth() + 1)}.{date.getFullYear()}
        </p>
      )}
      {date && (
        <p className="text-[14px] italic mt-0.5" style={{ fontFamily: SERIF, color: C.muted }}>
          {lunarLine(date)}
        </p>
      )}
      {place && (
        <p className="mt-4 text-[19px]" style={{ fontFamily: SERIF, color: C.ink, fontWeight: 500 }}>
          {place}
        </p>
      )}
      {address && (
        <p className="text-[15px] mt-1" style={{ fontFamily: SERIF, color: C.muted }}>
          {address}
        </p>
      )}
      <div className="my-5 flex justify-center">{kind === "chapel" ? <Chapel /> : <Hall />}</div>
      <div className="flex gap-2 justify-center flex-wrap">
        {q && <Pill href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`}>Chỉ đường</Pill>}
        {date && <Pill href={googleCalendarUrl(date, `${name} · ${core.couple}`, q)}>Lưu vào lịch</Pill>}
      </div>
    </GlassFrameBox>
  )
}

// ---------------------------------------------------------------- programme: the champagne stream

function Programme({ items }: { items: any[] }) {
  const [ref, p] = useScrollProgress<HTMLDivElement>()
  const rowH = 118
  const H = 150 + items.length * rowH + 110
  // a meandering stream down the middle: smooth S-curves between rows
  const path = useMemo(() => {
    let d = "M232 92"
    let y = 92
    for (let i = 0; i <= items.length; i++) {
      const ny = 150 + i * rowH
      const x = i % 2 ? 214 : 186
      d += ` C ${i % 2 ? 150 : 250} ${y + 40}, ${x} ${ny - 50}, ${x} ${ny}`
      y = ny
    }
    d += ` C 200 ${y + 40}, 200 ${H - 120}, 200 ${H - 92}`
    return d
  }, [items.length, H])
  const len = 3000
  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[400px]" style={{ height: H }}>
      <svg viewBox={`0 0 400 ${H}`} className="absolute inset-0 w-full h-full" aria-hidden preserveAspectRatio="none">
        <path d={path} fill="none" stroke={C.glass2} strokeWidth="9" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
        <path d={path} fill="none" stroke={C.sepia} strokeWidth="1.2" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} opacity=".7" />
      </svg>
      <div className="absolute right-6 top-0">
        <Bottle />
      </div>
      {items.map((it, i) => {
        const left = i % 2 === 0
        const reached = p > (i + 0.6) / (items.length + 1.6)
        return (
          <div key={i} className="absolute flex items-center gap-3" style={{ top: 150 + i * rowH - 36, [left ? "left" : "right"]: 8, flexDirection: left ? "row" : "row-reverse", textAlign: left ? "right" : "left", width: "44%", opacity: reached ? 1 : 0, transform: reached ? "none" : "translateY(10px)", transition: "opacity .6s ease, transform .6s ease" } as any}>
            <div className="flex-1">
              <p className="text-[19px] leading-tight" style={{ fontFamily: SERIF, color: C.ink, fontWeight: 500 }}>
                {it.title}
              </p>
              <p className="text-[15px] tracking-[0.12em]" style={{ fontFamily: SC, fontWeight: 700, color: C.roseDeep }}>
                {it.time}
              </p>
              {it.note && (
                <p className="text-[13px] italic" style={{ fontFamily: SERIF, color: C.muted }}>
                  {it.note}
                </p>
              )}
            </div>
            <PaletteProvider value={SEPIA_PAL}>
              <span className="shrink-0">
                <LineIcon name={it.icon} on size={40} />
              </span>
            </PaletteProvider>
          </div>
        )
      })}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: H - 96 }}>
        <Coupe />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- the page

export function StainedPage({ core, opened }: { core: Core; opened: boolean }) {
  const cd = useCountdown(core.start)
  const s = core.start
  const photo = core.gallery[1] || core.gallery[0]
  const album = core.gallery.slice(2)
  const [viewer, setViewer] = useState<number | null>(null)
  const video = videoEmbed(core.event.video_url)
  const families = [
    { k: "Nhà gái", v: core.event.bride_family, role: "Con gái", name: core.event.bride_full_name || core.bride },
    { k: "Nhà trai", v: core.event.groom_family, role: "Con trai", name: core.event.groom_full_name || core.groom },
  ]
  const hasFamilies = !!(core.event.bride_family || core.event.groom_family)
  const tone = { ink: C.ink, muted: C.muted, line: "#E6D3D1", field: "#FFFFFF", accent: C.olive, onAccent: C.cream, ok: C.leafDeep, okBg: "#EEF0E3", palette: PAL }

  return (
    <PaletteProvider value={PAL}>
      <GlassDefs />
      <div className="min-h-screen" style={{ background: C.paper, color: C.ink, fontFamily: SERIF }}>
        <main className="mx-auto max-w-[480px] overflow-hidden" style={{ background: C.paper, boxShadow: "0 0 60px rgba(120,60,60,.12)" }}>
          <Cover core={core} opened={opened} />

          {/* ---- olive card: thanks + the mirror */}
          <Scene className="px-4 pt-4 pb-14">
            <Raised max={5} thick={1.5}><div className="em-dark rounded-t-[200px] rounded-b-[28px] px-6 pt-14 pb-12 text-center" style={{ background: C.olive, color: C.cream }}>
              <div className="flex justify-center">
                <RoseSprig w={110} />
              </div>
              <p className="mt-4 text-[38px] leading-[1.1]" style={{ fontFamily: SCRIPT, color: C.cream }}>
                Thật vui khi được chung vui cùng bạn
              </p>
              <p className="mt-4 text-[17px] leading-relaxed" style={{ color: "rgba(247,238,228,.86)" }}>
                {core.message}
              </p>
              <div className="mt-10">
                <ScratchMirror photo={photo} />
              </div>
              <p className="mt-16 text-[13px] tracking-[0.22em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: "rgba(247,238,228,.7)" }}>
                Kính gửi {core.guest.name}
              </p>
            </div></Raised>
          </Scene>

          {/* ---- families */}
          {hasFamilies && (
            <Scene className="px-6 pb-14 text-center">
              <Kicker>Hai gia đình</Kicker>
              <Title>Trân trọng báo tin</Title>
              <div className="mt-8 grid grid-cols-2 gap-5">
                {families.map((f) => (
                  <div key={f.k}>
                    <p className="text-[14px] tracking-[0.2em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: C.rose }}>
                      {f.k}
                    </p>
                    <p className="mt-2 text-[16px] whitespace-pre-line leading-relaxed">{f.v}</p>
                    {f.name && (
                      <>
                        <p className="mt-3 text-[13px]" style={{ color: C.muted }}>
                          {f.role}
                        </p>
                        <p className="text-[30px] leading-tight" style={{ fontFamily: SCRIPT, color: C.roseDeep }}>
                          {f.name}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Scene>
          )}

          {/* ---- ceremonies */}
          <Scene className="px-5 pb-14 text-center">
            <Kicker>Lễ cưới & tiệc cưới</Kicker>
            <Title>Ngày chung đôi</Title>
            <div className="mt-8 flex flex-col gap-8">
              {core.ceremonies.map((c, i) => {
                const d = c.date ? new Date(`${c.date}T${c.time || "00:00"}:00`) : null
                return <CeremonyCard key={i} name={c.name} date={d} time={c.time} place={c.place} address={c.address} kind="chapel" core={core} />
              })}
              <CeremonyCard name={core.ceremonies.length ? "Tiệc cưới" : "Lễ thành hôn & tiệc cưới"} date={s} place={core.event.venue_name} address={core.event.venue_address} kind="hall" core={core} />
            </div>
          </Scene>

          {/* ---- countdown */}
          {s && cd && (
            <Scene className="px-5 pb-14 text-center">
              <Kicker>{core.dayOver ? "Cảm ơn bạn" : "Còn"}</Kicker>
              {!cd.over ? (
                <Raised max={9}><div className="mt-5 flex justify-center gap-3">
                  {[
                    [cd.d, "ngày"],
                    [cd.h, "giờ"],
                    [cd.m, "phút"],
                    [cd.s, "giây"],
                  ].map(([v, l]) => (
                    <div key={l as string} className="w-[74px] h-[74px] rounded-full flex flex-col items-center justify-center" style={{ backgroundImage: FROST, backgroundSize: "220px 220px, cover, cover, cover", boxShadow: `inset 0 0 0 2px ${C.lead}, inset 0 3px 4px rgba(255,255,255,.8), inset 0 -4px 6px rgba(120,60,60,.25), 0 3px 0 ${C.leadDark}, 0 12px 18px -10px rgba(120,60,60,.55)` }}>
                      <span className="text-[26px] leading-none tabular-nums" style={{ fontFamily: SC, fontWeight: 700, color: C.roseDeep }}>
                        {p2(v as number)}
                      </span>
                      <span className="text-[11px] mt-1 tracking-[0.14em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: C.ink }}>
                        {l}
                      </span>
                    </div>
                  ))}
                </div></Raised>
              ) : (
                <p className="mt-3 text-[34px]" style={{ fontFamily: SCRIPT, color: C.roseDeep }}>
                  {core.dayOver ? "Cảm ơn bạn đã đến chung vui" : "Hôm nay là ngày cưới!"}
                </p>
              )}
            </Scene>
          )}

          {/* ---- programme */}
          {core.timeline.length > 0 && (
            <Scene className="px-4 pb-10 text-center">
              <Title>Chương trình</Title>
              <Kicker>Diễn biến ngày vui</Kicker>
              <div className="mt-4">
                <Programme items={core.timeline} />
              </div>
            </Scene>
          )}

          {/* ---- dress code */}
          {(core.dressCode || core.dressColors.length > 0) && (
            <Scene className="px-6 pb-6 text-center">
              <div className="flex justify-center">
                <Attire />
              </div>
              <Title>Trang phục</Title>
              {core.dressCode && <p className="mt-3 text-[17px] leading-relaxed">{core.dressCode}</p>}
              {core.dressColors.length > 0 && (
                <div className="mt-5 flex justify-center gap-3">
                  {core.dressColors.map((c) => (
                    <span key={c} className="w-10 h-10 rounded-full" style={{ background: c, boxShadow: `inset 0 0 0 2px ${C.lead}, inset 0 6px 8px rgba(255,255,255,.45)` }} />
                  ))}
                </div>
              )}
              <StringLights />
            </Scene>
          )}

          {/* ---- story */}
          {(core.story || core.milestones.length > 0) && (
            <Scene className="px-6 pb-14 text-center">
              <Kicker>Câu chuyện</Kicker>
              <Title>Chuyện của chúng mình</Title>
              {core.story && <p className="mt-5 text-[17px] leading-relaxed text-left">{core.story}</p>}
              {core.milestones.length > 0 && (
                <div className="mt-8 text-left">
                  <Milestones items={core.milestones} />
                </div>
              )}
            </Scene>
          )}

          {/* ---- album: arched glass windows */}
          {album.length > 0 && (
            <Scene className="px-5 pb-14 text-center">
              <Kicker>Khoảnh khắc</Kicker>
              <Title>Album</Title>
              <div className="mt-7 grid grid-cols-2 gap-4">
                {album.map((u, i) => (
                  <button key={u} type="button" onClick={() => setViewer(core.gallery.indexOf(u))} className={"relative overflow-hidden rounded-t-full " + (i % 3 === 0 ? "col-span-2 aspect-[4/3] rounded-t-[160px]" : "aspect-[3/4]")} style={{ boxShadow: `0 0 0 3px ${C.lead}, 0 0 0 7px ${C.glass1}, 0 0 0 9px ${C.lead}` }} aria-label="Xem ảnh">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </Scene>
          )}

          {/* ---- faq */}
          {core.faq.length > 0 && (
            <Scene className="px-6 pb-14 text-center">
              <Kicker>Hỏi đáp</Kicker>
              <Title>Bạn cần biết</Title>
              <div className="mt-6 text-left">
                <FaqList items={core.faq} />
              </div>
            </Scene>
          )}

          {/* ---- RSVP: olive band under a scalloped glass border */}
          <Scene className="pt-[46px] em-dark" style={{ background: C.olive }}>
            <div className="absolute inset-x-0 top-0 h-[46px]" style={{ backgroundImage: SCALLOP, backgroundSize: "80px 46px", backgroundRepeat: "repeat-x", backgroundColor: C.paper }} aria-hidden />
            <div className="px-5 pt-10 pb-14 text-center">
              <Kicker light>Hồi âm</Kicker>
              <Title light>Xác nhận tham dự</Title>
              <Raised max={3} thick={1.3}><div className="mt-7 rounded-[22px] p-5" style={{ background: "#FFFBF8" }}>
                <RsvpForm core={core} tone={tone} />
              </div></Raised>
            </div>
          </Scene>

          {/* ---- guestbook */}
          <Scene className="px-5 pb-14 text-center">
            <Kicker>Sổ lưu bút</Kicker>
            <Title>Gửi lời chúc</Title>
            <div className="mt-6">
              <Guestbook code={core.guest.code} guestName={core.guest.name} preview={core.preview} />
            </div>
          </Scene>

          {/* ---- video */}
          {video && (
            <Scene className="px-5 pb-14 text-center">
              <Title>Thước phim</Title>
              <div className="mt-5 aspect-video overflow-hidden rounded-xl" style={{ boxShadow: `0 0 0 3px ${C.lead}` }}>
                {video.kind === "iframe" ? <iframe src={video.src} title="Video cưới" className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : video.kind === "file" ? <video src={video.src} controls playsInline className="w-full h-full object-contain bg-black" /> : <a href={video.src} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center text-[15px] underline" style={{ background: C.blush }}>Mở video</a>}
              </div>
            </Scene>
          )}

          {/* ---- gifts */}
          {(core.gifts.length > 0 || core.giftQr) && (
            <Scene className="mx-4 mb-14 px-5 py-12 text-center rounded-[6px]" style={{ background: "#F1E6DD" }}>
              <div className="flex justify-center">
                <Raised max={12}><GiftBox /></Raised>
              </div>
              <Title>Mừng cưới</Title>
              <p className="mt-2 mb-6 text-[16px]" style={{ color: C.muted }}>
                Sự có mặt của bạn là món quà quý nhất. Nếu bạn ở xa và muốn gửi lời chúc, chúng mình xin nhận tại đây.
              </p>
              <GiftAccounts accounts={core.gifts} fallbackQr={core.giftQr} />
            </Scene>
          )}

          {/* ---- footer */}
          <footer className="relative text-center px-6 pt-[70px] pb-10" style={{ background: C.paper }}>
            <div className="absolute inset-x-0 top-0 h-[46px] rotate-180" style={{ backgroundImage: SCALLOP, backgroundSize: "80px 46px", backgroundRepeat: "repeat-x", backgroundColor: C.paper }} aria-hidden />
            <div className="flex justify-center">
              <GlassRose size={70} />
            </div>
            <p className="mt-2 text-[44px] leading-tight" style={{ fontFamily: SCRIPT, color: C.roseDeep }}>
              {core.couple}
            </p>
            {s && (
              <p className="mt-1 text-[15px] tracking-[0.2em]" style={{ fontFamily: SC, fontWeight: 700, color: C.ink }}>
                {p2(s.getDate())}.{p2(s.getMonth() + 1)}.{s.getFullYear()}
              </p>
            )}
            <p className="mt-6 text-[12px]" style={{ color: C.muted }}>
              Thiệp làm bằng WedTable
            </p>
          </footer>
        </main>
      </div>
      {core.musicUrl && opened && <MusicToggle src={core.musicUrl} start={opened} />}
      {viewer !== null && <Lightbox photos={core.gallery} index={viewer} onClose={() => setViewer(null)} onIndex={setViewer} />}
      <style>{`
        .sg-scene{opacity:0;transform:translateY(22px);filter:blur(3px);transition:opacity .9s ease,transform 1s cubic-bezier(.2,.7,.2,1),filter .9s ease}
        .sg-scene.sg-in{opacity:1;transform:none;filter:none}
        .sg-fade{opacity:0;transform:translateY(6px);transition:opacity 1s ease,transform 1s ease}
        .sg-fade.sg-on{opacity:1;transform:none}
        .sg-pane{opacity:0}
        .sg-panes-on .sg-pane{animation:sgPane .5s ease forwards}
        @keyframes sgPane{from{opacity:0}to{opacity:1}}
        .sg-bloom{opacity:0;transform:scale(.4) rotate(-20deg);transition:opacity .9s ease,transform 1.1s cubic-bezier(.3,1.4,.5,1)}
        .sg-bloom-on{opacity:1;transform:none}
        .sg-draw path,.sg-draw circle{stroke-dasharray:600;stroke-dashoffset:600}
        .sg-in .sg-draw path,.sg-in .sg-draw circle{animation:sgDraw 2.4s ease forwards}
        @keyframes sgDraw{to{stroke-dashoffset:0}}
        .sg-in .sg-lid{animation:sgLid 1.2s cubic-bezier(.3,1.6,.5,1) .4s both;transform-origin:20% 100%;transform-box:fill-box}
        @keyframes sgLid{0%{transform:none}40%{transform:translateY(-8px) rotate(-6deg)}100%{transform:none}}
        .sg-spark{animation:sgTw 1.8s ease-in-out infinite}
        @keyframes sgTw{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes sgSpark{to{transform:translate(var(--dx),var(--dy)) scale(.3);opacity:0}}
        @media (prefers-reduced-motion: reduce){.sg-scene,.sg-fade,.sg-bloom{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}.sg-pane{opacity:1!important;animation:none!important}.sg-draw path,.sg-draw circle{stroke-dashoffset:0!important;animation:none!important}}
      `}</style>
    </PaletteProvider>
  )
}

/** Still cover for the template picker */
export function StainedThumb({ event }: { event: any }) {
  const c = { bride: event.bride_name || "", groom: event.groom_name || "", start: eventStart(event.event_date, event.event_time) }
  return (
    <div style={{ fontFamily: SERIF }}>
      <GlassDefs />
      <Cover core={c} opened />
      <style>{`.sg-fade{opacity:1!important;transform:none!important}.sg-bloom{opacity:1!important;transform:none!important}.sg-pane{opacity:1!important}`}</style>
    </div>
  )
}
