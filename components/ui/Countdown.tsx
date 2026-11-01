"use client"

import { useEffect, useState } from "react"

/** Remaining time until `target`, ticking every second. Null before mount (avoids SSR mismatch). */
export function useCountdown(target: Date | string | number) {
  const end = new Date(target).getTime()
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [end])
  if (now === null) return null
  const diff = Math.max(0, end - now)
  return {
    done: diff === 0,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

const pad = (n: number) => String(n).padStart(2, "0")

/** Four-cell clock: ngày · giờ · phút · giây (DESIGN.md: serif numerals, flat cells, no effects) */
export default function Countdown({
  target,
  tone = "light",
  size = "md",
  className = "",
}: {
  target: Date | string | number
  tone?: "light" | "dark"
  size?: "sm" | "md" | "lg"
  className?: string
}) {
  const c = useCountdown(target)
  const cells = [
    { v: c ? String(c.days) : "–", l: "ngày" },
    { v: c ? pad(c.hours) : "–", l: "giờ" },
    { v: c ? pad(c.minutes) : "–", l: "phút" },
    { v: c ? pad(c.seconds) : "–", l: "giây" },
  ]
  const box =
    tone === "dark" ? "bg-white/10 border-white/15 text-white" : "bg-surface border-border text-text"
  const label = tone === "dark" ? "text-white/70" : "text-muted"
  const num = size === "lg" ? "text-5xl md:text-6xl" : size === "sm" ? "text-2xl" : "text-4xl"
  const w = size === "lg" ? "min-w-[84px] md:min-w-[104px] py-4" : size === "sm" ? "min-w-[56px] py-2" : "min-w-[72px] py-3"

  return (
    <div className={"flex items-stretch gap-2 sm:gap-3 " + className} role="timer" aria-live="off">
      {cells.map((x, i) => (
        <div key={x.l} className="flex items-center gap-2 sm:gap-3">
          <div className={"rounded-lg border text-center px-2 " + box + " " + w}>
            <div className={"font-serif leading-none tabular-nums " + num}>{x.v}</div>
            <div className={"text-xs mt-1.5 " + label}>{x.l}</div>
          </div>
          {i < cells.length - 1 && <span className={"font-serif text-2xl hidden sm:block " + label}>:</span>}
        </div>
      ))}
    </div>
  )
}
