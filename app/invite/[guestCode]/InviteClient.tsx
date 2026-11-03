"use client"

import { useEffect, useState } from "react"
import { confirmSeat, markViewed } from "./actions"
import { formatInviteDate } from "@/lib/formatDate"
import { videoEmbed } from "@/lib/videoEmbed"
import { Collage, FilmStrip, Lightbox, PhotoInterlude } from "./Album"
import { Foil, LETTERPRESS, LINEN, PAPER_GRAIN, PrintPhoto, Tilt } from "./Paper"
import FloorLayers from "@/components/seating/FloorLayers"
import { serif, sans } from "./fonts"
import { CurtainIntro, Divider, Frame, Garland, PaletteProvider, Reveal, Seal, THEMES, useIV } from "./Ornaments"
import { Cartouche, EnvelopeIntro, GiltCrest, GiltDivider, GiltFrame, GiltSeal, PhotoStrip } from "./Gilded"
import { DoorsIntro, GlassArch, GlassDivider, GlassFrame, GlassSeal, LeadArch, OvalWindow, RoseCorner } from "./Glass"
import { ERoseCorner, EmbossDivider, EmbossFrame, EmbossSeal, EmbossVine, Ribbon, useRaised } from "./Emboss"
import { glassTexture, templateOf } from "@/lib/inviteThemes"
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
function TableMap({ floors, value, companions, onChange }: { floors: any[]; value: string; companions: number; onChange: (id: string) => void }) {
  const IV = useIV()
  const initial = Math.max(0, floors.findIndex((f) => (f.tables ?? []).some((t: any) => t.id === value)))
  const [floorIdx, setFloorIdx] = useState(initial)
  const floor = floors[Math.min(floorIdx, floors.length - 1)]
  if (!floor) return null

  return (
    <div>
      {floors.length > 1 && (
        <div className="flex gap-2 mb-3 justify-center flex-wrap">
          {floors.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFloorIdx(i)}
              className="rounded-full px-4 py-1 text-xs border transition-colors"
              style={i === floorIdx ? { background: IV.wine, borderColor: IV.wine, color: "#fff" } : { borderColor: IV.line, color: IV.muted }}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}
      <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border" style={{ background: IV.paper, borderColor: IV.line }}>
        <FloorLayers floor={floor} theme="light" />
        {(floor.tables ?? []).map((t: any) => {
          const left = t.seats - (t.used ?? 0)
          const full = left < 1 + companions
          const selected = t.id === value
          const style: React.CSSProperties = selected
            ? { background: IV.wine, borderColor: IV.wine, color: "#fff" }
            : full
            ? { background: "#fff", borderColor: IV.line, color: IV.muted, opacity: 0.45 }
            : t.vip
            ? { background: "#F6E6D8", borderColor: "#C9A46A", color: "#7A5A24" }
            : { background: "#fff", borderColor: IV.sage, color: IV.ink }
          return (
            <button
              key={t.id}
              type="button"
              disabled={full && !selected}
              onClick={() => onChange(t.id)}
              style={{ left: `${t.x_pct}%`, top: `${t.y_pct}%`, transform: "translate(-50%, -50%)", ...style }}
              className={
                "absolute border-[1.5px] flex flex-col items-center justify-center text-[10px] leading-tight transition-transform active:scale-95 shadow-sm " +
                (t.shape === "rect" ? "w-24 h-11 rounded-xl " : "w-14 h-14 rounded-full ") +
                (selected ? "scale-110 font-medium" : "")
              }
            >
              <span className="max-w-[52px] truncate">{t.name}</span>
              <span className="opacity-80">{full && !selected ? "đầy" : `còn ${Math.max(0, left)}`}</span>
            </button>
          )
        })}
      </div>
      <p className="text-xs mt-2" style={{ color: IV.muted }}>
        Chạm vào bàn để chọn chỗ ngồi. Bàn mờ đã đủ chỗ cho nhóm của bạn.
      </p>
    </div>
  )
}

/** Palette remap for text sitting on the dark "deep" background of gilded themes */
function onDeep(IV: Palette): Palette {
  const gold = IV.gold ?? [IV.blush, IV.rose, IV.wine]
  return { ...IV, wine: gold[0], rose: gold[1], muted: IV.line, ink: IV.paper, blush: "rgba(255,255,255,0.06)", paper: IV.deep ?? IV.wine }
}

// ---------- countdown ----------
function Countdown({ start }: { start: Date }) {
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
          <span className="text-xs" style={{ color: IV.muted }}>
            {it.l}
          </span>
        </div>
      ))}
    </div>
  )
}

function SectionTitle({ children, kicker }: { children: React.ReactNode; kicker?: string }) {
  const IV = useIV()
  // onDeep() makes paper the deep stock color
  const onDark = IV.paper === IV.deep
  return (
    <div className="text-center mb-6">
      {kicker && (
        <p className="text-[11px] tracking-[0.3em] uppercase mb-2" style={{ color: IV.rose }}>
          {kicker}
        </p>
      )}
      <h2 className="text-[32px] leading-tight italic" style={{ ...SERIF, color: IV.wine, ...(onDark ? {} : LETTERPRESS) }}>
        {onDark ? <Foil>{children}</Foil> : children}
      </h2>
    </div>
  )
}

// ---------- timeline ----------
function Timeline({ items }: { items: any[] }) {
  const IV = useIV()
  return (
    <div className="relative pl-2">
      <div className="absolute left-[27px] top-2 bottom-2 border-l-2 border-dotted" style={{ borderColor: IV.rose }} />
      <div className="flex flex-col gap-7">
        {items.map((it, i) => (
          <Reveal key={i} delay={i * 90}>
            <div className="flex items-start gap-4">
              <div
                className="relative z-10 w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-lg"
                style={{ background: IV.blush, boxShadow: `0 0 0 4px ${IV.paper}` }}
                aria-hidden
              >
                {it.icon || "✦"}
              </div>
              <div className="pt-0.5 text-left">
                <p className="text-xl" style={{ ...SERIF, color: IV.wine }}>
                  {it.time}
                </p>
                <p className="text-[12px] tracking-[0.18em] uppercase" style={{ color: IV.ink }}>
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

// ---------- winding timeline (non-floral templates): stops alternate around a curving dashed path ----------
function WindingTimeline({ items }: { items: any[] }) {
  const IV = useIV()
  const lead = IV.gold[1]
  const ROW = 104
  const W = 72
  const pts = items.map((_, i) => ({ x: i % 2 === 0 ? 20 : W - 20, y: ROW / 2 + i * ROW }))
  let d = `M${W / 2} 0 C ${W / 2} ${ROW / 4}, ${pts[0].x} ${ROW / 4}, ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    d += ` C ${a.x} ${a.y + ROW / 2}, ${b.x} ${b.y - ROW / 2}, ${b.x} ${b.y}`
  }
  const last = pts[pts.length - 1]
  d += ` C ${last.x} ${last.y + ROW / 4}, ${W / 2} ${last.y + ROW / 4}, ${W / 2} ${last.y + ROW / 2}`
  return (
    <div className="relative grid grid-cols-[1fr_72px_1fr]" style={{ gridTemplateRows: `repeat(${items.length}, ${ROW}px)` }}>
      <svg className="col-start-2 w-[72px] overflow-visible" style={{ gridRow: `1 / span ${items.length}`, height: items.length * ROW }} viewBox={`0 0 ${W} ${items.length * ROW}`} aria-hidden>
        <path d={d} fill="none" stroke={lead} strokeWidth="1.6" strokeDasharray="5 5" />
        {pts.map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="17" fill={IV.blush} stroke={lead} strokeWidth="1.2" />
            <text x={pt.x} y={pt.y + 6} textAnchor="middle" fontSize="17">
              {items[i].icon || "✦"}
            </text>
          </g>
        ))}
      </svg>
      {items.map((it, i) => (
        <div key={i} style={{ gridRow: i + 1 }} className={(i % 2 === 0 ? "col-start-3 text-left pl-1" : "col-start-1 text-right pr-1") + " flex flex-col justify-center"}>
          <Reveal delay={i * 90}>
            <p className="text-xl" style={{ ...SERIF, color: IV.wine }}>
              {it.time}
            </p>
            <p className="text-[12px] tracking-[0.16em] uppercase leading-snug" style={{ color: IV.ink }}>
              {it.title}
            </p>
            {it.note && (
              <p className="text-xs mt-0.5" style={{ color: IV.muted }}>
                {it.note}
              </p>
            )}
          </Reveal>
        </div>
      ))}
    </div>
  )
}

// ---------- emboss hero: raised-paper arch with roses, satin ribbon that unties, dark countdown band ----------
function EmbossHero({ event, shortDate, start, cover, second, opened }: { event: any; shortDate: string; start: Date | null; cover?: string; second?: string; opened: boolean }) {
  const IV = useIV()
  const d = (n: number) => ({ "data-depth": "", style: { ["--d" as any]: n } as React.CSSProperties })
  const dark = onDeep(IV)
  const raised = useRaised(1.2)
  const v = { vectorEffect: "non-scaling-stroke" as const }
  return (
    <section className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-10 pt-24 pb-10 overflow-hidden" style={{ background: `radial-gradient(ellipse at 50% 20%, ${IV.soft} 0%, ${IV.paper} 70%)` }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none" style={raised} aria-hidden>
        <path d="M6 97 V30 Q6 9 50 4 Q94 9 94 30 V97 Z" fill="none" stroke={IV.paper} strokeWidth="5" style={v} />
        <path d="M9 94 V31 Q9 12 50 7.5 Q91 12 91 31 V94 Z" fill="none" stroke={IV.paper} strokeWidth="2" style={v} />
      </svg>
      <ERoseCorner className="absolute -top-2 -left-2 w-[42%] max-w-[190px]" />
      <ERoseCorner className="absolute -top-2 -right-2 w-[42%] max-w-[190px]" style={{ transform: "scaleX(-1)" }} />
      <ERoseCorner className="absolute bottom-0 -left-2 w-[30%] max-w-[140px]" style={{ transform: "scaleY(-1)" }} />
      <ERoseCorner className="absolute bottom-0 -right-2 w-[30%] max-w-[140px]" style={{ transform: "scale(-1)" }} />
      <Ribbon start={opened} />
      <Reveal className="relative w-full">
        <Tilt max={8} className="mx-auto w-[min(74vw,300px)]">
          <div className="relative" style={{ transformStyle: "preserve-3d" }}>
            {cover && (
              <div className="absolute -right-[18%] top-[22%] w-[52%]" {...d(8)}>
                <PrintPhoto src={cover} rotate={7} tall />
              </div>
            )}
            {second && (
              <div className="absolute -left-[17%] top-[52%] w-[44%]" {...d(14)}>
                <PrintPhoto src={second} rotate={-6} />
              </div>
            )}
            {/* pressed paper card: debossed panel with a raised border */}
            <div className="relative rounded-[18px] px-7 pt-12 pb-12 flex flex-col items-center" {...d(30)}>
              <div
                className="absolute inset-0 rounded-[18px]"
                style={{
                  backgroundColor: IV.paper,
                  backgroundImage: PAPER_GRAIN,
                  boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.7), 0 2px 3px rgba(0,0,0,0.12), 0 30px 50px -22px rgba(40,30,40,0.5)`,
                }}
              />
              <div className="absolute inset-[10px] rounded-[12px] pointer-events-none" style={{ boxShadow: `1.5px 2px 2px ${IV.muted}66, -1px -1px 1px rgba(255,255,255,0.9), inset 1.5px 2px 2px ${IV.muted}55, inset -1px -1px 1px rgba(255,255,255,0.9)` }} />
              <div className="relative flex flex-col items-center w-full">
                <p className="text-[10px] tracking-[0.28em] uppercase mb-4" style={{ color: IV.rose }}>
                  Báo tin lễ thành hôn
                </p>
                <h1 className="italic leading-[1.02] break-words max-w-full" style={{ ...SERIF, color: IV.wine, ...LETTERPRESS }}>
                  <span className="block text-[42px]">{event.bride_name}</span>
                  <span className="block text-3xl my-0.5" style={{ color: IV.rose }}>
                    &amp;
                  </span>
                  <span className="block text-[42px]">{event.groom_name}</span>
                </h1>
                <EmbossDivider className="my-5 !w-28" />
                <p className="text-lg tracking-[0.15em]" style={{ ...SERIF, color: IV.ink, ...LETTERPRESS }}>
                  {shortDate}
                </p>
                {event.venue_name && (
                  <p className="text-xs mt-1" style={{ color: IV.muted }}>
                    {event.venue_name}
                  </p>
                )}
              </div>
            </div>
            <div className="absolute -top-7 -left-8 w-24" {...d(50)}>
              <ERoseCorner className="w-full" />
            </div>
            <div className="absolute -bottom-7 -right-8 w-24" {...d(50)}>
              <ERoseCorner className="w-full" style={{ transform: "scale(-1)" }} />
            </div>
          </div>
        </Tilt>
      </Reveal>
      {start && (
        <PaletteProvider value={dark}>
          <Reveal delay={450} className="relative w-full mt-10">
            <div className="rounded-2xl px-3 py-5" style={{ background: IV.deep }}>
              <p className="text-[11px] tracking-[0.25em] uppercase mb-3" style={{ color: dark.muted }}>
                Đếm ngược
              </p>
              <Countdown start={start} />
            </div>
          </Reveal>
        </PaletteProvider>
      )}
    </section>
  )
}

// ---------- floral hero as a layered stationery suite: deep stock, arched ivory card, photo print, wax seal ----------
function SuiteHero({ event, shortDate, start, cover, second, initials }: { event: any; shortDate: string; start: Date | null; cover?: string; second?: string; initials: string }) {
  const IV = useIV()
  const dark = onDeep(IV)
  const g = IV.gold
  const d = (n: number) => ({ "data-depth": "", style: { ["--d" as any]: n } as React.CSSProperties })
  return (
    <section
      className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-6 pt-14 pb-24 overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 50% 28%, ${IV.wine} 0%, ${IV.deep} 78%)` }}
    >
      <Reveal>
        <p className="text-[11px] tracking-[0.35em] uppercase mb-8">
          <Foil>Trân trọng kính mời</Foil>
        </p>
      </Reveal>
      <Reveal delay={120} className="w-full">
        <Tilt max={8} className="mx-auto w-[min(76vw,310px)]">
          <div className="relative" style={{ transformStyle: "preserve-3d" }}>
            {/* photo print tucked behind the card */}
            {cover && (
              <div className="absolute -left-[16%] top-[30%] w-[52%]" {...d(8)}>
                <PrintPhoto src={cover} rotate={-8} tall />
              </div>
            )}
            {second && (
              <div className="absolute -right-[15%] top-[12%] w-[44%]" {...d(14)}>
                <PrintPhoto src={second} rotate={7} />
              </div>
            )}
            {/* the arched ivory card */}
            <div
              className="relative rounded-t-[999px] rounded-b-[6px] px-7 pt-16 pb-12 flex flex-col items-center"
              {...d(30)}
            >
              <div
                className="absolute inset-0 rounded-t-[999px] rounded-b-[6px]"
                style={{
                  backgroundColor: IV.paper,
                  backgroundImage: PAPER_GRAIN,
                  boxShadow: `inset 0 0 0 7px ${IV.paper}, inset 0 0 0 8px ${g[1]}, inset 0 0 0 11px ${IV.paper}, inset 0 0 0 11.5px ${g[1]}, 0 2px 3px rgba(0,0,0,0.2), 0 30px 50px -18px rgba(0,0,0,0.6)`,
                }}
              />
              <div className="relative flex flex-col items-center w-full">
                <O_Garland />
                <p className="text-[10px] tracking-[0.28em] uppercase mt-1 mb-4" style={{ color: IV.rose }}>
                  Lễ thành hôn
                </p>
                <h1 className="italic leading-[1.02] break-words max-w-full" style={{ ...SERIF, color: IV.wine, ...LETTERPRESS }}>
                  <span className="block text-[44px]">{event.bride_name}</span>
                  <span className="block text-3xl my-0.5" style={{ color: g[2] }}>
                    &amp;
                  </span>
                  <span className="block text-[44px]">{event.groom_name}</span>
                </h1>
                <Divider className="my-5 !w-28" />
                <p className="text-lg tracking-[0.18em]" style={{ ...SERIF, color: IV.ink, ...LETTERPRESS }}>
                  {shortDate}
                </p>
                {event.venue_name && (
                  <p className="text-xs mt-1" style={{ color: IV.muted }}>
                    {event.venue_name}
                  </p>
                )}
              </div>
            </div>
            {/* wax seal pressed on the bottom edge */}
            <div className="absolute inset-x-0 -bottom-9 flex justify-center" style={{ transformStyle: "preserve-3d" }}>
              <div {...d(55)}>
                <div style={{ filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.35))" }}>
                  <GiltSeal text={initials} size={78} />
                </div>
              </div>
            </div>
          </div>
        </Tilt>
      </Reveal>
      {start && (
        <PaletteProvider value={dark}>
          <Reveal delay={350} className="mt-16">
            <p className="text-xs mb-3" style={{ color: dark.muted }}>
              Còn lại đến ngày chung đôi
            </p>
            <Countdown start={start} />
          </Reveal>
        </PaletteProvider>
      )}
      <div className="absolute bottom-6 flex flex-col items-center gap-1 text-[10px] tracking-[0.3em] uppercase animate-bounce" style={{ color: g[1] }}>
        <span>Cuộn xuống</span>
        <span aria-hidden>⌄</span>
      </div>
    </section>
  )
}

/** Small garland sized for the card top */
function O_Garland() {
  return (
    <div className="absolute -top-14 inset-x-0 opacity-90 pointer-events-none">
      <Garland />
    </div>
  )
}

type InviteProps = { guest: any; event: any; floors: any[]; locked: boolean; preview?: boolean; skipIntro?: boolean }

// ---------- glass hero: frosted pink window with leaded roses, then an olive section with the oval photo ----------
function GlassHero({ event, shortDate, start, cover }: { event: any; shortDate: string; start: Date | null; cover?: string }) {
  const IV = useIV()
  const d = (n: number) => ({ "data-depth": "", style: { ["--d" as any]: n } as React.CSSProperties })
  const dark = onDeep(IV)
  return (
    <>
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center text-center px-10 pt-24 pb-24 overflow-hidden" style={{ background: glassTexture(IV) }}>
        <LeadArch />
        <RoseCorner className="absolute -top-3 -left-3 w-[46%] max-w-[210px]" />
        <RoseCorner className="absolute -top-3 -right-3 w-[46%] max-w-[210px]" style={{ transform: "scaleX(-1)" }} />
        <RoseCorner className="absolute -bottom-3 -left-3 w-[34%] max-w-[160px]" style={{ transform: "scaleY(-1)" }} />
        <RoseCorner className="absolute -bottom-3 -right-3 w-[34%] max-w-[160px]" style={{ transform: "scale(-1)" }} />
        <Reveal className="relative w-full">
          <Tilt max={8} className="mx-auto w-[min(74vw,300px)]">
            <div className="relative" style={{ transformStyle: "preserve-3d" }}>
              {/* leaded ivory card in the window */}
              <div className="relative rounded-t-[999px] rounded-b-[6px] px-7 pt-16 pb-12 flex flex-col items-center" {...d(30)}>
                <div
                  className="absolute inset-0 rounded-t-[999px] rounded-b-[6px]"
                  style={{
                    backgroundColor: IV.paper,
                    backgroundImage: PAPER_GRAIN,
                    boxShadow: `inset 0 0 0 2px ${IV.gold[2]}, inset 0 0 0 7px ${IV.blush}, inset 0 0 0 9px ${IV.gold[2]}, inset 0 0 0 10px ${IV.gold[1]}, 0 2px 3px rgba(0,0,0,0.15), 0 30px 50px -20px rgba(60,30,30,0.5)`,
                  }}
                />
                <div className="relative flex flex-col items-center w-full">
                  <p className="text-[10px] tracking-[0.28em] uppercase mb-1" style={{ color: IV.rose }}>
                    Cùng gia đình hai bên
                  </p>
                  <p className="text-xs tracking-[0.3em] mb-5" style={{ ...SERIF, color: IV.muted }}>
                    {shortDate}
                  </p>
                  <h1 className="italic leading-[1.02] break-words max-w-full" style={{ ...SERIF, color: IV.wine, ...LETTERPRESS }}>
                    <span className="block text-[42px]">{event.bride_name}</span>
                    <span className="block text-3xl my-0.5" style={{ color: IV.rose }}>
                      &amp;
                    </span>
                    <span className="block text-[42px]">{event.groom_name}</span>
                  </h1>
                  <GlassDivider className="my-5 !w-28" />
                  {event.venue_name && (
                    <p className="text-xs" style={{ color: IV.muted }}>
                      {event.venue_name}
                    </p>
                  )}
                </div>
              </div>
              {/* roses popping out of the card */}
              <div className="absolute -top-8 -left-9 w-28" {...d(60)}>
                <RoseCorner className="w-full" style={{ filter: "drop-shadow(0 8px 8px rgba(60,30,30,0.3))" }} />
              </div>
              <div className="absolute -bottom-8 -right-9 w-28" {...d(60)}>
                <RoseCorner className="w-full" style={{ transform: "scale(-1)", filter: "drop-shadow(0 -6px 8px rgba(60,30,30,0.25))" }} />
              </div>
            </div>
          </Tilt>
        </Reveal>
        {start && (
          <Reveal delay={350} className="relative mt-14">
            <p className="text-xs mb-3" style={{ color: IV.muted }}>
              Còn lại đến ngày chung đôi
            </p>
            <Countdown start={start} />
          </Reveal>
        )}
        <div className="absolute bottom-8 flex flex-col items-center gap-1 text-[10px] tracking-[0.3em] uppercase animate-bounce" style={{ color: IV.rose }}>
          <span>Cuộn xuống</span>
          <span aria-hidden>⌄</span>
        </div>
      </section>
      <section className="px-8 py-16 text-center" style={{ background: IV.deep ?? IV.wine }}>
        <Reveal>
          <p className="text-[28px] italic leading-snug mb-8" style={{ ...SERIF, color: IV.soft }}>
            Chúng mình rất vui được cùng bạn chung vui ngày này
          </p>
        </Reveal>
        <Reveal delay={150}>
          <OvalWindow photo={cover}>
            <GlassSeal text={`${initialOf(event.bride_name)}&${initialOf(event.groom_name)}`} size={110} />
          </OvalWindow>
        </Reveal>
        <PaletteProvider value={dark}>
          <Reveal delay={250}>
            <p className="text-xs tracking-[0.25em] uppercase mt-10" style={{ color: dark.muted }}>
              {shortDate}
            </p>
          </Reveal>
        </PaletteProvider>
      </section>
    </>
  )
}

// ---------- gilded hero: gold cartouche on bordeaux + photobooth strip ----------
function GildedHero({ event, shortDate, start, photos, opened }: { event: any; shortDate: string; start: Date | null; photos: string[]; opened: boolean }) {
  const IV = useIV()
  const d = (n: number) => ({ "data-depth": "", style: { ["--d" as any]: n } as React.CSSProperties })
  const dark = onDeep(IV)
  return (
    <section
      className="relative min-h-[100svh] flex flex-col items-center justify-center px-6 pt-14 pb-24 overflow-hidden"
      style={{ background: `radial-gradient(ellipse at 50% 30%, ${IV.wine} 0%, ${IV.deep ?? IV.wine} 72%)` }}
    >
      <div className="w-[min(84vw,330px)]">
        <Reveal>
          <Tilt max={7}>
          <div className="relative" style={{ transformStyle: "preserve-3d" }}>
          {/* champagne backer card peeking out behind the frame */}
          <div className="absolute inset-x-[4%] top-[5%] bottom-[8%] rounded-[6px]" {...d(0)}>
            <div className="w-full h-full rounded-[6px]" style={{ backgroundColor: IV.paper, backgroundImage: PAPER_GRAIN, transform: "rotate(-5deg)", boxShadow: `inset 0 0 0 4px ${IV.paper}, inset 0 0 0 5px ${IV.gold[1]}, 0 20px 40px -18px rgba(0,0,0,0.6)` }} />
          </div>
          <div {...d(28)}>
          <Cartouche slot={photos.length > 0}>
            <p className="text-[10px] tracking-[0.32em] uppercase mt-1 mb-4" style={{ color: IV.rose }}>
              Trân trọng kính mời
            </p>
            <h1 className="italic leading-[1.05] break-words max-w-full" style={{ ...SERIF, color: IV.wine, ...LETTERPRESS }}>
              <span className="block text-[38px]">{event.bride_name}</span>
              <span className="block text-2xl my-0.5" style={{ color: IV.rose }}>
                &amp;
              </span>
              <span className="block text-[38px]">{event.groom_name}</span>
            </h1>
            <GiltDivider className="my-4 !w-28" />
            <p className="text-lg tracking-[0.15em]" style={{ ...SERIF, color: IV.ink }}>
              {shortDate}
            </p>
            {event.venue_name && (
              <p className="text-xs mt-1" style={{ color: IV.muted }}>
                {event.venue_name}
              </p>
            )}
          </Cartouche>
          </div>
          <div className="relative" {...d(45)}>
            <PhotoStrip photos={photos} start={opened} />
          </div>
          </div>
          </Tilt>
        </Reveal>
      </div>
      {start && (
        <PaletteProvider value={dark}>
          <Reveal delay={300} className="mt-10 text-center">
            <p className="text-xs mb-3" style={{ color: dark.muted }}>
              Còn lại đến ngày chung đôi
            </p>
            <Countdown start={start} />
          </Reveal>
        </PaletteProvider>
      )}
      <div className="absolute bottom-6 flex flex-col items-center gap-1 text-[10px] tracking-[0.3em] uppercase animate-bounce" style={{ color: dark.rose }}>
        <span>Cuộn xuống</span>
        <span aria-hidden>⌄</span>
      </div>
    </section>
  )
}

export default function InviteClient(props: InviteProps) {
  // Free plan: only the classic color set (DESIGN.md / lib/plan.ts)
  // Free plan: classic colors + floral template only (lib/plan.ts)
  const premium = props.event.plan === "premium"
  const theme = premium ? THEMES[props.event.invite_theme] ?? THEMES.blush : THEMES.classic
  const look = premium ? templateOf(props.event.invite_template) : "floral"
  return (
    <PaletteProvider value={theme.p}>
      <Invite {...props} look={look} />
    </PaletteProvider>
  )
}

function Invite({ guest, event, floors, locked, preview = false, skipIntro = false, look = "floral" }: InviteProps & { look?: InviteStyle }) {
  const IV = useIV()
  const gilded = look === "gilded"
  const glass = look === "glass"
  const emboss = look === "emboss"
  // Decoration set for this theme; non-floral looks put RSVP on the dark "deep" color
  const O =
    look === "gilded"
      ? { Garland: GiltCrest, Divider: GiltDivider, Frame: GiltFrame }
      : look === "glass"
      ? { Garland: GlassArch, Divider: GlassDivider, Frame: GlassFrame }
      : look === "emboss"
      ? { Garland: EmbossVine, Divider: EmbossDivider, Frame: EmbossFrame }
      : { Garland, Divider, Frame }
  const deepRsvp = look !== "floral"
  const [opened, setOpened] = useState(skipIntro)
  const [tableId, setTableId] = useState(guest.table_id ?? "")
  const [companions, setCompanions] = useState<number>(guest.companions ?? 0)
  const [status, setStatus] = useState<{ error?: string; message?: string; success?: boolean } | null>(null)
  const [loading, setLoading] = useState(false)

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
  const albumPhotos = rest.filter((u) => u !== interlude1 && u !== interlude2)
  // collage up to 10; a swipe strip for the rest when there are at least 3 more
  const collagePhotos = albumPhotos.length >= 13 ? albumPhotos.slice(0, 10) : albumPhotos
  const stripPhotos = albumPhotos.length >= 13 ? albumPhotos.slice(10) : []
  // the small second print on the cover reuses an album photo
  const heroSecond = gallery[1]
  const [viewer, setViewer] = useState<number | null>(null)
  const openPhoto = (url: string) => setViewer(Math.max(0, gallery.indexOf(url)))
  const premium = event.plan === "premium"
  const timeline: any[] = premium ? (Array.isArray(event.timeline) ? event.timeline : []).filter((t: any) => t?.time || t?.title) : []
  const dressColors: string[] = Array.isArray(event.dress_colors) ? event.dress_colors.filter(Boolean) : []
  const start = eventStart(event.event_date, event.event_time)
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
    const result = await confirmSeat(guest.code, tableId, Number(companions))
    setLoading(false)
    setStatus(result)
  }

  return (
    <div className={`${serif.variable} ${sans.variable} min-h-screen wt-paper`} style={{ backgroundColor: IV.bg, backgroundImage: LINEN, color: IV.ink, fontFamily: "var(--iv-sans)" }}>
      <style>{`.wt-paper main section{position:relative}.wt-paper main section::after{content:"";position:absolute;inset:0;pointer-events:none;background-image:${PAPER_GRAIN};mix-blend-mode:multiply}`}</style>
      {!opened &&
        (gilded ? (
          <EnvelopeIntro initials={initials} photo={cover} title={coupleTitle} date={shortDate} onOpened={() => setOpened(true)} />
        ) : glass ? (
          <DoorsIntro initials={initials} onOpened={() => setOpened(true)} />
        ) : emboss ? (
          <EnvelopeIntro initials={initials} title={coupleTitle} date={shortDate} dark={false} onOpened={() => setOpened(true)} seal={<EmbossSeal text={initials} size={110} />} />
        ) : (
          <CurtainIntro initials={initials} onOpened={() => setOpened(true)} />
        ))}

      <main
        className="relative max-w-md mx-auto sm:my-10 sm:rounded-[4px] overflow-hidden"
        style={{
          backgroundColor: IV.paper,
          backgroundImage: PAPER_GRAIN,
          boxShadow: `0 1px 2px rgba(0,0,0,0.08), 0 40px 70px -40px rgba(40,25,20,0.45), 7px 9px 0 -3px ${IV.soft}, 7px 9px 0 -2px ${IV.line}, 14px 18px 0 -6px ${IV.soft}, 14px 18px 0 -5px ${IV.line}`,
        }}
      >
        {/* ---------- Hero ---------- */}
        {gilded ? (
          <GildedHero event={event} shortDate={shortDate} start={start} photos={gallery.slice(0, 3)} opened={opened} />
        ) : glass ? (
          <GlassHero event={event} shortDate={shortDate} start={start} cover={cover} />
        ) : emboss ? (
          <EmbossHero event={event} shortDate={shortDate} start={start} cover={cover} second={heroSecond} opened={opened} />
        ) : (
          <SuiteHero event={event} shortDate={shortDate} start={start} cover={cover} second={heroSecond} initials={initials} />
        )}

        {/* ---------- Invitation ---------- */}
        <section className="px-8 py-14 text-center" style={{ background: IV.bg }}>
          <Reveal>
            <p className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: IV.rose }}>
              Kính gửi
            </p>
            <p className="text-[34px] italic leading-tight mb-6" style={{ ...SERIF, color: IV.wine }}>
              {guest.name}
            </p>
            <p className="text-[15px] leading-relaxed">{event.invite_message || DEFAULT_MESSAGE}</p>
            <O.Divider className="my-8" />
          </Reveal>

          {hasFamilies && (
            <Reveal>
              <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                {[
                  { k: "Nhà gái", v: event.bride_family },
                  { k: "Nhà trai", v: event.groom_family },
                ].map((f) => (
                  <div key={f.k}>
                    <p className="text-[11px] tracking-[0.25em] uppercase mb-2" style={{ color: IV.rose }}>
                      {f.k}
                    </p>
                    <p className="whitespace-pre-line leading-relaxed" style={{ color: IV.ink }}>
                      {f.v}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          )}

          {hasFullNames && (
            <Reveal>
              <p className="text-[11px] tracking-[0.3em] uppercase mb-3" style={{ color: IV.rose }}>
                Trân trọng báo tin lễ thành hôn của
              </p>
              <p className="text-[30px] italic leading-snug" style={{ ...SERIF, color: IV.wine }}>
                {event.bride_full_name || event.bride_name}
              </p>
              <p className="text-xl italic my-1" style={{ ...SERIF, color: IV.rose }}>
                cùng
              </p>
              <p className="text-[30px] italic leading-snug mb-8" style={{ ...SERIF, color: IV.wine }}>
                {event.groom_full_name || event.groom_name}
              </p>
            </Reveal>
          )}

          <Reveal>
            <div style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.08)) drop-shadow(0 14px 18px rgba(40,25,20,0.14))" }}>
            <O.Frame>
              <p className="text-[11px] tracking-[0.3em] uppercase mb-2" style={{ color: IV.rose }}>
                Lễ thành hôn &amp; tiệc cưới
              </p>
              <p className="text-2xl italic mb-3" style={{ ...SERIF, color: IV.wine }}>
                {event.venue_name || "Đang cập nhật địa điểm"}
              </p>
              <p className="text-sm font-medium">{formatInviteDate(event.event_date, event.event_time)}</p>
              {event.venue_address && (
                <p className="text-sm mt-2 whitespace-pre-line" style={{ color: IV.muted }}>
                  {event.venue_address}
                </p>
              )}
              {mapEmbed && (
                <div className="mt-5 -mx-1 overflow-hidden rounded-xl border" style={{ borderColor: IV.line }}>
                  <iframe src={mapEmbed} title="Bản đồ địa điểm" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="block w-full h-56 border-0" />
                </div>
              )}
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-5 rounded-full px-5 py-2 text-xs tracking-[0.15em] uppercase border transition-colors hover:bg-white"
                  style={{ borderColor: IV.rose, color: IV.wine }}
                >
                  {mapEmbed ? "Chỉ đường" : "Xem bản đồ"}
                </a>
              )}
            </O.Frame>
            </div>
          </Reveal>
        </section>

        {interlude1 && <PhotoInterlude src={interlude1} caption={shortDate} title={coupleTitle} onOpen={() => openPhoto(interlude1)} />}

        {/* ---------- Timeline ---------- */}
        {timeline.length > 0 && (
          <section className="px-8 py-14">
            <Reveal>
              <SectionTitle kicker="Lịch trình">Ngày vui của chúng mình</SectionTitle>
            </Reveal>
            {look === "floral" ? <Timeline items={timeline} /> : <WindingTimeline items={timeline} />}
          </section>
        )}

        {/* ---------- Dress code ---------- */}
        {premium && (event.dress_code || dressColors.length > 0) && (
          <section className="px-8 py-14 text-center" style={{ background: IV.bg }}>
            <Reveal>
              <SectionTitle kicker="Trang phục">Dress code</SectionTitle>
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
        {premium && event.love_story && (
          <section className="px-8 py-14 text-center">
            <Reveal>
              <SectionTitle kicker="Câu chuyện">Chuyện của chúng mình</SectionTitle>
            </Reveal>
            {storyPhoto && (
              <Reveal>
                <div className="mx-auto w-[70%] p-2 mb-6 rounded-t-[999px] rounded-b-2xl border bg-white shadow-sm" style={{ borderColor: IV.line }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={storyPhoto} alt="" className="w-full h-64 object-cover rounded-t-[999px] rounded-b-xl" />
                </div>
              </Reveal>
            )}
            <Reveal>
              <p className="text-[15px] leading-relaxed whitespace-pre-line text-left sm:text-center">{event.love_story}</p>
            </Reveal>
          </section>
        )}

        {/* ---------- Album ---------- */}
        {albumPhotos.length > 0 && (
          <section className="px-6 py-14">
            <Reveal>
              <SectionTitle kicker="Khoảnh khắc">Album của chúng tôi</SectionTitle>
            </Reveal>
            <Collage photos={collagePhotos} onOpen={(i) => openPhoto(collagePhotos[i])} />
            {stripPhotos.length > 0 && <FilmStrip photos={stripPhotos} onOpen={(i) => openPhoto(stripPhotos[i])} />}
            <p className="text-center text-xs mt-6" style={{ color: IV.muted }}>
              Chạm vào ảnh để xem lớn · {gallery.length} ảnh
            </p>
          </section>
        )}

        {interlude2 && <PhotoInterlude src={interlude2} caption="Hẹn gặp bạn" title="trong ngày vui" onOpen={() => openPhoto(interlude2)} />}

        {/* ---------- RSVP ---------- */}
        <section className="px-6 py-14" style={{ background: deepRsvp ? IV.deep : IV.bg }}>
          <PaletteProvider value={deepRsvp ? onDeep(IV) : IV}>
            <Reveal>
              <SectionTitle kicker="Hồi âm">Xác nhận tham dự</SectionTitle>
            </Reveal>
          </PaletteProvider>
          <Reveal>
            <div className="rounded-3xl p-5 sm:p-6 border" style={{ backgroundColor: IV.paper, backgroundImage: PAPER_GRAIN, borderColor: IV.line, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.7), 0 2px 3px rgba(0,0,0,0.08), 0 24px 40px -20px rgba(0,0,0,0.45)` }}>
              {guest.confirmed && !status?.success && (
                <p className="text-xs text-center mb-4 rounded-full py-1.5 px-3" style={{ background: IV.okBg, color: IV.leaf }}>
                  {locked ? "Bạn đã xác nhận tham dự." : "Bạn đã xác nhận tham dự. Bạn vẫn có thể đổi bàn bên dưới."}
                </p>
              )}
              {locked ? (
                <p className="text-sm text-center" style={{ color: IV.wine }}>
                  Danh sách khách đã chốt, không thể thay đổi lựa chọn. Cảm ơn bạn!
                </p>
              ) : (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Số người đi cùng bạn</span>
                    <div className="flex items-center rounded-full border bg-white" style={{ borderColor: IV.line }}>
                      <button type="button" className="w-9 h-9 rounded-full text-lg" style={{ color: IV.wine }} onClick={() => setCompanions((c) => Math.max(0, c - 1))} aria-label="Bớt một người">
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{companions}</span>
                      <button type="button" className="w-9 h-9 rounded-full text-lg" style={{ color: IV.wine }} onClick={() => setCompanions((c) => Math.min(20, c + 1))} aria-label="Thêm một người">
                        +
                      </button>
                    </div>
                  </div>

                  <TableMap floors={floors} value={tableId} companions={companions} onChange={setTableId} />

                  <select className="rounded-full border bg-white px-4 py-2.5 text-sm" style={{ borderColor: IV.line }} value={tableId} onChange={(e) => setTableId(e.target.value)}>
                    <option value="">Hoặc chọn bàn từ danh sách…</option>
                    {allTables.map((t: any) => (
                      <option key={t.id} value={t.id} disabled={t.seats - (t.used ?? 0) < 1}>
                        {t.name} (còn {Math.max(0, t.seats - (t.used ?? 0))} chỗ)
                      </option>
                    ))}
                  </select>

                  <button
                    className="rounded-full py-3 text-sm tracking-[0.15em] uppercase text-white transition-opacity disabled:opacity-60"
                    style={{ background: IV.wine }}
                    disabled={loading}
                    onClick={handleConfirm}
                  >
                    {loading ? "Đang gửi…" : "Xác nhận tham dự"}
                  </button>
                  {status?.error && (
                    <p className="text-sm text-center" style={{ color: IV.wine }}>
                      {status.message}
                    </p>
                  )}
                  {status?.success && (
                    <p className="text-lg italic text-center" style={{ ...SERIF, color: IV.leaf }}>
                      Cảm ơn bạn! Hẹn gặp bạn tại tiệc cưới.
                    </p>
                  )}
                </div>
              )}
            </div>
          </Reveal>
        </section>

        {/* ---------- Gift ---------- */}
        {premium && event.gift_qr_url && (
          <section className="px-8 py-14 text-center">
            <Reveal>
              <SectionTitle kicker="Gửi yêu thương">Hộp mừng cưới</SectionTitle>
              <O.Frame className="mx-auto max-w-[280px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.gift_qr_url} alt="Mã QR mừng cưới" className="mx-auto w-48 h-48 object-contain bg-white rounded-lg" />
                <p className="text-xs mt-3" style={{ color: IV.muted }}>
                  Quét mã để gửi lời chúc và quà mừng
                </p>
              </O.Frame>
            </Reveal>
          </section>
        )}

        {/* ---------- Video ---------- */}
        {video && (
          <section className="px-6 py-14 text-center">
            <Reveal>
              <SectionTitle kicker="Thước phim">Video cưới</SectionTitle>
            </Reveal>
            <Reveal>
              {video.kind === "link" ? (
                <a
                  href={video.src}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-full px-6 py-2.5 text-xs tracking-[0.15em] uppercase border"
                  style={{ borderColor: IV.rose, color: IV.wine }}
                >
                  ▶ Xem video cưới
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

        {/* ---------- Footer ---------- */}
        <footer className="px-8 pt-6 pb-14 text-center">
          <O.Garland className="opacity-80 mb-4 rotate-180" />
          <Reveal>
            <div className="flex justify-center">
              {gilded ? <GiltSeal text={initials} size={84} /> : glass ? <GlassSeal text={initials} size={84} /> : emboss ? <EmbossSeal text={initials} size={84} /> : <Seal text={initials} size={84} />}
            </div>
            <p className="text-xl italic mt-4" style={{ ...SERIF, color: IV.wine }}>
              Sự hiện diện của bạn là niềm vinh hạnh của chúng tôi
            </p>
            <p className="text-[10px] tracking-[0.3em] uppercase mt-8" style={{ color: IV.muted }}>
              WedTable
            </p>
          </Reveal>
        </footer>
        {viewer !== null && gallery.length > 0 && <Lightbox photos={gallery} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} />}
      </main>
    </div>
  )
}
