"use client"

// Physical-stationery look shared by every template: cotton paper grain, stacked sheets, letterpress ink,
// gold foil text and a gentle 3D tilt that follows the finger / mouse / phone tilt.
import { useEffect, useRef } from "react"
import { useIV } from "./Ornaments"

/** Fine cotton-paper grain (SVG noise), laid over a solid paper color */
export const PAPER_GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0.09 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`
)}")`

/** Woven linen for the table the card sits on */
export const LINEN = `repeating-linear-gradient(0deg, rgba(0,0,0,0.018) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)`

/** Ink pressed into the paper (letterpress): light catch below, shadow above */
export const LETTERPRESS: React.CSSProperties = { textShadow: "0 1px 0 rgba(255,255,255,0.65), 0 -0.5px 0 rgba(0,0,0,0.18)" }

/** Soft shadow for anything that should look like a separate card lying on the page */
export const LIFT: React.CSSProperties = { filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.08)) drop-shadow(0 14px 18px rgba(40,25,20,0.14))" }

/** Gold (or the palette's metal) foil text with a slow moving shine */
export function Foil({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const IV = useIV()
  const g = IV.gold
  return (
    <span
      className={"wt-foil " + className}
      style={{
        backgroundImage: `linear-gradient(100deg, ${g[2]} 0%, ${g[1]} 22%, ${g[0]} 38%, ${g[1]} 52%, ${g[2]} 70%, ${g[1]} 86%, ${g[0]} 100%)`,
        backgroundSize: "220% 100%",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.25))",
        ...style,
      }}
    >
      {children}
      <style>{`.wt-foil{animation:wtShine 6s ease-in-out infinite}@keyframes wtShine{0%,100%{background-position:0% 0}50%{background-position:100% 0}}@media (prefers-reduced-motion: reduce){.wt-foil{animation:none}}`}</style>
    </span>
  )
}

/**
 * Tilts its child a few degrees toward the pointer (or with the phone's gyroscope where allowed),
 * so layered parts at different depths (data-depth) shift and the card feels three-dimensional.
 */
export function Tilt({ children, className = "", max = 7 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    const apply = (x: number, y: number) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.transform = `rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`
        el.style.setProperty("--tx", x.toFixed(3))
        el.style.setProperty("--ty", y.toFixed(3))
      })
    }
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      apply(Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1)), Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1)))
    }
    const onLeave = () => apply(0, 0)
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      apply(Math.max(-1, Math.min(1, e.gamma / 25)), Math.max(-1, Math.min(1, (e.beta - 45) / 25)))
    }
    window.addEventListener("pointermove", onMove)
    document.addEventListener("pointerleave", onLeave)
    window.addEventListener("deviceorientation", onTilt)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerleave", onLeave)
      window.removeEventListener("deviceorientation", onTilt)
    }
  }, [max])
  return (
    <div style={{ perspective: 1100 }} className={className}>
      <div ref={ref} className="wt-tilt" style={{ transformStyle: "preserve-3d", transition: "transform 400ms cubic-bezier(.2,.7,.2,1)" }}>
        {children}
      </div>
      <style>{`.wt-tilt [data-depth]{transform:translateZ(calc(var(--d) * 1px)) translate(calc(var(--tx,0) * var(--d) * -0.15px), calc(var(--ty,0) * var(--d) * -0.15px));transition:transform 400ms cubic-bezier(.2,.7,.2,1)}`}</style>
    </div>
  )
}

/** Depth helper for children of <Tilt>: bigger = closer to the viewer */
export const depth = (d: number) => ({ "data-depth": "", style: { ["--d" as any]: d } as React.CSSProperties })

/** A photo printed on card stock with a white border, lying slightly rotated on the page */
export function PrintPhoto({ src, className = "", rotate = 0, tall = false }: { src: string; className?: string; rotate?: number; tall?: boolean }) {
  const IV = useIV()
  return (
    <div className={"p-[6px] pb-[22px] " + className} style={{ background: IV.paper, backgroundImage: PAPER_GRAIN, transform: `rotate(${rotate}deg)`, boxShadow: "0 1px 1px rgba(0,0,0,0.1), 0 10px 22px -8px rgba(40,25,20,0.3)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className={"w-full object-cover " + (tall ? "aspect-[4/5]" : "aspect-[4/3]")} />
    </div>
  )
}
