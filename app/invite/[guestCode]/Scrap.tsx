"use client"
import { fitName } from "./Looks"

// "Sổ kỷ niệm" (template id `scrapbook`, 2026-11-25): a kraft notebook with washi tape and a name label; the
// cover turns like a page onto a scrapbook spread with taped polaroids, handwriting, doodles and a date stamp.
import { useEffect, useRef, useState } from "react"
import { useIV } from "./Ornaments"
import { lunarLine } from "@/lib/lunar"
import type { HeroProps, IntroProps } from "./Looks"

const HAND = "var(--iv-hand), cursive"
const SC = "var(--iv-sc), serif"
const pad = (n: number) => String(n).padStart(2, "0")

const KRAFT =
  "radial-gradient(rgba(90,60,30,.10) 1px, transparent 1.4px) 0 0/7px 7px, radial-gradient(rgba(255,255,255,.12) 1px, transparent 1.3px) 3px 4px/9px 9px"
const DOTS = "radial-gradient(rgba(80,60,50,.16) 1px, transparent 1.3px) 0 0/16px 16px"

/** A strip of washi tape */
export function Tape({ color, w = 92, rot = -6, className = "", style }: { color: string; w?: number; rot?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      aria-hidden
      className={"absolute block h-[26px] " + className}
      style={{
        width: w,
        transform: `rotate(${rot}deg)`,
        background: `repeating-linear-gradient(45deg, rgba(255,255,255,.35) 0 6px, rgba(255,255,255,0) 6px 12px), ${color}`,
        opacity: 0.88,
        clipPath: "polygon(3% 0, 97% 4%, 100% 50%, 97% 96%, 3% 100%, 0 50%)",
        boxShadow: "0 1px 2px rgba(0,0,0,.12)",
        ...style,
      }}
    />
  )
}

/** Polaroid print */
export function Polaroid({ src, rot, w, caption, tape }: { src?: string; rot: number; w: number; caption?: string; tape: string }) {
  const IV = useIV()
  return (
    <div className="relative bg-white p-2 pb-9" style={{ width: w, transform: `rotate(${rot}deg)`, boxShadow: "0 10px 20px -8px rgba(60,40,20,.45)" }}>
      <Tape color={tape} className="left-1/2 -top-3 -translate-x-1/2" rot={rot > 0 ? -8 : 7} />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square" style={{ background: IV.blush }} />
      )}
      {caption && (
        <p className="absolute inset-x-0 bottom-1.5 text-center text-[19px]" style={{ fontFamily: HAND, color: IV.ink }}>
          {caption}
        </p>
      )}
    </div>
  )
}

/** Hand-drawn heart doodle */
function Heart({ color, size = 26, className = "" }: { color: string; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 30 28" width={size} height={size * 0.93} className={className} aria-hidden>
      <path d="M15 26 C5 18 1 12 3 7 C5 2 12 2 15 8 C18 2 25 2 27 7 C29 12 25 18 15 26Z" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function ScrapIntro({ event, guest, onOpened, onReveal }: IntroProps) {
  const IV = useIV()
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
    timers.current.push(window.setTimeout(() => onReveal?.(), 150))
    timers.current.push(window.setTimeout(() => setPhase("out"), 1500))
    timers.current.push(window.setTimeout(onOpened, 2100))
  }
  tapRef.current = tap
  const names = [event.bride_name, event.groom_name].filter(Boolean)
  return (
    <div className={"fixed inset-0 z-50 overflow-hidden cursor-pointer select-none sb " + (phase !== "idle" ? "sb-run " : "") + (phase === "out" ? "sb-out" : "")} onClick={tap} role="button" aria-label="Mở thiệp mời" style={{ background: phase === "idle" ? "#3a2f28" : "transparent" }}>
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[460px]" style={{ perspective: 1600 }}>
        <div className="absolute inset-0 sb-cover" style={{ transformOrigin: "0 50%", background: `${KRAFT}, linear-gradient(160deg, #C9A57A, #B48E62)`, boxShadow: "inset -14px 0 30px rgba(0,0,0,.18)" }}>
          {/* stitched spine */}
          <div className="absolute inset-y-0 left-0 w-[22px]" style={{ background: "linear-gradient(to right, rgba(0,0,0,.25), rgba(0,0,0,0))" }} />
          <div className="absolute inset-y-6 left-[12px] w-px" style={{ backgroundImage: "linear-gradient(#f6ecd8 50%, transparent 50%)", backgroundSize: "1px 10px" }} />
          <Tape color={IV.blush} w={130} rot={-8} className="left-[18%] top-[12%]" />
          <Tape color={IV.sage} w={110} rot={10} className="right-[10%] top-[16%]" />
          {/* label */}
          <div className="absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2 w-[74%] bg-[#FBF7EF] px-6 py-7 text-center" style={{ boxShadow: "0 8px 18px -8px rgba(60,40,20,.5)", transform: "translate(-50%,-50%) rotate(-2deg)" }}>
            <p className="text-[13px] tracking-[0.26em]" style={{ fontFamily: SC, fontWeight: 700, color: IV.muted }}>
              Sổ kỷ niệm
            </p>
            <p className="mt-3 text-[44px] leading-[1]" style={{ fontFamily: HAND, color: IV.wine }}>
              {names[0]}
              <br />
              <span className="text-[30px]" style={{ color: IV.rose }}>
                và
              </span>{" "}
              {names[1]}
            </p>
            <Heart color={IV.rose} className="mx-auto mt-3" />
          </div>
          {/* stamp with the guest's name */}
          <div className="absolute left-1/2 bottom-[17%] -translate-x-1/2 w-[70%] rounded-[6px] px-4 py-3 text-center" style={{ border: `2px dashed ${IV.wine}`, color: IV.wine, transform: "translateX(-50%) rotate(3deg)", background: "rgba(255,250,240,.55)" }}>
            <p className="text-[22px] leading-none" style={{ fontFamily: HAND }}>
              {guest ? `Gửi ${guest}` : "Gửi bạn thân mến"}
            </p>
            <p className="mt-1 text-[13px]" style={{ fontFamily: SC, fontWeight: 700, letterSpacing: ".08em" }}>
              Mời bạn mở sổ cùng chúng mình
            </p>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-[5%] flex justify-center pointer-events-none" style={{ opacity: phase === "idle" ? 1 : 0, transition: "opacity .3s" }}>
          <span className="rounded-lg px-4 py-2 text-[13px] sb-hint" style={{ background: "rgba(255,255,255,.9)", color: "#3a2f28", fontFamily: SC, fontWeight: 700, letterSpacing: ".08em" }}>
            Chạm để mở sổ
          </span>
        </div>
      </div>
      <style>{`
        .sb{transition:opacity .6s ease}
        .sb-out{opacity:0;pointer-events:none}
        .sb-cover{transition:transform 1.3s cubic-bezier(.6,.05,.3,1);backface-visibility:hidden}
        .sb-run .sb-cover{transform:rotateY(-170deg)}
        .sb-hint{animation:sbNudge 2.2s ease-in-out infinite}
        @keyframes sbNudge{50%{transform:translateY(-3px)}}
        @media (prefers-reduced-motion: reduce){.sb-hint{animation:none}}
      `}</style>
    </div>
  )
}

export function ScrapHero({ event, cover, second, start, opened }: HeroProps) {
  const IV = useIV()
  const pop = (i: number, rot = 0): React.CSSProperties => ({ opacity: opened ? 1 : 0, transform: opened ? `rotate(${rot}deg)` : `rotate(${rot}deg) translateY(14px) scale(.96)`, transition: `opacity .6s ease ${0.15 + i * 0.18}s, transform .8s cubic-bezier(.3,.7,.2,1.3) ${0.15 + i * 0.18}s` })
  return (
    <section className="wt-bare relative min-h-[100svh] overflow-hidden px-6 pt-10 pb-14" style={{ background: `${DOTS}, ${IV.paper}` }}>
      <p className="text-[34px] leading-none" style={{ fontFamily: HAND, color: IV.muted, ...pop(0, -3) }}>
        Chúng mình cưới!
      </p>
      <div className="relative mt-6 h-[360px]">
        <div className="absolute left-[2%] top-0" style={pop(1, -4)}>
          <Polaroid src={cover} rot={0} w={230} caption="hai đứa mình" tape={IV.blush} />
        </div>
        {second && (
          <div className="absolute right-[1%] top-[44%]" style={pop(2, 6)}>
            <Polaroid src={second} rot={0} w={150} tape={IV.sage} />
          </div>
        )}
        {/* doodle arrow */}
        <svg viewBox="0 0 90 60" className="absolute right-[10%] top-[6%] w-24" style={pop(3)} aria-hidden>
          <path d="M6 10 C40 2 70 14 76 44 M64 36 L76 46 L82 32" fill="none" stroke={IV.wine} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="absolute right-[2%] top-0 text-[22px] leading-tight text-right" style={{ fontFamily: HAND, color: IV.wine, ...pop(3, 4) }}>
          ngày vui
          <br />
          sắp tới!
        </p>
      </div>
      <h1 className="mt-4 leading-[1.05]" style={{ fontSize: fitName((event.bride_name || "") + (event.groom_name || ""), 54, 11), fontFamily: HAND, color: IV.wine, ...pop(4, -2) }}>
        {event.bride_name}
        <Heart color={IV.rose} size={30} className="inline-block mx-2 align-middle" />
        {event.groom_name}
      </h1>
      {start && (
        <div className="mt-6 flex items-center gap-4" style={pop(5)}>
          {/* rubber date stamp */}
          <div className="w-[92px] h-[92px] rounded-full flex flex-col items-center justify-center shrink-0" style={{ border: `2.5px solid ${IV.wine}`, boxShadow: `inset 0 0 0 4px ${IV.paper}, inset 0 0 0 5px ${IV.wine}`, color: IV.wine, transform: "rotate(-10deg)" }}>
            <span className="text-[30px] leading-none" style={{ fontFamily: SC, fontWeight: 700 }}>
              {pad(start.getDate())}
            </span>
            <span className="text-[11px] tracking-[0.1em]" style={{ fontFamily: SC, fontWeight: 700 }}>
              tháng {start.getMonth() + 1}
            </span>
          </div>
          <p className="text-[16px] leading-snug" style={{ color: IV.ink }}>
            {pad(start.getHours())}:{pad(start.getMinutes())}, {["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"][start.getDay()]}
            <br />
            <span style={{ color: IV.muted }}>{lunarLine(start)}</span>
          </p>
        </div>
      )}
    </section>
  )
}

export function ScrapTitle({ children }: { children: React.ReactNode; kicker?: string }) {
  const IV = useIV()
  return (
    <div className="text-center mb-7">
      <h2 className="inline-block text-[42px] leading-[1.05] relative" style={{ fontFamily: HAND, color: IV.wine }}>
        {children}
        <svg viewBox="0 0 200 12" preserveAspectRatio="none" className="absolute left-0 right-0 -bottom-2 w-full h-3" aria-hidden>
          <path d="M3 8 C50 2 100 11 150 5 S190 6 197 4" fill="none" stroke={IV.rose} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </h2>
    </div>
  )
}

// ---------------------------------------------------------------- body pieces (used by every section)

/** Notebook dots behind the body sections */
export const SCRAP_DOTS_CSS = `.wt-scrap main section:not(.wt-full):not(.wt-bare){background-image:radial-gradient(rgba(80,60,50,.13) 1px,transparent 1.3px)!important;background-size:16px 16px!important}`

/** A note card taped onto the page, slightly askew */
export function ScrapFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const IV = useIV()
  return (
    <div className={"relative mx-auto max-w-[360px] text-center " + className} style={{ transform: "rotate(-0.8deg)" }}>
      <div className="rounded-[3px] px-5 pt-8 pb-6" style={{ background: IV.paper, boxShadow: "0 1px 1px rgba(0,0,0,.08), 0 12px 22px -12px rgba(60,40,30,.35)" }}>
        <div style={{ transform: "rotate(0.8deg)" }}>{children}</div>
      </div>
      <Tape color={IV.blush} w={86} rot={-8} className="-top-3 -left-3" />
      <Tape color={IV.sage} w={70} rot={9} className="-top-2.5 -right-2" />
    </div>
  )
}

/** Hand-drawn dashes with a heart in the middle */
export function ScrapDivider({ className = "" }: { className?: string }) {
  const IV = useIV()
  return (
    <div className={"flex items-center justify-center gap-3 " + className} aria-hidden>
      <svg width="70" height="8" viewBox="0 0 70 8"><path d="M2 5 C14 2 24 7 36 4 S58 3 68 5" fill="none" stroke={IV.rose} strokeWidth="1.6" strokeLinecap="round" strokeDasharray="5 5" /></svg>
      <Heart color={IV.rose} size={18} />
      <svg width="70" height="8" viewBox="0 0 70 8"><path d="M2 4 C14 6 24 2 36 5 S58 6 68 3" fill="none" stroke={IV.rose} strokeWidth="1.6" strokeLinecap="round" strokeDasharray="5 5" /></svg>
    </div>
  )
}
