"use client"
import { fitName } from "./Looks"

// "Hộp lụa nơ" (template id `emboss`, 2026-11-25, replaces the lotus look the owner found too temple-like):
// a silk-covered invitation box with an embossed rose wreath on the lid, a satin ribbon tied in a bow and a
// little name tag. Tap: the bow unties, the ribbon slides away, the lid lifts and the invitation is inside.
import { useEffect, useRef, useState } from "react"
import { useIV } from "./Ornaments"
import { embossSvg, wreathArt } from "./emboss"
import { useEmbossUrl } from "./useEmboss"
import { lunarLine } from "@/lib/lunar"
import { Letters, IVORY_CSS } from "./Ivory"
import type { HeroProps, IntroProps } from "./Looks"

const PIN = "var(--iv-pinyon), cursive"
const SC = "var(--iv-sc), serif"
const CG = "var(--iv-caps), serif"
const pad = (n: number) => String(n).padStart(2, "0")

/** Silk: fine crossing threads + a soft diagonal sheen over the base colour */
export function silk(base: string) {
  return {
    backgroundColor: base,
    backgroundImage:
      "linear-gradient(115deg, rgba(255,255,255,0) 20%, rgba(255,255,255,.30) 38%, rgba(255,255,255,0) 52%, rgba(255,255,255,.18) 70%, rgba(255,255,255,0) 86%)," +
      "repeating-linear-gradient(0deg, rgba(120,80,80,.04) 0 1px, transparent 1px 3px)," +
      "repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 1px, transparent 1px 4px)",
  } as React.CSSProperties
}

function useWreath(base: string, size: number, radius: number) {
  return useEmbossUrl(() => embossSvg(size, size, base, wreathArt(size, size, radius), { depth: 2.6, blur: 1.4 }), [base, size, radius])
}

/** Satin ribbon band (horizontal or vertical) with a sheen down its length */
function Band({ dir, color, className = "" }: { dir: "h" | "v"; color: string; className?: string }) {
  const sheen = dir === "h" ? "to bottom" : "to right"
  return (
    <div
      className={"absolute " + className}
      style={{
        ...(dir === "h" ? { left: 0, right: 0, top: "50%", height: 46, marginTop: -23 } : { top: 0, bottom: 0, left: "50%", width: 46, marginLeft: -23 }),
        background: `linear-gradient(${sheen}, rgba(0,0,0,.22), rgba(255,255,255,.35) 30%, rgba(255,255,255,.05) 55%, rgba(0,0,0,.18)), ${color}`,
        boxShadow: "0 3px 6px rgba(70,30,40,.25)",
      }}
    />
  )
}

/** Bow: two loops, a knot and two tails, drawn as satin */
function Bow({ color }: { color: string }) {
  return (
    <svg viewBox="-120 -80 240 200" width="230" height="192" aria-hidden style={{ overflow: "visible", filter: "drop-shadow(0 6px 8px rgba(70,30,40,.3))" }}>
      <defs>
        <linearGradient id="bwL" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".45" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".25" />
        </linearGradient>
      </defs>
      <g className="sk-tail-l">
        <path d="M-6 8 C-30 50 -48 84 -64 112 L-40 106 L-30 120 C-18 84 -8 46 4 12Z" fill={color} />
        <path d="M-6 8 C-30 50 -48 84 -64 112 L-40 106 L-30 120 C-18 84 -8 46 4 12Z" fill="url(#bwL)" />
      </g>
      <g className="sk-tail-r">
        <path d="M6 8 C30 50 48 84 64 112 L40 106 L30 120 C18 84 8 46 -4 12Z" fill={color} />
        <path d="M6 8 C30 50 48 84 64 112 L40 106 L30 120 C18 84 8 46 -4 12Z" fill="url(#bwL)" />
      </g>
      <g className="sk-loop-l">
        <path d="M-8 0 C-40 -60 -110 -54 -104 -8 C-100 30 -44 24 -8 4Z" fill={color} />
        <path d="M-8 0 C-40 -60 -110 -54 -104 -8 C-100 30 -44 24 -8 4Z" fill="url(#bwL)" />
        <path d="M-20 -2 C-46 -34 -86 -34 -88 -8" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="2" />
      </g>
      <g className="sk-loop-r">
        <path d="M8 0 C40 -60 110 -54 104 -8 C100 30 44 24 8 4Z" fill={color} />
        <path d="M8 0 C40 -60 110 -54 104 -8 C100 30 44 24 8 4Z" fill="url(#bwL)" />
        <path d="M20 -2 C46 -34 86 -34 88 -8" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="2" />
      </g>
      <rect x="-15" y="-15" width="30" height="30" rx="9" fill={color} className="sk-knot" />
      <rect x="-15" y="-15" width="30" height="30" rx="9" fill="url(#bwL)" className="sk-knot" />
    </svg>
  )
}

export function SilkIntro({ onOpened, onReveal, guest, event }: IntroProps) {
  const IV = useIV()
  const wreath = useWreath(IV.blush, 340, 128)
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
    timers.current.push(window.setTimeout(() => onReveal?.(), 1500))
    timers.current.push(window.setTimeout(() => setPhase("out"), 2500))
    timers.current.push(window.setTimeout(onOpened, 3150))
  }
  tapRef.current = tap
  const ribbon = IV.rose
  const names = [event.bride_name, event.groom_name].filter(Boolean).join(" & ")
  return (
    <div className={"fixed inset-0 z-50 overflow-hidden cursor-pointer select-none sk " + (phase !== "idle" ? "sk-run " : "") + (phase === "out" ? "sk-out" : "")} onClick={tap} role="button" aria-label="Mở thiệp mời">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[460px]" style={{ perspective: 1400 }}>
        {/* the lid */}
        <div className="absolute inset-0 sk-lid" style={{ ...silk(IV.blush), transformOrigin: "50% 0" }}>
          <div className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px]" style={{ backgroundImage: wreath, backgroundSize: "100% 100%" }} />
          <p className="absolute inset-x-0 top-[34%] -translate-y-1/2 text-center text-[40px] leading-none" style={{ fontFamily: PIN, color: IV.wine }}>
            {names}
          </p>
          <div className="absolute inset-0 sk-ribbons">
            <Band dir="h" color={ribbon} className="sk-band-h" />
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[42%] sk-bow">
            <Bow color={ribbon} />
          </div>
          {/* name tag on a thread from the knot */}
          <div className="absolute left-1/2 top-[58%] -ml-[1px] w-px h-[9%] sk-thread" style={{ background: IV.gold[2] }} />
          <div className="absolute left-1/2 top-[67%] -translate-x-1/2 w-[78%] max-w-[300px] rounded-[4px] px-5 py-4 text-center sk-tag" style={{ background: IV.soft, boxShadow: "0 8px 16px -8px rgba(70,30,40,.35), inset 0 0 0 1px " + IV.line }}>
            <p className="text-[26px] leading-none" style={{ fontFamily: PIN, color: IV.ink }}>
              Trân trọng kính mời
            </p>
            <p className="mt-2 text-[18px] tracking-[0.04em]" style={{ fontFamily: SC, fontWeight: 700, color: IV.wine }}>
              <Letters text={guest || names} on={ready} delay={0.3} step={0.035} />
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-[4%] flex justify-center pointer-events-none sk-hint">
          <span className="rounded-lg px-4 py-2 text-[13px]" style={{ background: "rgba(255,255,255,.85)", color: IV.ink, fontFamily: SC, fontWeight: 700, letterSpacing: ".08em", boxShadow: "0 4px 14px rgba(0,0,0,.1)" }}>
            Chạm để tháo nơ
          </span>
        </div>
      </div>
      <style>{`
        ${IVORY_CSS}
        .sk{transition:opacity .65s ease}
        .sk-out{opacity:0;pointer-events:none}
        .sk-loop-l,.sk-loop-r,.sk-tail-l,.sk-tail-r,.sk-knot{transform-box:fill-box;transition:transform .7s cubic-bezier(.5,0,.3,1),opacity .5s ease .2s}
        .sk-loop-l{transform-origin:100% 50%}.sk-loop-r{transform-origin:0 50%}
        .sk-run .sk-loop-l{transform:scale(.2) rotate(40deg);opacity:0}
        .sk-run .sk-loop-r{transform:scale(.2) rotate(-40deg);opacity:0}
        .sk-run .sk-tail-l{transform:translate(-60px,140px) rotate(-30deg);opacity:0}
        .sk-run .sk-tail-r{transform:translate(60px,140px) rotate(30deg);opacity:0}
        .sk-run .sk-knot{opacity:0}
        .sk-band-h,.sk-band-v{transition:transform .8s cubic-bezier(.5,0,.3,1) .45s,opacity .4s ease .9s}
        .sk-run .sk-band-h{transform:translateX(110%);opacity:0}
        .sk-run .sk-band-v{transform:translateY(110%);opacity:0}
        .sk-thread,.sk-tag{transition:transform .8s cubic-bezier(.5,0,.3,1) .3s,opacity .5s ease .5s}
        .sk-run .sk-thread,.sk-run .sk-tag{transform:translate(-50%,40px);opacity:0}
        .sk-run .sk-thread{transform:translateY(40px)}
        .sk-lid{transition:transform 1.1s cubic-bezier(.6,.05,.3,1) 1.2s,opacity .6s ease 1.7s;box-shadow:0 20px 40px rgba(70,30,40,.3)}
        .sk-run .sk-lid{transform:translateY(-104%) rotateX(18deg);opacity:.6}
        .sk-hint span{animation:skNudge 2.2s ease-in-out infinite}
        .sk-run .sk-hint{opacity:0;transition:opacity .3s}
        @keyframes skNudge{50%{transform:translateY(-3px)}}
        @media (prefers-reduced-motion: reduce){.sk-hint span{animation:none}}
      `}</style>
    </div>
  )
}

export function SilkHero({ event, cover, start, opened }: HeroProps) {
  const IV = useIV()
  const wreath = useWreath(IV.paper, 360, 132)
  const enter = (i: number): React.CSSProperties => ({ opacity: opened ? 1 : 0, transform: opened ? "none" : "translateY(8px)", transition: `opacity 1s ease ${0.3 + i * 0.18}s, transform 1s ease ${0.3 + i * 0.18}s` })
  return (
    <section className="wt-bare relative min-h-[100svh] overflow-hidden flex flex-col items-center justify-center text-center px-6 py-14" style={silk(IV.paper)}>
      <p className="relative text-[15px] tracking-[0.12em]" style={{ fontFamily: SC, fontWeight: 700, color: IV.muted, ...enter(0) }}>
        Trân trọng báo tin lễ thành hôn
      </p>
      <div className="relative mt-4 w-[340px] h-[340px] max-w-full flex items-center justify-center" style={enter(1)}>
        <div className="absolute inset-0" style={{ backgroundImage: wreath, backgroundSize: "100% 100%" }} />
        <div className="relative w-[226px] h-[226px] rounded-full p-[5px]" style={{ background: IV.soft, boxShadow: `0 0 0 1px ${IV.gold[1]}, 0 16px 28px -16px rgba(80,40,50,.45)` }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="w-full h-full rounded-full object-cover" style={{ filter: opened ? "none" : "blur(8px)", transition: "filter 2.4s ease" }} />
          ) : (
            <div className="w-full h-full rounded-full" style={{ background: IV.blush }} />
          )}
        </div>
      </div>
      <h1 className="relative mt-4 leading-[1.02]" style={{ fontFamily: PIN, color: IV.wine }}>
        <Letters text={event.bride_name || ""} on={opened} delay={0.8} step={0.07} className="block" style={{ fontSize: fitName(event.bride_name, 56) }} />
        <Letters text="&" on={opened} delay={1.1} className="block text-[34px]" style={{ color: IV.rose }} />
        <Letters text={event.groom_name || ""} on={opened} delay={1.3} step={0.07} className="block" style={{ fontSize: fitName(event.groom_name, 56) }} />
      </h1>
      {start && (
        <div className="relative mt-4" style={enter(6)}>
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

export function SilkTitle({ children }: { children: React.ReactNode; kicker?: string }) {
  const IV = useIV()
  const onDark = IV.paper === IV.deep
  return (
    <div className="text-center mb-7">
      <svg viewBox="-40 -14 80 34" className="w-14 h-6 mx-auto block" aria-hidden>
        <g fill={IV.blush} stroke={IV.rose} strokeWidth="1">
          <path d="M-3 0 C-12 -14 -34 -12 -32 -2 C-30 8 -14 6 -3 1Z" />
          <path d="M3 0 C12 -14 34 -12 32 -2 C30 8 14 6 3 1Z" />
          <path d="M-2 2 C-8 10 -12 16 -16 19 M2 2 C8 10 12 16 16 19" fill="none" />
          <rect x="-4" y="-4" width="8" height="8" rx="2.5" />
        </g>
      </svg>
      <h2 className="mt-1 text-[44px] leading-[1.05]" style={{ fontFamily: PIN, color: onDark ? IV.gold[0] : IV.wine }}>
        {children}
      </h2>
    </div>
  )
}
