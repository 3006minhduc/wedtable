"use client"
import { fitName } from "./Looks"

// "Vén voan" (template id `veil`, 2026-11-25): a bridal tulle veil with a scalloped lace hem and tiny embroidered
// flowers lies over the couple's photo; tapping lifts it like the groom lifting the bride's veil.
import { useEffect, useRef, useState } from "react"
import { useIV } from "./Ornaments"
import { lunarLine } from "@/lib/lunar"
import { Letters, IVORY_CSS } from "./Ivory"
import type { HeroProps, IntroProps } from "./Looks"

const PIN = "var(--iv-pinyon), cursive"
const SC = "var(--iv-sc), serif"
const CG = "var(--iv-caps), serif"
const pad = (n: number) => String(n).padStart(2, "0")

/** Fine tulle mesh with soft pleats and scattered embroidered flowers */
const TULLE =
  "radial-gradient(circle, rgba(255,255,255,.95) .7px, transparent 1.1px) 0 0/5px 5px," +
  "linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,.22) 45%, rgba(255,255,255,0) 60%)," +
  `url("data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><g fill='white' fill-opacity='.85'><g transform='translate(30 34)'><circle r='2.2'/><circle cx='4' r='2.2'/><circle cx='-4' r='2.2'/><circle cy='4' r='2.2'/><circle cy='-4' r='2.2'/></g><g transform='translate(88 92) scale(.8)'><circle r='2.2'/><circle cx='4' r='2.2'/><circle cx='-4' r='2.2'/><circle cy='4' r='2.2'/><circle cy='-4' r='2.2'/></g><circle cx='70' cy='20' r='1.6'/><circle cx='14' cy='96' r='1.6'/></g></svg>"
  )}")`

/** Scalloped lace hem: scallops with eyelets and a little flower in each */
function LaceHem({ className = "" }: { className?: string }) {
  const n = 9
  const w = 360
  const sw = w / n
  return (
    <svg viewBox={`0 -24 ${w} 72`} preserveAspectRatio="none" className={"w-full h-[72px] block " + className} aria-hidden>
      <path d={`M0 -24 L${w} -24 L${w} 0 ${Array.from({ length: n }, (_, i) => `Q${w - (i + 0.5) * sw} 44 ${w - (i + 1) * sw} 0`).join(" ")} Z`} fill="rgba(255,255,255,.9)" stroke="rgba(190,170,170,.5)" strokeWidth="1" />
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`translate(${(i + 0.5) * sw} 14)`} fill="none" stroke="rgba(180,155,155,.6)" strokeWidth="1">
          <circle r="5" />
          <circle cx="-11" cy="-6" r="2" />
          <circle cx="11" cy="-6" r="2" />
          <path d="M-16 -14 Q0 -22 16 -14" />
        </g>
      ))}
      <path d={`M0 -16 H${w}`} stroke="rgba(190,170,170,.5)" strokeDasharray="2 3" />
    </svg>
  )
}

export function VeilIntro({ event, cover, guest, onOpened, onReveal }: IntroProps) {
  const IV = useIV()
  const [phase, setPhase] = useState<"idle" | "run" | "out">("idle")
  const [ready, setReady] = useState(false)
  const timers = useRef<number[]>([])
  const tapRef = useRef<() => void>(() => {})
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 250)
    return () => {
      clearTimeout(t)
      timers.current.forEach(clearTimeout)
    }
  }, [])
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
    timers.current.push(window.setTimeout(() => onReveal?.(), 900))
    timers.current.push(window.setTimeout(() => setPhase("out"), 2000))
    timers.current.push(window.setTimeout(onOpened, 2650))
  }
  tapRef.current = tap
  const names = [event.bride_name, event.groom_name].filter(Boolean).join(" & ")
  return (
    <div className={"fixed inset-0 z-50 overflow-hidden cursor-pointer select-none vl " + (phase !== "idle" ? "vl-run " : "") + (phase === "out" ? "vl-out" : "")} onClick={tap} role="button" aria-label="Mở thiệp mời">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[460px] overflow-hidden">
        {/* what shows through the veil */}
        <div className="absolute inset-0 vl-under" style={{ background: IV.paper }}>
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>
        {/* the veil */}
        <div className="absolute inset-x-[-6%] top-0 h-[86%] vl-veil" style={{ transformOrigin: "50% 0" }}>
          <div className="absolute inset-0" style={{ background: `${TULLE}, linear-gradient(rgba(255,251,250,.78), rgba(255,248,248,.7))`, backdropFilter: "blur(7px)", WebkitBackdropFilter: "blur(7px)" }} />
          <div className="absolute inset-x-0 bottom-0 translate-y-[60%]">
            <LaceHem />
          </div>
          <div className="absolute inset-x-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center px-6 py-8 rounded-[18px]" style={{ background: "rgba(255,255,255,.62)" }}>
            <p className="text-[32px] leading-none" style={{ fontFamily: PIN, color: IV.ink }}>
              Kính gửi
            </p>
            <p className="mt-3 text-[23px] tracking-[0.04em]" style={{ fontFamily: SC, fontWeight: 700, color: IV.ink }}>
              <Letters text={guest || names} on={ready} delay={0.3} step={0.035} />
            </p>
            <div className="my-6 h-px w-24" style={{ background: IV.gold[1] }} />
            <p className="text-[44px] leading-[1.05]" style={{ fontFamily: PIN, color: IV.wine }}>
              {names}
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-[5%] flex justify-center pointer-events-none vl-hint">
          <span className="rounded-lg px-4 py-2 text-[13px]" style={{ background: "rgba(255,255,255,.9)", color: IV.ink, fontFamily: SC, fontWeight: 700, letterSpacing: ".08em", boxShadow: "0 4px 14px rgba(0,0,0,.1)" }}>
            Chạm để vén voan
          </span>
        </div>
      </div>
      <style>{`
        ${IVORY_CSS}
        .vl{transition:opacity .65s ease}
        .vl-out{opacity:0;pointer-events:none}
        .vl-veil{animation:vlSway 5s ease-in-out infinite}
        .vl-run .vl-veil{animation:vlLift 1.7s cubic-bezier(.55,.05,.3,1) forwards}
        .vl-under img{filter:none}
        .vl-hint span{animation:vlNudge 2.2s ease-in-out infinite}
        .vl-run .vl-hint{opacity:0;transition:opacity .3s}
        @keyframes vlSway{50%{transform:skewX(.6deg) translateX(-3px)}}
        @keyframes vlLift{0%{transform:none}35%{transform:translateY(-18%) skewX(-3deg) scaleY(.96)}70%{transform:translateY(-75%) skewX(2deg) scaleY(.9)}100%{transform:translateY(-118%) scaleY(.85);opacity:.6}}
        @keyframes vlNudge{50%{transform:translateY(-3px)}}
        @media (prefers-reduced-motion: reduce){.vl-veil,.vl-hint span{animation:none}}
      `}</style>
    </div>
  )
}

export function VeilHero({ event, cover, start, opened }: HeroProps) {
  const IV = useIV()
  const enter = (i: number): React.CSSProperties => ({ opacity: opened ? 1 : 0, transform: opened ? "none" : "translateY(8px)", transition: `opacity 1s ease ${0.3 + i * 0.18}s, transform 1s ease ${0.3 + i * 0.18}s` })
  return (
    <section className="wt-bare relative min-h-[100svh] overflow-hidden flex flex-col items-center text-center px-6 pt-12 pb-14" style={{ background: `radial-gradient(circle, rgba(255,255,255,.9) .7px, transparent 1.1px) 0 0/5px 5px, ${IV.paper}` }}>
      <p className="text-[15px] tracking-[0.12em]" style={{ fontFamily: SC, fontWeight: 700, color: IV.muted, ...enter(0) }}>
        Trân trọng báo tin lễ thành hôn
      </p>
      {/* arched photo with a lace edge */}
      <div className="relative mt-6 w-[78%] max-w-[300px]" style={enter(1)}>
        <div className="absolute -inset-[10px] rounded-t-full" style={{ background: "radial-gradient(circle at 50% 50%, transparent 3px, rgba(255,255,255,.95) 3.5px) 0 0/12px 12px", boxShadow: `0 0 0 1px ${IV.line}` }} />
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="relative w-full aspect-[3/4] object-cover rounded-t-full" style={{ boxShadow: `0 0 0 4px #fff, 0 0 0 5px ${IV.gold[1]}`, filter: opened ? "none" : "blur(8px)", transition: "filter 2.2s ease" }} />
        ) : (
          <div className="relative w-full aspect-[3/4] rounded-t-full" style={{ background: IV.blush }} />
        )}
      </div>
      <h1 className="mt-7 leading-[1.02]" style={{ fontFamily: PIN, color: IV.wine }}>
        <Letters text={event.bride_name || ""} on={opened} delay={0.9} step={0.07} className="block" style={{ fontSize: fitName(event.bride_name, 56) }} />
        <Letters text="&" on={opened} delay={1.2} className="block text-[34px]" style={{ color: IV.gold[1] }} />
        <Letters text={event.groom_name || ""} on={opened} delay={1.4} step={0.07} className="block" style={{ fontSize: fitName(event.groom_name, 56) }} />
      </h1>
      {start && (
        <div className="mt-4" style={enter(6)}>
          <p className="text-[21px] tracking-[0.16em]" style={{ fontFamily: SC, fontWeight: 700, color: IV.ink }}>
            {pad(start.getDate())}.{pad(start.getMonth() + 1)}.{start.getFullYear()}
          </p>
          <p className="mt-1 text-[16px] italic" style={{ fontFamily: CG, color: IV.muted }}>
            {lunarLine(start)}
          </p>
        </div>
      )}
      <style>{IVORY_CSS}</style>
    </section>
  )
}

export function VeilTitle({ children }: { children: React.ReactNode; kicker?: string }) {
  const IV = useIV()
  return (
    <div className="text-center mb-7">
      <h2 className="text-[44px] leading-[1.05]" style={{ fontFamily: PIN, color: IV.wine }}>
        {children}
      </h2>
      {/* string of pearls */}
      <svg viewBox="0 0 120 10" className="w-28 h-[10px] mx-auto mt-2 block" aria-hidden>
        {Array.from({ length: 11 }, (_, i) => (
          <circle key={i} cx={10 + i * 10} cy={5 + Math.sin(i / 1.6) * 1.6} r={i === 5 ? 3.4 : 2.4} fill="#fff" stroke={IV.line} strokeWidth=".8" />
        ))}
      </svg>
    </div>
  )
}
