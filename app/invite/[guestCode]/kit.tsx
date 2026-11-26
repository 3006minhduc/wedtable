"use client"

// Shared engine for the 2026-11-26 invitation set (Kính màu, Lụa dập nổi, Vườn tím).
// Each template draws its own scenes; this file only holds the data, the RSVP logic and the
// functional widgets (seat picker, side, dietary, guestbook, gifts) so every template can dress
// them in its own frame. See docs/mau-thiep/bo-moi-2026-11-26.md.
import { useEffect, useRef, useState } from "react"
import { confirmSeat, declineInvite, markViewed } from "./actions"
import TablePicker from "./TablePicker"
import { DietaryPicker } from "./Extras"
import { SidePicker } from "./Sections"
import type { Ceremony, GiftAccount, Milestone } from "./Sections"
import { PaletteProvider } from "./Ornaments"
import type { Palette } from "@/lib/inviteThemes"

export const DEFAULT_MESSAGE =
  "Tình yêu của chúng tôi sẽ trọn vẹn hơn khi có sự hiện diện và lời chúc phúc từ bạn. Rất mong được đón tiếp bạn trong ngày trọng đại này."

export const p2 = (n: number) => String(n).padStart(2, "0")
const WEEKDAY = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]
export const weekday = (d: Date) => WEEKDAY[d.getDay()]

export function eventStart(date?: string | null, time?: string | null) {
  if (!date) return null
  const d = new Date(`${date}T${time ? String(time).slice(0, 5) : "00:00"}:00`)
  return isNaN(d.getTime()) ? null : d
}

export type InviteInput = { guest: any; event: any; floors: any[]; locked: boolean; preview?: boolean }

/** Everything a template needs: the event, derived lists, and the RSVP state with its actions */
export function useInviteCore({ guest, event, floors, locked, preview = false }: InviteInput) {
  const premium = event.plan === "premium"
  const gallery: string[] = Array.isArray(event.gallery) ? event.gallery.filter(Boolean) : []
  const start = eventStart(event.event_date, event.event_time)
  const list = <T,>(v: any, keep: (x: any) => boolean): T[] => (Array.isArray(v) ? v.filter(keep) : [])
  const data = {
    guest,
    event,
    floors,
    locked,
    preview,
    premium,
    gallery,
    start,
    bride: (event.bride_name || "").trim(),
    groom: (event.groom_name || "").trim(),
    couple: [event.bride_name, event.groom_name].filter(Boolean).join(" & "),
    message: (event.invite_message || "").trim() || DEFAULT_MESSAGE,
    ceremonies: list<Ceremony>(event.ceremonies, (c) => c?.name?.trim()),
    timeline: premium ? list<any>(event.timeline, (t) => t?.time || t?.title) : [],
    faq: premium ? list<{ q: string; a: string }>(event.faq, (x) => x?.q?.trim()) : [],
    gifts: premium ? list<GiftAccount>(event.gift_accounts, (a) => a?.number || a?.qr) : [],
    giftQr: premium ? (event.gift_qr_url as string) || "" : "",
    milestones: premium ? list<Milestone>(event.story_milestones, (m) => m?.title?.trim() || m?.year?.trim()) : [],
    story: premium ? ((event.love_story as string) || "").trim() : "",
    dressCode: premium ? ((event.dress_code as string) || "").trim() : "",
    dressColors: premium ? list<string>(event.dress_colors, Boolean) : [],
    musicUrl: premium ? ((event.music_url as string) || "").trim() : "",
    allTables: floors.flatMap((f) => f.tables ?? []),
    mapQuery: [event.venue_name, event.venue_address].filter(Boolean).join(", "),
  }
  const mapUrl = data.mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.mapQuery)}` : ""

  // wedding day over (computed after mount so server and client markup agree)
  const [dayOver, setDayOver] = useState(false)
  useEffect(() => {
    if (start) setDayOver(Date.now() > new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59).getTime())
    if (!preview) markViewed(guest.code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // RSVP
  const [tableId, setTableId] = useState<string>(guest.table_id ?? "")
  const [companions, setCompanions] = useState<number>(guest.companions ?? 0)
  const [dietary, setDietary] = useState<string>(guest.dietary ?? "")
  const [note, setNote] = useState<string>(guest.rsvp_note ?? "")
  const [side, setSide] = useState<string>(guest.side ?? "")
  const [status, setStatus] = useState<{ error?: string; message?: string; success?: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const [declined, setDeclined] = useState<boolean>(!!guest.no_show && !guest.confirmed)
  const [asking, setAsking] = useState(false)
  const [savedTable, setSavedTable] = useState<string>(guest.confirmed ? guest.table_id ?? "" : "")
  const [savedCompanions, setSavedCompanions] = useState<number>(guest.companions ?? 0)

  async function confirm() {
    if (preview) return setStatus({ error: "PREVIEW", message: "Đây là bản xem trước. Khách thật sẽ xác nhận được ở đây." })
    if (!tableId) return setStatus({ error: "NO_TABLE", message: "Bạn chọn bàn trên sơ đồ hoặc trong danh sách nhé." })
    setLoading(true)
    const r = await confirmSeat(guest.code, tableId, Number(companions), dietary, note, side)
    setLoading(false)
    setStatus(r)
    if (r?.success) {
      setDeclined(false)
      setSavedTable(tableId)
      setSavedCompanions(Number(companions))
    }
  }
  async function decline() {
    if (preview) return setStatus({ error: "PREVIEW", message: "Đây là bản xem trước. Khách thật sẽ gửi được ở đây." })
    setLoading(true)
    const r = await declineInvite(guest.code, note)
    setLoading(false)
    if (r?.success) {
      setDeclined(true)
      setAsking(false)
      setSavedTable("")
      setTableId("")
      setStatus(null)
    } else setStatus(r)
  }

  return {
    ...data,
    mapUrl,
    dayOver,
    rsvp: { tableId, setTableId, companions, setCompanions, dietary, setDietary, note, setNote, side, setSide, status, loading, declined, asking, setAsking, savedTable, savedCompanions, confirm, decline },
  }
}
export type Core = ReturnType<typeof useInviteCore>

/** Live countdown; null until mounted (no hydration mismatch) */
export function useCountdown(start: Date | null) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!start || now === null) return null
  const diff = Math.max(0, start.getTime() - now)
  return { d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000), over: diff === 0 }
}

/** True once the element has scrolled into view (stays true) */
export function useSeen<T extends Element>(threshold = 0.2) {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") return setSeen(true)
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) {
        setSeen(true)
        io.disconnect()
      }
    }, { threshold, rootMargin: "0px 0px -6% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [threshold])
  return [ref, seen] as const
}

/** How far (0..1) the element has travelled through the viewport: 0 when its top reaches the
 *  bottom of the screen, 1 when its bottom reaches the middle. Drives scroll-linked drawings. */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const v = (vh - r.top) / (r.height + vh * 0.5)
      setP(Math.max(0, Math.min(1, v)))
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    tick()
    window.addEventListener("scroll", on, { passive: true })
    window.addEventListener("resize", on)
    return () => {
      window.removeEventListener("scroll", on)
      window.removeEventListener("resize", on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return [ref, p] as const
}

export function reducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
}

export function googleCalendarUrl(start: Date, title: string, place: string) {
  const end = new Date(start.getTime() + 4 * 3600 * 1000)
  const fmt = (d: Date) => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}T${p2(d.getHours())}${p2(d.getMinutes())}00`
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&ctz=Asia/Ho_Chi_Minh&location=${encodeURIComponent(place)}`
}

/** Colours a template gives to its RSVP form */
export type FormTone = { ink: string; muted: string; line: string; field: string; accent: string; onAccent: string; ok: string; okBg: string; palette: Palette }

/** The RSVP form itself (status, people, seat, side, dietary, note, confirm, decline), no frame */
export function RsvpForm({ core, tone, button = "rounded-full" }: { core: Core; tone: FormTone; button?: string }) {
  const r = core.rsvp
  const field = { borderColor: tone.line, background: tone.field, color: tone.ink }
  return (
    <PaletteProvider value={tone.palette}>
      <div style={{ color: tone.ink }}>
        {r.savedTable && !r.declined && (
          <div className="text-center mb-5 rounded-2xl py-3 px-4" style={{ background: tone.okBg, color: tone.ok }}>
            <p className="text-[15px] font-medium">
              Bạn đã xác nhận · {core.allTables.find((t: any) => t.id === r.savedTable)?.name ?? "đã chọn bàn"}
              {r.savedCompanions > 0 ? ` · đi cùng ${r.savedCompanions} người` : ""}
            </p>
            {!core.locked && <p className="text-[13px] mt-0.5 opacity-80">Bạn vẫn đổi được bàn hoặc số người bên dưới.</p>}
          </div>
        )}
        {r.declined && (
          <div className="text-center mb-5 rounded-2xl py-3 px-4" style={{ background: tone.okBg }}>
            <p className="text-[15px] font-medium">Bạn đã báo không thể tham dự.</p>
            <p className="text-[13px] mt-0.5" style={{ color: tone.muted }}>
              {core.locked ? "Cảm ơn bạn đã cho cô dâu chú rể biết." : "Nếu thu xếp được, bạn chọn bàn bên dưới để xác nhận lại nhé."}
            </p>
          </div>
        )}
        {core.locked ? (
          <p className="text-[15px] text-center" style={{ color: tone.muted }}>
            {core.dayOver ? "Tiệc cưới đã diễn ra. Cảm ơn bạn đã dành tình cảm cho cô dâu chú rể!" : "Danh sách khách đã chốt, không thể thay đổi lựa chọn. Cảm ơn bạn!"}
          </p>
        ) : (
          <div className="flex flex-col gap-5 text-left">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[15px]">Số người đi cùng bạn</span>
              <div className="flex items-center rounded-full border" style={field}>
                <button type="button" className="w-11 h-11 text-xl" onClick={() => r.setCompanions((c) => Math.max(0, c - 1))} aria-label="Bớt một người">
                  −
                </button>
                <span className="w-7 text-center text-[15px] font-medium tabular-nums">{r.companions}</span>
                <button type="button" className="w-11 h-11 text-xl" onClick={() => r.setCompanions((c) => Math.min(20, c + 1))} aria-label="Thêm một người">
                  +
                </button>
              </div>
            </div>
            <TablePicker floors={core.floors} value={r.tableId} companions={r.companions} onChange={r.setTableId} mine={core.guest.table_id} />
            <SidePicker value={r.side} onChange={r.setSide} />
            <DietaryPicker value={r.dietary} onChange={r.setDietary} />
            <textarea className="rounded-2xl border px-4 py-3 text-[15px]" style={field} rows={2} maxLength={500} placeholder="Lời nhắn cho cô dâu chú rể (không bắt buộc)" value={r.note} onChange={(e) => r.setNote(e.target.value)} />
            <button className={`${button} h-12 text-[15px] font-medium transition-opacity disabled:opacity-60`} style={{ background: tone.accent, color: tone.onAccent }} disabled={r.loading} onClick={r.confirm}>
              {r.loading ? "Đang gửi…" : "Xác nhận tham dự"}
            </button>
            {r.status?.error && (
              <p role="alert" className="text-[14px] text-center" style={{ color: tone.accent }}>
                {r.status.message}
              </p>
            )}
            {r.status?.success && (
              <p role="status" className="text-[17px] text-center" style={{ color: tone.ok }}>
                Cảm ơn bạn! Hẹn gặp bạn tại tiệc cưới.
              </p>
            )}
            {!r.declined && !r.asking && (
              <button type="button" onClick={() => r.setAsking(true)} className="mx-auto text-[14px] underline underline-offset-4 min-h-11 px-3" style={{ color: tone.muted }}>
                Tôi không thể tham dự
              </button>
            )}
            {r.asking && (
              <div className="rounded-2xl border p-4 flex flex-col gap-3 text-center" style={{ borderColor: tone.line }}>
                <p className="text-[15px]">Tiếc quá! Bạn có thể để lại lời nhắn ở ô phía trên, cô dâu chú rể sẽ đọc được.</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <button type="button" disabled={r.loading} onClick={r.decline} className={`${button} h-11 px-4 text-[14px] border font-medium disabled:opacity-60`} style={{ borderColor: tone.accent, color: tone.accent }}>
                    {r.loading ? "Đang gửi…" : "Gửi lời báo không đến"}
                  </button>
                  <button type="button" onClick={() => r.setAsking(false)} className={`${button} h-11 px-4 text-[14px]`} style={{ color: tone.muted }}>
                    Để mình xem lại
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PaletteProvider>
  )
}

/** Keeps the page still while an opening plays */
export function useLockScroll(locked: boolean) {
  useEffect(() => {
    document.body.style.overflow = locked ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [locked])
}

/** Opening state machine shared by the new templates: idle → run → out → done, auto after 8s,
 *  a second tap skips, reduced motion skips straight to the end. */
export function useOpening(total: number, onOpened: () => void, revealAt = 0, onReveal?: () => void) {
  const [phase, setPhase] = useState<"idle" | "run" | "out">("idle")
  const timers = useRef<number[]>([])
  const tapRef = useRef<() => void>(() => {})
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    if (phase !== "idle") return
    const t = window.setTimeout(() => tapRef.current(), 8000)
    return () => clearTimeout(t)
  }, [phase])
  function finish() {
    timers.current.forEach(clearTimeout)
    setPhase("out")
    onReveal?.()
    timers.current = [window.setTimeout(onOpened, 600)]
  }
  function tap() {
    if (phase === "out") return
    if (phase === "run" || reducedMotion()) return finish()
    setPhase("run")
    timers.current.push(window.setTimeout(() => onReveal?.(), revealAt))
    timers.current.push(window.setTimeout(() => setPhase("out"), total))
    timers.current.push(window.setTimeout(onOpened, total + 650))
  }
  tapRef.current = tap
  return { phase, tap }
}

/**
 * A raised 3D block: the card has real thickness (stacked drop shadows that follow its shape, also
 * for cut corners), stands up from a tilted-back position as it scrolls in, then follows the finger,
 * the mouse or the phone's tilt a few degrees, with a light sheen sliding over its face (`shine`).
 * Reduced motion keeps the thickness and drops the movement.
 */
export function Raised({ children, className = "", max = 7, shine = false, thick = 1, style }: { children: React.ReactNode; className?: string; max?: number; shine?: boolean; thick?: number; style?: React.CSSProperties }) {
  const [wrap, seen] = useSeen<HTMLDivElement>(0.12)
  const tilt = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = tilt.current
    if (!el || reducedMotion()) return
    let raf = 0
    const apply = (x: number, y: number) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.transform = `rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`
        el.style.setProperty("--rx", x.toFixed(3))
        el.style.setProperty("--ry", y.toFixed(3))
      })
    }
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      if (e.clientY < r.top - 120 || e.clientY > r.bottom + 120) return
      apply(Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)), Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1)))
    }
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return
      apply(Math.max(-1, Math.min(1, e.gamma / 22)), Math.max(-1, Math.min(1, (e.beta - 50) / 22)))
    }
    const reset = () => apply(0, 0)
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerup", reset)
    document.addEventListener("pointerleave", reset)
    window.addEventListener("deviceorientation", onTilt)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", reset)
      document.removeEventListener("pointerleave", reset)
      window.removeEventListener("deviceorientation", onTilt)
    }
  }, [max])
  const t = thick
  const depth = `drop-shadow(0 ${1 * t}px 0 rgba(0,0,0,.10)) drop-shadow(0 ${2 * t}px 0 rgba(0,0,0,.08)) drop-shadow(0 ${3 * t}px 0 rgba(0,0,0,.06)) drop-shadow(0 ${16 * t}px ${14 * t}px rgba(30,15,25,.32))`
  return (
    <div ref={wrap} className={className} style={{ perspective: 1000, ...style }}>
      <div style={{ transform: seen ? "none" : "rotateX(24deg) translateY(36px) scale(.96)", transformOrigin: "50% 100%", opacity: seen ? 1 : 0, transition: "transform 1.1s cubic-bezier(.2,.8,.2,1), opacity .8s ease" }}>
        <div ref={tilt} className="relative" style={{ transition: "transform .45s cubic-bezier(.2,.7,.2,1)", filter: depth, transformStyle: "preserve-3d" }}>
          {children}
          {shine && (
            <span
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{ borderRadius: "inherit", mixBlendMode: "soft-light", background: "radial-gradient(60% 50% at calc(50% + var(--rx, 0) * 40%) calc(30% + var(--ry, 0) * 40%), rgba(255,255,255,.75), rgba(255,255,255,0) 70%)" }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
