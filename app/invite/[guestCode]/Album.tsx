"use client"

// Photo-heavy parts of the invitation: a full-bleed photo between sections, the album collage,
// a swipeable film strip and a full-screen viewer.
import { useEffect, useRef, useState } from "react"
import { Reveal, useIV } from "./Ornaments"
import { Foil, PAPER_GRAIN, PrintPhoto } from "./Paper"

const SERIF: React.CSSProperties = { fontFamily: "var(--iv-serif)" }

/** A large photo across the whole card with a short line of text on it */
export function PhotoInterlude({ src, title, caption, onOpen }: { src: string; title?: string; caption?: string; onOpen?: () => void }) {
  return (
    <section className="relative h-[78svh] max-h-[620px] min-h-[380px] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" onClick={onOpen} className="absolute inset-0 w-full h-full object-cover cursor-zoom-in wt-kenburns" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)" }} />
      {(title || caption) && (
        <div className="absolute inset-x-0 bottom-10 text-center px-8 pointer-events-none">
          <Reveal>
            {caption && <p className="text-[10px] tracking-[0.35em] uppercase text-white/80 mb-2">{caption}</p>}
            {title && (
              <p className="text-[34px] italic leading-tight" style={{ ...SERIF, textShadow: "0 2px 12px rgba(0,0,0,0.35)" }}>
                <Foil>{title}</Foil>
              </p>
            )}
          </Reveal>
        </div>
      )}
      <style>{`.wt-kenburns{animation:wtKen 18s ease-in-out infinite alternate}@keyframes wtKen{from{transform:scale(1.02)}to{transform:scale(1.12) translateY(-2%)}}@media (prefers-reduced-motion: reduce){.wt-kenburns{animation:none}}`}</style>
    </section>
  )
}

/** Swipeable strip of prints (horizontal scroll with snap) */
export function FilmStrip({ photos, onOpen, offset = 0 }: { photos: string[]; onOpen: (i: number) => void; offset?: number }) {
  return (
    <div className="-mx-6 mt-8">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-6 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {photos.map((url, i) => (
          <button key={url + i} onClick={() => onOpen(offset + i)} className="snap-center shrink-0 w-[58%]" aria-label="Xem ảnh">
            <PrintPhoto src={url} rotate={i % 2 ? 1.6 : -1.6} tall />
          </button>
        ))}
      </div>
      <p className="text-center text-[10px] tracking-[0.3em] uppercase opacity-60">Vuốt để xem thêm</p>
    </div>
  )
}

/**
 * Collage: repeats a 5-photo pattern (one wide, two tall, two square) so any number of photos looks composed.
 * Every photo opens the viewer.
 */
export function Collage({ photos, onOpen, offset = 0 }: { photos: string[]; onOpen: (i: number) => void; offset?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-5 px-1">
      {photos.map((url, i) => {
        const k = i % 5
        const wide = k === 0
        return (
          <Reveal key={url + i} delay={(i % 5) * 70} className={wide ? "col-span-2" : k >= 3 ? "mt-[-18px]" : ""}>
            <button onClick={() => onOpen(offset + i)} className="block w-full cursor-zoom-in" aria-label="Xem ảnh">
              <PrintPhoto src={url} rotate={wide ? (i % 2 ? 1 : -1.2) : k % 2 ? 2.4 : -2} tall={k === 1 || k === 2} />
            </button>
          </Reveal>
        )
      })}
    </div>
  )
}

/** Full-screen photo viewer: swipe, arrows, Esc */
export function Lightbox({ photos, index, onClose, onIndex }: { photos: string[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const IV = useIV()
  const touch = useRef<number | null>(null)
  const n = photos.length
  const go = (d: number) => onIndex((index + d + n) % n)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  })
  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center"
      style={{ background: "rgba(12,8,8,0.92)" }}
      onClick={onClose}
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current == null) return
        const dx = e.changedTouches[0].clientX - touch.current
        touch.current = null
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
      }}
    >
      <div className="relative max-w-[min(92vw,720px)] p-2 pb-8" style={{ backgroundColor: IV.paper, backgroundImage: PAPER_GRAIN }} onClick={(e) => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={photos[index]} src={photos[index]} alt="" className="block max-h-[78svh] w-auto max-w-full object-contain wt-fadein" />
        <p className="absolute bottom-2 inset-x-0 text-center text-[11px] tracking-[0.2em]" style={{ color: IV.muted }}>
          {index + 1} / {n}
        </p>
      </div>
      {n > 1 && (
        <>
          <button onClick={(e) => (e.stopPropagation(), go(-1))} className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 text-white text-2xl" aria-label="Ảnh trước">
            ‹
          </button>
          <button onClick={(e) => (e.stopPropagation(), go(1))} className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 text-white text-2xl" aria-label="Ảnh sau">
            ›
          </button>
        </>
      )}
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white text-xl" aria-label="Đóng">
        ×
      </button>
      <style>{`.wt-fadein{animation:wtFade .35s ease}@keyframes wtFade{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}

/** Index of the open photo in the viewer, or null */
export function useLightbox() {
  return useState<number | null>(null)
}
