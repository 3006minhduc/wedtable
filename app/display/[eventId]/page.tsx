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

  const load = useCallback(async () => {
    const { data, error } = await createClient().rpc("display_data", { p_event_id: params.eventId })
    if (error || !data) {
      setError("Không tìm thấy sự kiện hoặc sự kiện chưa được publish.")
      return
    }
    setError("")
    setEvent({ ...data.event, floors: data.floors ?? [], guests: data.guests ?? [] })
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
  const showPhotos = photos.length > 0 && (mode === "photos" || (mode === "auto" && autoShow === "photos"))

  const counter = (
    <div className="text-right">
      <div className="text-3xl font-semibold leading-none">
        <span style={{ color: "#E7B9C1" }}>{checkedPeople}</span>
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
      <div className="h-full flex">
        <div className="flex-1 min-w-0 flex flex-col p-6 gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-semibold">Sơ đồ chỗ ngồi</h2>
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
          <HallMap floor={floor} guests={guests} showNames={!!event.show_guest_names_on_map} />
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
function HallMap({ floor, guests, showNames }: { floor: any; guests: any[]; showNames: boolean }) {
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
          {(floor?.tables ?? []).map((t: any) => {
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
                <div
                  className={"flex items-center justify-center " + (rect ? "rounded-[10px]" : "rounded-full")}
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
