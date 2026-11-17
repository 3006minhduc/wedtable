"use client"

// Step-by-step coach marks: dims the page, spotlights one element (found by CSS selector) and
// shows a small card next to it. Skippable; callers decide when to open it (e.g. first visit).
import { useEffect, useLayoutEffect, useState } from "react"
import { createPortal } from "react-dom"

export type TourStep = { target: string; title: string; body: string }

export default function Tour({ steps, open, onClose }: { steps: TourStep[]; open: boolean; onClose: () => void }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = steps[i]

  useEffect(() => {
    if (open) setI(0)
  }, [open])

  // follow the target while scrolling / resizing
  useLayoutEffect(() => {
    if (!open || !step) return
    const el = document.querySelector(step.target) as HTMLElement | null
    if (!el) {
      setRect(null)
      return
    }
    el.scrollIntoView({ block: "nearest", behavior: "smooth" })
    const update = () => setRect(el.getBoundingClientRect())
    update()
    const t = setTimeout(update, 350)
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    return () => {
      clearTimeout(t)
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [open, step])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") setI((x) => Math.min(steps.length - 1, x + 1))
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, steps.length, onClose])

  if (!open || !step) return null
  const pad = 6
  const last = i === steps.length - 1

  // card placement: to the right of the target if there is room, else below, else above
  const W = 300
  let style: React.CSSProperties = { left: "50%", top: "50%", transform: "translate(-50%, -50%)" }
  if (rect) {
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (rect.right + pad + 16 + W < vw && rect.width < vw * 0.5) style = { left: rect.right + pad + 12, top: Math.max(12, Math.min(vh - 220, rect.top)) }
    else if (rect.bottom + 200 < vh) style = { left: Math.max(12, Math.min(vw - W - 12, rect.left + rect.width / 2 - W / 2)), top: rect.bottom + pad + 12 }
    else style = { left: Math.max(12, Math.min(vw - W - 12, rect.left + rect.width / 2 - W / 2)), top: Math.max(12, rect.top - pad - 200) }
  }

  // portal to <body>: the page wrapper has a transform (page-enter animation) that would
  // otherwise make position:fixed relative to it
  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-label={step.title}>
      {/* dimmed page with a hole around the target */}
      {rect ? (
        <div
          className="absolute rounded-xl pointer-events-none transition-all duration-300"
          style={{ left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2, boxShadow: "0 0 0 9999px rgba(20,14,15,0.55)", outline: "2px solid rgb(var(--brand-rgb))" }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/55" />
      )}
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute bg-surface rounded-card shadow-2xl border border-border p-4" style={{ ...style, width: W }}>
        <p className="text-[11px] text-muted tabular-nums">
          Bước {i + 1}/{steps.length}
        </p>
        <h3 className="font-semibold text-[15px] text-text mt-0.5">{step.title}</h3>
        <p className="text-sm text-muted mt-1 leading-relaxed">{step.body}</p>
        <div className="flex items-center gap-2 mt-4">
          <button onClick={onClose} className="text-xs text-muted hover:text-text mr-auto">
            Bỏ qua
          </button>
          {i > 0 && (
            <button onClick={() => setI(i - 1)} className="h-8 px-3 rounded-lg border border-border text-xs text-text hover:bg-surface-hover">
              Trước
            </button>
          )}
          <button onClick={() => (last ? onClose() : setI(i + 1))} className="h-8 px-3 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-hover">
            {last ? "Xong" : "Tiếp"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

/** Has this tour been seen on this device? */
export function tourSeen(key: string) {
  try {
    return localStorage.getItem(key) === "1"
  } catch {
    return true
  }
}
export function markTourSeen(key: string) {
  try {
    localStorage.setItem(key, "1")
  } catch {}
}
