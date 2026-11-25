"use client"
import { fitName } from "./Looks"

// "Cuộn phim" (template id `glass`, rebuilt 2026-11-25): an old film projector. A title card, then a
// 3-2-1 film leader with a sweeping hand, a white flash, and the wedding photo framed by sprocket holes
// with drifting light leaks and grain. The album becomes a strip of film.
import { useEffect, useRef, useState } from "react"
import { useIV } from "./Ornaments"
import { lunarLine } from "@/lib/lunar"
import type { HeroProps, IntroProps } from "./Looks"

const DISPLAY = "var(--iv-display), serif"
const SC = "var(--iv-sc), serif"
const pad = (n: number) => String(n).padStart(2, "0")

/** Fine animated film grain + vignette, as an overlay */
export function Grain({ strength = 0.16 }: { strength?: number }) {
  const noise = `url("data:image/svg+xml,${encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}")`
  return (
    <>
      <div className="absolute inset-0 pointer-events-none fm2-grain" style={{ backgroundImage: noise, opacity: strength, mixBlendMode: "overlay" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,.55))" }} />
      <style>{`.fm2-grain{animation:fm2Grain .5s steps(4) infinite}@keyframes fm2Grain{0%{background-position:0 0}25%{background-position:-40px 30px}50%{background-position:30px -50px}75%{background-position:-20px -10px}}@media (prefers-reduced-motion: reduce){.fm2-grain{animation:none}}`}</style>
    </>
  )
}

/** Vertical sprocket strip (left or right edge of a frame) */
function Sprockets({ side }: { side: "l" | "r" }) {
  return (
    <div
      className="absolute inset-y-0 w-[24px] pointer-events-none"
      style={{
        [side === "l" ? "left" : "right"]: 0,
        background: "#0c0b0a",
        backgroundImage: "linear-gradient(#0c0b0a 0 0), radial-gradient(circle, transparent 0, transparent 0)",
        WebkitMaskImage: "linear-gradient(#000,#000)",
      } as React.CSSProperties}
    >
      <div className="absolute inset-x-[6px] inset-y-0" style={{ backgroundImage: "linear-gradient(to bottom, rgba(236,226,206,.9) 0 9px, transparent 9px 22px)", backgroundSize: "12px 22px", borderRadius: 2, maskImage: "linear-gradient(#000,#000)" }} />
    </div>
  )
}

export function FilmIntro2({ event, onOpened, onReveal }: IntroProps) {
  const IV = useIV()
  const [phase, setPhase] = useState<"idle" | "count" | "flash" | "out">("idle")
  const [n, setN] = useState(3)
  const timers = useRef<number[]>([])
  const tapRef = useRef<() => void>(() => {})
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    if (phase !== "idle") return
    const t = window.setTimeout(() => tapRef.current(), 7000)
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
    if (phase !== "idle" || reduce) return finish(600)
    setPhase("count")
    setN(3)
    timers.current.push(window.setTimeout(() => setN(2), 500))
    timers.current.push(window.setTimeout(() => setN(1), 1000))
    timers.current.push(window.setTimeout(() => {
      setPhase("flash")
      onReveal?.()
    }, 1500))
    timers.current.push(window.setTimeout(() => setPhase("out"), 1750))
    timers.current.push(window.setTimeout(onOpened, 2400))
  }
  tapRef.current = tap
  const names = [event.bride_name, event.groom_name].filter(Boolean)
  return (
    <div className={"fixed inset-0 z-50 overflow-hidden cursor-pointer select-none fm2 " + (phase === "out" ? "fm2-out" : "")} style={{ background: "#14120f" }} onClick={tap} role="button" aria-label="Mở thiệp mời">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[460px] fm2-flicker">
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10" style={{ color: "#EDE4D3" }}>
            <p className="text-[13px] tracking-[0.3em]" style={{ fontFamily: SC, fontWeight: 600, color: "#BFB29C" }}>
              Một bộ phim về
            </p>
            <p className="mt-5 text-[44px] leading-[1.05]" style={{ fontFamily: DISPLAY }}>
              {names[0]}
              <br />
              <span className="text-[28px] italic" style={{ color: "#BFB29C" }}>
                và
              </span>
              <br />
              {names[1]}
            </p>
            <div className="mt-6 h-px w-16" style={{ background: "#6f6658" }} />
          </div>
        )}
        {phase === "count" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[78vw] max-w-[320px] aspect-square">
              <div className="absolute inset-0 rounded-full" style={{ border: "2px solid #d8cfbf" }} />
              <div className="absolute inset-[9%] rounded-full" style={{ border: "1.5px solid #d8cfbf" }} />
              <div className="absolute left-1/2 inset-y-[-12%] w-px -ml-px" style={{ background: "#d8cfbf" }} />
              <div className="absolute top-1/2 inset-x-[-12%] h-px -mt-px" style={{ background: "#d8cfbf" }} />
              <div key={n} className="absolute inset-0 rounded-full fm2-sweep" />
              <span key={"n" + n} className="absolute inset-0 flex items-center justify-center text-[150px] leading-none fm2-num" style={{ fontFamily: DISPLAY, color: "#f1e9da" }}>
                {n}
              </span>
            </div>
          </div>
        )}
        {phase === "flash" && <div className="absolute inset-0 bg-white fm2-flash" />}
        <Grain strength={0.22} />
        {phase === "idle" && (
          <div className="absolute inset-x-0 bottom-[8%] flex justify-center pointer-events-none">
            <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] fm2-hint" style={{ border: "1px solid #6f6658", color: "#EDE4D3", fontFamily: SC, fontWeight: 600, letterSpacing: ".1em" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7 4l13 8-13 8z" />
              </svg>
              Chạm để chiếu
            </span>
          </div>
        )}
      </div>
      <style>{`
        .fm2{transition:opacity .65s ease}
        .fm2-out{opacity:0;pointer-events:none}
        .fm2-flicker{animation:fm2Flick 3s steps(1) infinite}
        .fm2-sweep{background:conic-gradient(from 0deg, rgba(216,207,191,.38) 0deg, rgba(216,207,191,.38) var(--a,0deg), transparent var(--a,0deg));animation:fm2Sweep .5s linear forwards}
        .fm2-num{animation:fm2Num .5s ease-out}
        .fm2-flash{animation:fm2Flash .3s ease-out forwards}
        .fm2-hint{animation:fm2Nudge 2.2s ease-in-out infinite}
        @property --a{syntax:'<angle>';inherits:false;initial-value:0deg}
        @keyframes fm2Sweep{to{--a:360deg}}
        @keyframes fm2Num{0%{transform:scale(1.08);opacity:.6}100%{transform:scale(1);opacity:1}}
        @keyframes fm2Flash{0%{opacity:0}30%{opacity:1}100%{opacity:.85}}
        @keyframes fm2Flick{0%{opacity:1}31%{opacity:.93}32%{opacity:1}67%{opacity:.96}68%{opacity:1}}
        @keyframes fm2Nudge{50%{transform:translateY(-3px)}}
        @media (prefers-reduced-motion: reduce){.fm2-flicker,.fm2-hint{animation:none}}
      `}</style>
    </div>
  )
}

export function FilmHero2({ event, cover, start, opened }: HeroProps) {
  const IV = useIV()
  const enter = (i: number): React.CSSProperties => ({ opacity: opened ? 1 : 0, transform: opened ? "none" : "translateY(10px)", transition: `opacity 1.1s ease ${0.6 + i * 0.22}s, transform 1.1s ease ${0.6 + i * 0.22}s` })
  return (
    <section className="wt-bare relative h-[100svh] min-h-[620px] overflow-hidden" style={{ background: "#0c0b0a" }}>
      <div className="absolute inset-y-0 left-[24px] right-[24px] overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover fm2-ken" style={{ filter: "sepia(.18) contrast(1.05) saturate(.92)" }} />
        ) : (
          <div className="absolute inset-0" style={{ background: IV.deep }} />
        )}
        {/* light leaks */}
        <div className="absolute -inset-10 fm2-leak" style={{ background: "radial-gradient(40% 30% at 90% 10%, rgba(255,140,60,.45), transparent 70%), radial-gradient(35% 40% at 0% 85%, rgba(255,90,60,.30), transparent 70%)", mixBlendMode: "screen" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,7,6,.88) 0%, rgba(8,7,6,.45) 36%, rgba(8,7,6,0) 62%)" }} />
        <Grain strength={0.14} />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-[10svh] text-white">
          <p className="text-[13px] tracking-[0.28em]" style={{ fontFamily: SC, fontWeight: 600, color: "rgba(255,255,255,.78)", ...enter(0) }}>
            Chúng mình cưới
          </p>
          <h1 className="mt-3 text-[52px] leading-[1]" style={{ fontFamily: DISPLAY }}>
            <span className="block" style={{ fontSize: fitName(event.bride_name, 52, 9), ...enter(1) }}>
              {event.bride_name}
            </span>
            <span className="block" style={{ fontSize: fitName(event.groom_name, 52, 7), ...enter(2) }}>
              <i className="text-[0.65em] font-normal">và</i> {event.groom_name}
            </span>
          </h1>
          {start && (
            <div className="mt-6 flex items-end gap-5" style={enter(3)}>
              <span className="text-[64px] leading-[0.8] tabular-nums" style={{ fontFamily: DISPLAY }}>
                {pad(start.getDate())}
              </span>
              <span className="pb-1 text-[17px] leading-snug text-white/90">
                tháng {start.getMonth() + 1}
                <br />
                năm {start.getFullYear()}
              </span>
            </div>
          )}
          {start && (
            <p className="mt-3 text-[15px] text-white/80" style={enter(4)}>
              {lunarLine(start)}
            </p>
          )}
        </div>
      </div>
      <Sprockets side="l" />
      <Sprockets side="r" />
      <style>{`.fm2-ken{animation:fm2Ken 16s ease-out both}@keyframes fm2Ken{from{transform:scale(1.12)}to{transform:scale(1.02)}}.fm2-leak{animation:fm2Leak 9s ease-in-out infinite alternate}@keyframes fm2Leak{from{transform:translate(0,0);opacity:.7}to{transform:translate(-30px,20px);opacity:1}}@media (prefers-reduced-motion: reduce){.fm2-ken,.fm2-leak{animation:none}}`}</style>
    </section>
  )
}

/** Album as a strip of film that scrolls sideways */
export function FilmReel({ photos, onOpen }: { photos: string[]; onOpen: (url: string) => void }) {
  return (
    <div className="-mx-6 relative" style={{ background: "#0c0b0a" }}>
      <div className="h-[18px]" style={{ backgroundImage: "linear-gradient(to right, rgba(236,226,206,.85) 0 12px, transparent 12px 24px)", backgroundSize: "24px 8px", backgroundRepeat: "repeat-x", backgroundPosition: "0 5px" }} />
      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {photos.map((src, i) => (
          <button key={src + i} type="button" onClick={() => onOpen(src)} className="snap-center shrink-0 w-[62%] aspect-[3/4] relative overflow-hidden" aria-label="Xem ảnh">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" style={{ filter: "sepia(.15) contrast(1.05)" }} />
            <span className="absolute left-1.5 bottom-1 text-[10px] tracking-[0.2em]" style={{ color: "rgba(255,170,90,.85)", fontFamily: "ui-monospace, monospace" }}>
              {String(i + 1).padStart(2, "0")}A
            </span>
          </button>
        ))}
      </div>
      <div className="h-[18px]" style={{ backgroundImage: "linear-gradient(to right, rgba(236,226,206,.85) 0 12px, transparent 12px 24px)", backgroundSize: "24px 8px", backgroundRepeat: "repeat-x", backgroundPosition: "0 5px" }} />
      <p className="text-center text-[13px] py-3" style={{ color: "rgba(236,226,206,.7)" }}>
        Vuốt ngang để xem cuộn phim
      </p>
    </div>
  )
}
