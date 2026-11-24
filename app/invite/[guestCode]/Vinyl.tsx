"use client"

// "Đĩa than" (template id `vinyl`, 2026-11-25): the wedding as a record. A printed sleeve with the couple's
// names; tapping slides the record out, the sleeve away, the tonearm drops and the record spins with the
// wedding photo as its centre label. The programme reads as a tracklist.
import { useEffect, useRef, useState } from "react"
import { useIV } from "./Ornaments"
import { lunarLine } from "@/lib/lunar"
import type { HeroProps, IntroProps } from "./Looks"

const DISPLAY = "var(--iv-display), serif"
const SC = "var(--iv-sc), serif"
const pad = (n: number) => String(n).padStart(2, "0")

/** The record: grooves, sheen, a photo label in the middle */
export function Record({ cover, size, spin, label }: { cover?: string; size: number; spin: boolean; label: string }) {
  const IV = useIV()
  return (
    <div className="relative rounded-full" style={{ width: size, height: size, boxShadow: "0 18px 40px -12px rgba(0,0,0,.6)" }}>
      <div
        className={"absolute inset-0 rounded-full " + (spin ? "vy-spin" : "")}
        style={{
          background:
            "conic-gradient(from 0deg, rgba(255,255,255,.05), rgba(255,255,255,0) 25%, rgba(255,255,255,.05) 50%, rgba(255,255,255,0) 75%), repeating-radial-gradient(circle at 50% 50%, #151313 0 1.6px, #1d1a1a 1.6px 2.6px), radial-gradient(circle, #222 0 30%, #0d0c0c 100%)",
        }}
      />
      <div className="absolute inset-0 rounded-full">
        {/* label */}
        <div className="absolute rounded-full overflow-hidden" style={{ inset: "31%", background: IV.blush, boxShadow: `0 0 0 3px ${IV.gold[1]}` }}>
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-center text-[11px] px-2" style={{ fontFamily: SC, fontWeight: 700, color: IV.wine }}>
              {label}
            </div>
          )}
        </div>
        <div className="absolute rounded-full" style={{ inset: "48.6%", background: "#0d0c0c" }} />
      </div>
      {/* fixed light reflection (does not spin) */}
      <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: "conic-gradient(from 20deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,.14) 30deg, rgba(255,255,255,0) 60deg, rgba(255,255,255,0) 180deg, rgba(255,255,255,.10) 210deg, rgba(255,255,255,0) 240deg)", WebkitMaskImage: "radial-gradient(circle, transparent 31%, #000 31.5%)", maskImage: "radial-gradient(circle, transparent 31%, #000 31.5%)" }} />
      <style>{`.vy-spin{animation:vySpin 3.2s linear infinite}@keyframes vySpin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion: reduce){.vy-spin{animation:none}}`}</style>
    </div>
  )
}

function Tonearm({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 80 220" width="64" height="176" className="absolute" style={{ right: -26, top: -36, transformOrigin: "60px 22px", transform: on ? "rotate(24deg)" : "rotate(0deg)", transition: "transform 1s cubic-bezier(.5,0,.3,1)" }} aria-hidden>
      <circle cx="60" cy="22" r="16" fill="#c9c2b6" stroke="#8d8576" strokeWidth="2" />
      <circle cx="60" cy="22" r="6" fill="#6f685c" />
      <path d="M60 22 L56 160 L38 190" fill="none" stroke="#d8d1c5" strokeWidth="5" strokeLinecap="round" />
      <rect x="26" y="184" width="22" height="14" rx="3" transform="rotate(32 37 191)" fill="#b9b1a3" />
    </svg>
  )
}

export function VinylIntro({ event, cover, guest, onOpened, onReveal }: IntroProps) {
  const IV = useIV()
  const [phase, setPhase] = useState<"idle" | "slide" | "play" | "out">("idle")
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
    if (phase !== "idle" || reduce) return finish(650)
    setPhase("slide")
    timers.current.push(window.setTimeout(() => setPhase("play"), 1100))
    timers.current.push(window.setTimeout(() => onReveal?.(), 2300))
    timers.current.push(window.setTimeout(() => setPhase("out"), 2700))
    timers.current.push(window.setTimeout(onOpened, 3350))
  }
  tapRef.current = tap
  const names = [event.bride_name, event.groom_name].filter(Boolean)
  const size = 300
  return (
    <div className={"fixed inset-0 z-50 overflow-hidden cursor-pointer select-none vy " + (phase === "out" ? "vy-out" : "")} style={{ background: `radial-gradient(120% 80% at 50% 35%, ${IV.deep}, #140b0d)` }} onClick={tap} role="button" aria-label="Mở thiệp mời">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[460px]">
        <p className="absolute inset-x-0 top-[9%] text-center text-[13px] tracking-[0.3em]" style={{ fontFamily: SC, fontWeight: 700, color: IV.gold[0] }}>
          {guest ? `Kính gửi ${guest}` : "Thiệp mời cưới"}
        </p>
        <div className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2" style={{ width: size, height: size }}>
          {/* record (behind the sleeve, slides out to the right, then centres and spins) */}
          <div
            className="absolute inset-0 transition-transform duration-[1000ms] ease-[cubic-bezier(.5,0,.3,1)]"
            style={{ transform: phase === "idle" ? "translateX(14%)" : phase === "slide" ? "translateX(30%)" : "translateX(0)" }}
          >
            <Record cover={cover} size={size} spin={phase === "play" || phase === "out"} label={names.join(" & ")} />
            <div className="absolute inset-0 pointer-events-none" style={{ opacity: phase === "idle" ? 0 : 1, transition: "opacity .4s" }}>
              <Tonearm on={phase === "play" || phase === "out"} />
            </div>
          </div>
          {/* sleeve */}
          <div
            className="absolute inset-0 rounded-[6px] flex flex-col justify-between p-6 transition-transform duration-[1000ms] ease-[cubic-bezier(.5,0,.3,1)]"
            style={{
              transform: phase === "idle" ? "none" : phase === "slide" ? "translateX(-30%) rotate(-4deg)" : "translateX(-150%) rotate(-10deg)",
              background: `linear-gradient(135deg, ${IV.paper}, ${IV.soft})`,
              boxShadow: "0 22px 40px -14px rgba(0,0,0,.6), inset 0 0 0 1px rgba(0,0,0,.06)",
            }}
          >
            <p className="text-[12px] tracking-[0.24em]" style={{ fontFamily: SC, fontWeight: 700, color: IV.muted }}>
              Thiệp cưới
            </p>
            <div>
              <p className="text-[44px] leading-[0.95]" style={{ fontFamily: DISPLAY, color: IV.wine }}>
                {names[0]}
                <br />
                <i className="text-[28px]" style={{ color: IV.rose }}>
                  &amp;
                </i>{" "}
                {names[1]}
              </p>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-[12px] tracking-[0.2em]" style={{ fontFamily: SC, fontWeight: 700, color: IV.muted }}>
                Side A
              </span>
              <span className="w-10 h-10 rounded-full" style={{ border: `1.5px solid ${IV.wine}` }} />
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-[7%] flex justify-center pointer-events-none vy-hint" style={{ opacity: phase === "idle" ? 1 : 0, transition: "opacity .3s" }}>
          <span className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px]" style={{ border: `1px solid ${IV.gold[1]}`, color: IV.gold[0], fontFamily: SC, fontWeight: 700, letterSpacing: ".1em" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M7 4l13 8-13 8z" />
            </svg>
            Chạm để phát
          </span>
        </div>
      </div>
      <style>{`.vy{transition:opacity .65s ease}.vy-out{opacity:0;pointer-events:none}.vy-hint span{animation:vyNudge 2.2s ease-in-out infinite}@keyframes vyNudge{50%{transform:translateY(-3px)}}@media (prefers-reduced-motion: reduce){.vy-hint span{animation:none}}`}</style>
    </div>
  )
}

export function VinylHero({ event, cover, start, opened }: HeroProps) {
  const IV = useIV()
  const enter = (i: number): React.CSSProperties => ({ opacity: opened ? 1 : 0, transform: opened ? "none" : "translateY(8px)", transition: `opacity 1s ease ${0.3 + i * 0.18}s, transform 1s ease ${0.3 + i * 0.18}s` })
  return (
    <section className="wt-bare relative min-h-[100svh] overflow-hidden flex flex-col items-center px-6 pt-12 pb-14 text-center" style={{ background: `radial-gradient(120% 80% at 50% 30%, ${IV.deep}, #140b0d)`, color: IV.gold[0] }}>
      <div className="relative" style={enter(0)}>
        <Record cover={cover} size={280} spin={opened} label={[event.bride_name, event.groom_name].filter(Boolean).join(" & ")} />
      </div>
      <p className="mt-8 text-[13px] tracking-[0.3em]" style={{ fontFamily: SC, fontWeight: 700, color: IV.gold[1], ...enter(1) }}>
        Chúng mình cưới
      </p>
      <h1 className="mt-2 text-[46px] leading-[1]" style={{ fontFamily: DISPLAY, color: "#F6EFE6", ...enter(2) }}>
        {event.bride_name} <i style={{ color: IV.gold[0] }}>&amp;</i> {event.groom_name}
      </h1>
      {start && (
        <div className="mt-5" style={enter(3)}>
          <p className="text-[16px]" style={{ color: "rgba(246,239,230,.88)" }}>
            Ngày cưới {pad(start.getHours())}:{pad(start.getMinutes())}, {pad(start.getDate())}.{pad(start.getMonth() + 1)}.{start.getFullYear()}
          </p>
          <p className="mt-1 text-[15px]" style={{ color: "rgba(246,239,230,.7)" }}>
            {lunarLine(start)}
          </p>
        </div>
      )}
    </section>
  )
}

export function VinylTitle({ children }: { children: React.ReactNode; kicker?: string }) {
  const IV = useIV()
  const onDark = IV.paper === IV.deep
  return (
    <div className="text-center mb-7">
      <svg viewBox="0 0 40 40" className="w-8 h-8 mx-auto" aria-hidden>
        <circle cx="20" cy="20" r="18" fill={onDark ? "#0d0c0c" : IV.ink} />
        <circle cx="20" cy="20" r="12" fill="none" stroke={onDark ? "#2a2626" : "rgba(255,255,255,.15)"} />
        <circle cx="20" cy="20" r="6" fill={IV.rose} />
        <circle cx="20" cy="20" r="1.4" fill="#0d0c0c" />
      </svg>
      <h2 className="mt-2 text-[34px] leading-tight" style={{ fontFamily: DISPLAY, color: onDark ? IV.gold[0] : IV.wine }}>
        {children}
      </h2>
    </div>
  )
}

/** Programme as a tracklist: A1 17:30 Đón khách ………… */
export function Tracklist({ items }: { items: any[] }) {
  const IV = useIV()
  return (
    <ol className="text-left max-w-[360px] mx-auto">
      {items.map((it, i) => (
        <li key={i} className="flex items-baseline gap-3 py-3 border-b" style={{ borderColor: IV.line }}>
          <span className="w-8 shrink-0 text-[13px]" style={{ fontFamily: SC, fontWeight: 700, color: IV.rose }}>
            {i < 4 ? "A" : "B"}
            {(i % 4) + 1}
          </span>
          <span className="flex-1">
            <span className="block text-[17px] font-medium" style={{ color: IV.ink }}>
              {it.title}
            </span>
            {it.note && (
              <span className="block text-[14px]" style={{ color: IV.muted }}>
                {it.note}
              </span>
            )}
          </span>
          <span className="text-[18px] tabular-nums" style={{ fontFamily: DISPLAY, color: IV.wine }}>
            {it.time}
          </span>
        </li>
      ))}
    </ol>
  )
}
