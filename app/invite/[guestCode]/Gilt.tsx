"use client"

// "Ngà & Nhũ" (ivory and champagne foil). Built after studying the most luxurious invites crawled
// (Long & Linh, invio Ngọc Trai, thiepvui Lake Como): one ivory paper, one espresso ink, champagne
// foil as the only accent, the wedding photo as the hero, lots of space, hairlines instead of boxes.
// Opening: a letterpressed linen ground, an ivory envelope with a gold wax seal; the flap opens and
// the card slides out before melting into the full-bleed cover. Approved as an HTML mock-up
// (docs/mau-thiep/preview/nga-va-nhu.html) on 2026-11-27.
import { useState } from "react"
import { lunarLine } from "@/lib/lunar"
import { videoEmbed } from "@/lib/videoEmbed"
import type { Palette } from "@/lib/inviteThemes"
import { PaletteProvider } from "./Ornaments"
import { GiftAccounts, Guestbook, Milestones } from "./Sections"
import { FaqList, MusicToggle } from "./Extras"
import { Lightbox } from "./Album"
import { ActionBar, Core, Painted, RsvpForm, eventStart, googleCalendarUrl, p2, useCountdown, useOpening, useScrollProgress, useSeen, weekday } from "./kit"

const C = { paper: "#FBF8F3", ivory: "#F3ECE1", ink: "#3A2E28", muted: "#8C7F73", line: "#DED4C5", gold: "#B8955A", goldDark: "#A27E46" }
const PAL: Palette = {
  bg: C.paper,
  paper: "#FFFFFF",
  blush: C.ivory,
  rose: C.goldDark,
  wine: C.ink,
  sage: "#B9AE9C",
  leaf: C.ink,
  ink: C.ink,
  muted: C.muted,
  line: C.line,
  soft: "#F7F2EA",
  okBg: "#F1EBE0",
  deep: C.ink,
  gold: ["#E8D4A2", C.gold, C.goldDark],
}
const MONTH = ["Tháng Một", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu", "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Mười Hai"]
const ini = (n: string) => (n.trim().split(/\s+/).pop() || "").charAt(0).toUpperCase()

const PAPER_NOISE =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .55 0 0 0 0 .5 0 0 0 0 .44 0 0 0 .2 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`
const LINEN =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='l'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9 .05' numOctaves='2' seed='4'/%3E%3CfeColorMatrix values='0 0 0 0 .45 0 0 0 0 .4 0 0 0 0 .34 0 0 0 .16 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23l)'/%3E%3Crect width='100%25' height='100%25' filter='url(%23l)' transform='rotate(90 80 80)'/%3E%3C/svg%3E")`

const CSS = `
.ng{font-family:var(--iv-caps),"Cormorant Garamond",Georgia,serif;color:${C.ink}}
.ng .foil{background:linear-gradient(100deg,#9C7A45 0%,#E8D4A2 20%,#B8955A 38%,#F5E8C4 50%,#A27E46 66%,#E8D4A2 84%,#9C7A45 100%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:ngSheen 7s linear infinite}
.ng .foil-bg{background:linear-gradient(100deg,#9C7A45,#E8D4A2 30%,#B8955A 50%,#F5E8C4 62%,#A27E46);background-size:220% 100%;animation:ngSheen 7s linear infinite}
@keyframes ngSheen{from{background-position:120% 0}to{background-position:-100% 0}}
.ng .caps{text-transform:uppercase;letter-spacing:.32em;font-weight:500;font-size:11px;color:${C.muted}}
.ng .scr{font-family:var(--iv-pinyon),cursive;font-weight:400}
.ng .rule{display:flex;align-items:center;justify-content:center;gap:12px;margin:28px auto}
.ng .rule::before,.ng .rule::after{content:"";height:1px;width:64px;background:linear-gradient(90deg,transparent,${C.gold})}
.ng .rule::after{transform:scaleX(-1)}
.ng .rule i{width:7px;height:7px;transform:rotate(45deg);display:block}
.ng .lead{font-style:italic;font-weight:300;font-size:21px;line-height:1.55;color:#4A3D35}
.ng .in{opacity:0;transform:translateY(18px);transition:opacity 1.3s cubic-bezier(.2,.7,.2,1),transform 1.4s cubic-bezier(.2,.7,.2,1)}
.ng .on .in,.ng .in.on{opacity:1;transform:none}
.ng .d1{transition-delay:.15s}.ng .d2{transition-delay:.3s}.ng .d3{transition-delay:.45s}.ng .d4{transition-delay:.6s}
.ng .btn{font-family:var(--iv-sans);font-size:12px;letter-spacing:.18em;text-transform:uppercase;padding:13px 20px;border:1px solid ${C.ink};color:${C.ink};display:inline-block;transition:background .3s,color .3s}
.ng .btn:hover{background:${C.ink};color:${C.paper}}
.ng .photo-grade{filter:saturate(.78) sepia(.12) contrast(.96) brightness(1.02)}
.ng .rl span{display:inline-block;opacity:0;transform:translateY(10px);filter:blur(4px);transition:opacity 1s ease,transform 1s ease,filter 1s ease}
.ng .opened .rl span{opacity:1;transform:none;filter:none}
@media (prefers-reduced-motion: reduce){.ng *{animation:none!important}.ng .in,.ng .rl span{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}}
`

/** A section that switches its .in children on when it scrolls into view */
function S({ children, className = "", style, id }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; id?: string }) {
  const [ref, seen] = useSeen<HTMLElement>(0.12)
  return (
    <section ref={ref as any} id={id} className={"relative px-[34px] py-[84px] text-center scroll-mt-2 " + (seen ? "on " : "") + className} style={style}>
      {children}
    </section>
  )
}
function Rule() {
  return (
    <div className="rule in d2">
      <i className="foil-bg" />
    </div>
  )
}
function Head({ kicker, title }: { kicker: string; title?: string }) {
  return (
    <>
      <p className="caps in">{kicker}</p>
      {title && (
        <p className="scr in d1 text-[42px] leading-[1.1] mt-1.5">{title}</p>
      )}
    </>
  )
}

// ---------------------------------------------------------------- opening

function Seal({ text }: { text: string }) {
  const pts: string[] = []
  for (let i = 0; i <= 360; i += 4) {
    const a = (i * Math.PI) / 180
    const r = 44 + 2.4 * Math.cos(a * 11) + 1.2 * Math.sin(a * 7)
    pts.push(`${i ? "L" : "M"}${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`)
  }
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full" style={{ filter: "drop-shadow(0 5px 7px rgba(80,50,20,.35))" }} aria-hidden>
      <defs>
        <radialGradient id="ngWax" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#F3E2B6" />
          <stop offset=".45" stopColor="#C9A66B" />
          <stop offset="1" stopColor="#8E6B37" />
        </radialGradient>
      </defs>
      <path d={pts.join("") + "Z"} fill="url(#ngWax)" />
      <circle r="31" fill="none" stroke="#8E6B37" strokeWidth="1.2" opacity=".6" />
      <circle r="27" fill="none" stroke="#F3E2B6" strokeWidth=".8" opacity=".6" />
      <text y="9" textAnchor="middle" fontSize="26" fill="#7A5A2C" style={{ fontFamily: "var(--iv-pinyon), cursive" }}>
        {text}
      </text>
    </svg>
  )
}

export function GiltIntro({ core, onOpened, onReveal }: { core: Core; onOpened: () => void; onReveal: () => void }) {
  const { phase, tap } = useOpening(3400, onOpened, 2600, onReveal)
  const run = phase !== "idle"
  const s = core.start
  const mono = `${ini(core.bride)}&${ini(core.groom)}`
  const press = { color: "#D8CDBB", textShadow: "-1px -1px 0 rgba(80,60,35,.32), 1px 1px 0 rgba(255,255,255,.75)" }
  const paper = { backgroundImage: `radial-gradient(120% 70% at 50% 0%, rgba(255,255,255,.5), transparent 60%), ${PAPER_NOISE}`, backgroundColor: "#F4EEE4" }
  const clipFlap = "polygon(0 0,100% 0,100% 6%,50% 100%,0 6%)"
  return (
    <div className={"ng fixed inset-0 z-50 flex justify-center cursor-pointer select-none"} style={{ background: "#E6DED1", opacity: phase === "out" ? 0 : 1, transition: "opacity 1s ease", pointerEvents: phase === "out" ? "none" : "auto" }} onClick={tap} role="button" aria-label="Mở thiệp mời">
      <style>{CSS}</style>
      <div className="relative w-full max-w-[480px] h-full overflow-hidden" style={{ backgroundImage: `${LINEN}, radial-gradient(120% 70% at 50% 30%, #F1EBE1, #E3DACB)` }}>
        <div className="absolute inset-x-0 top-[9%] text-center" style={press}>
          <div className="text-[58px] font-light tracking-[.08em]">
            {mono[0]}
            <span className="scr text-[40px] mx-1.5">&amp;</span>
            {mono[2]}
          </div>
          {s && <div className="text-[11px] tracking-[.46em] font-semibold mt-0.5">{p2(s.getDate())} · {p2(s.getMonth() + 1)} · {s.getFullYear()}</div>}
        </div>
        <div className="absolute inset-x-0 top-[27%] text-center px-6" style={{ opacity: run ? 0 : 1, transition: "opacity .5s" }}>
          <div className="scr text-[28px]" style={{ color: "#9A8770" }}>
            Kính gửi
          </div>
          <div className="mt-1 text-[18px] tracking-[.16em] uppercase font-medium">{core.guest.name}</div>
        </div>
        <div className="absolute left-[8%] right-[8%] top-[47%] h-[34%]" style={{ perspective: 1400, filter: "drop-shadow(0 22px 26px rgba(60,40,20,.28)) drop-shadow(0 2px 2px rgba(60,40,20,.12))" }}>
          <div className="absolute inset-0" style={{ background: "#E7DDCD" }} />
          {/* the card inside */}
          <div className="absolute left-[5%] right-[5%] top-[6%] h-[90%] p-2" style={{ zIndex: 1, background: C.paper, transform: run ? "translateY(-78%)" : "none", transition: "transform 1.7s cubic-bezier(.55,.02,.2,1) 1.05s" }}>
            <div className="absolute inset-1 pointer-events-none" style={{ border: `1px solid ${C.gold}`, opacity: 0.75 }} />
            <div className="h-[74%] bg-center bg-cover photo-grade" style={{ backgroundImage: core.gallery[0] ? `url("${core.gallery[0]}")` : undefined, backgroundColor: C.ivory }} />
            <p className="mt-2 text-center text-[18px] tracking-[.24em] uppercase">
              {core.bride} <span className="scr text-[30px] leading-none tracking-normal normal-case" style={{ color: C.goldDark }}>&amp;</span> {core.groom}
            </p>
          </div>
          {/* the pocket in front */}
          <div className="absolute inset-0" style={{ ...paper, zIndex: 2, clipPath: "polygon(0 0,50% 46%,100% 0,100% 100%,0 100%)" }}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top right,transparent 49.6%,rgba(90,70,40,.12) 50%,transparent 50.6%),linear-gradient(to top left,transparent 49.6%,rgba(90,70,40,.12) 50%,transparent 50.6%)" }} />
          </div>
          {/* the flap */}
          <div className="absolute inset-x-0 top-0 h-[58%]" style={{ transformOrigin: "50% 0", transformStyle: "preserve-3d", transform: run ? "rotateX(180deg)" : "none", zIndex: run ? 0 : 3, transition: `transform 1.15s cubic-bezier(.55,.02,.3,1) .2s, z-index 0s ${run ? ".8s" : "0s"}` }}>
            <div className="absolute inset-0" style={{ ...paper, clipPath: clipFlap, backfaceVisibility: "hidden", filter: "drop-shadow(0 3px 3px rgba(60,40,20,.15))" }} />
            <div className="absolute inset-0" style={{ clipPath: clipFlap, background: "#E2D7C5", transform: "rotateX(180deg)", backfaceVisibility: "hidden" }} />
            <div className="absolute left-1/2 top-full w-[84px] h-[84px]" style={{ transform: `translate(-50%,-58%) scale(${run ? 0.9 : 1})`, opacity: run ? 0 : 1, transition: "transform .5s ease, opacity .5s ease .25s" }}>
              <Seal text={mono} />
            </div>
          </div>
        </div>
        <p className="absolute inset-x-0 bottom-[5%] text-center text-[12px] tracking-[.14em]" style={{ fontFamily: "var(--iv-sans)", color: C.muted, opacity: run ? 0 : 1, transition: "opacity .4s" }}>
          Chạm vào dấu sáp để mở thiệp
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- page

function Cover({ core, opened }: { core: Pick<Core, "bride" | "groom" | "start" | "gallery">; opened: boolean }) {
  const s = core.start
  return (
    <section className={"relative flex flex-col min-h-[100svh] " + (opened ? "opened" : "")}>
      <div className="relative h-[72svh] min-h-[460px] overflow-hidden">
        {core.gallery[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={core.gallery[0]} alt="" className="w-full h-full object-cover photo-grade" style={{ transform: opened ? "scale(1)" : "scale(1.12)", transition: "transform 6s cubic-bezier(.2,.65,.2,1)" }} />
        ) : (
          <div className="w-full h-full" style={{ background: C.ivory }} />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(251,248,243,0) 55%, ${C.paper} 99%)` }} />
        <p className="absolute top-[22px] inset-x-0 text-center text-[11px] tracking-[.42em] uppercase font-medium text-white" style={{ textShadow: "0 1px 8px rgba(0,0,0,.35)" }}>
          Lễ thành hôn
        </p>
      </div>
      <div className="relative -mt-16 px-5 pb-10 text-center">
        <h1 className="rl font-light text-[48px] leading-[1.05] tracking-[.2em] uppercase">
          <span style={{ display: "block", transitionDelay: ".6s" }}>{core.bride}</span>
          <span className="scr text-[84px] leading-[.8] tracking-normal normal-case -my-1" style={{ display: "block", transitionDelay: "1s", color: C.goldDark }}>
            <i className="not-italic">&amp;</i>
          </span>
          <span style={{ display: "block", transitionDelay: "1.3s" }}>{core.groom}</span>
        </h1>
        {s && (
          <p className="rl mt-4 text-[15px] tracking-[.5em] font-medium">
            <span style={{ transitionDelay: "1.8s" }}>
              {p2(s.getDate())} · {p2(s.getMonth() + 1)} · {s.getFullYear()}
            </span>
          </p>
        )}
      </div>
    </section>
  )
}

function Interlude({ src, quote }: { src: string; quote?: string }) {
  const [ref, p] = useScrollProgress<HTMLDivElement>()
  return (
    <section className="relative h-[86svh] min-h-[520px] overflow-hidden">
      <div ref={ref} className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" loading="lazy" className="w-full h-[118%] object-cover photo-grade" style={{ transform: `translateY(${-(p * 14)}%)` }} />
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 55%, rgba(30,20,12,.55))" }} />
      {quote && (
        <p className="absolute inset-x-0 bottom-11 px-[34px] text-center text-white italic font-light text-[23px] leading-[1.45]" style={{ textShadow: "0 2px 14px rgba(0,0,0,.4)" }}>
          “{quote}”
        </p>
      )}
    </section>
  )
}

export function GiltPage({ core, opened }: { core: Core; opened: boolean }) {
  const s = core.start
  const cd = useCountdown(s)
  const [viewer, setViewer] = useState<number | null>(null)
  const video = videoEmbed(core.event.video_url)
  const g = core.gallery
  const interlude = g[1]
  const story = g.slice(2, 4)
  const album = g.slice(4)
  const closing = g.length >= 3 ? g[g.length - 1] : undefined
  const hasFamilies = !!(core.event.bride_family || core.event.groom_family)
  const tone = { ink: C.ink, muted: C.muted, line: C.line, field: "#FFFFFF", accent: C.ink, onAccent: C.paper, ok: C.ink, okBg: "#F1EBE0", palette: PAL }
  const venueQ = core.mapQuery
  return (
    <PaletteProvider value={PAL}>
      <div className="ng min-h-screen" style={{ background: "#E9E2D6" }}>
        <style>{CSS}</style>
        <main className="mx-auto max-w-[480px] overflow-hidden relative" style={{ background: C.paper, boxShadow: "0 0 80px rgba(60,40,20,.12)" }}>
          <Cover core={core} opened={opened} />

          {/* invitation + families */}
          <S>
            <p className="scr foil in text-[34px]">Trân trọng kính mời</p>
            <p className="in d1 text-[30px] tracking-[.04em] mt-1.5">{core.guest.name}</p>
            <Rule />
            <p className="lead in d3">{core.message}</p>
            {hasFamilies && (
              <div className="in d4 grid grid-cols-[1fr_1px_1fr] gap-[18px] mt-[34px]">
                {[
                  { k: "Nhà gái", v: core.event.bride_family, role: "Con gái", name: core.event.bride_full_name || core.bride },
                  null,
                  { k: "Nhà trai", v: core.event.groom_family, role: "Con trai", name: core.event.groom_full_name || core.groom },
                ].map((f, i) =>
                  f ? (
                    <div key={i}>
                      <h3 className="text-[11px] tracking-[.36em] font-semibold uppercase" style={{ color: C.goldDark }}>
                        {f.k}
                      </h3>
                      <p className="text-[17px] leading-[1.6] mt-2.5 whitespace-pre-line">{f.v}</p>
                      {f.name && (
                        <>
                          <p className="text-[13px] italic mt-4" style={{ color: C.muted }}>
                            {f.role}
                          </p>
                          <p className="text-[24px] leading-[1.15] mt-0.5">{f.name}</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div key={i} style={{ background: `linear-gradient(transparent, ${C.line}, transparent)` }} />
                  )
                )}
              </div>
            )}
          </S>

          {/* the day */}
          <S style={{ background: C.ivory }}>
            <p className="caps in">Hôn lễ được cử hành vào</p>
            {s && (
              <>
                <p className="caps in d1 mt-5" style={{ color: C.ink }}>
                  {weekday(s)}
                </p>
                <div className="in d2 grid grid-cols-[1fr_auto_1fr] items-center gap-3.5 mt-5">
                  <div className="py-2.5 text-[13px] tracking-[.3em] uppercase font-medium" style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                    {MONTH[s.getMonth()]}
                  </div>
                  <div className="foil text-[118px] font-light leading-[.9]">{p2(s.getDate())}</div>
                  <div className="py-2.5 text-[13px] tracking-[.3em] uppercase font-medium" style={{ borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                    {s.getFullYear()}
                  </div>
                </div>
                <p className="in d3 text-[20px] tracking-[.4em] mt-3.5">
                  {p2(s.getHours())}:{p2(s.getMinutes())}
                </p>
                <p className="in d3 italic text-[16px] mt-1.5" style={{ color: C.muted }}>
                  {lunarLine(s)}
                </p>
                {cd && !cd.over && (
                  <div className="in d4 flex justify-center gap-6 mt-7">
                    {[
                      [cd.d, "ngày"],
                      [cd.h, "giờ"],
                      [cd.m, "phút"],
                      [cd.s, "giây"],
                    ].map(([v, l]) => (
                      <div key={l as string} className="min-w-[44px]">
                        <b className="block font-light text-[38px] leading-none tabular-nums">{p2(v as number)}</b>
                        <small className="text-[10px] tracking-[.3em] uppercase" style={{ color: C.muted }}>
                          {l}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <Rule />
            <p className="caps in">Tại</p>
            <p className="in d1 text-[30px] mt-2.5">{core.event.venue_name || "Đang cập nhật địa điểm"}</p>
            {core.event.venue_address && (
              <p className="in d2 text-[17px] mt-1" style={{ color: C.muted }}>
                {core.event.venue_address}
              </p>
            )}
            <div className="in d3 flex gap-2.5 justify-center flex-wrap mt-6">
              {core.mapUrl && (
                <a className="btn" href={core.mapUrl} target="_blank" rel="noreferrer">
                  Chỉ đường
                </a>
              )}
              {s && (
                <a className="btn" href={googleCalendarUrl(s, `Đám cưới ${core.couple}`, venueQ)} target="_blank" rel="noreferrer">
                  Lưu vào lịch
                </a>
              )}
            </div>
          </S>

          {/* ceremonies */}
          {core.ceremonies.length > 0 && (
            <S>
              <Head kicker="Lễ nghi" title="Các nghi lễ" />
              <ul className="in d2 mt-7 text-left">
                {core.ceremonies.map((c, i) => {
                  const d = c.date ? new Date(`${c.date}T${c.time || "00:00"}:00`) : null
                  const q = [c.place, c.address].filter(Boolean).join(", ")
                  return (
                    <li key={i} className="list-none grid grid-cols-[92px_1fr] items-baseline py-4" style={{ borderTop: `1px solid ${C.line}`, borderBottom: i === core.ceremonies.length - 1 ? `1px solid ${C.line}` : undefined }}>
                      <span className="text-[30px] font-light">{c.time}</span>
                      <span className="text-[20px]">
                        {c.name}
                        <small className="block text-[14px] italic mt-0.5" style={{ color: C.muted }}>
                          {[d ? `${weekday(d)} ${p2(d.getDate())}.${p2(d.getMonth() + 1)}` : "", c.place].filter(Boolean).join(" · ")}
                        </small>
                        {q && (
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`} target="_blank" rel="noreferrer" className="text-[13px] underline underline-offset-4" style={{ color: C.goldDark, fontFamily: "var(--iv-sans)" }}>
                            Chỉ đường
                          </a>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </S>
          )}

          {interlude && <Interlude src={interlude} quote={core.story ? core.story.split(/(?<=[.!?])\s/)[0] : undefined} />}

          {/* programme */}
          {core.timeline.length > 0 && (
            <S>
              <Head kicker="Chương trình" title="Ngày vui của chúng mình" />
              <ul className="in d2 mt-7 text-left">
                {core.timeline.map((it, i) => (
                  <li key={i} className="list-none grid grid-cols-[92px_1fr] items-baseline py-4" style={{ borderTop: `1px solid ${C.line}`, borderBottom: i === core.timeline.length - 1 ? `1px solid ${C.line}` : undefined }}>
                    <span className="text-[30px] font-light">{it.time}</span>
                    <span className="text-[20px]">
                      {it.title}
                      {it.note && (
                        <small className="block text-[14px] italic mt-0.5" style={{ color: C.muted }}>
                          {it.note}
                        </small>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </S>
          )}

          {/* story */}
          {(core.story || core.milestones.length > 0 || story.length > 0) && (
            <S style={{ background: C.ivory }}>
              <Head kicker="Câu chuyện" title="Chuyện của chúng mình" />
              {core.story && <p className="lead in d2 mt-5">{core.story}</p>}
              {core.milestones.length > 0 && (
                <div className="in d3 mt-8 text-left">
                  <Milestones items={core.milestones} />
                </div>
              )}
              {story.length > 0 && (
                <div className="in d3 grid grid-cols-[1.1fr_.9fr] gap-3.5 mt-9 text-left">
                  {story.map((u, i) => (
                    <figure key={u} className={i === 1 ? "mt-16" : ""}>
                      <button type="button" onClick={() => setViewer(g.indexOf(u))} aria-label="Xem ảnh" className="block w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="" loading="lazy" className="w-full aspect-[3/4] object-cover photo-grade" />
                      </button>
                      {core.milestones[i] && (
                        <figcaption className="text-[13px] italic mt-2" style={{ color: C.muted }}>
                          {[core.milestones[i].title, core.milestones[i].year].filter(Boolean).join(", ")}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}
            </S>
          )}

          {/* dress code */}
          {(core.dressCode || core.dressColors.length > 0) && (
            <S>
              <p className="caps in">Trang phục</p>
              {core.dressCode && <p className="lead in d1 mt-3.5">{core.dressCode}</p>}
              {core.dressColors.length > 0 && (
                <div className="in d2 flex justify-center gap-4 mt-5">
                  {core.dressColors.map((c) => (
                    <span key={c} className="w-11 h-11 rounded-full" style={{ background: c, boxShadow: `inset 0 6px 10px rgba(255,255,255,.45), inset 0 -6px 10px rgba(0,0,0,.08), 0 0 0 4px ${C.paper}, 0 0 0 5px ${C.line}` }} />
                  ))}
                </div>
              )}
            </S>
          )}

          {/* album */}
          {album.length > 0 && (
            <S className="!pt-5">
              <p className="caps in">Khoảnh khắc</p>
              <div className="in d1 grid grid-cols-2 gap-2.5 mt-7">
                {album.map((u, i) => (
                  <button key={u} type="button" onClick={() => setViewer(g.indexOf(u))} aria-label="Xem ảnh" className={"overflow-hidden block " + (i % 3 === 0 ? "col-span-2 aspect-[4/3]" : "aspect-[3/4]")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" loading="lazy" className="w-full h-full object-cover photo-grade transition-transform duration-[1200ms] hover:scale-[1.04]" />
                  </button>
                ))}
              </div>
            </S>
          )}

          {core.faq.length > 0 && (
            <S>
              <Head kicker="Hỏi đáp" title="Bạn cần biết" />
              <div className="in d2 mt-6 text-left">
                <FaqList items={core.faq} />
              </div>
            </S>
          )}

          {/* RSVP */}
          <S id="rsvp" style={{ background: C.ivory }}>
            <Head kicker="Hồi âm" title="Xác nhận tham dự" />
            <div className="in d2 mt-7 text-left p-5" style={{ background: "#FFFFFF", boxShadow: `inset 0 0 0 1px ${C.line}` }}>
              <RsvpForm core={core} tone={tone} button="rounded-none" />
            </div>
          </S>

          {/* wishes */}
          <S id="wishes">
            <Head kicker="Sổ lưu bút" title="Gửi lời chúc" />
            <div className="in d2 mt-6">
              <Guestbook code={core.guest.code} guestName={core.guest.name} preview={core.preview} />
            </div>
          </S>

          {video && (
            <S>
              <p className="caps in">Thước phim</p>
              <div className="in d1 mt-6 aspect-video overflow-hidden" style={{ boxShadow: `0 0 0 1px ${C.line}` }}>
                {video.kind === "iframe" ? <iframe src={video.src} title="Video cưới" className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen /> : video.kind === "file" ? <video src={video.src} controls playsInline className="w-full h-full object-contain bg-black" /> : <a href={video.src} target="_blank" rel="noreferrer" className="w-full h-full flex items-center justify-center underline">Mở video</a>}
              </div>
            </S>
          )}

          {/* gifts */}
          {(core.gifts.length > 0 || core.giftQr) && (
            <S id="gifts" style={{ background: C.ivory }}>
              <p className="caps in">Mừng cưới</p>
              <p className="lead in d1 mt-3 !text-[19px]">Sự hiện diện của bạn là món quà quý nhất. Nếu ở xa, bạn có thể gửi lời chúc qua đây.</p>
              <div className="in d2 mt-6">
                <GiftAccounts accounts={core.gifts} fallbackQr={core.giftQr} />
              </div>
            </S>
          )}

          {/* closing */}
          {closing && (
            <section className="relative h-[100svh] min-h-[560px] overflow-hidden text-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={closing} alt="" loading="lazy" className="w-full h-full object-cover" style={{ filter: "saturate(.7) sepia(.16) contrast(.95) brightness(.92)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(20,14,8,.15), rgba(20,14,8,.55))" }} />
              <div className="absolute inset-x-0 bottom-[16%] px-[30px] text-center">
                <p className="scr text-[64px] leading-none">Hẹn gặp bạn</p>
                <p className="mt-3 text-[14px] tracking-[.46em] uppercase">{core.couple}</p>
              </div>
            </section>
          )}
          <S className="!pt-14 !pb-[120px]">
            <div className="in w-[150px] mx-auto -mt-2.5 mb-2">
              <Painted src="rose-blush" style={{ width: "100%" }} />
            </div>
            <p className="caps in d1">Trân trọng cảm ơn</p>
            <p className="lead in d2 mt-2.5 !text-[18px]">Sự hiện diện của bạn là niềm vinh hạnh của gia đình chúng tôi.</p>
          </S>
        </main>
      </div>
      {core.musicUrl && opened && <MusicToggle src={core.musicUrl} start={opened} />}
      {opened && <ActionBar core={core} accent={C.ink} onAccent={C.paper} ink={C.ink} ground="rgba(251,248,243,.92)" />}
      {viewer !== null && <Lightbox photos={g} index={viewer} onClose={() => setViewer(null)} onIndex={setViewer} />}
    </PaletteProvider>
  )
}

/** Still cover for the template picker */
export function GiltThumb({ event }: { event: any }) {
  const c = { bride: event.bride_name || "", groom: event.groom_name || "", start: eventStart(event.event_date, event.event_time), gallery: Array.isArray(event.gallery) ? event.gallery : [] }
  return (
    <div className="ng" style={{ background: C.paper }}>
      <style>{CSS + ".ng .rl span{opacity:1!important;transform:none!important;filter:none!important}"}</style>
      <Cover core={c} opened />
    </div>
  )
}
