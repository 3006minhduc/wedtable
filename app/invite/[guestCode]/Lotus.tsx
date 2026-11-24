"use client"

// "Sen lụa" (template id `emboss`, rebuilt 2026-11-25): silk ground with an embossed lotus pond; a closed lotus
// bud with the guest's name opens petal by petal, light blooms from its heart, and the cover shows the couple's
// photo in a round frame floating on the pond. Vietnamese motif, all drawn in code.
import { useEffect, useMemo, useRef, useState } from "react"
import { useIV } from "./Ornaments"
import { embossSvg, pondArt } from "./emboss"
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
      "linear-gradient(115deg, rgba(255,255,255,0) 20%, rgba(255,255,255,.28) 38%, rgba(255,255,255,0) 52%, rgba(255,255,255,.18) 70%, rgba(255,255,255,0) 86%)," +
      "repeating-linear-gradient(0deg, rgba(120,90,80,.035) 0 1px, transparent 1px 3px)," +
      "repeating-linear-gradient(90deg, rgba(255,255,255,.07) 0 1px, transparent 1px 4px)",
  } as React.CSSProperties
}

function usePond(base: string) {
  return useEmbossUrl(() => embossSvg(390, 300, base, pondArt(390, 300), { depth: 2.6, blur: 1.6 }), [base])
}

/** A lotus drawn petal by petal; `open` 0 (bud) → 1 (full bloom) */
export function LotusBloom({ open, size = 260 }: { open: boolean; size?: number }) {
  const IV = useIV()
  // [final angle, length, layer]
  const petals: [number, number, number][] = [
    [-78, 0.78, 0], [78, 0.78, 0], [-58, 0.9, 1], [58, 0.9, 1], [-34, 0.98, 2], [34, 0.98, 2], [-14, 1, 3], [14, 1, 3], [0, 1.02, 4],
  ]
  return (
    <svg viewBox="-130 -150 260 190" width={size} height={size * 0.73} aria-hidden style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="lpg" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFF7F2" />
          <stop offset=".55" stopColor={IV.blush} />
          <stop offset="1" stopColor={IV.rose} />
        </linearGradient>
        <radialGradient id="lcore" cx="50%" cy="60%" r="50%">
          <stop offset="0" stopColor="#FFF4C8" stopOpacity=".95" />
          <stop offset="1" stopColor="#FFF4C8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="-40" rx="110" ry="70" fill="url(#lcore)" className="lt2-core" />
      {petals.map(([a, len, layer], i) => {
        const L = 120 * len
        const ang = open ? a : a * 0.12
        return (
          <path
            key={i}
            d={`M0 0 C${-L * 0.34} ${-L * 0.28} ${-L * 0.24} ${-L * 0.82} 0 ${-L} C${L * 0.24} ${-L * 0.82} ${L * 0.34} ${-L * 0.28} 0 0Z`}
            fill="url(#lpg)"
            stroke={IV.rose}
            strokeOpacity=".55"
            strokeWidth="1"
            style={{ transform: `rotate(${ang}deg)`, transformOrigin: "0 0", transition: `transform 1.3s cubic-bezier(.3,.7,.2,1) ${0.15 + (4 - layer) * 0.12}s`, filter: "drop-shadow(0 2px 2px rgba(120,60,70,.18))" }}
          />
        )
      })}
      {petals.map(([a, len, layer], i) => {
        const L = 120 * len
        const ang = open ? a : a * 0.12
        return (
          <path
            key={"v" + i}
            d={`M0 ${-L * 0.08} Q${-L * 0.05} ${-L * 0.5} 0 ${-L * 0.9} M0 ${-L * 0.2} Q${-L * 0.14} ${-L * 0.5} ${-L * 0.1} ${-L * 0.8} M0 ${-L * 0.2} Q${L * 0.14} ${-L * 0.5} ${L * 0.1} ${-L * 0.8}`}
            fill="none"
            stroke={IV.rose}
            strokeOpacity=".35"
            strokeWidth=".8"
            style={{ transform: `rotate(${ang}deg)`, transformOrigin: "0 0", transition: `transform 1.3s cubic-bezier(.3,.7,.2,1) ${0.15 + (4 - layer) * 0.12}s` }}
          />
        )
      })}
      <ellipse cx="0" cy="2" rx="26" ry="7" fill={IV.leaf} opacity=".55" />
    </svg>
  )
}

export function LotusIntro({ onOpened, onReveal, guest, event }: IntroProps) {
  const IV = useIV()
  const pond = usePond(IV.paper)
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
    timers.current.push(window.setTimeout(() => onReveal?.(), 2100))
    timers.current.push(window.setTimeout(() => setPhase("out"), 2600))
    timers.current.push(window.setTimeout(onOpened, 3250))
  }
  tapRef.current = tap
  const names = [event.bride_name, event.groom_name].filter(Boolean).join(" & ")
  return (
    <div className={"fixed inset-0 z-50 overflow-hidden cursor-pointer select-none lt2 " + (phase !== "idle" ? "lt2-run " : "") + (phase === "out" ? "lt2-out" : "")} style={silk(IV.paper)} onClick={tap} role="button" aria-label="Mở thiệp mời">
      <div className="absolute inset-x-0 bottom-0 h-[300px] opacity-90" style={{ backgroundImage: pond, backgroundSize: "390px 300px", backgroundRepeat: "repeat-x", backgroundPosition: "center bottom" }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-[30px] leading-none" style={{ fontFamily: PIN, color: IV.ink }}>
          Trân trọng kính mời
        </p>
        <p className="mt-3 text-[21px] tracking-[0.05em]" style={{ fontFamily: SC, fontWeight: 600, color: IV.wine }}>
          <Letters text={guest || names} on={ready} delay={0.3} step={0.035} />
        </p>
        <div className="mt-10 relative">
          <LotusBloom open={phase !== "idle"} size={320} />
        </div>
        <p className="mt-4 text-[40px] leading-none lt2-names" style={{ fontFamily: PIN, color: IV.wine }}>
          {names}
        </p>
      </div>
      <div className="absolute inset-x-0 bottom-[6%] flex justify-center pointer-events-none lt2-hint">
        <span className="rounded-lg px-4 py-2 text-[13px]" style={{ background: "rgba(255,255,255,.75)", color: IV.ink, fontFamily: SC, fontWeight: 600, letterSpacing: ".08em", boxShadow: "0 4px 14px rgba(0,0,0,.08)" }}>
          Chạm để sen nở
        </span>
      </div>
      <style>{`
        ${IVORY_CSS}
        .lt2{transition:opacity .65s ease}
        .lt2-out{opacity:0;pointer-events:none}
        .lt2-core{opacity:0;transition:opacity 1.2s ease .9s}
        .lt2-run .lt2-core{opacity:1}
        .lt2-names{opacity:0;transition:opacity 1s ease 1.3s}
        .lt2-run .lt2-names{opacity:1}
        .lt2-hint span{animation:lt2Nudge 2.2s ease-in-out infinite}
        .lt2-run .lt2-hint{opacity:0;transition:opacity .3s}
        @keyframes lt2Nudge{50%{transform:translateY(-3px)}}
      `}</style>
    </div>
  )
}

export function LotusHero({ event, cover, start, opened }: HeroProps) {
  const IV = useIV()
  const pond = usePond(IV.paper)
  const enter = (i: number): React.CSSProperties => ({ opacity: opened ? 1 : 0, transform: opened ? "none" : "translateY(8px)", transition: `opacity 1s ease ${0.3 + i * 0.18}s, transform 1s ease ${0.3 + i * 0.18}s` })
  return (
    <section className="wt-bare relative min-h-[100svh] overflow-hidden flex flex-col items-center justify-center text-center px-8 py-16" style={silk(IV.paper)}>
      <div className="absolute inset-x-0 bottom-0 h-[220px] opacity-80" style={{ backgroundImage: pond, backgroundSize: "390px 300px", backgroundRepeat: "repeat-x", backgroundPosition: "center top", WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 60%)", maskImage: "linear-gradient(to bottom, transparent, #000 60%)" }} />
      <p className="relative text-[15px] tracking-[0.12em]" style={{ fontFamily: SC, fontWeight: 600, color: IV.muted, ...enter(0) }}>
        Trân trọng báo tin lễ thành hôn
      </p>
      <div className="relative mt-6 w-[74%] max-w-[300px] aspect-square rounded-full p-[6px]" style={{ boxShadow: `0 0 0 1px ${IV.gold[1]}, 0 18px 30px -18px rgba(80,50,50,.45)`, background: IV.paper, ...enter(1) }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          <div className="w-full h-full rounded-full" style={{ background: IV.blush }} />
        )}
      </div>
      <h1 className="relative mt-7 leading-[1.02]" style={{ fontFamily: PIN, color: IV.wine }}>
        <Letters text={event.bride_name || ""} on={opened} delay={0.8} step={0.07} className="block text-[56px]" />
        <Letters text="&" on={opened} delay={1.1} className="block text-[34px]" style={{ color: IV.leaf }} />
        <Letters text={event.groom_name || ""} on={opened} delay={1.3} step={0.07} className="block text-[56px]" />
      </h1>
      {start && (
        <div className="relative mt-5" style={enter(6)}>
          <p className="text-[21px] tracking-[0.16em]" style={{ fontFamily: SC, fontWeight: 600, color: IV.ink }}>
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

export function LotusTitle({ children }: { children: React.ReactNode; kicker?: string }) {
  const IV = useIV()
  const onDark = IV.paper === IV.deep
  return (
    <div className="text-center mb-7">
      <svg viewBox="0 0 60 26" className="w-12 h-6 mx-auto block" aria-hidden>
        <g fill={IV.blush} stroke={IV.rose} strokeWidth=".8">
          <path d="M30 24 C24 18 24 8 30 2 C36 8 36 18 30 24Z" />
          <path d="M30 24 C22 22 16 16 14 8 C22 10 28 16 30 24Z" />
          <path d="M30 24 C38 22 44 16 46 8 C38 10 32 16 30 24Z" />
        </g>
      </svg>
      <h2 className="mt-1 text-[44px] leading-[1.05]" style={{ fontFamily: PIN, color: onDark ? IV.gold[0] : IV.wine }}>
        {children}
      </h2>
    </div>
  )
}
