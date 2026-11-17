"use client"

// Overview guidance: the preparation journey (auto-detected steps with wedding-date milestones)
// and smart suggestions that can be snoozed for a week.
import { useEffect, useState } from "react"
import Icon from "@/components/ui/Icon"
import { journey, snooze, suggestions } from "@/lib/eventHealth"
import { phaseDue, PHASES } from "@/lib/checklistTemplate"
import type { GuideState } from "@/lib/eventHealth"

const COLLAPSE_KEY = "wt-journey-collapsed"

export function JourneyCard({ ev }: { ev: any }) {
  const { steps, done, next, stage, past } = journey(ev)
  const total = steps.length
  const pct = Math.round((done / total) * 100)
  const allDone = done === total
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSE_KEY + ev.id)
      // a wedding that already happened starts collapsed
      setCollapsed(saved ? saved === "1" : past)
    } catch {
      setCollapsed(past)
    }
  }, [ev.id, past])
  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY + ev.id, c ? "0" : "1")
      } catch {}
      return !c
    })
  }
  const showList = !collapsed && !allDone

  return (
    <section className="bg-surface border border-border rounded-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-[15px]">Hành trình chuẩn bị</h2>
          <p className="text-sm text-muted mt-0.5">{stage}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-serif text-3xl leading-none tabular-nums">{pct}%</p>
          <p className="text-xs text-muted mt-1">
            {done}/{total} bước
          </p>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-surface-alt overflow-hidden mt-4" aria-hidden>
        <div className="h-full bg-brand rounded-full transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>

      {allDone ? (
        <p className="text-sm text-success mt-4 flex items-center gap-2">
          <Icon name="check" size={16} /> Đã xong mọi bước. Chúc hai bạn một ngày cưới thật vui.
        </p>
      ) : (
        <>
          {/* next step stays visible even when collapsed */}
          {collapsed && next && !past && <NextLine step={next} />}
          {showList && (
            <ol className="mt-3 -mx-5">
              {steps.map((s, i) => {
                const isNext = s === next
                return (
                  <li
                    key={s.key}
                    className={"flex items-center gap-3 px-5 py-3 border-t border-border " + (isNext ? "bg-brand-soft/60" : "")}
                  >
                    <span
                      className={
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 " +
                        (s.done ? "bg-success/10 text-success" : isNext ? "bg-brand text-white" : "border border-border text-muted")
                      }
                    >
                      {s.done ? <Icon name="check" size={14} /> : i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={"text-sm " + (s.done ? "text-muted line-through decoration-border-hover" : "text-text font-medium")}>
                        {s.title}
                        {isNext && <span className="ml-2 align-middle inline-flex h-5 px-1.5 items-center rounded text-[11px] font-medium bg-brand text-white no-underline">Việc tiếp theo</span>}
                      </p>
                      <p className="text-xs text-muted mt-0.5 truncate">
                        {s.desc}
                        {!s.done && s.dueText && (
                          <span className={s.late ? " text-error" : ""}>
                            {" · "}
                            {s.late ? "đã quá mốc " : "nên xong "}
                            {s.dueText}
                          </span>
                        )}
                      </p>
                    </div>
                    {!s.done && (
                      <a
                        href={s.href}
                        className={
                          "shrink-0 inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium " +
                          (isNext ? "bg-brand text-white hover:bg-brand-hover" : "border border-border text-text hover:bg-surface-hover")
                        }
                      >
                        {s.cta}
                      </a>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
          <button onClick={toggle} className="mt-3 text-xs text-muted hover:text-text inline-flex items-center gap-1">
            {collapsed ? "Xem tất cả các bước" : "Thu gọn"}
            <Icon name="chevronDown" size={14} className={collapsed ? "" : "rotate-180"} />
          </button>
        </>
      )}
    </section>
  )
}

function NextLine({ step }: { step: ReturnType<typeof journey>["steps"][number] }) {
  return (
    <a href={step.href} className="mt-4 flex items-center gap-3 rounded-lg bg-brand-soft/60 px-3 py-2.5 hover:bg-brand-soft group">
      <span className="text-[11px] font-medium text-brand shrink-0">Việc tiếp theo</span>
      <span className="text-sm font-medium text-text flex-1 truncate">{step.title}</span>
      <Icon name="arrowRight" size={16} className="text-brand" />
    </a>
  )
}

export function SuggestionList({ ev, onSaved }: { ev: any; onSaved?: (state: GuideState) => void }) {
  const [state, setState] = useState<GuideState | null>(ev.guide_state ?? null)
  useEffect(() => setState(ev.guide_state ?? null), [ev.id, ev.guide_state])
  const tips = suggestions(ev, state)

  async function later(key: string) {
    const next = snooze(state, key)
    setState(next)
    onSaved?.(next)
    await fetch(`/api/events/${ev.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ guide_state: next }) }).catch(() => {})
  }

  return (
    <section className="bg-surface border border-border rounded-card p-5">
      <h2 className="font-semibold text-[15px]">Gợi ý cho bạn</h2>
      {tips.length === 0 ? (
        <p className="text-sm text-muted mt-3 flex items-center gap-2">
          <Icon name="check" size={16} className="text-success" /> Không có gì cần lưu ý lúc này.
        </p>
      ) : (
        <div className="mt-1 -mx-5">
          {tips.map((t) => (
            <div key={t.key} className="flex gap-3 px-5 py-3.5 border-t border-border first:border-t-0">
              <span className={"w-8 h-8 rounded-lg flex items-center justify-center shrink-0 " + (t.tone === "warn" ? "bg-error/10 text-error" : "bg-surface-alt text-muted")}>
                <Icon name={t.icon} size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text">{t.title}</p>
                <p className="text-xs text-muted mt-0.5 leading-relaxed">{t.desc}</p>
                <div className="flex items-center gap-1 mt-2 -ml-2">
                  <a href={t.href} className="inline-flex items-center h-7 px-2 rounded-md text-xs font-medium text-brand hover:bg-brand-soft">
                    {t.cta}
                  </a>
                  <button onClick={() => later(t.key)} className="inline-flex items-center h-7 px-2 rounded-md text-xs text-muted hover:text-text hover:bg-surface-hover">
                    Để sau
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/**
 * Overview card: checklist progress and the next few tasks by due date (overdue first), tickable here.
 * Without a checklist yet it invites the couple to create one.
 */
export function UpcomingCard({ ev }: { ev: any }) {
  const [items, setItems] = useState<any[] | null>(null)
  useEffect(() => {
    setItems(null)
    fetch(`/api/events/${ev.id}/checklist`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
  }, [ev.id])
  if (!items) return <section className="bg-surface border border-border rounded-card p-5 h-[132px]" />

  const steps = journey(ev).steps
  const isDone = (i: any) => (i.auto_key ? !!steps.find((s) => s.key === i.auto_key)?.done : i.done)
  if (items.length === 0) {
    return (
      <section className="bg-surface border border-border rounded-card p-5 flex items-center gap-4 flex-wrap">
        <span className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
          <Icon name="check" size={20} />
        </span>
        <div className="flex-1 min-w-[220px]">
          <h2 className="font-semibold text-[15px]">Checklist đám cưới</h2>
          <p className="text-sm text-muted mt-0.5">Trả lời 3 câu về vùng miền và các lễ, WedTable soạn sẵn danh sách việc kèm hạn cho từng việc.</p>
        </div>
        <a href="/checklist" className="h-10 px-4 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover inline-flex items-center">
          Tạo checklist
        </a>
      </section>
    )
  }
  const total = items.length
  const done = items.filter(isDone).length
  const pct = Math.round((done / total) * 100)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const order = (p: string) => PHASES.findIndex((x) => x.key === p)
  const next = items
    .filter((i) => !isDone(i))
    .sort((a, b) => order(a.phase) - order(b.phase) || a.sort - b.sort)
    .slice(0, 5)
  async function tick(i: any) {
    setItems((list) => list!.map((x) => (x.id === i.id ? { ...x, done: true } : x)))
    await fetch(`/api/events/${ev.id}/checklist/${i.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: true }) })
  }
  return (
    <section className="bg-surface border border-border rounded-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-[15px]">Việc sắp tới</h2>
          <p className="text-sm text-muted mt-0.5">
            {done}/{total} việc trong checklist đã xong
          </p>
        </div>
        <p className="font-serif text-3xl leading-none tabular-nums">{pct}%</p>
      </div>
      <div className="h-1.5 rounded-full bg-surface-alt overflow-hidden mt-3" aria-hidden>
        <div className="h-full bg-brand rounded-full transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      {next.length === 0 ? (
        <p className="text-sm text-success mt-4 flex items-center gap-2">
          <Icon name="check" size={16} /> Đã xong mọi việc trong checklist.
        </p>
      ) : (
        <ul className="mt-3 -mx-5">
          {next.map((i) => {
            const due = phaseDue(i.phase, ev.event_date)
            const late = due && due.getTime() < today.getTime()
            const step = i.auto_key ? steps.find((s) => s.key === i.auto_key) : null
            return (
              <li key={i.id} className="flex items-center gap-3 px-5 py-2.5 border-t border-border">
                {step ? (
                  <a href={step.href} className="w-4 h-4 rounded border border-border-hover shrink-0" title="WedTable tự đánh dấu khi bạn làm xong trong app" />
                ) : (
                  <input type="checkbox" className="w-4 h-4 shrink-0 accent-[rgb(var(--brand-rgb))]" onChange={() => tick(i)} aria-label="Đánh dấu xong" />
                )}
                <span className="flex-1 min-w-0 text-sm text-text truncate">{i.title}</span>
                <span className="text-xs text-muted shrink-0">{i.owner}</span>
                {due && <span className={"text-xs shrink-0 tabular-nums " + (late ? "text-error" : "text-muted")}>{late ? "quá hạn" : `${String(due.getDate()).padStart(2, "0")}/${String(due.getMonth() + 1).padStart(2, "0")}`}</span>}
              </li>
            )
          })}
        </ul>
      )}
      <a href="/checklist" className="mt-3 inline-flex items-center gap-1 text-sm text-brand hover:underline underline-offset-4">
        Xem cả checklist <Icon name="arrowRight" size={14} />
      </a>
    </section>
  )
}
