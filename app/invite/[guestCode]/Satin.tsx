"use client"

// "Lụa dập nổi" (embossed satin). Style study of the user's reference video 2 (style only): a satin
// envelope with deep fan-petal embossing and a plum wax seal, a flap that lifts, a ribbon that unties
// and a crumpled silk lining that slides away; inside, a matte card with a raised baroque frame, an
// indigo band with a torn paper countdown, a photo medallion that sharpens as it reaches the middle of
// the screen, a programme framed by embossed drapery, a dress code stamped with wax, a postage-stamp
// gift card. All textures are drawn here (SVG lighting filters, rasterised once as blob URLs).
import { useMemo, useState } from "react"
import { lunarLine } from "@/lib/lunar"
import { videoEmbed } from "@/lib/videoEmbed"
import type { Palette } from "@/lib/inviteThemes"
import { Letters, LineIcon } from "./Ivory"
import { PaletteProvider } from "./Ornaments"
import { GiftAccounts, Guestbook, Milestones } from "./Sections"
import { FaqList, MusicToggle } from "./Extras"
import { Lightbox } from "./Album"
import { WaxSeal } from "./Looks"
import { MiniBow } from "./Silk"
import { embossSvg, bloom, leaf } from "./emboss"
import { useEmbossUrl } from "./useEmboss"
import { Core, Painted, Raised, RsvpForm, eventStart, googleCalendarUrl, p2, useCountdown, useOpening, useScrollProgress, useSeen, weekday } from "./kit"

// ---------------------------------------------------------------- palette

const C = {
  satin: "#CDB4BA",
  satinDeep: "#B3939C",
  satinLight: "#E8DADD",
  card: "#ECE1E3",
  paper: "#F4ECEE",
  plum: "#6B3F4E",
  plumSoft: "#8C6371",
  indigo: "#4B5470",
  indigoSoft: "#5E6784",
  ink: "#4A3A40",
  muted: "#83707A",
  line: "#DCCBD0",
  cream: "#FBF6F4",
}
const PAL: Palette = {
  bg: C.paper,
  paper: "#FFFFFF",
  blush: C.satinLight,
  rose: C.plumSoft,
  wine: C.plum,
  sage: C.satinDeep,
  leaf: C.indigo,
  ink: C.ink,
  muted: C.muted,
  line: C.line,
  soft: "#F7F0F2",
  okBg: "#ECEEF4",
  deep: C.indigo,
  gold: ["#E9D5B5", "#B8956A", "#7E6040"],
}
const INK_PAL: Palette = { ...PAL, ink: C.plum }

const SCRIPT = "var(--iv-pinyon), cursive"
const SC = "var(--iv-sc), serif"
const SERIF = "var(--iv-serif), serif"

// ---------------------------------------------------------------- generated textures

const f = (n: number) => n.toFixed(1)
const g = (v: number) => {
  const c = Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")
  return `#${c}${c}${c}`
}
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

/** Crumpled satin: broad soft folds lit from the top left. The base colour stays dominant
 *  (base x (0.66 + 0.4 x light)) and a gentle specular sheen sits on the fold crests. */
function satinSvg(w: number, h: number, base: string, seed = 3, fold = 0.0035, depth = 7) {
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>` +
    `<filter id='s' x='0' y='0' width='100%' height='100%' color-interpolation-filters='sRGB'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${fold} ${fold * 1.8}' numOctaves='2' seed='${seed}' result='n'/>` +
    `<feGaussianBlur in='n' stdDeviation='9' result='nb'/>` +
    `<feDiffuseLighting in='nb' surfaceScale='${depth}' diffuseConstant='1' lighting-color='#fff' result='d'><feDistantLight azimuth='235' elevation='52'/></feDiffuseLighting>` +
    `<feSpecularLighting in='nb' surfaceScale='${depth}' specularConstant='.45' specularExponent='20' lighting-color='#fff' result='sp'><feDistantLight azimuth='235' elevation='56'/></feSpecularLighting>` +
    `<feFlood flood-color='${base}' result='c'/>` +
    `<feComposite in='c' in2='d' operator='arithmetic' k1='.4' k2='.66' k3='0' k4='0' result='cd'/>` +
    `<feComposite in='cd' in2='sp' operator='arithmetic' k1='0' k2='1' k3='.28' k4='0'/>` +
    `</filter><rect width='${w}' height='${h}' filter='url(#s)'/></svg>`
  )
}

/** A fan of long petals (lily-like) spreading from one point, each with a raised midrib */
function fan(cx: number, cy: number, r: number, rot: number) {
  let s = `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})">`
  const n = 7
  for (let i = 0; i < n; i++) {
    const a = -54 + (108 * i) / (n - 1)
    const L = r * (0.78 + 0.22 * Math.cos((a * Math.PI) / 180))
    const W = L * 0.2
    s += `<g transform="rotate(${f(a)})"><path d="M0 0 C${f(W)} ${f(-L * 0.3)} ${f(W * 1.15)} ${f(-L * 0.7)} 0 ${f(-L)} C${f(-W * 1.15)} ${f(-L * 0.7)} ${f(-W)} ${f(-L * 0.3)} 0 0Z" fill="${g(0.48)}" stroke="${g(0.3)}" stroke-width="2"/><path d="M0 ${f(-L * 0.08)} L0 ${f(-L * 0.9)}" stroke="${g(0.7)}" stroke-width="2.4" stroke-linecap="round"/></g>`
  }
  s += `<circle r="${f(r * 0.09)}" fill="${g(0.72)}"/>`
  return s + "</g>"
}

function envelopeArt(w: number, h: number) {
  const rand = rng(17)
  let s = ""
  const spots: [number, number, number, number][] = [
    [w * 0.12, h * 0.16, 150, 140], [w * 0.88, h * 0.12, 150, 220], [w * 0.2, h * 0.48, 130, 80], [w * 0.82, h * 0.52, 140, 260],
    [w * 0.5, h * 0.72, 160, 0], [w * 0.1, h * 0.88, 150, 40], [w * 0.92, h * 0.9, 150, 320], [w * 0.5, h * 0.3, 120, 180],
  ]
  for (const [x, y, r, rot] of spots) s += fan(x, y, r * (0.9 + rand() * 0.2), rot + rand() * 20)
  return s
}

/** Baroque frame: scalloped top arch, double moulding, roses and curls at the corners */
function baroqueArt(w: number, h: number, inset = 26) {
  const rand = rng(41)
  const x0 = inset, y0 = inset + 40, x1 = w - inset, y1 = h - inset
  const top = `M${x0} ${y0 + 30} Q${x0} ${y0} ${x0 + 40} ${y0} L${w * 0.32} ${y0} Q${w * 0.38} ${y0 - 34} ${w * 0.5} ${y0 - 40} Q${w * 0.62} ${y0 - 34} ${w * 0.68} ${y0} L${x1 - 40} ${y0} Q${x1} ${y0} ${x1} ${y0 + 30}`
  const frame = (k: number) =>
    `M${x0 + k} ${y0 + 30} Q${x0 + k} ${y0 + k} ${x0 + 40} ${y0 + k} L${w * 0.32} ${y0 + k} Q${w * 0.38} ${y0 - 34 + k} ${w * 0.5} ${y0 - 40 + k} Q${w * 0.62} ${y0 - 34 + k} ${w * 0.68} ${y0 + k} L${x1 - 40} ${y0 + k} Q${x1 - k} ${y0 + k} ${x1 - k} ${y0 + 30} L${x1 - k} ${y1 - 30} Q${x1 - k} ${y1 - k} ${x1 - 40} ${y1 - k} L${x0 + 40} ${y1 - k} Q${x0 + k} ${y1 - k} ${x0 + k} ${y1 - 30}Z`
  let s = `<path d="${frame(0)}" fill="none" stroke="${g(0.55)}" stroke-width="7"/>`
  s += `<path d="${frame(12)}" fill="none" stroke="${g(0.38)}" stroke-width="3"/>`
  s += `<path d="${frame(19)}" fill="none" stroke="${g(0.3)}" stroke-width="1.6"/>`
  void top
  const corners: [number, number, number][] = [[x0 + 8, y0 + 4, 30], [x1 - 8, y0 + 4, 30], [x0 + 8, y1 - 8, 34], [x1 - 8, y1 - 8, 34]]
  corners.forEach(([x, y, r], i) => {
    s += leaf(x + (i % 2 ? -10 : 10), y + (i < 2 ? 30 : -30), 46, i % 2 ? 210 : 150)
    s += leaf(x + (i % 2 ? -34 : 34), y, 40, i % 2 ? 270 : 90)
    s += bloom(x, y, r, rand() * 60, rand)
  })
  s += bloom(w * 0.5, y0 - 30, 26, 10, rand)
  return s
}

/** Drapery: swagged satin across the top and gathered curtains down both sides */
function drapeArt(w: number, h: number) {
  let s = ""
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < 6; i++) {
      const x = side ? w - 8 - i * 9 : 8 + i * 9
      const v = 0.3 + (i % 2) * 0.35
      s += `<path d="M${x} 0 C${x + (side ? -6 : 6)} ${h * 0.3} ${x + (side ? 8 : -8)} ${h * 0.6} ${x + (side ? -14 : 14) * (i / 5)} ${h}" fill="none" stroke="${g(v)}" stroke-width="7" stroke-linecap="round"/>`
    }
    const tx = side ? w - 46 : 46
    s += `<path d="M${tx - 22} ${h * 0.42} q22 10 44 0" stroke="${g(0.7)}" stroke-width="8" fill="none" stroke-linecap="round"/>`
  }
  for (let k = 0; k < 4; k++) {
    const y = 12 + k * 9
    s += `<path d="M0 ${y} Q${w * 0.25} ${y + 60 - k * 8} ${w * 0.5} ${y} Q${w * 0.75} ${y + 60 - k * 8} ${w} ${y}" fill="none" stroke="${g(0.35 + (k % 2) * 0.3)}" stroke-width="7" stroke-linecap="round"/>`
  }
  return s
}

/** Dense leafy wreath around a rounded rectangle */
function foliageArt(w: number, h: number) {
  const rand = rng(7)
  let s = ""
  const per = 2 * (w + h)
  for (let d = 0; d < per; d += 22) {
    let x: number, y: number, rot: number
    if (d < w) [x, y, rot] = [d, 14, 90]
    else if (d < w + h) [x, y, rot] = [w - 14, d - w, 180]
    else if (d < 2 * w + h) [x, y, rot] = [w - (d - w - h), h - 14, 270]
    else [x, y, rot] = [14, h - (d - 2 * w - h), 0]
    s += leaf(x, y, 34 + rand() * 14, rot + (rand() - 0.5) * 70)
  }
  return s
}

function useSatin(w: number, h: number, base: string, seed = 3, fold = 0.0035) {
  return useEmbossUrl(() => satinSvg(w, h, base, seed, fold), [w, h, base, seed, fold])
}
function useRelief(w: number, h: number, art: () => string, depth = 3.2, key = "") {
  return useEmbossUrl(() => embossSvg(w, h, "#ffffff", art(), { depth, blur: 2.2, light: 52 }), [w, h, key])
}

// ---------------------------------------------------------------- small pieces

function Kicker({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className="text-[13px] tracking-[0.28em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: light ? "rgba(251,246,244,.75)" : C.muted }}>
      {children}
    </p>
  )
}
function Title({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <h2 className="text-[46px] leading-[1.05]" style={{ fontFamily: SCRIPT, color: light ? C.cream : C.plum }}>
      {children}
    </h2>
  )
}
function Btn({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center h-11 px-5 text-[13px] tracking-[0.16em] uppercase border transition-colors hover:bg-white/50" style={{ borderColor: C.plum, color: C.plum, fontFamily: SC, fontWeight: 700 }}>
      {children}
    </a>
  )
}

function Scene({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const [ref, seen] = useSeen<HTMLElement>(0.12)
  return (
    <section ref={ref as any} className={"relative st-scene " + (seen ? "st-in " : "") + className} style={style}>
      {children}
    </section>
  )
}

/** Torn paper strip (jagged top and bottom edges) */
function torn(seed = 5) {
  const r = rng(seed)
  const pts: string[] = []
  for (let i = 0; i <= 40; i++) pts.push(`${(i * 2.5).toFixed(1)}% ${(r() * 7).toFixed(1)}%`)
  for (let i = 40; i >= 0; i--) pts.push(`${(i * 2.5).toFixed(1)}% ${(93 + r() * 7).toFixed(1)}%`)
  return `polygon(${pts.join(",")})`
}

function Palace() {
  const ink = { fill: "none", stroke: C.plumSoft, strokeWidth: 1.1, strokeLinecap: "round" as const }
  return (
    <svg viewBox="0 0 240 120" width="240" aria-hidden className="st-draw">
      <g {...ink}>
        <path d="M10 112H230" strokeWidth="1.4" />
        <path d="M30 112V56H210V112" />
        <path d="M24 56H216L200 44H40Z" />
        <path d="M90 44V24H150V44M86 24H154L120 8Z" />
        <circle cx="120" cy="34" r="5" />
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <path d={`M${40 + i * 20} 112V78 C${40 + i * 20} 70 ${52 + i * 20} 70 ${52 + i * 20} 78V112`} />
            <path d={`M${40 + i * 20} 66H${52 + i * 20}`} strokeWidth=".7" />
          </g>
        ))}
        {Array.from({ length: 22 }, (_, i) => (
          <path key={"h" + i} d={`M${32 + i * 8} 58 l-4 6`} strokeWidth=".5" />
        ))}
        <path d="M4 112 C10 98 18 96 20 104 C22 92 30 94 30 112M210 112 C210 94 218 92 220 104 C222 96 230 98 236 112" />
      </g>
    </svg>
  )
}

function Attire() {
  const ink = { fill: "none", stroke: C.plumSoft, strokeWidth: 1.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  return (
    <svg viewBox="0 0 200 130" width="200" aria-hidden className="st-draw">
      <g {...ink}>
        <path d="M60 6V12 C60 16 66 16 66 20 M48 26 L66 20 L84 26" />
        <path d="M54 26 C56 36 58 40 56 46 C52 66 36 100 30 122 H102 C96 100 80 66 76 46 C74 40 76 36 78 26" fill={C.satinLight} />
        <path d="M56 46 C62 50 70 50 76 46M44 92 C60 96 80 96 92 92" strokeWidth=".8" />
        <path d="M146 6V12 C146 16 152 16 152 20 M132 26 L152 20 L172 26" />
        <path d="M132 26 L124 42 V110 H180 V42 L172 26 L158 36 L152 66 L146 36Z" fill={C.cream} />
        <path d="M152 66V110M146 36 L152 48 L158 36" strokeWidth=".8" />
      </g>
    </svg>
  )
}

function Stamp() {
  return (
    <svg viewBox="0 0 110 130" width="96" aria-hidden className="st-stamp">
      <defs>
        <mask id="stPerf">
          <rect width="110" height="130" fill="#fff" />
          {Array.from({ length: 11 }, (_, i) => (
            <g key={i}>
              <circle cx={5 + i * 10} cy="0" r="3.6" fill="#000" />
              <circle cx={5 + i * 10} cy="130" r="3.6" fill="#000" />
            </g>
          ))}
          {Array.from({ length: 13 }, (_, i) => (
            <g key={"v" + i}>
              <circle cx="0" cy={5 + i * 10} r="3.6" fill="#000" />
              <circle cx="110" cy={5 + i * 10} r="3.6" fill="#000" />
            </g>
          ))}
        </mask>
      </defs>
      <rect width="110" height="130" fill={C.cream} mask="url(#stPerf)" />
      <rect x="12" y="12" width="86" height="106" fill={C.satinLight} stroke={C.plumSoft} strokeWidth="1" />
      <path d="M55 92 C 30 76 26 54 40 46 C 48 42 54 48 55 54 C 56 48 62 42 70 46 C 84 54 80 76 55 92Z" fill={C.plumSoft} opacity=".85" />
      <text x="55" y="112" textAnchor="middle" fontSize="9" fill={C.plum} style={{ fontFamily: SC, fontWeight: 700, letterSpacing: ".18em" }}>
        MỪNG CƯỚI
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------- opening: satin envelope

export function SatinIntro({ core, onOpened, onReveal }: { core: Core; onOpened: () => void; onReveal: () => void }) {
  const { phase, tap } = useOpening(3800, onOpened, 2600, onReveal)
  const W = 480, H = 900
  const satin = useSatin(W, H, C.satin, 4)
  const lining = useSatin(W, H, C.satinLight, 9, 0.005)
  const relief = useRelief(W, H, () => envelopeArt(W, H), 3.6, "env")
  const flapRelief = useRelief(W, 560, () => envelopeArt(W, 560), 3.6, "flap")
  const initials = `${(core.bride.split(/\s+/).pop() || "").charAt(0)}${(core.groom.split(/\s+/).pop() || "").charAt(0)}`
  const layer = (img?: string, extra: React.CSSProperties = {}) => ({ backgroundImage: [img, undefined].filter(Boolean).join(","), backgroundSize: "cover", backgroundPosition: "center", ...extra }) as React.CSSProperties
  return (
    <div className={"fixed inset-0 z-50 overflow-hidden select-none st-intro " + (phase !== "idle" ? "st-run " : "") + (phase === "out" ? "st-out" : "")} onClick={tap} role="button" aria-label="Mở thiệp mời">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[480px]" style={{ perspective: 1400 }}>
        {/* the silk lining inside, with the ribbon and bow, slides away last */}
        <div className="absolute inset-0 st-lining" style={layer(lining, { backgroundColor: C.satinLight })}>
          <div className="absolute inset-x-0 top-[54%] h-[54px] -translate-y-1/2 flex">
            <span className="flex-1 st-ribbon-l" style={{ background: `linear-gradient(180deg, rgba(0,0,0,.12), rgba(255,255,255,.45) 40%, rgba(0,0,0,.1)), ${C.satinDeep}` }} />
            <span className="flex-1 st-ribbon-r" style={{ background: `linear-gradient(180deg, rgba(0,0,0,.12), rgba(255,255,255,.45) 40%, rgba(0,0,0,.1)), ${C.satinDeep}` }} />
          </div>
          <div className="absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2 st-bow">
            <MiniBow color={C.satinDeep} size={170} />
          </div>
        </div>
        {/* envelope body (lower part) */}
        <div className="absolute inset-0 st-body" style={{ ...layer(satin, { backgroundColor: C.satin }), clipPath: "polygon(0 34%, 50% 62%, 100% 34%, 100% 100%, 0 100%)" }}>
          <div className="absolute inset-0" style={{ backgroundImage: relief, backgroundSize: "cover", mixBlendMode: "multiply" }} />
          <p className="absolute inset-x-0 bottom-[16%] text-center px-8 st-who" style={{ color: C.plum }}>
            <span className="block text-[26px]" style={{ fontFamily: SCRIPT }}>
              Kính gửi
            </span>
            <span className="block mt-1 text-[18px] tracking-[0.08em]" style={{ fontFamily: SC, fontWeight: 700 }}>
              {core.guest.name}
            </span>
          </p>
        </div>
        {/* the flap, hinged on the top edge */}
        <div className="absolute inset-x-0 top-0 h-[62%] st-flap" style={{ transformOrigin: "50% 0" }}>
          <div className="absolute inset-0" style={{ ...layer(satin, { backgroundColor: C.satinDeep }), clipPath: "polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%)", filter: "drop-shadow(0 8px 10px rgba(60,30,40,.35))" }}>
            <div className="absolute inset-0" style={{ backgroundImage: flapRelief, backgroundSize: "cover", mixBlendMode: "multiply" }} />
          </div>
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 st-seal">
            <WaxSeal text={initials.split("").join("")} size={104} color={C.plum} />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-[5%] flex justify-center pointer-events-none st-hint">
          <span className="px-5 py-2.5 text-[12px] tracking-[0.22em] uppercase" style={{ background: "rgba(251,246,244,.85)", color: C.plum, fontFamily: SC, fontWeight: 700 }}>
            Chạm vào dấu sáp để mở
          </span>
        </div>
      </div>
      <style>{`
        .st-intro{transition:opacity .6s ease}
        .st-out{opacity:0;pointer-events:none}
        .st-flap{transition:transform 1.3s cubic-bezier(.55,.05,.3,1) .15s;transform-style:preserve-3d}
        .st-run .st-flap{transform:rotateX(178deg)}
        .st-seal{transition:transform .35s ease}
        .st-run .st-seal{transform:translate(-50%,50%) scale(.94)}
        .st-body,.st-who,.st-hint{transition:transform 1.1s cubic-bezier(.55,.05,.3,1) 1s,opacity .5s ease}
        .st-run .st-body{transform:translateY(102%)}
        .st-run .st-hint{opacity:0}
        .st-bow{transition:transform 1s cubic-bezier(.45,0,.25,1) 1.6s,opacity .6s ease 2s}
        .st-run .st-bow{transform:translate(-50%,-10%) scale(.6) rotate(-14deg);opacity:0}
        .st-ribbon-l,.st-ribbon-r{transition:transform 1.1s cubic-bezier(.5,0,.3,1) 1.7s}
        .st-run .st-ribbon-l{transform:translateX(-102%)}
        .st-run .st-ribbon-r{transform:translateX(102%)}
        .st-lining{transition:transform 1.2s cubic-bezier(.6,.05,.3,1) 2.5s}
        .st-run .st-lining{transform:translateY(104%)}
        .st-hint span{animation:stNudge 2.2s ease-in-out infinite}
        @keyframes stNudge{50%{transform:translateY(-3px)}}
        @media (prefers-reduced-motion: reduce){.st-hint span{animation:none}}
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------- cover: matte card in a baroque frame

function Cover({ c, opened }: { c: { bride: string; groom: string; start: Date | null }; opened: boolean }) {
  const W = 360, H = 640
  const frame = useRelief(W, H, () => baroqueArt(W, H), 3.4, "cover")
  const s = c.start
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center px-3 py-6 overflow-hidden" style={{ background: C.card }}>
      <div className="relative w-full max-w-[380px]" style={{ aspectRatio: `${W} / ${H}`, backgroundImage: frame, backgroundSize: "100% 100%", mixBlendMode: "multiply" }} aria-hidden />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-[380px] px-12 text-center" style={{ aspectRatio: `${W} / ${H}`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p className={"text-[12px] tracking-[0.26em] uppercase st-fade " + (opened ? "st-on" : "")} style={{ fontFamily: SC, fontWeight: 700, color: C.muted, transitionDelay: ".5s" }}>
            Trân trọng báo tin lễ thành hôn
          </p>
          <h1 className="mt-5 leading-[1.02]" style={{ fontFamily: SCRIPT, color: C.plum }}>
            <Letters text={c.bride} on={opened} delay={0.9} step={0.07} className="block text-[54px]" />
            <Letters text="&" on={opened} delay={1.2} className="block text-[30px] my-1" style={{ color: C.plumSoft }} />
            <Letters text={c.groom} on={opened} delay={1.5} step={0.07} className="block text-[54px]" />
          </h1>
          {s && (
            <div className={"mt-6 st-fade " + (opened ? "st-on" : "")} style={{ transitionDelay: "2.2s" }}>
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
      {/* a fresh rose laid across the card */}
      <div className="absolute pointer-events-none" style={{ left: -26, bottom: "6%", width: 190, transform: "rotate(-32deg)", opacity: opened ? 1 : 0, transition: "opacity 1.4s ease 2.6s" }} aria-hidden>
        <Painted src="rose-blush" style={{ width: "100%" }} />
      </div>
      {/* light passing over the raised frame once it is revealed */}
      <div className={"absolute inset-0 pointer-events-none st-sheen " + (opened ? "st-sheen-on" : "")} />
    </section>
  )
}

// ---------------------------------------------------------------- sections

function Countdown({ start, dayOver }: { start: Date; dayOver: boolean }) {
  const cd = useCountdown(start)
  const [ref, seen] = useSeen<HTMLDivElement>(0.3)
  return (
    <div ref={ref} className="px-5 py-12 text-center em-dark" style={{ background: C.indigo }}>
      <Title light>{dayOver ? "Cảm ơn bạn" : "Đếm ngược"}</Title>
      <Raised max={8}><div className="mt-6 mx-auto max-w-[360px] px-4 py-6" style={{ background: C.cream, clipPath: seen ? torn(11) : "inset(0 50% 0 50%)", transition: "clip-path 1.1s cubic-bezier(.6,.05,.3,1)" }}>
        {cd && !cd.over ? (
          <div className="flex items-center justify-center gap-2" style={{ color: C.indigo }}>
            {[
              [cd.d, "ngày"],
              [cd.h, "giờ"],
              [cd.m, "phút"],
              [cd.s, "giây"],
            ].map(([v, l], i) => (
              <div key={l as string} className="flex items-center gap-2">
                {i > 0 && <span className="text-[24px] -mt-4">:</span>}
                <div className="text-center min-w-[52px]">
                  <p className="text-[34px] leading-none tabular-nums" style={{ fontFamily: SERIF, fontWeight: 500 }}>
                    {p2(v as number)}
                  </p>
                  <p className="mt-1 text-[11px] tracking-[0.16em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: C.muted }}>
                    {l}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[30px]" style={{ fontFamily: SCRIPT, color: C.indigo }}>
            {cd?.over ? "Hôm nay là ngày cưới!" : " "}
          </p>
        )}
      </div></Raised>
    </div>
  )
}

function Medallion({ photo }: { photo?: string }) {
  const [ref, p] = useScrollProgress<HTMLDivElement>()
  const W = 280, H = 360
  const ring = useRelief(W, H, () => {
    let s = `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${W / 2 - 14}" ry="${H / 2 - 14}" fill="none" stroke="${g(0.6)}" stroke-width="14"/>`
    s += `<ellipse cx="${W / 2}" cy="${H / 2}" rx="${W / 2 - 30}" ry="${H / 2 - 30}" fill="none" stroke="${g(0.38)}" stroke-width="3"/>`
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2
      s += `<circle cx="${f(W / 2 + Math.cos(a) * (W / 2 - 14))}" cy="${f(H / 2 + Math.sin(a) * (H / 2 - 14))}" r="4" fill="${g(0.78)}"/>`
    }
    const rand = rng(3)
    s += bloom(W / 2, 22, 22, 0, rand)
    s += leaf(W / 2 - 18, 26, 30, -100) + leaf(W / 2 + 18, 26, 30, 100)
    return s
  }, 3.2, "medal")
  // sharp and full size when the medallion reaches the middle of the screen
  const k = Math.min(1, p * 1.8)
  return (
    <div ref={ref} className="relative mx-auto" style={{ width: W, height: H }}>
      <div className="absolute rounded-[50%] overflow-hidden" style={{ inset: 26, background: C.satinLight }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="Ảnh cưới" className="w-full h-full object-cover" style={{ filter: `blur(${(1 - k) * 10}px) saturate(${0.6 + k * 0.4})`, transform: `scale(${1.15 - k * 0.15})`, transition: "filter .2s linear, transform .2s linear" }} />
        )}
      </div>
      <div className="absolute inset-0" style={{ backgroundImage: ring, backgroundSize: "100% 100%", mixBlendMode: "multiply" }} aria-hidden />
      <div className="absolute pointer-events-none" style={{ right: -54, top: -34, width: 130, transform: "rotate(38deg)" }} aria-hidden>
        <Painted src="rose-giant" style={{ width: "100%" }} />
      </div>
    </div>
  )
}

function DrapeCard({ children }: { children: React.ReactNode }) {
  const W = 380, H = 620
  const drape = useRelief(W, H, () => drapeArt(W, H), 4, "drape")
  return (
    <Raised max={4} thick={1.4}><div className="relative mx-auto max-w-[380px]" style={{ background: C.satinLight }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: drape, backgroundSize: "100% 100%", mixBlendMode: "multiply" }} aria-hidden />
      <div className="relative px-14 pt-20 pb-12">{children}</div>
    </div></Raised>
  )
}

function FoliageCard({ children }: { children: React.ReactNode }) {
  const W = 380, H = 520
  const leaves = useRelief(W, H, () => foliageArt(W, H), 3.4, "leaves")
  return (
    <Raised max={4} thick={1.3}><div className="relative mx-auto max-w-[380px]" style={{ background: C.card }}>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: leaves, backgroundSize: "100% 100%", mixBlendMode: "multiply" }} aria-hidden />
      <div className="relative px-10 py-14">{children}</div>
    </div></Raised>
  )
}

function ThinFrame({ children, seal }: { children: React.ReactNode; seal?: string }) {
  const [ref, seen] = useSeen<HTMLDivElement>(0.35)
  return (
    <Raised shine thick={1.1}><div ref={ref} className="relative mx-auto max-w-[360px] px-6 py-10" style={{ boxShadow: `inset 0 0 0 1px ${C.plumSoft}, inset 0 0 0 6px ${C.paper}, inset 0 0 0 7px ${C.plumSoft}, ${"inset 0 2px 3px rgba(255,255,255,.85), inset 0 -2px 4px rgba(60,30,40,.12), inset 3px 0 6px rgba(60,30,40,.06), inset -3px 0 6px rgba(60,30,40,.06)"}`, borderRadius: "46px 46px 8px 8px", background: C.paper }}>
      {children}
      {seal && (
        <div className="absolute -bottom-6 -right-4" style={{ transform: seen ? "scale(1) rotate(-8deg)" : "scale(1.6) rotate(-20deg)", opacity: seen ? 1 : 0, transition: "transform .5s cubic-bezier(.3,1.5,.5,1) .5s, opacity .3s ease .5s", filter: "drop-shadow(0 6px 8px rgba(60,30,40,.35))" }}>
          <WaxSeal text={seal} size={82} color={C.plum} />
        </div>
      )}
    </div></Raised>
  )
}

// ---------------------------------------------------------------- the page

export function SatinPage({ core, opened }: { core: Core; opened: boolean }) {
  const s = core.start
  const silk = useSatin(480, 900, C.satin, 12)
  const photo = core.gallery[0]
  const album = core.gallery.slice(1)
  const [viewer, setViewer] = useState<number | null>(null)
  const video = videoEmbed(core.event.video_url)
  const initials = `${(core.bride.split(/\s+/).pop() || "").charAt(0)}${(core.groom.split(/\s+/).pop() || "").charAt(0)}`
  const families = [
    { k: "Nhà gái", v: core.event.bride_family, role: "Con gái", name: core.event.bride_full_name || core.bride },
    { k: "Nhà trai", v: core.event.groom_family, role: "Con trai", name: core.event.groom_full_name || core.groom },
  ]
  const hasFamilies = !!(core.event.bride_family || core.event.groom_family)
  const tone = { ink: C.ink, muted: C.muted, line: C.line, field: "#FFFFFF", accent: C.indigo, onAccent: C.cream, ok: C.indigo, okBg: "#ECEEF4", palette: PAL }
  const places = useMemo(() => {
    const list = core.ceremonies.map((c) => ({ name: c.name, date: c.date ? new Date(`${c.date}T${c.time || "00:00"}:00`) : null, place: c.place, address: c.address }))
    list.push({ name: core.ceremonies.length ? "Tiệc cưới" : "Lễ thành hôn & tiệc cưới", date: s, place: core.event.venue_name, address: core.event.venue_address })
    return list
  }, [core.ceremonies, s, core.event.venue_name, core.event.venue_address])

  return (
    <PaletteProvider value={PAL}>
      <div className="min-h-screen" style={{ background: C.card, color: C.ink, fontFamily: SERIF }}>
        <main className="mx-auto max-w-[480px] overflow-hidden" style={{ background: C.paper, boxShadow: "0 0 60px rgba(70,40,50,.15)" }}>
          <Cover c={core} opened={opened} />

          {/* ---- photo medallion on crumpled satin */}
          <Scene className="px-5 py-14 text-center" style={{ backgroundImage: silk, backgroundSize: "cover", backgroundColor: C.satin }}>
            <Medallion photo={photo} />
            <p className="mt-6 text-[17px] leading-relaxed mx-auto max-w-[330px]" style={{ color: C.ink }}>
              {core.message}
            </p>
          </Scene>

          {/* ---- families */}
          {hasFamilies && (
            <Scene className="px-6 py-14 text-center">
              <Kicker>Hai gia đình</Kicker>
              <Title>Trân trọng báo tin</Title>
              <div className="mt-8 grid grid-cols-2 gap-5">
                {families.map((fm) => (
                  <div key={fm.k}>
                    <p className="text-[14px] tracking-[0.2em] uppercase" style={{ fontFamily: SC, fontWeight: 700, color: C.plumSoft }}>
                      {fm.k}
                    </p>
                    <p className="mt-2 text-[16px] whitespace-pre-line leading-relaxed">{fm.v}</p>
                    {fm.name && (
                      <>
                        <p className="mt-3 text-[13px]" style={{ color: C.muted }}>
                          {fm.role}
                        </p>
                        <p className="text-[30px] leading-tight" style={{ fontFamily: SCRIPT, color: C.plum }}>
                          {fm.name}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Scene>
          )}

          {/* ---- places */}
          <Scene className="px-6 py-14 text-center" style={{ background: C.satinLight }}>
            <Kicker>Địa điểm</Kicker>
            <Title>Ngày chung đôi</Title>
            <div className="mt-6 flex flex-col gap-12">
              {places.map((pl, i) => {
                const q = [pl.place, pl.address].filter(Boolean).join(", ")
                return (
                  <div key={i}>
                    <p className="text-[36px] leading-tight" style={{ fontFamily: SCRIPT, color: C.plum }}>
                      {pl.name}
                    </p>
                    {pl.date && (
                      <p className="mt-1 text-[15px] tracking-[0.14em]" style={{ fontFamily: SC, fontWeight: 700 }}>
                        {p2(pl.date.getHours())}:{p2(pl.date.getMinutes())} · {weekday(pl.date)} {p2(pl.date.getDate())}.{p2(pl.date.getMonth() + 1)}.{pl.date.getFullYear()}
                      </p>
                    )}
                    {pl.date && (
                      <p className="text-[14px] italic" style={{ color: C.muted }}>
                        {lunarLine(pl.date)}
                      </p>
                    )}
                    {pl.place && <p className="mt-3 text-[19px]" style={{ fontWeight: 500 }}>{pl.place}</p>}
                    {pl.address && (
                      <p className="text-[15px]" style={{ color: C.muted }}>
                        {pl.address}
                      </p>
                    )}
                    {i === places.length - 1 && (
                      <div className="my-5 flex justify-center">
                        <Palace />
                      </div>
                    )}
                    <div className="mt-4 flex gap-2 justify-center flex-wrap">
                      {q && <Btn href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`}>Chỉ đường</Btn>}
                      {pl.date && <Btn href={googleCalendarUrl(pl.date, `${pl.name} · ${core.couple}`, q)}>Lưu vào lịch</Btn>}
                    </div>
                  </div>
                )
              })}
            </div>
          </Scene>

          {s && <Countdown start={s} dayOver={core.dayOver} />}

          {/* ---- programme under drapery */}
          {core.timeline.length > 0 && (
            <Scene className="px-3 py-12 text-center">
              <DrapeCard>
                <Title>Chương trình</Title>
                <Kicker>Ngày vui của chúng mình</Kicker>
                <ul className="mt-7 flex flex-col gap-5 text-left relative">
                  <span className="absolute left-[22px] top-3 bottom-3 w-px" style={{ background: C.plumSoft, opacity: 0.5 }} aria-hidden />
                  {core.timeline.map((it, i) => (
                    <li key={i} className="flex items-start gap-4 relative st-row" style={{ transitionDelay: `${0.2 + i * 0.12}s` }}>
                      <span className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center" style={{ background: C.paper, boxShadow: `inset 0 0 0 1px ${C.plumSoft}` }}>
                        <PaletteProvider value={INK_PAL}>
                          <LineIcon name={it.icon} on size={26} />
                        </PaletteProvider>
                      </span>
                      <div className="pt-1">
                        <p className="text-[15px] tracking-[0.14em]" style={{ fontFamily: SC, fontWeight: 700, color: C.plumSoft }}>
                          {it.time}
                        </p>
                        <p className="text-[19px] leading-tight" style={{ fontWeight: 500 }}>
                          {it.title}
                        </p>
                        {it.note && (
                          <p className="text-[14px] italic" style={{ color: C.muted }}>
                            {it.note}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </DrapeCard>
            </Scene>
          )}

          {/* ---- dress code */}
          {(core.dressCode || core.dressColors.length > 0) && (
            <Scene className="px-6 py-12 text-center">
              <ThinFrame seal={initials}>
                <Title>Trang phục</Title>
                <div className="my-4 flex justify-center">
                  <Attire />
                </div>
                {core.dressCode && <p className="text-[17px] leading-relaxed">{core.dressCode}</p>}
                {core.dressColors.length > 0 && (
                  <div className="mt-5 flex justify-center gap-3">
                    {core.dressColors.map((c) => (
                      <span key={c} className="w-9 h-9 rounded-full" style={{ background: c, boxShadow: `0 0 0 3px ${C.paper}, 0 0 0 4px ${C.plumSoft}` }} />
                    ))}
                  </div>
                )}
              </ThinFrame>
            </Scene>
          )}

          {/* ---- story */}
          {(core.story || core.milestones.length > 0) && (
            <Scene className="px-6 py-14 text-center" style={{ background: C.satinLight }}>
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

          {/* ---- album on satin */}
          {album.length > 0 && (
            <Scene className="px-5 py-14 text-center" style={{ backgroundImage: silk, backgroundSize: "cover", backgroundColor: C.satin }}>
              <Title>Album</Title>
              <div className="mt-7 grid grid-cols-2 gap-4">
                {album.map((u, i) => (
                  <button key={u} type="button" onClick={() => setViewer(core.gallery.indexOf(u))} className={"relative overflow-hidden " + (i % 3 === 0 ? "col-span-2 aspect-[4/3] rounded-[50%]" : "aspect-[3/4] rounded-t-full")} style={{ boxShadow: `0 0 0 6px ${C.satinLight}, 0 0 0 7px ${C.plumSoft}, 0 14px 22px -12px rgba(60,30,40,.5)` }} aria-label="Xem ảnh">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" loading="lazy" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </Scene>
          )}

          {core.faq.length > 0 && (
            <Scene className="px-6 py-12 text-center">
              <Title>Bạn cần biết</Title>
              <div className="mt-6 text-left">
                <FaqList items={core.faq} />
              </div>
            </Scene>
          )}

          {/* ---- RSVP on indigo with a torn edge */}
          <Scene className="relative pt-10 em-dark" style={{ background: C.indigo }}>
            <div className="absolute inset-x-0 -top-px h-6" style={{ background: C.paper, clipPath: torn(3) }} aria-hidden />
            <div className="px-5 pt-8 pb-14 text-center">
              <Kicker light>Hồi âm</Kicker>
              <Title light>Xác nhận tham dự</Title>
              <Raised max={3} thick={1.3}><div className="mt-7 p-5" style={{ background: C.cream }}>
                <RsvpForm core={core} tone={tone} button="rounded-none" />
              </div></Raised>
            </div>
          </Scene>

          {/* ---- guestbook in a leafy frame */}
          <Scene className="px-3 py-12 text-center">
            <FoliageCard>
              <Kicker>Sổ lưu bút</Kicker>
              <Title>Gửi lời chúc</Title>
              <div className="mt-6">
                <Guestbook code={core.guest.code} guestName={core.guest.name} preview={core.preview} />
              </div>
            </FoliageCard>
          </Scene>

          {video && (
            <Scene className="px-5 py-12 text-center">
              <Title>Thước phim</Title>
              <div className="mt-5 aspect-video overflow-hidden" style={{ boxShadow: `0 0 0 6px ${C.satinLight}, 0 0 0 7px ${C.plumSoft}` }}>
                {video.kind === "iframe" ? <iframe src={video.src} title="Video cưới" className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : video.kind === "file" ? <video src={video.src} controls playsInline className="w-full h-full object-contain bg-black" /> : <a href={video.src} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center underline">Mở video</a>}
              </div>
            </Scene>
          )}

          {/* ---- gifts */}
          {(core.gifts.length > 0 || core.giftQr) && (
            <Scene className="px-6 py-14 text-center">
              <div className="flex justify-center">
                <Raised max={14}><Stamp /></Raised>
              </div>
              <Title>Mừng cưới</Title>
              <p className="mt-2 mb-6 text-[16px]" style={{ color: C.muted }}>
                Sự có mặt của bạn là món quà quý nhất. Nếu ở xa, bạn có thể gửi lời chúc qua đây.
              </p>
              <GiftAccounts accounts={core.gifts} fallbackQr={core.giftQr} />
            </Scene>
          )}

          <footer className="text-center px-6 pt-12 pb-10" style={{ background: C.card }}>
            <div className="relative flex justify-center h-[120px] items-center">
              <div className="absolute" style={{ width: 150, transform: "rotate(-70deg)", left: "calc(50% - 110px)", top: -30 }} aria-hidden>
                <Painted src="rose-blush" style={{ width: "100%" }} />
              </div>
              <div className="relative">
                <WaxSeal text={initials} size={84} color={C.plum} />
              </div>
            </div>
            <p className="mt-3 text-[44px] leading-tight" style={{ fontFamily: SCRIPT, color: C.plum }}>
              {core.couple}
            </p>
            {s && (
              <p className="mt-1 text-[15px] tracking-[0.2em]" style={{ fontFamily: SC, fontWeight: 700 }}>
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
        .st-scene{opacity:0;transform:translateY(20px);transition:opacity 1s ease,transform 1.1s cubic-bezier(.2,.7,.2,1)}
        .st-scene.st-in{opacity:1;transform:none}
        .st-fade{opacity:0;transform:translateY(6px);transition:opacity 1s ease,transform 1s ease}
        .st-fade.st-on{opacity:1;transform:none}
        .st-row{opacity:0;transform:translateX(-10px);transition:opacity .7s ease,transform .7s ease}
        .st-in .st-row{opacity:1;transform:none}
        .st-draw path,.st-draw circle{stroke-dasharray:700;stroke-dashoffset:700}
        .st-in .st-draw path,.st-in .st-draw circle{animation:stDraw 2.6s ease forwards}
        @keyframes stDraw{to{stroke-dashoffset:0}}
        .st-sheen{background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.45) 50%,transparent 65%);background-size:250% 100%;background-position:130% 0;mix-blend-mode:soft-light}
        .st-sheen-on{animation:stSheen 2.4s ease-out 1.2s both}
        @keyframes stSheen{to{background-position:-60% 0}}
        @media (prefers-reduced-motion: reduce){.st-scene,.st-fade,.st-row{opacity:1!important;transform:none!important;transition:none!important}.st-draw path,.st-draw circle{stroke-dashoffset:0!important;animation:none!important}.st-sheen-on{animation:none}}
      `}</style>
    </PaletteProvider>
  )
}

/** Still cover for the template picker */
export function SatinThumb({ event }: { event: any }) {
  const c = { bride: event.bride_name || "", groom: event.groom_name || "", start: eventStart(event.event_date, event.event_time) }
  return (
    <div style={{ fontFamily: SERIF }}>
      <Cover c={c} opened />
      <style>{`.st-fade{opacity:1!important;transform:none!important}`}</style>
    </div>
  )
}
