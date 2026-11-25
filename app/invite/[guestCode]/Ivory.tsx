"use client"
import { fitName } from "./Looks"

// "Ngà dập nổi" (template id `floral`, 2026-11-25). Style learned from a premium Vietnamese invite the user
// liked (embossed ivory paper, wax seal, photo that sharpens as the envelope opens, script revealed letter by
// letter, embossed borders, hand-drawn line icons). Every motif, layout and line of copy here is WedTable's own;
// see docs/mau-thiep/phong-bi-dap-noi-longlinh.md.
import { useEffect, useMemo, useRef, useState } from "react"
import { useIV } from "./Ornaments"
import { borderArt, embossSvg, envelopeArt } from "./emboss"
import { useEmbossUrl } from "./useEmboss"
import { lunarLine } from "@/lib/lunar"
import type { HeroProps, IntroProps } from "./Looks"

const PIN = "var(--iv-pinyon), cursive"
const SC = "var(--iv-sc), serif"
const CG = "var(--iv-caps), serif"

const pad = (n: number) => String(n).padStart(2, "0")
const dots = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`

/** Embossed peony paper for the envelope (rasterised once as an image) */
export function useEnvelopePaper(paper: string) {
  return useEmbossUrl(() => embossSvg(390, 844, paper, envelopeArt(390, 844)), [paper])
}
/** Embossed vine for the left and right page borders */
export function useBorderPaper(paper: string) {
  return useEmbossUrl(() => embossSvg(28, 200, paper, borderArt(28, 200), { depth: 2.2, blur: 1.2 }), [paper])
}

/** Text revealed one character at a time (blur → sharp), once `on` turns true */
export function Letters({ text, on, delay = 0, step = 0.06, className = "", style }: { text: string; on: boolean; delay?: number; step?: number; className?: string; style?: React.CSSProperties }) {
  // words stay unbroken (each word is a nowrap group); characters animate one by one
  const words = (text ?? "").normalize("NFC").split(" ")
  let idx = 0
  return (
    <span className={"iv-letters " + (on ? "iv-on " : "") + className} style={style} aria-label={text}>
      {words.map((w, wi) => (
        <span key={wi} className="whitespace-nowrap" aria-hidden>
          {Array.from(w).map((c) => {
            const i = idx++
            return (
              <span key={i} className="iv-ch" style={{ animationDelay: `${delay + i * step}s` }}>
                {c}
              </span>
            )
          })}
          {wi < words.length - 1 && (idx++, " ")}
        </span>
      ))}
    </span>
  )
}

export const IVORY_CSS = `
.iv-ch{display:inline-block;opacity:0;filter:blur(8px);transform:translateY(.22em)}
.iv-on .iv-ch{animation:ivCh .9s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes ivCh{to{opacity:1;filter:none;transform:none}}
.iv-wipe{clip-path:inset(-20% 100% -20% 0);transition:clip-path 1.5s cubic-bezier(.5,0,.2,1)}
.iv-wipe.iv-on{clip-path:inset(-20% 0 -20% 0)}
.iv-draw path,.iv-draw line,.iv-draw circle,.iv-draw rect,.iv-draw ellipse,.iv-draw polyline{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.6s cubic-bezier(.45,0,.25,1)}
.iv-draw.iv-on path,.iv-draw.iv-on line,.iv-draw.iv-on circle,.iv-draw.iv-on rect,.iv-draw.iv-on ellipse,.iv-draw.iv-on polyline{stroke-dashoffset:0}
.iv-draw-abs *{stroke-dasharray:200;stroke-dashoffset:200;transition:stroke-dashoffset 1.8s cubic-bezier(.45,0,.25,1)}
.iv-draw-abs.iv-on *{stroke-dashoffset:0}
@media (prefers-reduced-motion: reduce){.iv-draw-abs *{stroke-dashoffset:0}.iv-ch{opacity:1;filter:none;transform:none}.iv-on .iv-ch{animation:none}.iv-wipe{clip-path:none}.iv-draw path,.iv-draw line,.iv-draw circle,.iv-draw rect,.iv-draw ellipse,.iv-draw polyline{stroke-dashoffset:0}}
`

/** true once the element has scrolled into view */
export function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T | null>(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return setOn(true)
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setOn(true)
        io.disconnect()
      }
    }, { threshold })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, on] as const
}

// ---------------------------------------------------------------- wax seal

/** Ivory wax seal with a raised rim and a pressed lotus sprig */
export function IvorySeal({ size }: { size?: number }) {
  const IV = useIV()
  const blob = useMemo(() => {
    const pts: string[] = []
    for (let i = 0; i <= 360; i += 5) {
      const a = (i * Math.PI) / 180
      const r = 46 + 1.8 * Math.sin(a * 5 + 0.6) + 1.2 * Math.sin(a * 11) + 0.8 * Math.cos(a * 17)
      pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`)
    }
    return pts.join(" ")
  }, [])
  const wax = IV.soft
  return (
    <svg width={size ?? "100%"} height={size ?? "100%"} viewBox="0 0 100 100" className="block" aria-hidden>
      <defs>
        <radialGradient id="ivw" cx="40%" cy="34%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity=".7" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#5a4a38" stopOpacity=".28" />
        </radialGradient>
        <filter id="ivp" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation=".7" result="b" />
          <feDiffuseLighting in="b" surfaceScale="-2.2" diffuseConstant="1" lightingColor="#fff" result="l">
            <feDistantLight azimuth="225" elevation="55" />
          </feDiffuseLighting>
          <feComposite in="l" in2="SourceAlpha" operator="in" />
        </filter>
      </defs>
      <polygon points={blob} fill={wax} />
      <polygon points={blob} fill="url(#ivw)" />
      {/* raised rim */}
      <circle cx="50" cy="50" r="33" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="2.4" />
      <circle cx="50" cy="50.8" r="33" fill="none" stroke="#6b5a45" strokeOpacity=".22" strokeWidth="1.4" />
      {/* pressed motif: lotus bud on a stem with two leaves */}
      <g filter="url(#ivp)" opacity=".85">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <path key={a} d="M0 -2 C-5 -5 -5 -12 0 -14 C5 -12 5 -5 0 -2Z" transform={`translate(50 40) rotate(${a})`} fill="#000" />
        ))}
        {[30, 90, 150, 210, 270, 330].map((a) => (
          <path key={a} d="M0 -1 C-3 -3 -3 -8 0 -9 C3 -8 3 -3 0 -1Z" transform={`translate(50 40) rotate(${a})`} fill="#000" />
        ))}
        <circle cx="50" cy="40" r="2.6" fill="#000" />
        <path d="M50 54 C49 60 51 66 50 72" stroke="#000" strokeWidth="1.6" fill="none" />
        <path d="M50 62 C44 59 39 60 35 64 C41 67 46 66 50 62Z M50 66 C56 63 61 64 65 68 C59 71 54 70 50 66Z" fill="#000" />
      </g>
    </svg>
  )
}

// ---------------------------------------------------------------- opening

export function IvoryIntro({ event, initials, onOpened, onReveal, guest }: IntroProps) {
  const IV = useIV()
  const paperImg = useEnvelopePaper(IV.blush)
  const [phase, setPhase] = useState<"idle" | "press" | "run" | "out">("idle")
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
    if (phase !== "idle" || reduce) return finish(600)
    setPhase("press")
    // seal pressed (0.3s) → top and bottom flaps fold back → side flaps → the cover is ready under the
    // envelope before its inside fades, so nothing flashes white
    timers.current.push(window.setTimeout(() => setPhase("run"), 300))
    timers.current.push(window.setTimeout(() => onReveal?.(), 1500))
    timers.current.push(window.setTimeout(() => setPhase("out"), 3400))
    timers.current.push(window.setTimeout(onOpened, 4000))
  }
  tapRef.current = tap
  const C = { x: 50, y: 47 } // where the four flaps meet, in %
  const flap = (cls: string, clip: string, origin: string, shade: string) => (
    <div className={"absolute inset-0 iv-flap " + cls} style={{ transformOrigin: origin, backfaceVisibility: "hidden" }}>
      <div className="absolute inset-0" style={{ clipPath: clip, backgroundColor: IV.blush, backgroundImage: paperImg, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0" style={{ background: shade }} />
      </div>
    </div>
  )
  const name = guest || [event.bride_name, event.groom_name].filter(Boolean).join(" & ")
  return (
    <div
      className={"fixed inset-0 z-50 overflow-hidden cursor-pointer select-none iv-env " + (ready ? "iv-ready " : "") + (phase === "press" ? "iv-press " : "") + (phase === "run" || phase === "out" ? "iv-open " : "") + (phase === "out" ? "iv-gone" : "")}
      onClick={tap}
      role="button"
      aria-label="Mở thiệp mời"
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[460px]" style={{ perspective: 1500 }}>
        {/* solid paper behind the flaps until the side flaps begin to part */}
        <div className="absolute inset-0 iv-back" style={{ background: IV.blush }} />
        {flap("iv-left", `polygon(0 0, ${C.x}% ${C.y}%, 0 100%)`, "0 50%", "linear-gradient(to right, rgba(60,45,30,0) 40%, rgba(60,45,30,.10))")}
        {flap("iv-right", `polygon(100% 0, ${C.x}% ${C.y}%, 100% 100%)`, "100% 50%", "linear-gradient(to left, rgba(60,45,30,0) 40%, rgba(60,45,30,.10))")}
        <div className="absolute inset-0" style={{ filter: "drop-shadow(0 -2px 3px rgba(70,55,38,.18))" }}>
          {flap("iv-bottom", `polygon(0 100%, ${C.x}% ${C.y}%, 100% 100%)`, "50% 100%", "linear-gradient(to top, rgba(255,255,255,.08), rgba(60,45,30,.06))")}
        </div>
        <div className="absolute inset-0" style={{ filter: "drop-shadow(0 3px 4px rgba(70,55,38,.22))" }}>
          {flap("iv-top", `polygon(0 0, 100% 0, ${C.x}% ${C.y}%)`, "50% 0", "linear-gradient(to bottom, rgba(255,255,255,.12), rgba(60,45,30,.08))")}
        </div>
        {/* fold edges catch the light */}
        <svg className="absolute inset-0 w-full h-full iv-edges pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <g fill="none" vectorEffect="non-scaling-stroke">
            <path d={`M0 0 L${C.x} ${C.y} L100 0 M0 100 L${C.x} ${C.y} L100 100`} stroke="#fff" strokeOpacity=".75" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
          </g>
        </svg>
        {/* seal */}
        <div className="absolute left-1/2 iv-seal-wrap" style={{ top: `${C.y}%`, width: "min(46vw, 190px)", aspectRatio: "1", transform: "translate(-50%, -50%)" }}>
          <div className="absolute inset-[-14%] rounded-full iv-ring" style={{ border: "1px solid rgba(255,255,255,.8)" }} />
          <div className="relative w-full h-full iv-seal" style={{ filter: "drop-shadow(0 7px 9px rgba(92,74,44,.32)) drop-shadow(0 2px 2px rgba(92,74,44,.25))" }}>
            <IvorySeal />
            <span className="absolute inset-0 rounded-full iv-shine" />
          </div>
        </div>
        {/* who it is for */}
        <div className="absolute inset-x-0 bottom-[13%] text-center px-6 iv-who">
          <p className="text-[30px] leading-none" style={{ fontFamily: PIN, color: IV.ink }}>
            Trân trọng kính mời
          </p>
          <p className="mt-3 text-[21px] tracking-[0.06em]" style={{ fontFamily: SC, fontWeight: 600, color: IV.ink }}>
            <Letters text={name} on={ready} delay={0.3} step={0.035} />
          </p>
        </div>
        <div className="absolute inset-x-0 bottom-[5%] flex justify-center pointer-events-none iv-hint">
          <span className="inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px]" style={{ background: "rgba(40,34,28,.5)", color: "#F6EFE2", fontFamily: SC, fontWeight: 600, letterSpacing: ".06em", backdropFilter: "blur(6px)" }}>
            Chạm để mở thiệp
          </span>
        </div>
      </div>
      <style>{`
        ${IVORY_CSS}
        .iv-env{transition:opacity .6s ease}
        .iv-gone{opacity:0;pointer-events:none}
        .iv-flap{transition:transform 1.6s cubic-bezier(.55,.02,.25,1)}
        .iv-open .iv-top{transform:rotateX(-178deg)}
        .iv-open .iv-bottom{transform:rotateX(178deg);transition-delay:.25s}
        .iv-open .iv-left{transform:rotateY(178deg);transition-delay:1.25s;transition-duration:1.45s}
        .iv-open .iv-right{transform:rotateY(-178deg);transition-delay:1.35s;transition-duration:1.45s}
        .iv-back{transition:opacity .7s ease 2.3s}
        .iv-open .iv-back{opacity:0}
        .iv-edges,.iv-who,.iv-hint{transition:opacity .5s}
        .iv-open .iv-edges,.iv-open .iv-who,.iv-open .iv-hint,.iv-press .iv-hint{opacity:0}
        .iv-seal{transition:transform .35s cubic-bezier(.3,.7,.3,1),opacity .6s ease .25s}
        .iv-ready:not(.iv-press):not(.iv-open) .iv-seal{animation:ivBreathe 3.4s ease-in-out infinite}
        .iv-press .iv-seal{transform:scale(.93)}
        .iv-open .iv-seal{transform:scale(1.06);opacity:0}
        .iv-ring{opacity:0}
        .iv-ready:not(.iv-press):not(.iv-open) .iv-ring{animation:ivRing 2.8s ease-out infinite}
        .iv-shine{background:linear-gradient(115deg,transparent 38%,rgba(255,255,255,.55) 48%,rgba(255,255,255,0) 58%) 130% 0/260% 100% no-repeat;mix-blend-mode:soft-light;animation:ivShine 4.2s ease-in-out 1s infinite;clip-path:circle(46%)}
        .iv-hint span{animation:ivNudge 2.2s ease-in-out infinite}
        @keyframes ivBreathe{50%{transform:scale(1.025)}}
        @keyframes ivRing{0%{transform:scale(.85);opacity:.9}100%{transform:scale(1.3);opacity:0}}
        @keyframes ivShine{0%,55%{background-position:130% 0}100%{background-position:-60% 0}}
        @keyframes ivNudge{50%{transform:translateY(-3px)}}
        @media (prefers-reduced-motion: reduce){.iv-seal,.iv-ring,.iv-shine,.iv-hint span{animation:none!important}}
      `}</style>
    </div>
  )
}

// ---------------------------------------------------------------- cover

export function IvoryHero({ event, cover, start, opened }: HeroProps) {
  const IV = useIV()
  const paperImg = useEnvelopePaper(IV.blush)
  const bride = event.bride_name || ""
  const groom = event.groom_name || ""
  const t1 = 1.0
  const t2 = t1 + Array.from(bride).length * 0.07 + 0.25
  const t3 = t2 + 0.3 + Array.from(groom).length * 0.07
  // the paper rises high enough that the small heading line never sits on the photo
  const fade = `linear-gradient(to top, ${IV.paper} 0%, ${IV.paper} 34%, ${IV.paper}e6 50%, ${IV.paper}00 74%)`
  return (
    <section className="wt-full wt-bare relative h-[100svh] min-h-[620px] overflow-hidden" style={{ backgroundColor: IV.blush, backgroundImage: cover ? undefined : paperImg, backgroundSize: "cover" }}>
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            transformOrigin: "55% 60%",
            transform: opened ? "scale(1)" : "scale(1.12)",
            filter: opened ? "none" : "blur(12px) brightness(.8) saturate(.8)",
            transition: "transform 3.6s cubic-bezier(.2,.65,.2,1), filter 2.8s cubic-bezier(.3,.6,.3,1)",
          }}
        />
      )}
      <div className="absolute inset-0" style={{ background: fade }} />
      <div className="absolute inset-x-0 bottom-0 pb-[9svh] px-6 text-center flex flex-col items-center">
        <p className={"text-[13px] tracking-[0.08em] iv-wipe " + (opened ? "iv-on" : "")} style={{ fontFamily: SC, fontWeight: 700, color: IV.ink, transitionDelay: ".5s" }}>
          Trân trọng báo tin lễ thành hôn
        </p>
        <h1 className="mt-2 leading-[1.02]" style={{ fontFamily: PIN, color: IV.wine }}>
          <Letters text={bride} on={opened} delay={t1} step={0.07} className="block" style={{ fontSize: fitName(bride, 60, 8) }} />
          <Letters text="&" on={opened} delay={t2} className="block text-[38px] my-0.5" style={{ color: IV.rose }} />
          <Letters text={groom} on={opened} delay={t2 + 0.3} step={0.07} className="block" style={{ fontSize: fitName(groom, 60, 8) }} />
        </h1>
        {start && (
          <div className={"mt-4 iv-wipe " + (opened ? "iv-on" : "")} style={{ transitionDelay: `${t3}s` }}>
            <p className="text-[21px] tracking-[0.18em]" style={{ fontFamily: SC, fontWeight: 600, color: IV.ink }}>
              {dots(start)}
            </p>
            <p className="mt-1 text-[16px] italic" style={{ fontFamily: CG, color: IV.muted }}>
              {lunarLine(start)}
            </p>
          </div>
        )}
        <span
          className="mt-6 inline-flex items-center gap-2 rounded-lg border px-4 py-1.5 text-[13px] transition-opacity duration-1000"
          style={{ borderColor: IV.line, color: IV.muted, fontFamily: SC, fontWeight: 600, letterSpacing: ".12em", opacity: opened ? 1 : 0, transitionDelay: `${t3 + 0.6}s` }}
        >
          Cuộn xuống
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="iv-nudge" aria-hidden>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </div>
      <style>{`${IVORY_CSS}.iv-nudge{animation:ivNudge 1.8s ease-in-out infinite}@keyframes ivNudge{50%{transform:translateY(3px)}}`}</style>
    </section>
  )
}

export function IvoryTitle({ children }: { children: React.ReactNode; kicker?: string }) {
  const IV = useIV()
  const onDark = IV.paper === IV.deep
  return (
    <h2 className="text-center text-[46px] leading-[1.05] mb-7" style={{ fontFamily: PIN, color: onDark ? IV.gold[0] : IV.wine, textWrap: "balance" as any }}>
      {children}
    </h2>
  )
}

export function IvoryDivider({ className = "" }: { className?: string }) {
  const IV = useIV()
  return (
    <svg viewBox="0 0 120 14" className={"w-32 h-[14px] mx-auto block " + className} aria-hidden>
      <path d="M4 7 H48 M72 7 H116" stroke={IV.muted} strokeOpacity=".6" strokeWidth=".8" />
      <path d="M52 7 C55 2 58 2 60 7 C62 12 65 12 68 7 C65 2 62 2 60 7 C58 12 55 12 52 7Z" fill="none" stroke={IV.muted} strokeWidth=".8" />
    </svg>
  )
}

/** "Hôn lễ được cử hành vào / 18 giờ 00 | ngày 01.01.2027 / tức ngày …" */
export function IvoryEventDate({ start }: { start: Date }) {
  const IV = useIV()
  return (
    <div className="text-center" style={{ fontFamily: SC }}>
      <p className="text-[15px] tracking-[0.1em]" style={{ color: IV.muted, fontWeight: 600 }}>
        Hôn lễ được cử hành vào
      </p>
      <p className="mt-2 text-[19px] tracking-[0.04em] whitespace-nowrap" style={{ color: IV.ink, fontWeight: 700 }}>
        {pad(start.getHours())} giờ {pad(start.getMinutes())}
        <span className="mx-2 font-normal" style={{ color: IV.line }}>
          |
        </span>
        ngày {dots(start)}
      </p>
      <p className="mt-1.5 text-[15px]" style={{ color: IV.muted, fontWeight: 500 }}>
        {lunarLine(start)}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------- line icons for the programme

const ICONS: Record<string, React.ReactNode> = {
  glasses: (
    <>
      <path d="M14 8 L22 8 L21 22 C21 27 15 27 15 22Z" />
      <path d="M18 27 L18 38 M14 38 H22" />
      <path d="M30 6 L38 6 L37 20 C37 25 31 25 31 20Z" transform="rotate(14 34 20)" />
      <path d="M34 25 L32 36 M28 35 H36" transform="rotate(14 34 30)" />
      <path d="M24 4 L25 1 M27 5 L29 2 M21 5 L20 2" />
    </>
  ),
  rings: (
    <>
      <circle cx="18" cy="24" r="9" />
      <circle cx="29" cy="24" r="9" />
      <path d="M15 13 L18 9 L21 13" />
    </>
  ),
  arch: (
    <>
      <path d="M10 40 V20 C10 10 38 10 38 20 V40" />
      <path d="M16 40 V22 C16 15 32 15 32 22 V40" />
      <path d="M24 4 V12 M20 8 H28" />
      <path d="M6 40 H42" />
    </>
  ),
  dinner: (
    <>
      <circle cx="24" cy="24" r="11" />
      <circle cx="24" cy="24" r="7" />
      <path d="M8 12 V20 M6 12 V18 C6 20 10 20 10 18 V12 M8 20 V36" />
      <path d="M40 12 C37 14 37 22 40 24 V36" />
    </>
  ),
  camera: (
    <>
      <rect x="7" y="14" width="34" height="22" rx="3" />
      <circle cx="24" cy="25" r="7" />
      <path d="M17 14 L19 10 H29 L31 14" />
      <circle cx="36" cy="19" r="1.2" />
    </>
  ),
  cake: (
    <>
      <rect x="10" y="30" width="28" height="9" rx="1" />
      <rect x="14" y="22" width="20" height="8" rx="1" />
      <rect x="18" y="15" width="12" height="7" rx="1" />
      <path d="M24 15 V10 M24 10 C22 8 24 6 24 6 C24 6 26 8 24 10" />
    </>
  ),
  music: (
    <>
      <path d="M18 34 V12 L34 8 V30" />
      <ellipse cx="15" cy="34" rx="4" ry="3" />
      <ellipse cx="31" cy="30" rx="4" ry="3" />
    </>
  ),
  car: (
    <>
      <path d="M6 30 V24 L11 16 H33 L40 24 H42 V30 Z" />
      <circle cx="14" cy="31" r="4" />
      <circle cx="34" cy="31" r="4" />
      <path d="M13 23 H38 M22 16 V23" />
    </>
  ),
  bouquet: (
    <>
      <circle cx="18" cy="14" r="5" />
      <circle cx="29" cy="12" r="5" />
      <circle cx="24" cy="21" r="5" />
      <path d="M20 26 L24 40 L28 26" />
      <path d="M21 33 C24 31 27 31 29 33" />
    </>
  ),
  heart: <path d="M24 38 C10 28 6 20 10 14 C14 9 21 10 24 16 C27 10 34 9 38 14 C42 20 38 28 24 38Z" />,
}
const EMOJI_ICON: Record<string, string> = { "🥂": "glasses", "💍": "rings", "⛪": "arch", "🍽️": "dinner", "💃": "music", "📸": "camera", "🎂": "cake", "🎶": "music", "🚗": "car", "💐": "bouquet" }

export function LineIcon({ name, on, size = 52 }: { name?: string; on: boolean; size?: number }) {
  const IV = useIV()
  const key = (name && (EMOJI_ICON[name] ?? (ICONS[name] ? name : undefined))) || "heart"
  return (
    <svg viewBox="0 0 48 44" width={size} height={size * 0.92} className={"iv-draw-abs " + (on ? "iv-on" : "")} fill="none" stroke={IV.ink} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <g>{ICONS[key]}</g>
    </svg>
  )
}
/** Programme: centred line that draws itself, a line icon per moment, script times */
export function IvoryTimeline({ items }: { items: any[] }) {
  return (
    <div className="flex flex-col items-center text-center">
      {items.map((it, i) => (
        <IvoryMoment key={i} it={it} last={i === items.length - 1} />
      ))}
    </div>
  )
}
function IvoryMoment({ it, last }: { it: any; last: boolean }) {
  const IV = useIV()
  const [ref, on] = useInView<HTMLDivElement>(0.4)
  return (
    <div ref={ref} className="flex flex-col items-center">
      <LineIcon name={it.icon} on={on} />
      <p className="mt-1.5 text-[38px] leading-none" style={{ fontFamily: PIN, color: IV.ink }}>
        {it.time}
      </p>
      <p className="mt-1.5 text-[17px] tracking-[0.08em]" style={{ fontFamily: SC, fontWeight: 700, color: IV.ink }}>
        {it.title}
      </p>
      {it.note && (
        <p className="mt-0.5 text-[16px] italic" style={{ fontFamily: CG, color: IV.muted }}>
          {it.note}
        </p>
      )}
      {!last && (
        <svg width="2" height="30" className={"my-3 iv-draw " + (on ? "iv-on" : "")} aria-hidden>
          <line x1="1" y1="0" x2="1" y2="30" stroke={IV.muted} strokeOpacity=".55" strokeWidth="1" pathLength={1} style={{ transitionDelay: ".6s" }} />
        </svg>
      )}
      {last && <div className="h-2" />}
    </div>
  )
}

// ---------------------------------------------------------------- closing

export function IvoryClosing({ event, guest }: { event: any; guest: string }) {
  const IV = useIV()
  const [ref, on] = useInView<HTMLDivElement>(0.3)
  return (
    <div ref={ref} className="text-center">
      <p className="text-[34px] leading-tight" style={{ fontFamily: PIN, color: IV.ink }}>
        Hai gia đình
        <br />
        hân hoan báo tin
      </p>
      <div className="relative mx-auto mt-5 w-[220px] h-[270px]">
        <svg viewBox="0 0 220 270" className={"absolute inset-0 w-full h-full iv-draw " + (on ? "iv-on" : "")} fill="none" stroke={IV.muted} aria-hidden>
          <ellipse cx="110" cy="135" rx="92" ry="118" strokeWidth="1.3" pathLength={1} />
          <ellipse cx="110" cy="135" rx="85" ry="111" strokeWidth=".7" pathLength={1} />
          <path d="M80 18 C95 6 125 6 140 18 M95 14 C100 4 120 4 125 14 M80 252 C95 264 125 264 140 252 M95 256 C100 266 120 266 125 256" strokeWidth="1.1" pathLength={1} />
          <path d="M18 135 C8 128 8 142 18 135 M202 135 C212 128 212 142 202 135" strokeWidth="1.1" pathLength={1} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ fontFamily: PIN, color: IV.wine }}>
          <span className="text-[42px] leading-none">{event.bride_name}</span>
          <span className="text-[26px] my-1" style={{ color: IV.gold[2] }}>
            &amp;
          </span>
          <span className="text-[42px] leading-none">{event.groom_name}</span>
        </div>
      </div>
      <p className="mt-7 text-[15px] tracking-[0.1em]" style={{ fontFamily: SC, fontWeight: 600, color: IV.muted }}>
        Trân trọng kính mời
      </p>
      <p className="mt-1 text-[24px] tracking-[0.04em]" style={{ fontFamily: SC, fontWeight: 700, color: IV.ink }}>
        {guest}
      </p>
      <p className="mt-1 text-[16px] italic" style={{ fontFamily: CG, color: IV.muted }}>
        đến chung vui cùng gia đình chúng tôi
      </p>
    </div>
  )
}
