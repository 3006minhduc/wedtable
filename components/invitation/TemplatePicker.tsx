"use client"

// Template picker on /invitation (rebuilt 2026-11-23): the current template as a real cover thumbnail with
// its color dots, and a full-screen gallery where every card is that template's actual cover drawn with
// this wedding's names, date and photo (like Zola / Greenvelope / tiemthiep.online).
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Icon from "@/components/ui/Icon"
import { TemplateCover } from "@/app/invite/[guestCode]/InviteClient"
import { TEMPLATES, TEMPLATE_GROUPS, THEMES, THEME_INFO } from "@/lib/inviteThemes"
import type { InviteStyle, TemplateGroup } from "@/lib/inviteThemes"

const PHONE_W = 390
const PHONE_H = 844

/** Scales a 390×844 phone screen down to the card's width */
function Thumb({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(0.4)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => setScale(el.clientWidth / PHONE_W)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={box} className={"relative w-full overflow-hidden bg-surface-alt " + className} style={{ aspectRatio: `${PHONE_W} / ${PHONE_H}` }}>
      <div className="wt-thumb absolute left-0 top-0 pointer-events-none select-none" style={{ width: PHONE_W, height: PHONE_H, transform: `scale(${scale})`, transformOrigin: "0 0" }} aria-hidden>
        {children}
      </div>
    </div>
  )
}

function Dot({ id, active, locked, onPick }: { id: string; active: boolean; locked: boolean; onPick: () => void }) {
  const p = THEMES[id]?.p
  if (!p) return null
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onPick()
      }}
      title={`${THEMES[id].label}${THEME_INFO[id]?.desc ? `: ${THEME_INFO[id].desc}` : ""}${locked ? " (Premium)" : ""}`}
      aria-label={`Bộ màu ${THEMES[id].label}`}
      aria-pressed={active}
      className={"relative w-7 h-7 rounded-full overflow-hidden shrink-0 transition-shadow " + (active ? "ring-2 ring-offset-2 ring-text" : "ring-1 ring-border hover:ring-border-hover") + (locked ? " opacity-40" : "")}
    >
      <span className="absolute inset-0" style={{ background: `conic-gradient(${p.deep} 0 35%, ${p.gold[1]} 0 55%, ${p.blush} 0 80%, ${p.paper} 0)` }} />
    </button>
  )
}

/** Full-screen try-on: plays the real invite (with its opening) in a phone frame */
function TryOn({ eventId, id, palette, locked, isCurrent, onUse, onClose }: { eventId: string; id: InviteStyle; palette: string; locked: boolean; isCurrent: boolean; onUse: () => void; onClose: () => void }) {
  const [key, setKey] = useState(0)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])
  const t = TEMPLATES[id]
  return createPortal(
    <div className="fixed inset-0 z-[90] bg-black/70 flex flex-col items-center justify-center p-4 gap-3" role="dialog" aria-modal="true" aria-label={`Xem thử mẫu ${t.label}`} onClick={onClose}>
      <div className="w-full max-w-[400px] h-[min(780px,calc(100svh-120px))] rounded-[28px] overflow-hidden bg-black ring-4 ring-black/80" onClick={(e) => e.stopPropagation()}>
        <iframe key={key} src={`/invite-preview/${eventId}?intro=1&t=${id}&p=${palette}`} title={`Xem thử ${t.label}`} className="w-full h-full border-0 bg-white" />
      </div>
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="h-10 px-4 rounded-lg bg-surface text-text text-sm">
          Quay lại
        </button>
        <button type="button" onClick={() => setKey((k) => k + 1)} className="h-10 px-4 rounded-lg bg-surface text-text text-sm">
          Phát lại
        </button>
        {!locked && !isCurrent && (
          <button type="button" onClick={onUse} className="h-10 px-4 rounded-lg bg-brand text-white text-sm font-medium">
            Dùng mẫu này
          </button>
        )}
        {locked && <span className="h-10 px-4 rounded-lg bg-surface text-muted text-sm inline-flex items-center gap-1.5"><Icon name="lock" size={14} /> Cần gói Premium</span>}
      </div>
    </div>,
    document.body
  )
}

type Props = {
  event: any
  cover?: string
  second?: string
  template: InviteStyle
  palette: string
  premium: boolean
  onChange: (template: InviteStyle, palette: string) => void
}

export default function TemplatePicker({ event, cover, second, template, palette, premium, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [tryCurrent, setTryCurrent] = useState(false)
  const [allColors, setAllColors] = useState(false)
  const t = TEMPLATES[template]
  const suggested = t.palettes.filter((id) => THEMES[id])
  const others = Object.keys(THEMES).filter((id) => !suggested.includes(id))
  const canColor = (id: string) => premium || !!THEME_INFO[id]?.free

  return (
    <section id="mau-thiep" className="bg-surface border border-border rounded-card p-5 sm:p-6 scroll-mt-20">
      <style>{`.wt-thumb section{min-height:${PHONE_H}px!important}`}</style>
      <div className="flex gap-5 items-start">
        <button type="button" onClick={() => setOpen(true)} className="w-[132px] sm:w-[150px] shrink-0 rounded-xl overflow-hidden ring-1 ring-border hover:ring-border-hover transition-shadow" aria-label="Đổi mẫu thiệp">
          <Thumb>
            <TemplateCover id={template} palette={palette} event={event} cover={cover} second={second} />
          </Thumb>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">Mẫu đang dùng</p>
          <h2 className="font-semibold text-[17px] text-text mt-0.5">
            {t.label} <span className="ml-1.5 align-middle text-xs font-normal text-muted border border-border rounded-md px-1.5 py-0.5">{TEMPLATE_GROUPS[t.group]}</span>
          </h2>
          <p className="text-sm text-muted mt-1">{t.desc}</p>

          <div className="mt-4">
            <p className="text-sm text-text">
              Màu: <span className="text-muted">{THEMES[palette]?.label ?? "Mặc định"}</span>
            </p>
            <div className="flex items-center gap-2.5 mt-2 flex-wrap">
              {(premium ? suggested : ["classic"]).map((id) => (
                <Dot key={id} id={id} active={palette === id} locked={!canColor(id)} onPick={() => canColor(id) && onChange(template, id)} />
              ))}
              {premium && (
                <button type="button" onClick={() => setAllColors((v) => !v)} className="text-sm text-muted hover:text-text underline-offset-4 hover:underline ml-1">
                  {allColors ? "Ẩn bớt màu" : `Màu khác (${others.length})`}
                </button>
              )}
            </div>
            {premium && allColors && (
              <div className="flex items-center gap-2.5 mt-3 flex-wrap">
                {others.map((id) => (
                  <Dot key={id} id={id} active={palette === id} locked={false} onPick={() => onChange(template, id)} />
                ))}
              </div>
            )}
            {!premium && <p className="text-xs text-muted mt-2">Gói Miễn phí dùng mẫu Thư ngà, màu Ngà và đỏ đô.</p>}
          </div>

          <div className="flex items-center gap-2 mt-5 flex-wrap">
            <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-surface hover:bg-surface-hover hover:border-border-hover text-sm font-medium">
              Đổi mẫu thiệp
            </button>
            <button type="button" onClick={() => setTryCurrent(true)} className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm text-muted hover:text-text hover:bg-surface-hover">
              Xem thử toàn màn hình
            </button>
          </div>
        </div>
      </div>

      {tryCurrent && event.id && (
        <TryOn eventId={event.id} id={template} palette={palette} locked={false} isCurrent onUse={() => setTryCurrent(false)} onClose={() => setTryCurrent(false)} />
      )}

      {open && (
        <Gallery
          event={event}
          cover={cover}
          second={second}
          current={template}
          currentPalette={palette}
          premium={premium}
          onClose={() => setOpen(false)}
          onPick={(id, pal) => {
            onChange(id, pal)
            setOpen(false)
          }}
        />
      )}
    </section>
  )
}

function Gallery({
  event,
  cover,
  second,
  current,
  currentPalette,
  premium,
  onClose,
  onPick,
}: {
  event: any
  cover?: string
  second?: string
  current: InviteStyle
  currentPalette: string
  premium: boolean
  onClose: () => void
  onPick: (id: InviteStyle, palette: string) => void
}) {
  const [group, setGroup] = useState<TemplateGroup | "all">("all")
  const [trying, setTrying] = useState<{ id: InviteStyle; palette: string } | null>(null)
  const ids = (Object.keys(TEMPLATES) as InviteStyle[]).filter((id) => group === "all" || TEMPLATES[id].group === group)
  // the color each card is showing (starts at the template's default, or the current color for the current template)
  const [shown, setShown] = useState<Record<string, string>>(() => ({ [current]: currentPalette }))
  const groups = useMemo(() => (Object.keys(TEMPLATE_GROUPS) as TemplateGroup[]).filter((g) => Object.values(TEMPLATES).some((t) => t.group === g)), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[80] bg-bg flex flex-col" role="dialog" aria-modal="true" aria-label="Chọn mẫu thiệp">
      <style>{`.wt-thumb section{min-height:${PHONE_H}px!important}`}</style>
      <header className="shrink-0 border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <h2 className="font-serif text-[20px] text-text">Chọn mẫu thiệp</h2>
          <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm text-muted hover:text-text hover:bg-surface-hover" aria-label="Đóng">
            <Icon name="close" size={16} /> Đóng
          </button>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_85%,transparent)] sm:[mask-image:none]">
          {(["all", ...groups] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(g)}
              className={"shrink-0 h-8 px-3.5 rounded-lg text-sm border transition-colors " + (group === g ? "bg-text text-surface border-text" : "bg-surface border-border text-text hover:border-border-hover")}
            >
              {g === "all" ? "Tất cả" : TEMPLATE_GROUPS[g]}
            </button>
          ))}
        </div>
      </header>

      {trying && (
        <TryOn
          eventId={event.id}
          id={trying.id}
          palette={trying.palette}
          locked={!premium && !TEMPLATES[trying.id].free}
          isCurrent={trying.id === current && trying.palette === currentPalette}
          onUse={() => onPick(trying.id, trying.palette)}
          onClose={() => setTrying(null)}
        />
      )}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {ids.map((id) => {
            const t = TEMPLATES[id]
            const locked = !premium && !t.free
            const pal = premium ? shown[id] ?? t.palette : "classic"
            const isCurrent = id === current
            return (
              <div key={id} className="min-w-0">
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => onPick(id, pal)}
                  className={"group relative block w-full rounded-xl overflow-hidden text-left transition-shadow " + (isCurrent ? "ring-2 ring-brand" : "ring-1 ring-border hover:ring-border-hover") + (locked ? " cursor-not-allowed" : "")}
                  aria-label={`Dùng mẫu ${t.label}`}
                >
                  <Thumb>
                    <TemplateCover id={id} palette={pal} event={event} cover={cover} second={second} />
                  </Thumb>
                  {locked && (
                    <span className="absolute inset-0 bg-black/35 flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-3 py-1.5 text-sm text-text">
                        <Icon name="lock" size={14} /> Premium
                      </span>
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-brand text-white px-2 py-1 text-xs font-medium">
                      <Icon name="check" size={12} /> Đang dùng
                    </span>
                  )}
                  {!locked && !isCurrent && (
                    <span className="absolute inset-x-3 bottom-3 rounded-lg bg-surface/95 py-2 text-center text-sm font-medium text-text opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                      Dùng mẫu này
                    </span>
                  )}
                </button>
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <p className="font-medium text-[15px] text-text truncate">{t.label}</p>
                  <p className="text-xs text-muted shrink-0">{t.free ? "Miễn phí" : "Premium"}</p>
                </div>
                {premium && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {t.palettes.filter((p) => THEMES[p]).map((p) => (
                      <Dot key={p} id={p} active={pal === p} locked={false} onPick={() => setShown((s) => ({ ...s, [id]: p }))} />
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted mt-2 leading-relaxed line-clamp-2">{t.desc}</p>
                <button type="button" onClick={() => setTrying({ id, palette: pal })} className="mt-2 inline-flex items-center h-8 px-3 rounded-lg border border-border bg-surface hover:border-border-hover text-sm text-text">
                  Xem thử
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}
