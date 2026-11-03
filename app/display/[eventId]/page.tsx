"use client"

// Big-screen display for the venue: live seating map drawn to the hall's real scale, a wedding-photo
// panel beside it, a full-screen photo slideshow, and an auto mode that alternates the two.
import { useCallback, useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import FloorLayers from "@/components/seating/FloorLayers"
import { hallOf } from "@/lib/hall"
import { formatInviteDate } from "@/lib/formatDate"

type Mode = "map" | "photos" | "auto"

// Real table footprint in metres (same as the editor: 72px / 132x52px at 32 px/m)
const ROUND_M = 2.25
const RECT_M = { w: 4.1, h: 1.6 }
const SLIDE_MS = 6000
const AUTO_MAP_MS = 40000
const AUTO_PHOTO_MS = 20000

function used(guests: any[], tableId: string, onlyCheckedIn = false) {
  return guests
    .filter((g) => g.table_id === tableId && !g.no_show && (!onlyCheckedIn || g.checked_in))
    .reduce((s, g) => s + 1 + (g.companions ?? 0), 0)
}

/** Size of an element, kept up to date */
function useBox<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, box] as const
}

/** Font size for a table name: full size for short names, smaller for long ones (they also wrap to 2 lines) */
function nameFont(name: string, base: number, rect: boolean) {
  const fits = rect ? 16 : 7 // characters that fit on one line at full size
  const len = name.length
  if (len <= fits) return base
  // up to three lines; the longer the name, the smaller the text
  const scale = len <= fits * 2 ? 0.85 : Math.max(0.5, (fits * 1.7) / len)
  return Math.max(8, base * scale)
}

/** Index that advances every `ms` */
function useTicker(count: number, ms: number) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (count < 2) return
    const t = setInterval(() => setI((x) => (x + 1) % count), ms)
    return () => clearInterval(t)
  }, [count, ms])
  return count ? i % count : 0
}

export default function DisplayPage({ params }: { params: { eventId: string } }) {
  const [event, setEvent] = useState<any>(null)
  const [error, setError] = useState("")
  const [floorIdx, setFloorIdx] = useState(0)
  const [mode, setMode] = useState<Mode>("map")
  const [autoShow, setAutoShow] = useState<"map" | "photos">("map")
  const prevChecked = useRef<Set<string> | null>(null)
  const [arrivals, setArrivals] = useState<Arrival[]>([])
  const [glowing, setGlowing] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    const { data, error } = await createClient().rpc("display_data", { p_event_id: params.eventId })
    if (error || !data) {
      setError("Không tìm thấy sự kiện hoặc sự kiện chưa được publish.")
      return
    }
    setError("")
    const guests: any[] = data.guests ?? []
    const floors: any[] = data.floors ?? []
    // Who checked in since the last poll (nothing is announced on the first load)
    const now = new Set(guests.filter((g) => g.checked_in).map((g) => g.id))
    const before = prevChecked.current
    prevChecked.current = now
    if (before) {
      const fresh = guests.filter((g) => g.checked_in && !before.has(g.id))
      if (fresh.length > 0) {
        const tableName = (id: string) => floors.flatMap((f) => f.tables ?? []).find((t: any) => t.id === id)?.name ?? ""
        const items: Arrival[] = fresh.map((g) => ({ key: g.id + Date.now(), name: g.name || "", table: tableName(g.table_id), people: 1 + (g.companions ?? 0) }))
        setArrivals((a) => [...a, ...items].slice(-4))
        items.forEach((it) => setTimeout(() => setArrivals((a) => a.filter((x) => x.key !== it.key)), 7000))
        const tids = fresh.map((g) => g.table_id).filter(Boolean)
        setGlowing((cur) => new Set([...Array.from(cur), ...tids]))
        setTimeout(() => setGlowing((cur) => new Set(Array.from(cur).filter((t) => !tids.includes(t)))), 9000)
        // show the floor of the latest arrival
        const fi = floors.findIndex((f) => (f.tables ?? []).some((t: any) => t.id === fresh[fresh.length - 1].table_id))
        if (fi >= 0) setFloorIdx(fi)
      }
    }
    setEvent({ ...data.event, floors, guests })
  }, [params.eventId])

  useEffect(() => {
    load()
    const poll = setInterval(load, 5000)
    return () => clearInterval(poll)
  }, [load])

  // auto mode: map for a while, then photos, and back
  useEffect(() => {
    if (mode !== "auto") return
    const t = setTimeout(() => setAutoShow((s) => (s === "map" ? "photos" : "map")), autoShow === "map" ? AUTO_MAP_MS : AUTO_PHOTO_MS)
    return () => clearTimeout(t)
  }, [mode, autoShow])

  const photos: string[] = Array.isArray(event?.gallery) ? event.gallery.filter(Boolean) : []
  const slide = useTicker(photos.length, SLIDE_MS)

  if (error) return <div className="min-h-screen bg-ink flex items-center justify-center text-white/70">{error}</div>
  if (!event) return <div className="min-h-screen bg-ink flex items-center justify-center text-white/70">Đang tải...</div>
  if (event.plan !== "premium") {
    return (
      <div className="min-h-screen bg-ink text-white flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-serif text-3xl">Màn hình trình chiếu là tính năng Premium</p>
        <p className="text-white/70">Chủ tiệc nâng cấp đám cưới lên Premium để mở màn hình này.</p>
      </div>
    )
  }

  const floors: any[] = event.floors ?? []
  const floor = floors[Math.min(floorIdx, floors.length - 1)]
  const guests: any[] = event.guests ?? []
  const checkedPeople = guests.filter((g) => g.checked_in).reduce((s, g) => s + 1 + (g.companions ?? 0), 0)
  const expected = guests.filter((g) => !g.no_show).reduce((s, g) => s + 1 + (g.companions ?? 0), 0)
  const couple = [event.bride_name, event.groom_name].filter(Boolean).join(" & ")
  const when = formatInviteDate(event.event_date, event.event_time)
  const progress = expected ? Math.min(100, Math.round((checkedPeople / expected) * 100)) : 0
  const showPhotos = photos.length > 0 && (mode === "photos" || (mode === "auto" && autoShow === "photos"))

  const counter = (
    <div className="text-right">
      <div className="text-3xl font-semibold leading-none">
        <span style={{ color: "#E7B9C1" }}>
          <CountUp value={checkedPeople} />
        </span>
        <span className="text-white/45 text-lg">/{expected}</span>
      </div>
      <div className="text-[11px] text-white/55 mt-1">khách đã có mặt</div>
    </div>
  )

  const controls = (
    <div className="flex items-center gap-2">
      {photos.length > 0 && (
        <div className="flex rounded-pill border border-white/20 p-0.5 text-xs">
          {(
            [
              ["map", "Sơ đồ"],
              ["photos", "Ảnh cưới"],
              ["auto", "Tự chuyển"],
            ] as [Mode, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              onClick={() => {
                setMode(m)
                setAutoShow("map")
              }}
              className={"rounded-pill px-3 py-1 " + (mode === m ? "bg-white text-ink" : "text-white/70 hover:text-white")}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <button
        className="border border-white/25 rounded-pill px-3 py-1.5 text-xs text-white/80 hover:text-white"
        onClick={() => (document.fullscreenElement ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.())}
      >
        Toàn màn hình
      </button>
    </div>
  )

  return (
    <div className="h-screen overflow-hidden bg-ink text-white relative">
      <Ambient />
      <Arrivals items={arrivals} />
      {/* ---------- full-screen photo slideshow ---------- */}
      <div className={"absolute inset-0 z-20 transition-opacity duration-1000 " + (showPhotos ? "opacity-100" : "opacity-0 pointer-events-none")}>
        <Slides photos={photos} index={slide} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 p-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-white/70 mb-2">Chào mừng quý khách đến dự lễ thành hôn</p>
            <h1 className="font-serif italic text-6xl md:text-7xl leading-none">{couple}</h1>
            <p className="text-white/75 mt-3">
              {when}
              {event.venue_name ? ` · ${event.venue_name}` : ""}
            </p>
          </div>
          {counter}
        </div>
        <div className="absolute top-5 right-6">{controls}</div>
      </div>

      {/* ---------- map + photo panel ---------- */}
      <div className="h-full flex relative">
        <div className="flex-1 min-w-0 flex flex-col p-6 gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold flex items-center gap-2.5">
                <span className="relative flex w-2.5 h-2.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-[#E7B9C1] opacity-70 animate-ping" />
                  <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-[#E7B9C1]" />
                </span>
                Sơ đồ chỗ ngồi
              </h2>
              <Clock />
              {floors.length > 1 &&
                floors.map((f, i) => (
                  <button
                    key={f.id}
                    onClick={() => setFloorIdx(i)}
                    className={"rounded-pill px-3 py-1 text-sm border " + (i === floorIdx ? "bg-brand border-brand text-white" : "border-white/25 text-white/70")}
                  >
                    {f.name}
                  </button>
                ))}
            </div>
            <div className="flex items-center gap-4">
              {photos.length === 0 && counter}
              {controls}
            </div>
          </div>
          {/* how many guests are here */}
          <div className="flex items-center gap-3 text-xs text-white/60">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full wt-bar" style={{ width: `${progress}%` }} />
            </div>
            <span>{progress}% khách đã đến</span>
          </div>
          <HallMap key={floor?.id} floor={floor} guests={guests} showNames={!!event.show_guest_names_on_map} glowing={glowing} />
        </div>

        {photos.length > 0 && (
          <aside className="hidden lg:flex w-[min(34vw,460px)] shrink-0 relative flex-col justify-end overflow-hidden border-l border-white/10">
            <Slides photos={photos} index={slide} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.8) 100%)" }} />
            <div className="relative p-7">
              <h1 className="font-serif italic text-5xl leading-tight">{couple}</h1>
              <p className="text-white/70 text-sm mt-2">
                {when}
                {event.venue_name ? ` · ${event.venue_name}` : ""}
              </p>
              <div className="mt-5 flex items-end justify-between">
                <div className="flex gap-1.5">
                  {photos.length > 1 &&
                    photos.slice(0, 12).map((_, i) => <span key={i} className={"h-1 rounded-full transition-all " + (i === slide % 12 ? "w-6 bg-white" : "w-2 bg-white/35")} />)}
                </div>
                {counter}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

/** Cross-fading photos with a slow zoom */
function Slides({ photos, index }: { photos: string[]; index: number }) {
  return (
    <div className="absolute inset-0 bg-black">
      {photos.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src + i}
          src={src}
          alt=""
          className={"absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] " + (i === index ? "opacity-100 wt-ken" : "opacity-0")}
        />
      ))}
      <style>{`.wt-ken{animation:wtKen 9s ease-out both}@keyframes wtKen{from{transform:scale(1.02)}to{transform:scale(1.1)}}@media (prefers-reduced-motion: reduce){.wt-ken{animation:none}}`}</style>
    </div>
  )
}

/** Seating map that fills the space it gets, at the hall's proportions, tables at real size */
function HallMap({ floor, guests, showNames, glowing }: { floor: any; guests: any[]; showNames: boolean; glowing: Set<string> }) {
  const [wrapRef, box] = useBox<HTMLDivElement>()
  const hall = hallOf(floor)
  const ratio = hall.w / hall.h
  const w = Math.max(0, Math.min(box.w, box.h * ratio))
  const h = w / ratio
  const ppm = w / hall.w // pixels per metre on this screen
  // On a big screen read from afar, grow tables into the free space around them (up to 2.5x real size)
  // without letting neighbours touch.
  const tables: any[] = floor?.tables ?? []
  let nearest = Infinity
  for (let i = 0; i < tables.length; i++)
    for (let j = i + 1; j < tables.length; j++) {
      const dx = ((tables[i].x_pct - tables[j].x_pct) / 100) * w
      const dy = ((tables[i].y_pct - tables[j].y_pct) / 100) * h
      nearest = Math.min(nearest, Math.hypot(dx, dy))
    }
  const grow = Number.isFinite(nearest) && ppm > 0 ? Math.max(1, Math.min(2.5, (nearest * 0.78) / (ROUND_M * ppm))) : 1.6

  return (
    <div ref={wrapRef} className="flex-1 min-h-0 flex items-center justify-center">
      {w > 0 && (
        <div className="relative bg-white/[0.04] border border-white/10 rounded-card overflow-hidden" style={{ width: w, height: h }}>
          <FloorLayers floor={floor} theme="dark" />
          {(floor?.tables ?? []).map((t: any, idx: number) => {
            const rect = t.shape === "rect"
            const tw = (rect ? RECT_M.w : ROUND_M) * ppm * grow
            const th = (rect ? RECT_M.h : ROUND_M) * ppm * grow
            const ring = Math.max(3, Math.min(tw, th) * 0.09)
            const total = used(guests, t.id)
            const here = used(guests, t.id, true)
            const pct = Math.min(100, Math.round((here / Math.max(1, t.seats)) * 100))
            const font = Math.max(8, Math.min(18, Math.min(tw, th * 1.4) * 0.2))
            const names = showNames ? guests.filter((g) => g.table_id === t.id && !g.no_show && g.name).map((g) => g.name) : []
            const fill = here > 0 ? "#C24A5C" : "rgba(255,255,255,0.14)"
            return (
              <div key={t.id} className="absolute flex flex-col items-center" style={{ left: `${t.x_pct}%`, top: `${t.y_pct}%`, transform: "translate(-50%, -50%)" }}>
                <div className="wt-pop" style={{ animationDelay: `${Math.min(idx, 40) * 45}ms` }}>
                <div
                  className={"flex items-center justify-center transition-[background] duration-700 " + (rect ? "rounded-[10px]" : "rounded-full") + (glowing.has(t.id) ? " wt-glow" : "")}
                  style={{
                    width: tw,
                    height: th,
                    padding: ring,
                    background: rect
                      ? `linear-gradient(90deg, ${fill} ${pct}%, rgba(255,255,255,0.14) 0)`
                      : `conic-gradient(${fill} ${pct}%, rgba(255,255,255,0.14) 0)`,
                  }}
                >
                  <div
                    className={"w-full h-full flex flex-col items-center justify-center leading-tight text-center overflow-hidden " + (rect ? "rounded-[7px]" : "rounded-full")}
                    style={{ background: t.vip ? "var(--pr-d)" : "#1d1a1a", fontSize: font }}
                  >
                    {/* long names wrap to two lines and shrink so the whole name fits */}
                    <span
                      className="font-medium max-w-[80%] break-words line-clamp-3"
                      style={{ fontSize: nameFont(String(t.name ?? ""), font, rect), lineHeight: 1.1 }}
                    >
                      {t.name}
                    </span>
                    <span className="text-white/60" style={{ fontSize: font * 0.82 }}>
                      {here}/{total || t.seats}
                    </span>
                  </div>
                </div>
                </div>
                {names.length > 0 && (
                  <div className="text-white/60 mt-1 text-center leading-tight" style={{ fontSize: Math.max(8, font * 0.7), maxWidth: Math.max(tw * 1.4, 70) }}>
                    {names.slice(0, 4).join(", ")}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

type Arrival = { key: string; name: string; table: string; people: number }

/** Number that counts up/down smoothly to its value */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf = 0
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 900)
      const v = Math.round(a + (value - a) * (1 - Math.pow(1 - k, 3)))
      setShown(v)
      if (k < 1) raf = requestAnimationFrame(step)
      else from.current = value
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <span key={value} className="inline-block wt-bump">{shown}</span>
}

/** Current time, hh:mm */
function Clock() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 10000)
    return () => clearInterval(t)
  }, [])
  if (!now) return null
  return <span className="text-sm text-white/50 tabular-nums">{now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
}

/** Slow drifting glows and falling petals behind everything, plus shared keyframes */
function Ambient() {
  const petals = Array.from({ length: 16 }, (_, i) => ({
    left: (i * 61) % 100,
    delay: (i * 1.7) % 14,
    dur: 13 + ((i * 7) % 9),
    size: 8 + ((i * 5) % 9),
    drift: (i % 2 ? 1 : -1) * (30 + ((i * 13) % 50)),
  }))
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute -top-1/3 -left-1/4 w-[70vw] h-[70vw] rounded-full wt-blob" style={{ background: "radial-gradient(circle, rgba(194,74,92,0.22), transparent 65%)" }} />
      <div className="absolute -bottom-1/3 -right-1/4 w-[65vw] h-[65vw] rounded-full wt-blob2" style={{ background: "radial-gradient(circle, rgba(201,164,106,0.16), transparent 65%)" }} />
      {petals.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className="absolute -top-8 wt-petal"
          style={{ left: p.left + "%", width: p.size, height: p.size, animationDelay: `-${p.delay}s`, animationDuration: p.dur + "s", ["--drift" as any]: p.drift + "px" } as React.CSSProperties}
        >
          <path d="M10 1 C15 5 16 12 10 19 C4 12 5 5 10 1 Z" fill={i % 3 ? "rgba(231,185,193,0.55)" : "rgba(233,207,160,0.5)"} />
        </svg>
      ))}
      <style>{`
        .wt-blob{animation:wtBlob 22s ease-in-out infinite alternate}
        .wt-blob2{animation:wtBlob 28s ease-in-out infinite alternate-reverse}
        @keyframes wtBlob{from{transform:translate(0,0) scale(1)}to{transform:translate(8vw,6vh) scale(1.15)}}
        .wt-petal{animation-name:wtFall;animation-timing-function:linear;animation-iteration-count:infinite}
        @keyframes wtFall{0%{transform:translate(0,0) rotate(0deg);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translate(var(--drift),110vh) rotate(540deg);opacity:0}}
        .wt-pop{animation:wtPop .6s cubic-bezier(.2,.9,.3,1.3) both}
        @keyframes wtPop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}
        .wt-glow{animation:wtGlow 1.2s ease-in-out 6}
        @keyframes wtGlow{0%,100%{box-shadow:0 0 0 0 rgba(231,185,193,0)}50%{box-shadow:0 0 0 10px rgba(231,185,193,0.25),0 0 36px 8px rgba(231,185,193,0.55)}}
        .wt-bar{background:linear-gradient(90deg,#8E1F2F,#E7B9C1,#C9A46A,#E7B9C1,#8E1F2F);background-size:300% 100%;animation:wtBar 6s linear infinite;transition:width 1s ease}
        @keyframes wtBar{from{background-position:0 0}to{background-position:300% 0}}
        .wt-bump{animation:wtBump .5s ease}
        @keyframes wtBump{50%{transform:scale(1.25)}}
        .wt-arrive{animation:wtArrive 7s ease both}
        @keyframes wtArrive{0%{opacity:0;transform:translateY(24px) scale(.96)}8%{opacity:1;transform:none}88%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-10px)}}
        @media (prefers-reduced-motion: reduce){.wt-blob,.wt-blob2,.wt-petal,.wt-pop,.wt-glow,.wt-bar,.wt-bump{animation:none}.wt-petal{display:none}}
      `}</style>
    </div>
  )
}

/** Welcome cards for guests who just checked in */
function Arrivals({ items }: { items: Arrival[] }) {
  if (items.length === 0) return null
  return (
    <div className="absolute left-6 bottom-6 z-30 flex flex-col gap-3 pointer-events-none w-[min(420px,80vw)]">
      {items.map((a) => (
        <div key={a.key} className="wt-arrive rounded-2xl px-5 py-4 border border-white/15 backdrop-blur-md shadow-2xl" style={{ background: "linear-gradient(120deg, rgba(142,31,47,0.85), rgba(40,20,24,0.85))" }}>
          <p className="text-[10px] tracking-[0.35em] uppercase text-white/70">Vừa đến</p>
          <p className="font-serif italic text-2xl leading-tight mt-0.5">Chào mừng {a.name || "quý khách"}</p>
          <p className="text-sm text-white/75 mt-1">
            {a.table ? `Mời ngồi ${a.table}` : "Mời vào tiệc"}
            {a.people > 1 ? ` · ${a.people} người` : ""}
          </p>
        </div>
      ))}
    </div>
  )
}
