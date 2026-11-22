"use client"

// Background music toggle, FAQ accordion and the dietary chips of the RSVP form (shared by every template).
import { useEffect, useRef, useState } from "react"
import { useIV } from "./Ornaments"

/** Round button bottom-right. Tries to start when the invite opens (the guest just tapped); if the
 *  browser blocks autoplay, the first tap anywhere starts it. */
export function MusicToggle({ src, start }: { src: string; start: boolean }) {
  const IV = useIV()
  const audio = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const userPaused = useRef(false)

  useEffect(() => {
    const a = audio.current
    if (!a || !start || userPaused.current) return
    a.volume = 0.6
    a.play().catch(() => {
      // autoplay blocked: start on the next tap
      const once = () => {
        if (!userPaused.current) a.play().catch(() => {})
      }
      window.addEventListener("pointerdown", once, { once: true })
    })
  }, [start, src])

  function toggle() {
    const a = audio.current
    if (!a) return
    if (a.paused) {
      userPaused.current = false
      a.play().catch(() => {})
    } else {
      userPaused.current = true
      a.pause()
    }
  }

  return (
    <>
      <audio ref={audio} src={src} loop preload="auto" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggle()
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={playing ? "Tắt nhạc" : "Bật nhạc"}
        className="fixed z-40 bottom-5 right-5 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
        style={{ background: IV.wine, color: "#fff", opacity: start ? 1 : 0, pointerEvents: start ? "auto" : "none" }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={playing ? "wt-spin" : ""}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="2.5" />
          {!playing && <path d="M4 4 L20 20" />}
        </svg>
        <style>{`.wt-spin{animation:wtSpin 4s linear infinite}@keyframes wtSpin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion: reduce){.wt-spin{animation:none}}`}</style>
      </button>
    </>
  )
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const IV = useIV()
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="flex flex-col gap-2.5 text-left">
      {items.map((it, i) => {
        const isOpen = open === i
        return (
          <div key={i} className="rounded-2xl border overflow-hidden" style={{ background: IV.soft, borderColor: IV.line }}>
            <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left" aria-expanded={isOpen}>
              <span className="text-[15px] font-medium" style={{ color: IV.ink }}>
                {it.q}
              </span>
              <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm transition-transform" style={{ color: IV.wine, border: `1px solid ${IV.line}`, transform: isOpen ? "rotate(45deg)" : "none" }}>
                +
              </span>
            </button>
            <div className="grid transition-[grid-template-rows] duration-300" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
              <p className="overflow-hidden px-4 text-sm leading-relaxed whitespace-pre-line" style={{ color: IV.muted, paddingBottom: isOpen ? 14 : 0 }}>
                {it.a}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const DIETARY_OPTIONS = ["Ăn chay", "Hải sản", "Đậu phộng", "Sữa", "Gluten", "Thịt bò"]

/** Dietary chips (stored as "Ăn chay, Hải sản, khác…") + free text */
export function DietaryPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const IV = useIV()
  const parts = value.split(",").map((s) => s.trim()).filter(Boolean)
  const picked = parts.filter((p) => DIETARY_OPTIONS.includes(p))
  const other = parts.filter((p) => !DIETARY_OPTIONS.includes(p)).join(", ")
  const emit = (nextPicked: string[], nextOther: string) => onChange([...nextPicked, nextOther.trim()].filter(Boolean).join(", "))
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm">Ăn chay hoặc dị ứng thức ăn</span>
      <div className="flex flex-wrap gap-2">
        {DIETARY_OPTIONS.map((o) => {
          const on = picked.includes(o)
          return (
            <button
              key={o}
              type="button"
              onClick={() => emit(on ? picked.filter((p) => p !== o) : [...picked, o], other)}
              aria-pressed={on}
              className="rounded-full border px-3 py-1.5 text-xs transition-colors"
              style={on ? { background: IV.wine, borderColor: IV.wine, color: "#fff" } : { background: "#fff", borderColor: IV.line, color: IV.ink }}
            >
              {o}
            </button>
          )
        })}
      </div>
      <input
        className="rounded-full border bg-white px-4 py-2 text-sm"
        style={{ borderColor: IV.line }}
        placeholder="Khác (ví dụ: không ăn cay)"
        value={other}
        onChange={(e) => emit(picked, e.target.value.replace(/,/g, " "))}
        maxLength={120}
      />
    </div>
  )
}
