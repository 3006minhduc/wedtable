"use client"

// "Hỷ sơn mài" (template id `gilded`, rebuilt 2026-11-25): carved red-lacquer doors with antique-gold relief
// (peony branch, lattice, auspicious clouds) and a gold double-happiness medallion; the doors swing open on a
// tone-on-tone carved lacquer cover. All drawn in code (emboss.ts).
import { useEffect, useMemo, useRef, useState } from "react"
import { useIV } from "./Ornaments"
import { doorArt, embossSvg, lacquerArt } from "./emboss"
import { useEmbossUrl } from "./useEmboss"
import { EventDate } from "./Looks"
import type { HeroProps, IntroProps } from "./Looks"

const HAN = '"Noto Serif SC","Noto Serif CJK SC","Songti SC","STSong","SimSun","PMingLiU",serif'
const SC = "var(--iv-sc), serif"

const SHEEN = "linear-gradient(100deg, rgba(255,255,255,0) 30%, rgba(255,235,200,.10) 45%, rgba(255,255,255,0) 60%), radial-gradient(120% 70% at 50% 35%, rgba(255,120,90,.10), rgba(0,0,0,.35))"

function useLacquer(red: string, gold: [string, string, string]) {
  const o = { ink: gold[2], metal: gold[0], depth: 3.2 }
  return {
    left: useEmbossUrl(() => embossSvg(195, 844, red, doorArt(195, 844), o), [red, gold[2], gold[0]]),
    right: useEmbossUrl(() => embossSvg(195, 844, red, doorArt(195, 844, true), o), [red, gold[2], gold[0]]),
    ground: useEmbossUrl(() => embossSvg(390, 844, red, lacquerArt(390, 844), { depth: 2.2, blur: 2 }), [red]),
  }
}
const withSheen = (u?: string) => (u ? `${SHEEN}, ${u}` : SHEEN)

/** Gold medallion with a raised 囍 */
export function HyMedallion({ size = 132, shine = true }: { size?: number; shine?: boolean }) {
  const IV = useIV()
  const g = IV.gold
  return (
    <div className="relative rounded-full" style={{ width: size, height: size, filter: "drop-shadow(0 8px 14px rgba(0,0,0,.45))" }}>
      <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle at 34% 28%, ${g[0]}, ${g[1]} 52%, ${g[2]})` }} />
      <div className="absolute inset-[7%] rounded-full" style={{ boxShadow: `inset 0 2px 3px rgba(0,0,0,.35), inset 0 -2px 2px rgba(255,255,255,.35), 0 0 0 1px ${g[2]}` }} />
      <div className="absolute inset-0 flex items-center justify-center" style={{ fontFamily: HAN, fontWeight: 700, fontSize: size * 0.48, lineHeight: 1 }}>
        <span style={{ position: "absolute", color: "rgba(255,248,220,.55)", transform: "translate(-1px,-1px)" }}>囍</span>
        <span style={{ position: "absolute", color: "rgba(60,20,10,.45)", transform: "translate(1.2px,1.6px)" }}>囍</span>
        <span style={{ position: "relative", color: IV.deep }}>囍</span>
      </div>
      {shine && <span className="absolute inset-0 rounded-full hy2-shine" />}
    </div>
  )
}

export function HyIntro2({ onOpened, onReveal }: IntroProps) {
  const IV = useIV()
  const L = useLacquer(IV.deep, IV.gold)
  const [phase, setPhase] = useState<"idle" | "run" | "out">("idle")
  const timers = useRef<number[]>([])
  const tapRef = useRef<() => void>(() => {})
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    if (phase !== "idle") return
    const t = window.setTimeout(() => tapRef.current(), 8000)
    return () => clearTimeout(t)
  }, [phase])
  const reduce = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  function finish(ms: number) {
    timers.current.forEach(clearTimeout)
    setPhase("out")
    onReveal?.()
    timers.current = [window.setTimeout(onOpened, ms)]
  }
  function tap() {
    if (phase === "out") return
    if (phase === "run" || reduce) return finish(650)
    setPhase("run")
    timers.current.push(window.setTimeout(() => onReveal?.(), 700))
    timers.current.push(window.setTimeout(() => setPhase("out"), 2100))
    timers.current.push(window.setTimeout(onOpened, 2750))
  }
  tapRef.current = tap
  const door = (side: "l" | "r") => (
    <div
      className={"absolute inset-y-0 w-1/2 hy2-door hy2-" + side}
      style={{ [side === "l" ? "left" : "right"]: 0, transformOrigin: side === "l" ? "0 50%" : "100% 50%", backgroundColor: IV.deep, backgroundImage: withSheen(side === "l" ? L.left : L.right), backgroundSize: "100% 100%" } as React.CSSProperties}
    >
      {/* ring pull near the seam */}
      <span className="absolute top-1/2 w-7 h-7 -mt-3.5 rounded-full" style={{ [side === "l" ? "right" : "left"]: 18, border: `3px solid ${IV.gold[1]}`, boxShadow: "0 2px 3px rgba(0,0,0,.4), inset 0 1px 1px rgba(255,255,255,.4)" } as React.CSSProperties} />
    </div>
  )
  return (
    <div className={"fixed inset-0 z-50 overflow-hidden cursor-pointer select-none hy2 " + (phase !== "idle" ? "hy2-run " : "") + (phase === "out" ? "hy2-out" : "")} onClick={tap} role="button" aria-label="Mở thiệp mời" style={{ background: phase === "idle" ? IV.deep : "transparent" }}>
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[460px]" style={{ perspective: 1400 }}>
        {/* warm light leaking through the seam */}
        <div className="absolute inset-y-0 left-1/2 w-24 -ml-12 hy2-glow" style={{ background: `radial-gradient(closest-side, ${IV.gold[0]}cc, ${IV.gold[0]}00)` }} />
        {door("l")}
        {door("r")}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hy2-medal">
          <HyMedallion size={136} />
        </div>
        <div className="absolute inset-x-0 bottom-[6%] flex justify-center pointer-events-none hy2-hint">
          <span className="rounded-lg px-4 py-2 text-[13px]" style={{ background: "rgba(30,8,6,.55)", color: IV.gold[0], fontFamily: SC, fontWeight: 600, letterSpacing: ".08em", backdropFilter: "blur(6px)" }}>
            Chạm để mở cửa
          </span>
        </div>
      </div>
      <style>{`
        .hy2{transition:opacity .65s ease}
        .hy2-out{opacity:0;pointer-events:none}
        .hy2-door{transition:transform 1.4s cubic-bezier(.6,.05,.25,1) .45s;backface-visibility:hidden}
        .hy2-run .hy2-l{transform:rotateY(-104deg)}
        .hy2-run .hy2-r{transform:rotateY(104deg)}
        .hy2-medal{transition:transform .5s ease,opacity .45s ease .15s}
        .hy2-run .hy2-medal{transform:translate(-50%,-50%) scale(1.12);opacity:0}
        .hy2-glow{opacity:.35;animation:hy2Glow 2.6s ease-in-out infinite}
        .hy2-run .hy2-glow{animation:none;opacity:1;transform:scaleX(5);transition:transform 1.2s ease .3s,opacity .8s ease 1.2s}
        .hy2-hint span{animation:hy2Nudge 2.2s ease-in-out infinite}
        .hy2-run .hy2-hint{opacity:0;transition:opacity .3s}
        .hy2-shine{background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.65) 48%,rgba(255,255,255,0) 58%) 130% 0/260% 100% no-repeat;mix-blend-mode:soft-light;animation:hy2Shine 3.8s ease-in-out .8s infinite}
        @keyframes hy2Glow{50%{opacity:.7}}
        @keyframes hy2Nudge{50%{transform:translateY(-3px)}}
        @keyframes hy2Shine{0%,55%{background-position:130% 0}100%{background-position:-60% 0}}
        @media (prefers-reduced-motion: reduce){.hy2-glow,.hy2-shine,.hy2-hint span{animation:none}}
      `}</style>
    </div>
  )
}

/** A few small 囍 drifting down at the edges, once */
function Drift({ on }: { on: boolean }) {
  const IV = useIV()
  const bits = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ left: i % 2 ? 82 + ((i * 7) % 14) : 2 + ((i * 5) % 14), delay: 0.4 + i * 0.35, dur: 5 + (i % 3), size: 14 + (i % 3) * 4 })), [])
  if (!on) return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span key={i} className="absolute -top-8 hy2-fall" style={{ left: `${b.left}%`, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, fontFamily: HAN, fontWeight: 700, fontSize: b.size, color: IV.gold[1] }}>
          囍
        </span>
      ))}
      <style>{`.hy2-fall{opacity:0;animation:hy2Fall linear forwards}@keyframes hy2Fall{0%{opacity:0;transform:translateY(0) rotate(-12deg)}12%{opacity:.85}100%{opacity:0;transform:translateY(100svh) rotate(14deg)}}@media (prefers-reduced-motion: reduce){.hy2-fall{display:none}}`}</style>
    </div>
  )
}

export function HyHero2({ event, cover, start, opened }: HeroProps) {
  const IV = useIV()
  const L = useLacquer(IV.deep, IV.gold)
  const g = IV.gold
  const foil: React.CSSProperties = { backgroundImage: `linear-gradient(100deg, ${g[2]} 0%, ${g[0]} 35%, ${g[1]} 60%, ${g[0]} 80%, ${g[2]} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }
  const enter = (i: number): React.CSSProperties => ({ opacity: opened ? 1 : 0, transform: opened ? "none" : "translateY(8px)", transition: `opacity 1s ease ${0.3 + i * 0.18}s, transform 1s ease ${0.3 + i * 0.18}s` })
  return (
    <section className="wt-bare relative min-h-[100svh] overflow-hidden flex flex-col items-center justify-center text-center px-8 py-16" style={{ backgroundColor: IV.deep, backgroundImage: withSheen(L.ground), backgroundSize: "100% 100%, cover" }}>
      {/* carved gold frame */}
      <div className="absolute inset-[14px] pointer-events-none" style={{ boxShadow: `inset 0 0 0 1.5px ${g[1]}, inset 0 0 0 6px transparent, inset 0 0 0 7px ${g[2]}` }} />
      <div className="relative" style={enter(0)}>
        {cover ? (
          <div className="relative w-[200px] h-[250px] rounded-t-full p-[5px]" style={{ background: `linear-gradient(160deg, ${g[0]}, ${g[2]})`, boxShadow: "0 16px 30px -14px rgba(0,0,0,.6)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt=""
              className="w-full h-full object-cover rounded-t-full"
              style={{ filter: opened ? "none" : "blur(10px) brightness(.8)", transform: opened ? "scale(1)" : "scale(1.08)", transition: "filter 2.6s ease, transform 3.2s ease" }}
            />
          </div>
        ) : null}
        <div className={cover ? "absolute left-1/2 -bottom-9 -translate-x-1/2" : ""}>
          <HyMedallion size={cover ? 76 : 112} />
        </div>
      </div>
      <p className={(cover ? "mt-12" : "mt-6") + " text-[17px] tracking-[0.12em]"} style={{ color: g[0], fontFamily: SC, fontWeight: 600, ...enter(1) }}>
        Lễ thành hôn
      </p>
      <h1 className="mt-3 leading-[1.05]" style={{ fontFamily: SC, fontWeight: 700, letterSpacing: "0.04em" }}>
        <span className="block text-[46px] pb-1" style={{ ...foil, ...enter(2) }}>
          {event.bride_name}
        </span>
        <span className="block text-[24px] my-1" style={{ color: g[1], fontFamily: "var(--iv-caps), serif", fontStyle: "italic", ...enter(3) }}>
          và
        </span>
        <span className="block text-[46px] pb-1" style={{ ...foil, ...enter(4) }}>
          {event.groom_name}
        </span>
      </h1>
      <div className="mt-8 w-full max-w-[340px]" style={enter(5)}>
        <EventDate start={start} tone="dark" />
      </div>
    </section>
  )
}
