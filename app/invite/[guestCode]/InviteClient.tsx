"use client"

import { useEffect, useState } from "react"
import { confirmSeat, declineInvite, markViewed } from "./actions"
import { formatInviteDate } from "@/lib/formatDate"
import { videoEmbed } from "@/lib/videoEmbed"
import { Collage, FilmStrip, Lightbox, PhotoInterlude } from "./Album"
import { LINEN, PAPER_GRAIN } from "./Paper"
import TablePicker from "./TablePicker"
import { caps, display, hand, pinyon, script, serif, sans, smallcaps } from "./fonts"
import { VeilHero, VeilIntro, VeilTitle } from "./Veil"
import { Tracklist, VinylHero, VinylIntro, VinylTitle } from "./Vinyl"
import { ScrapHero, ScrapIntro, ScrapTitle, SCRAP_DOTS_CSS, ScrapDivider, ScrapFrame, Tape } from "./Scrap"
import { HyHero2, HyIntro2 } from "./Hy"
import { FilmHero2, FilmIntro2, FilmReel } from "./Film"
import { SilkHero, SilkIntro, SilkTitle, silk, SilkDivider, SilkFrame } from "./Silk"
import { IvoryClosing, IvoryDivider, IvoryEventDate, IvoryHero, IvoryIntro, IvoryTimeline, IvoryTitle, LineIcon, useBorderPaper } from "./Ivory"
import { DateStrip, EventDate, dotDate, FilmHero, FilmIntro, FilmTitle, HyHero, HyIntro, HyTitle, LetterHero, LetterIntro, LetterTitle, MagHero, MagIntro, MagTitle, WaxSeal } from "./Looks"
import type { HeroProps, IntroProps } from "./Looks"
import { DietaryPicker, FaqList, MusicToggle } from "./Extras"
import { Ceremonies, GiftAccounts, Guestbook, Milestones, SidePicker } from "./Sections"
import type { Ceremony, GiftAccount, Milestone } from "./Sections"
import { ConfettiOnView, DAISY_BRANCH_BG, DaisyDivider, DaisyFrame, DaisyHero, DaisyIntro, DaisySeal, ScrollHint } from "./Daisy"
import { Drift, PaletteProvider, Reveal, REVEAL_CSS, RevealProvider, THEMES, useIV } from "./Ornaments"
import type { RevealStyle } from "./Ornaments"
import { FREE_TEMPLATE, TEMPLATES, templateOf } from "@/lib/inviteThemes"
import NewInvite, { NEW_LOOKS } from "./NewInvite"
import { StainedThumb } from "./Stained"
import { SatinThumb } from "./Satin"
import { VioletThumb } from "./Violet"
import type { InviteStyle, Palette } from "@/lib/inviteThemes"

const DEFAULT_MESSAGE =
  "Tình yêu của chúng tôi sẽ trọn vẹn hơn khi có sự hiện diện và lời chúc phúc từ bạn. Rất mong được đón tiếp bạn trong ngày trọng đại này."

const SERIF: React.CSSProperties = { fontFamily: "var(--iv-serif)" }

function initialOf(name?: string) {
  const last = (name ?? "").trim().split(/\s+/).pop() ?? ""
  return last.charAt(0).toUpperCase()
}

function eventStart(date?: string | null, time?: string | null) {
  if (!date) return null
  const d = new Date(`${date}T${time ? String(time).slice(0, 5) : "00:00"}:00`)
  return isNaN(d.getTime()) ? null : d
}

// ---------- seat map (guest picks a table) ----------
/** Palette remap for text sitting on the dark "deep" background of gilded themes */
function onDeep(IV: Palette): Palette {
  const gold = IV.gold ?? [IV.blush, IV.rose, IV.wine]
  return { ...IV, wine: gold[0], rose: gold[1], muted: IV.line, ink: IV.paper, blush: "rgba(255,255,255,0.06)", paper: IV.deep ?? IV.wine }
}

/** Whole-page dark palette (film template body; red bands of the traditional template) */
function darkPalette(p: Palette, ground?: string): Palette {
  return { ...p, bg: ground ?? p.deep, paper: ground ?? p.deep, ink: "#F4EFE7", muted: "rgba(244,239,231,0.68)", line: "rgba(255,255,255,0.16)", soft: "rgba(255,255,255,0.07)", blush: "rgba(255,255,255,0.08)", okBg: "rgba(255,255,255,0.1)", wine: p.gold[0], rose: p.gold[1], leaf: p.gold[0], sage: p.gold[1] }
}

// ---------- countdown ----------
function Countdown({ start, variant = "circle" }: { start: Date; variant?: "circle" | "square" | "plain" | "cells" }) {
  const IV = useIV()
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (now === null) return <div className="h-[92px]" />
  const diff = start.getTime() - now
  if (diff <= 0) {
    const sameDay = new Date(now).toDateString() === start.toDateString()
    return (
      <p className="text-2xl italic" style={{ ...SERIF, color: IV.wine }}>
        {sameDay ? "Hôm nay là ngày trọng đại!" : "Cảm ơn bạn đã cùng chung vui"}
      </p>
    )
  }
  const items = [
    { v: String(Math.floor(diff / 86400000)), l: "ngày" },
    { v: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, "0"), l: "giờ" },
    { v: String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0"), l: "phút" },
    { v: String(Math.floor((diff % 60000) / 1000)).padStart(2, "0"), l: "giây" },
  ]
  if (variant === "cells")
    return (
      <div className="grid grid-cols-3 max-w-[300px] mx-auto" role="timer">
        {items.slice(0, 3).map((it, i) => (
          <div key={it.l} className={"flex flex-col items-center py-1 " + (i ? "border-l" : "")} style={{ borderColor: IV.line }}>
            <span className="text-[40px] leading-none tabular-nums" style={{ fontFamily: "var(--iv-caps), serif", fontWeight: 500, color: IV.ink }}>
              {it.v.padStart(2, "0")}
            </span>
            <span className="text-[13px] mt-2 tracking-[0.12em]" style={{ fontFamily: "var(--iv-sc), serif", fontWeight: 600, color: IV.muted }}>
              {it.l}
            </span>
          </div>
        ))}
      </div>
    )
  if (variant === "plain")
    return (
      <div className="grid grid-cols-4" role="timer">
        {items.map((it, i) => (
          <div key={it.l} className={"flex flex-col items-center " + (i ? "border-l" : "")} style={{ borderColor: IV.line }}>
            <span className="text-[44px] leading-none tabular-nums" style={{ fontFamily: "var(--iv-display), serif", color: IV.ink }}>
              {it.v}
            </span>
            <span className="text-[13px] mt-2" style={{ color: IV.muted }}>
              {it.l}
            </span>
          </div>
        ))}
      </div>
    )
  if (variant === "square")
    return (
      <div className="flex justify-center gap-2.5" role="timer">
        {items.map((it) => (
          <div key={it.l} className="w-[70px] py-3 flex flex-col items-center" style={{ boxShadow: `inset 0 0 0 1px ${IV.gold[1]}, inset 0 0 0 5px ${IV.gold[1]}33` }}>
            <span className="text-[30px] leading-none tabular-nums" style={{ fontFamily: "var(--iv-display), serif", color: IV.wine }}>
              {it.v}
            </span>
            <span className="text-[13px] mt-1.5" style={{ color: IV.muted }}>
              {it.l}
            </span>
          </div>
        ))}
      </div>
    )
  return (
    <div className="flex justify-center gap-2.5 sm:gap-4" role="timer">
      {items.map((it) => (
        <div key={it.l} className="flex flex-col items-center gap-2">
          <div
            className="w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle at 35% 28%, ${IV.paper} 0%, ${IV.blush} 85%)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -2px 3px rgba(0,0,0,0.08), 0 0 0 1px ${IV.line}, 0 0 0 4px ${IV.paper}, 0 0 0 5px ${IV.gold[1]}, 0 10px 16px -8px rgba(40,25,20,0.4)`,
            }}
          >
            <span className="text-[26px] tabular-nums" style={{ ...SERIF, color: IV.wine }}>
              {it.v}
            </span>
          </div>
          <span className="text-[13px]" style={{ color: IV.muted }}>
            {it.l}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------- save the date: month grid with the day marked ----------
function MonthCalendar({ date }: { date: Date }) {
  const IV = useIV()
  const y = date.getFullYear()
  const m = date.getMonth()
  const first = (new Date(y, m, 1).getDay() + 6) % 7 // Monday first
  const days = new Date(y, m + 1, 0).getDate()
  const cells = [...Array.from({ length: first }, () => 0), ...Array.from({ length: days }, (_, i) => i + 1)]
  return (
    <div className="mx-auto max-w-[300px]">
      <p className="text-[17px] mb-3" style={{ fontFamily: "var(--iv-caps), serif", fontWeight: 600, color: IV.wine }}>
        Tháng {m + 1} năm {y}
      </p>
      <div className="grid grid-cols-7 gap-y-1.5 text-[14px]">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
          <span key={d} className="text-[12px]" style={{ color: IV.muted }}>
            {d}
          </span>
        ))}
        {cells.map((d, i) => (
          <span key={i} className="relative h-8 flex items-center justify-center tabular-nums" style={{ color: d === date.getDate() ? "#fff" : IV.ink }}>
            {d === date.getDate() && (
              <svg viewBox="0 0 30 28" className="absolute w-8 h-8" aria-hidden>
                <path d="M15 26 C5 18 1 12 3 7 C5 2 12 2 15 8 C18 2 25 2 27 7 C29 12 25 18 15 26Z" fill={IV.wine} />
              </svg>
            )}
            <span className="relative">{d || ""}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/** "Lưu ngày cưới": Google Calendar link + phone calendar file (served by /api/ics, real invites only) */
function SaveToCalendar({ start, title, place, code }: { start: Date; title: string; place: string; code?: string }) {
  const IV = useIV()
  const end = new Date(start.getTime() + 4 * 3600 * 1000)
  // wall-clock time in Vietnam (same result on the server and on the guest's phone)
  const p2 = (n: number) => String(n).padStart(2, "0")
  const fmt = (d: Date) => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}T${p2(d.getHours())}${p2(d.getMinutes())}00`
  const g = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${fmt(start)}/${fmt(end)}&ctz=Asia/Ho_Chi_Minh&location=${encodeURIComponent(place)}`
  const btn = "flex-1 inline-flex items-center justify-center h-10 rounded-lg px-3 text-[14px] font-medium border transition-opacity hover:opacity-80"
  return (
    <div className="mt-3 flex gap-2 max-w-[340px] mx-auto">
      <a href={g} target="_blank" rel="noreferrer" className={btn} style={{ borderColor: IV.rose, color: IV.wine }}>
        Google Lịch
      </a>
      {code && (
        <a href={`/api/ics/${code}`} className={btn} style={{ borderColor: IV.rose, color: IV.wine }}>
          Lịch điện thoại
        </a>
      )}
    </div>
  )
}

// ---------- timeline ----------
function Timeline({ items }: { items: any[] }) {
  const IV = useIV()
  return (
    <div className="relative pl-2">
      <div className="absolute left-[29px] top-6 bottom-6 border-l" style={{ borderColor: IV.line }} />
      <div className="flex flex-col gap-6">
        {items.map((it, i) => (
          <Reveal key={i} delay={i * 90}>
            <div className="flex items-start gap-4">
              <span className="relative z-10 w-11 h-11 shrink-0 rounded-full flex items-center justify-center" style={{ background: IV.paper, boxShadow: `inset 0 0 0 1px ${IV.line}, 0 0 0 5px ${IV.bg}` }} aria-hidden>
                <LineIcon name={it.icon} on size={28} />
              </span>
              <div className="pt-0.5 text-left">
                <p className="text-[22px] leading-none mt-1 tabular-nums" style={{ fontFamily: "var(--iv-caps), serif", fontWeight: 600, color: IV.wine }}>
                  {it.time}
                </p>
                <p className="text-[17px] mt-1" style={{ color: IV.ink, fontWeight: 500 }}>
                  {it.title}
                </p>
                {it.note && (
                  <p className="text-sm mt-1" style={{ color: IV.muted }}>
                    {it.note}
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

type InviteProps = { guest: any; event: any; floors: any[]; locked: boolean; preview?: boolean; skipIntro?: boolean }

// ---------- looks ----------
function RuleDivider({ className = "" }: { className?: string }) {
  const IV = useIV()
  return (
    <div className={"flex items-center justify-center gap-3 " + className} aria-hidden>
      <span className="h-px w-14" style={{ background: IV.gold[1], opacity: 0.7 }} />
      <span className="w-1.5 h-1.5 rotate-45" style={{ background: IV.gold[1] }} />
      <span className="h-px w-14" style={{ background: IV.gold[1], opacity: 0.7 }} />
    </div>
  )
}

function CardFrame({ children, className = "", square = false, gilt = false }: { children: React.ReactNode; className?: string; square?: boolean; gilt?: boolean }) {
  const IV = useIV()
  return (
    <div
      className={(square ? "rounded-none" : "rounded-2xl") + " px-6 py-8 text-center " + className}
      style={{ background: IV.paper, boxShadow: gilt ? `inset 0 0 0 1px ${IV.gold[1]}, inset 0 0 0 5px ${IV.paper}, inset 0 0 0 6px ${IV.gold[1]}` : `inset 0 0 0 1px ${IV.line}` }}
    >
      {children}
    </div>
  )
}

type Look = {
  Intro: (p: IntroProps) => JSX.Element
  Hero: (p: HeroProps) => JSX.Element
  Title: (p: { children: React.ReactNode; kicker?: string }) => JSX.Element
  Divider: (p: { className?: string }) => JSX.Element
  Frame: (p: { children: React.ReactNode; className?: string }) => JSX.Element
}

/**
 * Section headings. Each template keeps one idea all the way down the card (the film is a screening,
 * the record has a tracklist, the scrapbook is a diary), the way the best invitations studied do.
 */
type CopyKey = "countdown" | "ceremonies" | "timeline" | "dress" | "story" | "album" | "faq" | "rsvp" | "gift" | "wishes" | "video"
const COPY_DEFAULT: Record<CopyKey, [string | undefined, string]> = {
  countdown: [undefined, "Hôn lễ sẽ diễn ra sau"],
  ceremonies: ["Lịch cưới", "Các nghi lễ"],
  timeline: ["Lịch trình", "Ngày vui của chúng mình"],
  dress: ["Trang phục", "Dress code"],
  story: ["Câu chuyện", "Chuyện của chúng mình"],
  album: ["Khoảnh khắc", "Album của chúng tôi"],
  faq: ["Hỏi đáp", "Bạn có thể thắc mắc"],
  rsvp: ["Hồi âm", "Xác nhận tham dự"],
  gift: ["Gửi yêu thương", "Hộp mừng cưới"],
  wishes: ["Sổ lưu bút", "Gửi lời chúc"],
  video: ["Thước phim", "Video cưới"],
}
const COPY_BY_LOOK: Partial<Record<string, Partial<Record<CopyKey, [string | undefined, string]>>>> = {
  glass: {
    countdown: ["Công chiếu", "Buổi chiếu bắt đầu sau"],
    ceremonies: ["Lịch chiếu", "Các suất chiếu"],
    timeline: ["Kịch bản", "Diễn biến ngày cưới"],
    story: ["Hậu trường", "Chuyện của chúng mình"],
    album: ["Những thước phim", "Cảnh quay đẹp nhất"],
    rsvp: ["Vé mời", "Giữ vé cho bạn"],
    wishes: ["Lời bình", "Cảm nhận của khán giả"],
  },
  vinyl: {
    countdown: ["Mặt A", "Bản nhạc bắt đầu sau"],
    ceremonies: ["Mặt A", "Những bản nghi lễ"],
    timeline: ["Danh sách bài hát", "Ngày vui của chúng mình"],
    story: ["Mặt B", "Bản tình ca của chúng mình"],
    album: ["Bìa đĩa", "Những khoảnh khắc"],
    rsvp: ["Đặt chỗ", "Giữ một chỗ nghe nhạc"],
    wishes: ["Lời đề tặng", "Viết lên bìa đĩa"],
  },
  scrapbook: {
    countdown: [undefined, "Còn bao lâu nữa nhỉ?"],
    ceremonies: [undefined, "Những ngày quan trọng"],
    timeline: [undefined, "Lịch trình hôm ấy"],
    story: [undefined, "Trang nhật ký"],
    album: [undefined, "Ảnh dán sổ"],
    rsvp: [undefined, "Bạn sẽ đến chứ?"],
    gift: [undefined, "Gửi quà mừng"],
    wishes: [undefined, "Viết vào sổ"],
  },
  gilded: {
    countdown: ["Ngày lành tháng tốt", "Hôn lễ cử hành sau"],
    ceremonies: ["Lễ nghi", "Nghi lễ cưới hỏi"],
    timeline: ["Trình tự", "Trình tự hôn lễ"],
    gift: ["Mừng hạnh phúc", "Hộp mừng cưới"],
    wishes: ["Chúc phúc", "Lời chúc trăm năm"],
  },
  emboss: {
    ceremonies: ["Mở hộp", "Những nghi lễ"],
    album: ["Kỷ niệm", "Những điều trong hộp"],
    rsvp: ["Hồi âm", "Nhận lời mời"],
    wishes: ["Thiệp chúc", "Gửi lời yêu thương"],
  },
  veil: {
    countdown: ["Sắp rồi", "Ngày vén voan còn"],
    wishes: ["Lời chúc", "Gửi đến cô dâu chú rể"],
  },
}

const shortTable = (n?: string) => (n ? String(n).replace(/^bàn\s+/i, "") : "")

const REVEAL_BY_LOOK: Record<string, RevealStyle> = { floral: "press", gilded: "gold", glass: "flicker", emboss: "unfurl", veil: "lift", vinyl: "swing", scrapbook: "stick", daisy: "bloom" }

const LOOKS: Partial<Record<InviteStyle, Look>> = {
  floral: { Intro: IvoryIntro, Hero: IvoryHero, Title: IvoryTitle, Divider: IvoryDivider, Frame: (p) => <div className={"text-center " + (p.className ?? "")}>{p.children}</div> },
  gilded: { Intro: HyIntro2, Hero: HyHero2, Title: HyTitle, Divider: RuleDivider, Frame: (p) => <CardFrame {...p} gilt /> },
  glass: { Intro: FilmIntro2, Hero: FilmHero2, Title: FilmTitle, Divider: RuleDivider, Frame: (p) => <CardFrame {...p} square /> },
  emboss: { Intro: SilkIntro, Hero: SilkHero, Title: SilkTitle, Divider: SilkDivider, Frame: SilkFrame },
  veil: { Intro: VeilIntro, Hero: VeilHero, Title: VeilTitle, Divider: RuleDivider, Frame: (p) => <CardFrame {...p} /> },
  vinyl: { Intro: VinylIntro, Hero: VinylHero, Title: VinylTitle, Divider: RuleDivider, Frame: (p) => <CardFrame {...p} square /> },
  scrapbook: { Intro: ScrapIntro, Hero: ScrapHero, Title: ScrapTitle, Divider: ScrapDivider, Frame: ScrapFrame },
  daisy: {
    Intro: (p) => <DaisyIntro onOpened={p.onOpened} onReveal={p.onReveal} />,
    Hero: (p) => <DaisyHero event={p.event} shortDate={p.date} opened={p.opened} />,
    Title: LetterTitle,
    Divider: DaisyDivider,
    Frame: DaisyFrame,
  },
}

/** A template's cover with real event data, for the template gallery on /invitation (static, already opened) */
export function TemplateCover({ id, palette, event, cover, second }: { id: InviteStyle; palette: string; event: any; cover?: string; second?: string }) {
  const fontVars = `${serif.variable} ${sans.variable} ${script.variable} ${caps.variable} ${display.variable} ${pinyon.variable} ${smallcaps.variable} ${hand.variable}`
  if (id === "stained") return <div className={fontVars}><StainedThumb event={event} /></div>
  if (id === "satin") return <div className={fontVars}><SatinThumb event={event} /></div>
  if (id === "violet") return <div className={fontVars}><VioletThumb event={event} /></div>
  const L = (LOOKS[id] ?? LOOKS.floral)!
  const p = (THEMES[palette] ?? THEMES[TEMPLATES[id].palette] ?? THEMES.classic).p
  const start = eventStart(event.event_date, event.event_time)
  const shortDate = start ? `${String(start.getDate()).padStart(2, "0")} · ${String(start.getMonth() + 1).padStart(2, "0")} · ${start.getFullYear()}` : ""
  const initials = `${initialOf(event.bride_name)}&${initialOf(event.groom_name)}`
  return (
    <PaletteProvider value={p}>
      <div
        className={`${serif.variable} ${sans.variable} ${script.variable} ${caps.variable} ${display.variable} ${pinyon.variable} ${smallcaps.variable} ${hand.variable}`}
        style={{ color: p.ink, fontFamily: "var(--iv-serif), serif" }}
      >
        <L.Hero event={event} cover={cover} second={second} start={start} date={shortDate} opened initials={initials} />
      </div>
    </PaletteProvider>
  )
}

export default function InviteClient(props: InviteProps) {
  // Free plan: only the classic color set (DESIGN.md / lib/plan.ts)
  // Free plan: classic colors + floral template only (lib/plan.ts)
  const premium = props.event.plan === "premium"
  const look = premium ? templateOf(props.event.invite_template) : FREE_TEMPLATE
  if ((NEW_LOOKS as readonly string[]).includes(look)) return <NewInvite {...props} look={look} />
  const theme = premium ? THEMES[props.event.invite_theme] ?? THEMES[TEMPLATES[look].palette] ?? THEMES.classic : THEMES.classic
  return (
    <PaletteProvider value={theme.p}>
      <Invite {...props} look={look} />
    </PaletteProvider>
  )
}

function Invite({ guest, event, floors, locked, preview = false, skipIntro = false, look = "floral" }: InviteProps & { look?: InviteStyle }) {
  const base = useIV()
  // film: the whole body is dark; traditional: red bands for the countdown and the invitation block
  // film and record: the whole body stays dark like their covers; traditional: red bands
  const darkBody = look === "glass" || look === "vinyl"
  const IV = darkBody ? darkPalette(base) : base
  const S = look === "gilded" ? darkPalette(base) : IV
  const ivory = look === "floral"
  const silky = look === "emboss"
  const border = useBorderPaper(base.paper)
  const daisy = look === "daisy"
  // Each template: its opening, cover, section title, divider, card frame and closing seal
  const L = (LOOKS[look] ?? LOOKS.floral)!
  const T = (k: CopyKey): [string | undefined, string] => COPY_BY_LOOK[look]?.[k] ?? COPY_DEFAULT[k]
  // a few pieces drifting down while reading, chosen to match each template's material
  const drift: { kind: "daisy" | "petal" | "fleck"; colors: string[]; count?: number } | null =
    look === "daisy" ? { kind: "daisy", colors: [base.gold[1], "#F2C14E"], count: 7 }
    : look === "gilded" ? { kind: "fleck", colors: [base.gold[0], base.gold[1]], count: 14 }
    : look === "emboss" ? { kind: "petal", colors: [base.blush, base.rose], count: 8 }
    : look === "veil" ? { kind: "petal", colors: ["#FFFFFF", base.blush], count: 9 }
    : null
  const O = { Divider: L.Divider, Frame: L.Frame }
  const SectionTitle = L.Title
  const deepRsvp = look === "gilded" || darkBody
  const [opened, setOpened] = useState(skipIntro)
  // cover entrance starts while the opening is still finishing (doors / page turn show the cover underneath)
  const [revealed, setRevealed] = useState(skipIntro)
  const [tableId, setTableId] = useState(guest.table_id ?? "")
  const [companions, setCompanions] = useState<number>(guest.companions ?? 0)
  const [dietary, setDietary] = useState<string>(guest.dietary ?? "")
  const [note, setNote] = useState<string>(guest.rsvp_note ?? "")
  const [side, setSide] = useState<string>(guest.side ?? "")
  const [status, setStatus] = useState<{ error?: string; message?: string; success?: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  // guest said they can't come (no_show without a confirmation); "asking" shows the short decline form
  const [declined, setDeclined] = useState<boolean>(!!guest.no_show && !guest.confirmed)
  const [asking, setAsking] = useState(false)
  const [savedTable, setSavedTable] = useState<string>(guest.confirmed ? guest.table_id ?? "" : "")
  const [savedCompanions, setSavedCompanions] = useState<number>(guest.companions ?? 0)

  useEffect(() => {
    if (!preview) markViewed(guest.code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the page still behind the curtain
  useEffect(() => {
    document.body.style.overflow = opened ? "" : "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [opened])

  const allTables = floors.flatMap((f) => f.tables ?? [])
  const gallery: string[] = Array.isArray(event.gallery) ? event.gallery : []
  const cover = gallery[0]
  const storyPhoto = gallery[1]
  // Every photo after the cover (and the story photo) is shown: big photos between sections, then the album
  const rest = gallery.slice(storyPhoto && event.plan === "premium" && event.love_story ? 2 : 1)
  const interlude1 = rest.length >= 3 ? rest[0] : undefined
  const interlude2 = rest.length >= 8 ? rest[rest.length - 1] : undefined
  // closing "thank you" photo: only when there are enough photos, and it is then left out of the album
  const thanksPhoto = !interlude2 && rest.length >= 5 ? rest[rest.length - 1] : undefined
  const albumAll = rest.filter((u) => u !== interlude1 && u !== interlude2 && u !== thanksPhoto)
  // three photos printed with the date (only when the album still has photos left after them)
  const datePhotos = albumAll.length >= 4 ? albumAll.slice(0, 3) : []
  const albumPhotos = albumAll.slice(datePhotos.length)
  // collage up to 10; a swipe strip for the rest when there are at least 3 more
  const collagePhotos = albumPhotos.length >= 13 ? albumPhotos.slice(0, 10) : albumPhotos
  const stripPhotos = albumPhotos.length >= 13 ? albumPhotos.slice(10) : []
  // the small second print on the cover reuses an album photo
  const heroSecond: string | undefined = look === "scrapbook" ? gallery[2] : undefined
  const [viewer, setViewer] = useState<number | null>(null)
  const openPhoto = (url: string) => setViewer(Math.max(0, gallery.indexOf(url)))
  const premium = event.plan === "premium"
  const timeline: any[] = premium ? (Array.isArray(event.timeline) ? event.timeline : []).filter((t: any) => t?.time || t?.title) : []
  const faq: { q: string; a: string }[] = premium ? (Array.isArray(event.faq) ? event.faq : []).filter((x: any) => x?.q?.trim()) : []
  const musicUrl: string = premium ? (event.music_url ?? "").trim() : ""
  const ceremonies: Ceremony[] = (Array.isArray(event.ceremonies) ? event.ceremonies : []).filter((c: any) => c?.name?.trim())
  const giftAccounts: GiftAccount[] = premium ? (Array.isArray(event.gift_accounts) ? event.gift_accounts : []).filter((a: any) => a?.number || a?.qr) : []
  const milestones: Milestone[] = premium ? (Array.isArray(event.story_milestones) ? event.story_milestones : []).filter((m: any) => m?.title?.trim() || m?.year?.trim()) : []
  const dressColors: string[] = Array.isArray(event.dress_colors) ? event.dress_colors.filter(Boolean) : []
  const start = eventStart(event.event_date, event.event_time)
  // computed after mount so server and client markup agree
  const [dayOver, setDayOver] = useState(false)
  useEffect(() => {
    if (start) setDayOver(Date.now() > new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59).getTime())
  }, [event.event_date])
  const initials = `${initialOf(event.bride_name)}&${initialOf(event.groom_name)}`
  // Map: the address when given, else the venue name
  const mapQuery = [event.venue_name, event.venue_address].filter(Boolean).join(", ")
  const mapUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : ""
  const mapEmbed = event.venue_address ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed` : ""
  const shortDate = start
    ? `${String(start.getDate()).padStart(2, "0")} · ${String(start.getMonth() + 1).padStart(2, "0")} · ${start.getFullYear()}`
    : ""
  const video = videoEmbed(event.video_url)
  const coupleTitle = [event.bride_name, event.groom_name].filter(Boolean).join(" & ")
  const hasFamilies = !!(event.bride_family || event.groom_family)
  const hasFullNames = !!(event.bride_full_name || event.groom_full_name)

  async function handleConfirm() {
    if (preview) {
      setStatus({ error: "PREVIEW", message: "Đây là bản xem trước. Khách thật sẽ xác nhận được ở đây." })
      return
    }
    if (!tableId) {
      setStatus({ error: "NO_TABLE", message: "Vui lòng chọn bàn trên sơ đồ hoặc trong danh sách." })
      return
    }
    setLoading(true)
    const result = await confirmSeat(guest.code, tableId, Number(companions), dietary, note, side)
    setLoading(false)
    setStatus(result)
    if (result?.success) {
      setDeclined(false)
      setSavedTable(tableId)
      setSavedCompanions(Number(companions))
    }
  }

  async function handleDecline() {
    if (preview) {
      setStatus({ error: "PREVIEW", message: "Đây là bản xem trước. Khách thật sẽ gửi được ở đây." })
      return
    }
    setLoading(true)
    const result = await declineInvite(guest.code, note)
    setLoading(false)
    if (result?.success) {
      setDeclined(true)
      setAsking(false)
      setSavedTable("")
      setTableId("")
      setStatus(null)
    } else setStatus(result)
  }

  return (
    <PaletteProvider value={IV}>
    <div
      className={`${serif.variable} ${sans.variable} ${script.variable} ${caps.variable} ${display.variable} ${pinyon.variable} ${smallcaps.variable} ${hand.variable} min-h-screen wt-paper ${daisy ? "wt-daisy" : ""} ${ivory ? "wt-ivory" : ""} ${silky ? "wt-silk" : ""} ${look === "scrapbook" ? "wt-scrap" : ""}`}
      style={{ backgroundColor: IV.bg, backgroundImage: LINEN, color: IV.ink, fontFamily: "var(--iv-serif), serif" }}
    >
      <style>{`.wt-paper main section{position:relative}.wt-paper main section::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:${PAPER_GRAIN};mix-blend-mode:multiply}.wt-paper main section.wt-bare::after{display:none}.wt-paper h1,.wt-paper h2{text-wrap:balance}.wt-ivory main section:not(.wt-full){background:transparent!important}.wt-ivory main section:not(.wt-full):not(.wt-wide){padding-left:40px!important;padding-right:40px!important}.wt-ivory main section.wt-wide{padding-left:12px!important;padding-right:12px!important}.wt-ivory main section:not(.wt-full)::after{display:none}.wt-silk main section:not(.wt-bare){background:transparent!important}.wt-silk main section::after{display:none}.wt-paper p{text-wrap:pretty}.wt-paper{font-variant-numeric:lining-nums}.wt-paper main .text-[15px]{font-size:17px}.wt-paper main .text-sm{font-size:15.5px}${look === "scrapbook" ? SCRAP_DOTS_CSS : ""}${REVEAL_CSS}.wt-paper input,.wt-paper select,.wt-paper textarea,.wt-paper button,.wt-paper .wt-sans{font-family:var(--iv-sans)}`}</style>
      {opened && drift && <Drift {...drift} />}
      {!opened && <L.Intro event={event} cover={cover} initials={initials} date={dotDate(start)} guest={guest.name} onReveal={() => setRevealed(true)} onOpened={() => { setRevealed(true); setOpened(true) }} />}

      <RevealProvider value={REVEAL_BY_LOOK[look] ?? "fade"}>
      <main
        className="relative max-w-md mx-auto sm:my-10 sm:rounded-[4px] overflow-hidden"
        style={{
          backgroundColor: IV.paper,
          backgroundImage: daisy
            ? `${DAISY_BRANCH_BG}, ${PAPER_GRAIN}`
            : ivory && border
            ? `${border}, ${border}, ${PAPER_GRAIN}`
            : silky
            ? `${silk(IV.paper).backgroundImage}, ${PAPER_GRAIN}`
            : PAPER_GRAIN,
          backgroundRepeat: daisy ? "repeat-y, repeat" : ivory && border ? "repeat-y, repeat-y, repeat" : undefined,
          backgroundPosition: daisy ? "left top, 0 0" : ivory && border ? "left top, right top, 0 0" : undefined,
          boxShadow: `0 1px 2px rgba(0,0,0,0.08), 0 40px 70px -40px rgba(40,25,20,0.45), 7px 9px 0 -3px ${IV.soft}, 7px 9px 0 -2px ${IV.line}, 14px 18px 0 -6px ${IV.soft}, 14px 18px 0 -5px ${IV.line}`,
        }}
      >
        {/* ---------- Hero ---------- */}
        <L.Hero event={event} cover={cover} second={heroSecond} start={start} date={shortDate} opened={revealed} initials={initials} />

        {/* ---------- Countdown ---------- */}
        {start && (
          <PaletteProvider value={S}>
            <section className="px-6 py-14 text-center" style={{ background: S.paper }}>
              <Reveal>
                <SectionTitle kicker={T("countdown")[0]}>{dayOver ? "Ngày chung đôi" : T("countdown")[1]}</SectionTitle>
                <Countdown start={start} variant={look === "gilded" ? "square" : look === "glass" || look === "vinyl" ? "plain" : look === "floral" || look === "emboss" || look === "scrapbook" ? "cells" : "circle"} />
                <div className="mt-10">
                  <MonthCalendar date={start} />
                </div>
              </Reveal>
            </section>
          </PaletteProvider>
        )}

        {/* ---------- Invitation ---------- */}
        <PaletteProvider value={S}>
        <section className="px-8 py-14 text-center" style={{ background: S.bg, color: S.ink }}>
          <Reveal>
            <p className="text-[17px] italic mb-2" style={{ color: S.muted, fontFamily: "var(--iv-caps), serif" }}>
              Trân trọng kính mời
            </p>
            <p className="text-[34px] italic leading-tight mb-6" style={{ ...SERIF, color: S.wine }}>
              {guest.name}
            </p>
            <p className="text-[15px] leading-relaxed">{event.invite_message || DEFAULT_MESSAGE}</p>
            <O.Divider className="my-8" />
          </Reveal>

          {hasFamilies && (
            <Reveal>
              <p className="text-[17px] italic mb-4" style={{ color: S.muted, fontFamily: "var(--iv-caps), serif" }}>
                Trân trọng báo tin lễ thành hôn của con chúng tôi
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                {[
                  { k: "Nhà gái", v: event.bride_family, role: "Con gái", name: event.bride_full_name || event.bride_name },
                  { k: "Nhà trai", v: event.groom_family, role: "Con trai", name: event.groom_full_name || event.groom_name },
                ].map((f) => (
                  <div key={f.k}>
                    <p className="text-[17px] mb-1.5" style={{ color: S.wine, fontFamily: "var(--iv-caps), serif", fontWeight: 600 }}>
                      {f.k}
                    </p>
                    <p className="whitespace-pre-line leading-relaxed" style={{ color: S.ink }}>
                      {f.v}
                    </p>
                    {f.name && (
                      <>
                        <p className="mt-3 text-[13px]" style={{ color: S.muted }}>
                          {f.role}
                        </p>
                        <p className="text-[20px] leading-snug" style={{ ...SERIF, color: S.wine, textWrap: "balance" as any }}>
                          {f.name}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {!hasFamilies && hasFullNames && (
            <Reveal>
              <p className="text-[17px] italic mb-2" style={{ color: S.muted, fontFamily: "var(--iv-caps), serif" }}>
                Trân trọng báo tin lễ thành hôn của
              </p>
              <p className="text-[30px] italic leading-snug" style={{ ...SERIF, color: S.wine }}>
                {event.bride_full_name || event.bride_name}
              </p>
              <p className="text-xl italic my-1" style={{ ...SERIF, color: S.rose }}>
                cùng
              </p>
              <p className="text-[30px] italic leading-snug mb-8" style={{ ...SERIF, color: S.wine }}>
                {event.groom_full_name || event.groom_name}
              </p>
            </Reveal>
          )}

          <Reveal>
            <div style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.08)) drop-shadow(0 14px 18px rgba(40,25,20,0.14))" }}>
            <O.Frame>
              {!ivory && (
                <p className="text-[22px] mb-5" style={{ fontFamily: "var(--iv-caps), serif", fontWeight: 600, color: S.wine }}>
                  {ceremonies.length > 0 ? "Tiệc cưới" : "Lễ thành hôn và tiệc cưới"}
                </p>
              )}
              {start ? ivory ? <IvoryEventDate start={start} /> : <EventDate start={start} /> : <p className="text-sm font-medium">{formatInviteDate(event.event_date, event.event_time)}</p>}
              <p className="mt-6 text-[13px]" style={{ color: S.muted }}>
                Tại
              </p>
              <p className="text-[22px] mb-1" style={{ fontFamily: "var(--iv-caps), serif", fontWeight: 600, color: S.ink }}>
                {event.venue_name || "Đang cập nhật địa điểm"}
              </p>
              {event.venue_address && (
                <p className="text-sm mt-2 whitespace-pre-line" style={{ color: S.muted }}>
                  {event.venue_address}
                </p>
              )}
              {mapEmbed && (
                <div className="mt-5 -mx-1 overflow-hidden rounded-xl border" style={{ borderColor: S.line }}>
                  <iframe src={mapEmbed} title="Bản đồ địa điểm" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="block w-full h-56 border-0" />
                </div>
              )}
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center mt-5 h-10 rounded-lg px-5 text-[15px] font-medium border transition-opacity hover:opacity-80"
                  style={{ borderColor: S.rose, color: S.wine }}
                >
                  {mapEmbed ? "Chỉ đường" : "Xem bản đồ"}
                </a>
              )}
              {start && (
                <>
                  <p className="mt-6 text-[13px]" style={{ color: S.muted }}>
                    Lưu ngày cưới vào lịch
                  </p>
                  <SaveToCalendar start={start} title={`Đám cưới ${coupleTitle}`} place={[event.venue_name, event.venue_address].filter(Boolean).join(", ")} code={preview ? undefined : guest.code} />
                </>
              )}
            </O.Frame>
            </div>
          </Reveal>
        </section>
        </PaletteProvider>

        {/* ---------- Ceremonies ---------- */}
        {ceremonies.length > 0 && (
          <section className="px-6 py-14 text-center">
            <Reveal>
              <SectionTitle kicker={T("ceremonies")[0]}>{T("ceremonies")[1]}</SectionTitle>
            </Reveal>
            <Reveal>
              <Ceremonies items={ceremonies} />
            </Reveal>
          </section>
        )}

        {datePhotos.length === 3 && start && (
          <section className="px-6 py-10 wt-bare wt-wide" style={{ background: IV.paper }}>
            <Reveal>
              <DateStrip start={start} photos={datePhotos} onOpen={openPhoto} />
            </Reveal>
          </section>
        )}

        {interlude1 && <PhotoInterlude src={interlude1} caption={dotDate(start)} title={coupleTitle} onOpen={() => openPhoto(interlude1)} />}

        {/* ---------- Timeline ---------- */}
        {timeline.length > 0 && (
          <section className="px-8 py-14">
            <Reveal>
              <SectionTitle kicker={T("timeline")[0]}>{T("timeline")[1]}</SectionTitle>
            </Reveal>
            {ivory ? <IvoryTimeline items={timeline} /> : look === "vinyl" ? <Tracklist items={timeline} /> : <Timeline items={timeline} />}
          </section>
        )}

        {/* ---------- Dress code ---------- */}
        {premium && (event.dress_code || dressColors.length > 0) && (
          <section className="px-8 py-14 text-center" style={{ background: IV.bg }}>
            <Reveal>
              <SectionTitle kicker={T("dress")[0]}>{T("dress")[1]}</SectionTitle>
              {event.dress_code && <p className="text-[15px] leading-relaxed whitespace-pre-line">{event.dress_code}</p>}
              {dressColors.length > 0 && (
                <div className="flex justify-center gap-3 mt-6">
                  {dressColors.map((c, i) => (
                    <span key={i} className="w-10 h-10 rounded-full border-2 border-white" style={{ background: c, boxShadow: `0 0 0 1px ${IV.line}` }} />
                  ))}
                </div>
              )}
            </Reveal>
          </section>
        )}

        {/* ---------- Love story ---------- */}
        {premium && (event.love_story || milestones.length > 0) && (
          <section className="px-8 py-14 text-center">
            <Reveal>
              <SectionTitle kicker={T("story")[0]}>{T("story")[1]}</SectionTitle>
            </Reveal>
            {storyPhoto && (
              <Reveal>
                <div className="mx-auto w-[70%] p-2 mb-6 rounded-t-[999px] rounded-b-2xl border bg-white shadow-sm" style={{ borderColor: IV.line }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={storyPhoto} alt="" className="w-full h-64 object-cover rounded-t-[999px] rounded-b-xl" />
                </div>
              </Reveal>
            )}
            {event.love_story && (
              <Reveal>
                <p className="text-[15px] leading-relaxed whitespace-pre-line text-left sm:text-center">{event.love_story}</p>
              </Reveal>
            )}
            {milestones.length > 0 && (
              <Reveal>
                <div className={event.love_story ? "mt-8" : ""}>
                  <Milestones items={milestones} />
                </div>
              </Reveal>
            )}
          </section>
        )}

        {/* ---------- Album ---------- */}
        {albumPhotos.length > 0 && (
          <section className="px-6 py-14">
            <Reveal>
              <SectionTitle kicker={T("album")[0]}>{T("album")[1]}</SectionTitle>
            </Reveal>
            {look === "glass" ? (
              <FilmReel photos={albumPhotos} onOpen={openPhoto} />
            ) : (
              <>
                <Collage photos={collagePhotos} onOpen={(i) => openPhoto(collagePhotos[i])} />
                {stripPhotos.length > 0 && <FilmStrip photos={stripPhotos} onOpen={(i) => openPhoto(stripPhotos[i])} />}
              </>
            )}
            <p className="text-center text-xs mt-6" style={{ color: IV.muted }}>
              Chạm vào ảnh để xem lớn · {gallery.length} ảnh
            </p>
          </section>
        )}

        {interlude2 && <PhotoInterlude src={interlude2} caption="Hẹn gặp bạn" title="trong ngày vui" onOpen={() => openPhoto(interlude2)} />}

        {/* ---------- FAQ ---------- */}
        {faq.length > 0 && (
          <section className="px-6 py-14">
            <Reveal>
              <SectionTitle kicker={T("faq")[0]}>{T("faq")[1]}</SectionTitle>
            </Reveal>
            <Reveal>
              <FaqList items={faq} />
            </Reveal>
          </section>
        )}

        {/* ---------- RSVP ---------- */}
        <section className="px-6 py-14 wt-wide" style={{ background: deepRsvp ? base.deep : IV.bg }}>
          <PaletteProvider value={deepRsvp ? darkPalette(base) : IV}>
            <Reveal>
              <SectionTitle kicker={T("rsvp")[0]}>{T("rsvp")[1]}</SectionTitle>
            </Reveal>
          </PaletteProvider>
          <PaletteProvider value={base}>
          <Reveal>
            <div className="relative rounded-3xl p-5 sm:p-6 border" style={{ color: base.ink, backgroundColor: base.paper, backgroundImage: PAPER_GRAIN, borderColor: base.line, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 3px rgba(0,0,0,0.08), 0 24px 40px -20px rgba(0,0,0,0.45)` }}>
              {(look === "glass" || look === "vinyl") && start && (
                <div className="-mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-5 px-5 sm:px-6 py-4 relative flex items-end justify-between gap-3 rounded-t-3xl" style={{ borderBottom: `2px dashed ${base.line}`, background: look === "glass" ? base.soft : `radial-gradient(circle at 26px 50%, ${base.deep} 0 9px, ${base.gold[1]} 9.5px 11px, transparent 11.5px), ${base.soft}` }}>
                  <div className={look === "vinyl" ? "pl-10" : ""}>
                    <p className="text-[12px] tracking-[0.28em] uppercase" style={{ color: base.muted, fontFamily: "var(--iv-sc), serif", fontWeight: 700 }}>
                      {look === "glass" ? "Vé mời · 1 suất" : "Mặt A · Hồi âm"}
                    </p>
                    <p className="text-[20px] leading-tight mt-0.5" style={{ color: base.ink }}>
                      {String(start.getHours()).padStart(2, "0")}:{String(start.getMinutes()).padStart(2, "0")} · {dotDate(start)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] tracking-[0.2em] uppercase" style={{ color: base.muted, fontFamily: "var(--iv-sc), serif", fontWeight: 700 }}>
                      {look === "glass" ? "Ghế" : "Bàn"}
                    </p>
                    <p className="text-[22px] leading-tight" style={{ color: base.wine }}>
                      {shortTable(allTables.find((t: any) => t.id === tableId)?.name) || "—"}
                    </p>
                  </div>
                  {look === "glass" && (
                    <>
                      <span aria-hidden className="absolute -left-3 -bottom-3 w-6 h-6 rounded-full" style={{ background: base.deep }} />
                      <span aria-hidden className="absolute -right-3 -bottom-3 w-6 h-6 rounded-full" style={{ background: base.deep }} />
                    </>
                  )}
                </div>
              )}
              {look === "scrapbook" && (
                <>
                  <Tape color={base.blush} w={96} rot={-7} className="-top-3 left-6" />
                  <Tape color={base.sage} w={80} rot={6} className="-top-3 right-6" />
                </>
              )}
              {savedTable && !declined && (
                <div className="text-center mb-5 rounded-2xl py-3 px-4" style={{ background: base.okBg, color: base.leaf }}>
                  <p className="text-[15px] font-medium">
                    Bạn đã xác nhận · {allTables.find((t: any) => t.id === savedTable)?.name ?? "đã chọn bàn"}
                    {savedCompanions > 0 ? ` · đi cùng ${savedCompanions} người` : ""}
                  </p>
                  {!locked && <p className="text-[13px] mt-0.5 opacity-80">Bạn vẫn đổi được bàn hoặc số người bên dưới.</p>}
                </div>
              )}
              {declined && (
                <div className="text-center mb-5 rounded-2xl py-3 px-4" style={{ background: base.soft, color: base.ink }}>
                  <p className="text-[15px] font-medium">Bạn đã báo không thể tham dự.</p>
                  <p className="text-[13px] mt-0.5" style={{ color: base.muted }}>
                    {locked ? "Cảm ơn bạn đã cho cô dâu chú rể biết." : "Nếu thu xếp được, bạn chọn bàn bên dưới để xác nhận lại nhé."}
                  </p>
                </div>
              )}
              {locked ? (
                <p className="text-sm text-center" style={{ color: base.wine }}>
                  {dayOver ? "Tiệc cưới đã diễn ra. Cảm ơn bạn đã dành tình cảm cho cô dâu chú rể!" : "Danh sách khách đã chốt, không thể thay đổi lựa chọn. Cảm ơn bạn!"}
                </p>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Số người đi cùng bạn</span>
                    <div className="flex items-center rounded-full border bg-white" style={{ borderColor: base.line }}>
                      <button type="button" className="w-11 h-11 rounded-full text-xl" style={{ color: base.wine }} onClick={() => setCompanions((c) => Math.max(0, c - 1))} aria-label="Bớt một người">
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{companions}</span>
                      <button type="button" className="w-11 h-11 rounded-full text-xl" style={{ color: base.wine }} onClick={() => setCompanions((c) => Math.min(20, c + 1))} aria-label="Thêm một người">
                        +
                      </button>
                    </div>
                  </div>

                  <TablePicker floors={floors} value={tableId} companions={companions} onChange={setTableId} mine={guest.table_id} />

                  <SidePicker value={side} onChange={setSide} />
                  <DietaryPicker value={dietary} onChange={setDietary} />
                  <textarea
                    className="rounded-2xl border bg-white px-4 py-2.5 text-sm"
                    style={{ borderColor: base.line }}
                    rows={2}
                    maxLength={500}
                    placeholder="Lời nhắn cho cô dâu chú rể (không bắt buộc)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />

                  <button
                    className="rounded-lg h-12 text-[15px] font-medium text-white transition-opacity disabled:opacity-60"
                    style={{ background: base.wine }}
                    disabled={loading}
                    onClick={handleConfirm}
                  >
                    {loading ? "Đang gửi…" : "Xác nhận tham dự"}
                  </button>
                  {status?.error && (
                    <p role="alert" className="text-sm text-center" style={{ color: base.wine }}>
                      {status.message}
                    </p>
                  )}
                  {status?.success && (
                    <p role="status" className="text-lg italic text-center" style={{ ...SERIF, color: base.leaf }}>
                      Cảm ơn bạn! Hẹn gặp bạn tại tiệc cưới.
                    </p>
                  )}
                  {!declined && !asking && (
                    <button type="button" onClick={() => setAsking(true)} className="mx-auto text-[14px] underline underline-offset-4 min-h-11 px-3" style={{ color: base.muted }}>
                      Tôi không thể tham dự
                    </button>
                  )}
                  {asking && (
                    <div className="rounded-2xl border p-4 flex flex-col gap-3 text-center" style={{ borderColor: base.line }}>
                      <p className="text-[15px]">Tiếc quá! Bạn có thể để lại lời nhắn ở ô phía trên, cô dâu chú rể sẽ đọc được.</p>
                      <div className="flex gap-2 justify-center flex-wrap">
                        <button type="button" disabled={loading} onClick={handleDecline} className="rounded-lg h-11 px-4 text-[14px] border font-medium disabled:opacity-60" style={{ borderColor: base.wine, color: base.wine }}>
                          {loading ? "Đang gửi…" : "Gửi lời báo không đến"}
                        </button>
                        <button type="button" onClick={() => setAsking(false)} className="rounded-lg h-11 px-4 text-[14px]" style={{ color: base.muted }}>
                          Để mình xem lại
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Reveal>
          </PaletteProvider>
        </section>

        {/* ---------- Gift ---------- */}
        {premium && (event.gift_qr_url || giftAccounts.length > 0) && (
          <section className="px-6 py-14 text-center">
            <Reveal>
              <SectionTitle kicker={T("gift")[0]}>{T("gift")[1]}</SectionTitle>
              <p className="text-[15px] mb-5" style={{ color: IV.muted }}>
                Dành cho người thân ở xa chưa thể đến chung vui
              </p>
              <ConfettiOnView>
                <PaletteProvider value={base}>
                  <GiftAccounts accounts={giftAccounts} fallbackQr={event.gift_qr_url} />
                </PaletteProvider>
              </ConfettiOnView>
            </Reveal>
          </section>
        )}

        {/* ---------- Guestbook ---------- */}
        <section className="px-6 py-14 text-center">
          <Reveal>
            <SectionTitle kicker={T("wishes")[0]}>{T("wishes")[1]}</SectionTitle>
          </Reveal>
          <Reveal>
            <PaletteProvider value={base}>
              <Guestbook code={guest.code} guestName={guest.name} preview={preview} />
            </PaletteProvider>
          </Reveal>
        </section>

        {/* ---------- Video ---------- */}
        {video && (
          <section className="px-6 py-14 text-center">
            <Reveal>
              <SectionTitle kicker={T("video")[0]}>{T("video")[1]}</SectionTitle>
            </Reveal>
            <Reveal>
              {video.kind === "link" ? (
                <a
                  href={video.src}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center h-11 rounded-lg px-5 text-[15px] font-medium border"
                  style={{ borderColor: IV.rose, color: IV.wine }}
                >
                  Xem video cưới
                </a>
              ) : (
                <div
                  className={"mx-auto p-2 rounded-2xl border " + (video.kind === "iframe" && video.vertical ? "max-w-[300px]" : "w-full")}
                  style={{ background: IV.paper, borderColor: IV.line, boxShadow: "0 12px 30px -14px rgba(0,0,0,0.25)" }}
                >
                  <div className={"relative overflow-hidden rounded-xl bg-black " + (video.kind === "iframe" && video.vertical ? "aspect-[9/16]" : "aspect-video")}>
                    {video.kind === "iframe" ? (
                      <iframe
                        src={video.src}
                        title="Video cưới"
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full border-0"
                      />
                    ) : (
                      <video src={video.src} controls playsInline preload="metadata" poster={cover} className="absolute inset-0 w-full h-full object-contain" />
                    )}
                  </div>
                </div>
              )}
            </Reveal>
          </section>
        )}

        {/* ---------- Thank-you photo ---------- */}
        {thanksPhoto && (
          <section className="wt-bare wt-full relative h-[78svh] max-h-[640px] min-h-[420px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thanksPhoto} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,.6) 100%)" }} />
            <div className="absolute inset-x-0 bottom-0 px-8 pb-12 text-white text-center">
              <Reveal>
                <p className="text-[54px] leading-none" style={{ fontFamily: "var(--iv-pinyon), var(--iv-script), cursive" }}>
                  Cảm ơn
                </p>
                <p className="mt-3 text-[18px] italic opacity-90">vì đã cùng chúng mình đi tới ngày hôm nay</p>
                <p className="mt-5 text-[14px] tracking-[0.2em]" style={{ fontFamily: "var(--iv-sc), serif", fontWeight: 700 }}>
                  {coupleTitle}
                </p>
              </Reveal>
            </div>
          </section>
        )}

        {/* ---------- Footer ---------- */}
        <footer className={"pt-6 pb-14 text-center " + (ivory ? "px-14" : "px-8")}>
          {ivory && (
            <div className="mb-10">
              <IvoryClosing event={event} guest={guest.name} />
            </div>
          )}
          <Reveal>
            <div className="flex justify-center">
              {ivory ? null : daisy ? <DaisySeal size={84} /> : <WaxSeal text={initials} size={84} color={look === "gilded" ? IV.gold[1] : undefined} />}
            </div>
            {!ivory && (
              <p className="text-xl italic mt-4" style={{ ...SERIF, color: IV.wine }}>
                Sự hiện diện của bạn là niềm vinh hạnh của chúng tôi
              </p>
            )}
            <p className="text-xs mt-8" style={{ color: IV.muted }}>
              Thiệp làm bằng WedTable
            </p>
          </Reveal>
        </footer>
        {daisy && <ScrollHint show={opened} />}
        {musicUrl && <MusicToggle src={musicUrl} start={opened} />}
        {viewer !== null && gallery.length > 0 && <Lightbox photos={gallery} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} />}
      </main>
      </RevealProvider>
    </div>
    </PaletteProvider>
  )
}
