"use client"
import { fitName } from "./Looks"

// "Daisy envelope" template (docs/mau-thiep/hoa-cuc-phong-bi.md): an embroidered daisy on an envelope
// flap, a gold light running up the thread from the wax seal, the flap flipping open, then a pastel-blue
// floral cover with a notched ivory arch card. All drawn here in SVG/CSS, no outside artwork.
import { useEffect, useMemo, useRef, useState } from "react"
import { useIV } from "./Ornaments"

const W = 360
const H = 640
const TIP = { x: 180, y: 470 } // flap point = wax seal
const SIDE = 250 // where the flap edges meet the screen sides
const FLOWER = { x: 180, y: 205 }

const PETAL = "M0,-10 C-7.5,-18 -7.5,-44 0,-53 C7.5,-44 7.5,-18 0,-10Z"
const STEM = "M180 440 C184 372 176 292 180 224" // drawn from the seal upward
const LEAF_L = "M179 338 C152 326 130 306 118 284 C142 288 166 304 179 338Z"
const LEAF_R = "M181 352 C208 340 230 320 242 298 C218 302 194 318 181 352Z"

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

/** Embroidered daisy: thread-stitched petals, French-knot centre, stitched stem and leaves.
 *  `gold` draws the same flower as the glowing gold thread (used for the light animation). */
function EmbroideredDaisy({ gold = false }: { gold?: boolean }) {
  const petals = Array.from({ length: 18 }, (_, i) => i * 20)
  const knots = useMemo(() => {
    const r = rng(7)
    return Array.from({ length: 34 }, () => {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r()) * 11
      return [FLOWER.x + Math.cos(a) * d, FLOWER.y + Math.sin(a) * d] as const
    })
  }, [])
  const stitch = (len: number) => ({ strokeDasharray: `${len} 1.3`, strokeLinecap: "round" as const })
  const leafStitches = (side: 1 | -1, y0: number) =>
    Array.from({ length: 7 }, (_, i) => {
      const y = y0 - i * 6.5
      const x = 180 + side * (4 + i * 8)
      return <path key={i} d={`M${180 + side * 2} ${y + 6} L${x} ${y - 10}`} />
    })
  if (gold) {
    return (
      <g filter="url(#dz-glow)">
        <path className="dz-g-stem" d={STEM} pathLength={1} fill="none" stroke="#F7CF7A" strokeWidth={3.6} strokeLinecap="round" />
        <g className="dz-g-leaves" fill="#F5C96E" stroke="#FBE2A6" strokeWidth={0.8}>
          <path d={LEAF_L} />
          <path d={LEAF_R} />
        </g>
        <g className="dz-g-petals" transform={`translate(${FLOWER.x} ${FLOWER.y})`}>
          {petals.map((a, i) => (
            <path key={a} d={PETAL} transform={`rotate(${a})`} fill="#FCE6B4" stroke="#F3C670" strokeWidth={0.7} style={{ animationDelay: `${2.0 + (i % 9) * 0.06}s` }} />
          ))}
          <circle r={13} fill="#E8A93E" />
        </g>
      </g>
    )
  }
  return (
    <g>
      {/* stem: two twisted threads */}
      <path d={STEM} fill="none" stroke="#6E7A58" strokeWidth={3.2} {...stitch(3.2)} />
      <path d={STEM} fill="none" stroke="#8C9773" strokeWidth={1.2} transform="translate(0.8 0)" {...stitch(2.4)} />
      {/* leaves: satin stitch fill + diagonal stitches + midrib */}
      {[LEAF_L, LEAF_R].map((d, i) => (
        <g key={i}>
          <path d={d} fill="#7B8566" stroke="#5C6648" strokeWidth={0.8} />
          <g stroke="#9AA383" strokeWidth={1.1} opacity={0.85} {...stitch(5)}>
            {leafStitches(i ? 1 : -1, i ? 344 : 330)}
          </g>
        </g>
      ))}
      <path d="M178 334 Q150 312 122 288 M182 348 Q210 326 238 302" fill="none" stroke="#525C40" strokeWidth={0.9} {...stitch(2.6)} />
      {/* petals: back layer, front layer, thread lines */}
      <g transform={`translate(${FLOWER.x} ${FLOWER.y})`}>
        {petals.map((a) => (
          <path key={"b" + a} d={PETAL} transform={`rotate(${a + 10}) scale(0.94)`} fill="#E7DCCB" stroke="#CDBFA8" strokeWidth={0.6} />
        ))}
        {petals.map((a) => (
          <g key={a} transform={`rotate(${a})`}>
            <path d={PETAL} fill="#F6EFE3" stroke="#D9CCB6" strokeWidth={0.7} />
            <g stroke="#CBBCA3" strokeWidth={0.55} {...stitch(2.2)}>
              <path d="M0 -14 L0 -49" />
              <path d="M-2.6 -16 L-2 -44" />
              <path d="M2.6 -16 L2 -44" />
            </g>
          </g>
        ))}
      </g>
      {/* French-knot centre */}
      <circle cx={FLOWER.x} cy={FLOWER.y} r={13.5} fill="#A9782F" />
      {knots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.5} fill={i % 3 ? "#D2A54C" : "#8A5F22"} />
      ))}
    </g>
  )
}

/** Gold wax seal with a pressed daisy */
export function DaisySeal({ size = 64, glow = false }: { size?: number; glow?: boolean }) {
  const blob = useMemo(() => {
    const r = rng(3)
    const pts = Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2
      const d = 29 + r() * 3.5
      return [Math.cos(a) * d, Math.sin(a) * d]
    })
    return "M" + pts.map((p, i) => {
      const n = pts[(i + 1) % pts.length]
      return `${p[0].toFixed(1)} ${p[1].toFixed(1)} Q${((p[0] + n[0]) / 2 * 1.05).toFixed(1)} ${((p[1] + n[1]) / 2 * 1.05).toFixed(1)}`
    }).join(" ") + ` ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}Z`
  }, [])
  return (
    <svg viewBox="-34 -34 68 68" width={size} height={size} className={glow ? "dz-seal-glow" : ""} aria-hidden>
      <defs>
        <radialGradient id="dz-wax" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#F4D58E" />
          <stop offset="0.55" stopColor="#C9973F" />
          <stop offset="1" stopColor="#8A6224" />
        </radialGradient>
      </defs>
      <path d={blob} fill="url(#dz-wax)" />
      <circle r={20} fill="none" stroke="#7E5A20" strokeOpacity={0.45} strokeWidth={2} />
      <circle r={18.5} fill="#E4BC6C" />
      <circle r={18.5} fill="none" stroke="#FFF3D0" strokeOpacity={0.6} strokeWidth={0.8} />
      <g stroke="#9C7128" strokeWidth={1.3} fill="#F2D592">
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d="M0 -3 C-2.4 -6 -2.4 -12 0 -14 C2.4 -12 2.4 -6 0 -3Z" transform={`rotate(${i * 36})`} />
        ))}
      </g>
      <circle r={3.2} fill="#9C7128" />
    </svg>
  )
}

/**
 * Opening: tap → gold light climbs the stitched stem, spreads to the leaves and petals, the paper
 * brightens, light leaks from the flap edges, the flap flips open (seal goes with it), the warm gold
 * inside shows an embossed daisy, then everything fades to the cover. Timings follow the reference video.
 */
export function DaisyIntro({ onOpened, onReveal }: { onOpened: () => void; onReveal?: () => void }) {
  const [phase, setPhase] = useState<"idle" | "run" | "out">("idle")
  const timers = useRef<number[]>([])
  const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

  const startRef = useRef<() => void>(() => {})
  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])
  // nobody tapped: start on its own after a few seconds
  useEffect(() => {
    if (phase !== "idle") return
    const t = window.setTimeout(() => startRef.current(), 7000)
    return () => clearTimeout(t)
  }, [phase])

  function start() {
    if (phase === "out") return
    if (phase === "run" || reduce) return finish(700) // second tap skips
    setPhase("run")
    timers.current.push(window.setTimeout(() => { setPhase("out"); onReveal?.() }, 5400))
    timers.current.push(window.setTimeout(onOpened, 6100))
  }
  function finish(ms: number) {
    timers.current.forEach((t) => clearTimeout(t))
    setPhase("out")
    onReveal?.()
    timers.current = [window.setTimeout(onOpened, ms)]
  }

  startRef.current = start
  const run = phase !== "idle"
  return (
    <div
      className={"fixed inset-0 z-50 overflow-hidden select-none cursor-pointer dz-intro " + (run ? "dz-run " : "") + (phase === "out" ? "dz-out" : "")}
      style={{ background: "#D9CBBB" }}
      onClick={start}
      role="button"
      aria-label="Mở thiệp mời"
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[520px]" style={{ perspective: 1600 }}>
        {/* inside of the envelope: warm gold with an embossed daisy, revealed by the flap */}
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full dz-inside">
          <defs>
            <radialGradient id="dz-inside" cx="50%" cy="32%" r="70%">
              <stop offset="0" stopColor="#FAEBCB" />
              <stop offset="0.6" stopColor="#EFCF94" />
              <stop offset="1" stopColor="#D2A867" />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill="url(#dz-inside)" />
          <g transform={`translate(${FLOWER.x} ${FLOWER.y + 40})`} opacity={0.9}>
            {Array.from({ length: 18 }, (_, i) => (
              <path key={i} d={PETAL} transform={`rotate(${i * 20})`} fill="#FFE1A3" stroke="#D98E2F" strokeWidth={0.8} />
            ))}
            <circle r={13} fill="#F7C25E" stroke="#D98E2F" />
            <path d="M0 14 C3 70 -3 120 0 190" stroke="#FFD98F" strokeWidth={3} fill="none" />
            <path d="M-1 110 C-28 98 -48 80 -60 58 C-36 62 -12 78 -1 110Z M1 124 C28 112 48 94 60 72 C36 76 12 92 1 124Z" fill="#FFD48A" stroke="#D98E2F" strokeWidth={0.8} />
          </g>
        </svg>

        {/* envelope pocket (lower part) */}
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="dz-pocket" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#E6D8C8" />
              <stop offset="1" stopColor="#DCCBB8" />
            </linearGradient>
          </defs>
          <path d={`M0 ${SIDE + 70} L${TIP.x} ${TIP.y + 92} L${W} ${SIDE + 70} V${H} H0Z`} fill="url(#dz-pocket)" />
          <path d={`M0 ${H} L${TIP.x} ${TIP.y + 92} L${W} ${H}`} fill="none" stroke="#CDBBA6" strokeWidth={1} />
          <path d={`M0 ${SIDE + 70} L${TIP.x} ${TIP.y + 92} L${W} ${SIDE + 70}`} fill="none" stroke="#FFF7EC" strokeOpacity={0.8} strokeWidth={1.2} />
        </svg>

        {/* the flap (front + back face), flips up around the top edge */}
        <div className="absolute inset-0 dz-flap" style={{ transformOrigin: "50% 0%", transformStyle: "preserve-3d" }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: "hidden" }}>
            <defs>
              <linearGradient id="dz-flapfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#EDE3D6" />
                <stop offset="1" stopColor="#E3D5C4" />
              </linearGradient>
              <filter id="dz-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="dz-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#6B5338" floodOpacity="0.28" />
              </filter>
              <filter id="dz-edge" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
            </defs>
            <path d={`M0 0 H${W} V${SIDE} L${TIP.x} ${TIP.y} L0 ${SIDE}Z`} fill="url(#dz-flapfill)" filter="url(#dz-shadow)" />
            {/* light leaking from under the flap edges */}
            <path className="dz-edge" d={`M0 ${SIDE} L${TIP.x} ${TIP.y} L${W} ${SIDE}`} fill="none" stroke="#F6B54F" strokeWidth={10} filter="url(#dz-edge)" />
            <path d={`M0 ${SIDE} L${TIP.x} ${TIP.y} L${W} ${SIDE}`} fill="none" stroke="#FFF8EE" strokeOpacity={0.9} strokeWidth={1.2} />
            {/* paper brightening as the light grows */}
            <rect className="dz-bright" width={W} height={H} fill="url(#dz-brightg)" style={{ mixBlendMode: "screen" }} />
            <defs>
              <radialGradient id="dz-brightg" cx="50%" cy="34%" r="55%">
                <stop offset="0" stopColor="#FFF6DF" stopOpacity="0.7" />
                <stop offset="1" stopColor="#FFF6DF" stopOpacity="0" />
              </radialGradient>
            </defs>
            <EmbroideredDaisy />
            <EmbroideredDaisy gold />
            <foreignObject x={TIP.x - 32} y={TIP.y - 32} width={64} height={64}>
              <div className="dz-seal" style={{ width: 64, height: 64 }}>
                <DaisySeal size={64} />
              </div>
            </foreignObject>
          </svg>
          {/* back of the flap (seen after it flips past 90°) */}
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}>
            <path d={`M0 0 H${W} V${SIDE} L${TIP.x} ${TIP.y} L0 ${SIDE}Z`} fill="#F4DDB0" transform={`scale(1 -1) translate(0 ${-H})`} />
          </svg>
        </div>

        {/* tap hint */}
        <div className="dz-hint absolute inset-x-0 bottom-[7%] flex justify-center pointer-events-none">
          <span className="rounded-lg px-4 py-2 text-[14px] font-medium" style={{ background: "rgba(255,255,255,.92)", color: "#2A2220", boxShadow: "0 4px 14px rgba(0,0,0,.18)" }}>
            Chạm để mở thiệp
          </span>
        </div>
      </div>
      <style>{`
        .dz-intro .dz-g-stem{stroke-dasharray:1;stroke-dashoffset:1}
        .dz-intro .dz-inside,.dz-intro .dz-g-leaves,.dz-intro .dz-g-petals path,.dz-intro .dz-g-petals circle,.dz-intro .dz-bright,.dz-intro .dz-edge{opacity:0}
        .dz-run .dz-g-stem{animation:dzStem 1.7s .25s cubic-bezier(.4,.1,.3,1) forwards}
        .dz-run .dz-g-leaves{animation:dzIn .9s 1.05s ease forwards}
        .dz-run .dz-g-petals path{animation:dzIn .7s ease forwards}
        .dz-run .dz-g-petals circle{animation:dzIn .8s 2.2s ease forwards}
        .dz-run .dz-bright{animation:dzIn 1.6s 2.0s ease forwards}
        .dz-run .dz-edge{animation:dzIn .9s 3.0s ease forwards}
        .dz-run .dz-seal{animation:dzSeal 1s 1.9s ease forwards}
        .dz-run .dz-inside{animation:dzIn .5s 3.7s ease forwards}
        .dz-run .dz-flap{animation:dzFlap .9s 3.9s cubic-bezier(.55,.05,.35,1) forwards}
        .dz-run .dz-hint{animation:none;opacity:0;transition:opacity .4s}
        .dz-hint{animation:dzPulse 2.2s ease-in-out infinite}
        .dz-intro{transition:opacity .7s ease}
        .dz-out{opacity:0;pointer-events:none}
        @keyframes dzStem{to{stroke-dashoffset:0}}
        @keyframes dzIn{to{opacity:1}}
        @keyframes dzSeal{to{filter:brightness(1.18) drop-shadow(0 0 10px rgba(255,210,120,.9))}}
        @keyframes dzFlap{to{transform:rotateX(178deg)}}
        @keyframes dzPulse{50%{opacity:.45}}
        @media (prefers-reduced-motion: reduce){.dz-run .dz-flap{animation:none}}
      `}</style>
    </div>
  )
}

// ---------- cover: pastel blue, flowering vines, notched ivory arch ----------

function Rose({ x, y, r, rot = 0 }: { x: number; y: number; r: number; rot?: number }) {
  const outer = Array.from({ length: 5 }, (_, i) => i * 72)
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {outer.map((a) => (
        <ellipse key={a} cx={0} cy={-r * 0.55} rx={r * 0.55} ry={r * 0.6} transform={`rotate(${a})`} fill="#F4C9C6" stroke="#D99895" strokeWidth={0.6} />
      ))}
      {outer.map((a) => (
        <ellipse key={"i" + a} cx={0} cy={-r * 0.32} rx={r * 0.36} ry={r * 0.38} transform={`rotate(${a + 36})`} fill="#F8DAD6" stroke="#DFA5A1" strokeWidth={0.5} />
      ))}
      <circle r={r * 0.22} fill="#E3B35E" />
      {Array.from({ length: 7 }, (_, i) => (
        <circle key={i} cx={Math.cos(i) * r * 0.14} cy={Math.sin(i * 2) * r * 0.14} r={r * 0.05} fill="#A9782F" />
      ))}
    </g>
  )
}

function Blossom({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {Array.from({ length: 5 }, (_, i) => (
        <circle key={i} cx={0} cy={-r * 0.6} r={r * 0.5} transform={`rotate(${i * 72})`} fill="#FBE4E1" stroke="#E2AEAA" strokeWidth={0.4} />
      ))}
      <circle r={r * 0.25} fill="#E3B35E" />
    </g>
  )
}

function Leaf({ x, y, s, rot }: { x: number; y: number; s: number; rot: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0 C-5 -6 -5 -16 0 -22 C5 -16 5 -6 0 0Z" fill="#55633F" />
      <path d="M0 -2 L0 -19" stroke="#8C9A6E" strokeWidth={0.6} />
    </g>
  )
}

function Butterfly({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} fill="#D9B060" stroke="#9A7330" strokeWidth={0.5}>
      <path d="M0 0 C-8 -10 -14 -6 -12 1 C-10 6 -4 4 0 0Z M0 0 C8 -10 14 -6 12 1 C10 6 4 4 0 0Z" />
      <path d="M0 0 C-5 4 -8 10 -4 11 C-1 10 0 4 0 0Z M0 0 C5 4 8 10 4 11 C1 10 0 4 0 0Z" fill="#E8C77E" />
      <path d="M0 -4 L0 6" stroke="#6E5220" strokeWidth={1} />
    </g>
  )
}

/** Flowering vines down both sides of the cover (procedural, mirrored with small variations) */
function FloralBorder() {
  const items = useMemo(() => {
    const out: React.ReactNode[] = []
    for (const side of [0, 1] as const) {
      const r = rng(side ? 41 : 17)
      const xOf = (y: number) => {
        const base = 30 + Math.sin(y / 70 + side) * 16
        return side ? W - base : base
      }
      // vine stem
      const pts = Array.from({ length: 34 }, (_, i) => -10 + i * 20)
      const d = "M" + pts.map((y) => `${xOf(y).toFixed(1)} ${y}`).join(" L")
      out.push(<path key={`v${side}`} d={d} fill="none" stroke="#B08A4E" strokeWidth={1.6} />)
      // twigs, leaves, baby's breath, roses
      for (let y = 0; y < H + 10; y += 13) {
        const x = xOf(y)
        const dir = side ? -1 : 1
        if (r() < 0.75) out.push(<Leaf key={`l${side}${y}`} x={x} y={y} s={0.7 + r() * 0.5} rot={dir * (40 + r() * 70) + (r() < 0.5 ? 180 : 0)} />)
        if (r() < 0.35) {
          const bx = x + dir * (14 + r() * 22)
          const by = y + (r() - 0.5) * 16
          out.push(<path key={`t${side}${y}`} d={`M${x} ${y} Q${(x + bx) / 2} ${by - 8} ${bx} ${by}`} stroke="#B08A4E" strokeWidth={0.7} fill="none" />)
          for (let k = 0; k < 7; k++) out.push(<circle key={`d${side}${y}${k}`} cx={bx + (r() - 0.5) * 14} cy={by + (r() - 0.5) * 14} r={1.4 + r()} fill="#FFFFFF" stroke="#E6DDD3" strokeWidth={0.3} />)
        }
        if (r() < 0.25) out.push(<Blossom key={`b${side}${y}`} x={x + dir * (6 + r() * 16)} y={y + 4} r={4 + r() * 2.5} />)
      }
      for (let k = 0; k < 7; k++) {
        const y = 40 + k * 92 + (r() - 0.5) * 30
        out.push(<Rose key={`r${side}${k}`} x={xOf(y) + (side ? -1 : 1) * (4 + r() * 10)} y={y} r={13 + r() * 7} rot={r() * 70} />)
      }
    }
    out.push(<Butterfly key="bf1" x={312} y={238} rot={-15} />)
    out.push(<Butterfly key="bf2" x={44} y={470} rot={12} />)
    out.push(<Butterfly key="bf3" x={318} y={600} rot={8} />)
    return out
  }, [])
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
      <g style={{ filter: "drop-shadow(0 2px 2px rgba(40,50,80,.25))" }}>{items}</g>
    </svg>
  )
}

const ARCH =
  "M72 190 C72 170 84 160 96 158 C100 138 116 128 134 126 C142 104 160 92 180 90 C200 92 218 104 226 126 C244 128 260 138 264 158 C276 160 288 170 288 190 " +
  "L288 470 C288 490 276 500 264 502 C260 522 244 532 226 534 C218 556 200 568 180 570 C160 568 142 556 134 534 C116 532 100 522 96 502 C84 500 72 490 72 470 Z"

/** Cover: pastel blue paper, flowering vines, notched ivory arch card with the names written in */
export function DaisyHero({ event, shortDate, opened }: { event: any; shortDate: string; opened: boolean }) {
  const IV = useIV()
  const line = (i: number): React.CSSProperties => ({
    opacity: opened ? 1 : 0,
    transform: opened ? "none" : "translateY(10px)",
    transition: `opacity 900ms ease ${0.35 + i * 0.18}s, transform 900ms ease ${0.35 + i * 0.18}s`,
  })
  const caps: React.CSSProperties = { fontFamily: "var(--iv-caps), serif", letterSpacing: "0.3em", textTransform: "uppercase" }
  const scriptF: React.CSSProperties = { fontFamily: "var(--iv-script), cursive", color: IV.wine }
  return (
    <section className="relative min-h-[100svh] overflow-hidden" style={{ backgroundColor: IV.sage, backgroundImage: "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,.35), rgba(255,255,255,0) 70%)" }}>
      <FloralBorder />
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden>
        <path d={ARCH} fill={IV.paper} stroke={IV.gold[1]} strokeWidth={2.2} style={{ filter: "drop-shadow(0 6px 10px rgba(40,50,80,.22))" }} />
        <path d={ARCH} fill="none" stroke={IV.gold[0]} strokeWidth={0.8} transform="translate(180 330) scale(0.955) translate(-180 -330)" />
      </svg>
      <div className="absolute inset-x-[22%] top-[18%] bottom-[16%] flex flex-col items-center justify-center text-center">
        <p className="text-[17px] italic" style={{ fontFamily: "var(--iv-caps), serif", color: IV.rose, ...line(1) }}>
          Chúng mình sắp cưới
        </p>
        <h1 className="mt-5 leading-[1.05] break-words max-w-full" style={scriptF}>
          <span className="block" style={{ fontSize: fitName(event.bride_name, 46), ...line(2) }}>{event.bride_name}</span>
          <span className="block text-[30px] my-1" style={line(3)}>&amp;</span>
          <span className="block" style={{ fontSize: fitName(event.groom_name, 46), ...line(4) }}>{event.groom_name}</span>
        </h1>
        <div style={line(5)}>
          <DaisyDivider className="my-6 !w-32" />
        </div>
        <p className="text-[18px] tracking-[0.12em]" style={{ fontFamily: "var(--iv-caps), serif", color: IV.wine, fontWeight: 600, ...line(6) }}>
          {shortDate}
        </p>
      </div>
    </section>
  )
}

export function DaisyDivider({ className = "" }: { className?: string }) {
  const IV = useIV()
  return (
    <svg viewBox="0 0 120 10" className={"w-40 h-[10px] mx-auto block " + className} aria-hidden>
      <path d="M2 5 H52 M68 5 H118" stroke={IV.wine} strokeWidth={0.8} strokeOpacity={0.7} />
      <path d="M60 1 L64 5 L60 9 L56 5Z" fill={IV.wine} />
    </svg>
  )
}

/** Small daisy sprig above section titles */
export function DaisySprig({ className = "" }: { className?: string }) {
  const IV = useIV()
  return (
    <svg viewBox="0 0 60 40" className={"w-14 h-10 mx-auto block " + className} aria-hidden>
      <g transform="translate(30 15)">
        {Array.from({ length: 14 }, (_, i) => (
          <path key={i} d="M0 -3 C-2.2 -5 -2.2 -11 0 -13 C2.2 -11 2.2 -5 0 -3Z" transform={`rotate(${i * 25.7})`} fill="#FBF5EC" stroke={IV.gold[1]} strokeWidth={0.6} />
        ))}
        <circle r={3.2} fill={IV.gold[1]} />
      </g>
      <path d="M30 28 C30 33 29 36 30 40 M30 34 C24 32 20 29 18 26 M30 36 C36 34 40 31 42 28" stroke={IV.leaf} strokeWidth={1} fill="none" />
    </svg>
  )
}

/** Section card: warm paper, thin gold rule */
export function DaisyFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const IV = useIV()
  return (
    <div className={"relative rounded-2xl px-6 py-8 text-center " + className} style={{ background: "rgba(255,252,247,.72)", boxShadow: `inset 0 0 0 1px ${IV.gold[0]}, 0 10px 30px -18px rgba(90,60,40,.35)` }}>
      {children}
    </div>
  )
}

/** "Scroll for more": shown at the bottom of the screen until the guest scrolls a little */
export function ScrollHint({ show }: { show: boolean }) {
  const IV = useIV()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 220)
    window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [])
  const visible = show && !scrolled
  return (
    <div className="fixed bottom-5 inset-x-0 z-30 flex flex-col items-center gap-1.5 pointer-events-none transition-opacity duration-700" style={{ opacity: visible ? 1 : 0 }}>
      <span className="text-[13px] font-medium" style={{ color: IV.wine }}>
        Cuộn để xem tiếp
      </span>
      <span className="w-[18px] h-[28px] rounded-full border-[1.5px] flex justify-center pt-1.5" style={{ borderColor: IV.wine }}>
        <span className="w-[3px] h-[6px] rounded-full dz-wheel" style={{ background: IV.wine }} />
      </span>
      <style>{`.dz-wheel{animation:dzWheel 1.6s ease-in-out infinite}@keyframes dzWheel{0%{transform:translateY(0);opacity:1}70%{transform:translateY(8px);opacity:0}100%{opacity:0}}`}</style>
    </div>
  )
}

/** Confetti burst the first time the wrapped block scrolls into view (gift section) */
export function ConfettiOnView({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [burst, setBurst] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setBurst(true)
        io.disconnect()
      }
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const pieces = useMemo(() => {
    const r = rng(11)
    const colors = ["#F2B8C6", "#F6D27A", "#A9BCD9", "#F59E9E", "#C9E3B5", "#E8C1F0"]
    return Array.from({ length: 46 }, (_, i) => ({ left: r() * 100, delay: r() * 0.5, dur: 1.8 + r() * 1.2, rot: r() * 360, w: 4 + r() * 4, color: colors[i % colors.length] }))
  }, [])
  return (
    <div ref={ref} className="relative">
      {children}
      {burst && (
        <div className="pointer-events-none absolute inset-x-0 -top-10 h-[120%] overflow-hidden" aria-hidden>
          {pieces.map((p, i) => (
            <span
              key={i}
              className="absolute top-0 dz-confetti"
              style={{ left: `${p.left}%`, width: p.w, height: p.w * 0.45, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, ["--r" as any]: `${p.rot}deg` }}
            />
          ))}
          <style>{`.dz-confetti{opacity:0;animation:dzFall ease-in forwards}@keyframes dzFall{0%{opacity:1;transform:translateY(-10px) rotate(var(--r))}100%{opacity:0;transform:translateY(420px) rotate(calc(var(--r) + 540deg))}}@media (prefers-reduced-motion: reduce){.dz-confetti{display:none}}`}</style>
        </div>
      )}
    </div>
  )
}

/** Faint dried-flower branches down the left side of the page background (data URI) */
export const DAISY_BRANCH_BG = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='150' height='520' viewBox='0 0 150 520'><g fill='none' stroke='#B9A38A' stroke-opacity='.45' stroke-width='1.1' stroke-linecap='round'><path d='M18 520 C30 420 46 320 58 220 C66 150 70 90 74 0'/><path d='M44 330 C64 300 84 286 108 280'/><path d='M52 260 C34 236 22 216 16 190'/><path d='M60 190 C82 170 98 150 112 120'/><path d='M66 120 C50 98 42 78 40 52'/></g><g fill='#C9B59B' fill-opacity='.4'>${Array.from({ length: 60 }, (_, i) => {
    const t = i / 60
    const x = 18 + t * 60 + Math.sin(i * 2.3) * 22
    const y = 520 - t * 520 + Math.cos(i * 1.7) * 14
    return `<ellipse cx='${x.toFixed(0)}' cy='${y.toFixed(0)}' rx='2.2' ry='4' transform='rotate(${(i * 37) % 180} ${x.toFixed(0)} ${y.toFixed(0)})'/>`
  }).join("")}</g></svg>`
)}")`
