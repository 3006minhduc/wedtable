"use client"

// Overview guidance: the preparation journey (auto-detected steps with wedding-date milestones)
// and smart suggestions that can be snoozed for a week.
import { useEffect, useState } from "react"
import Icon from "@/components/ui/Icon"
import { journey, snooze, suggestions } from "@/lib/eventHealth"
import type { GuideState } from "@/lib/eventHealth"

const COLLAPSE_KEY = "wt-journey-collapsed"

export function JourneyCard({ ev }: { ev: any }) {
  const { steps, done, next, stage } = journey(ev)
  const total = steps.length
  const pct = Math.round((done / total) * 100)
  const allDone = done === total
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY + ev.id) === "1")
    } catch {}
  }, [ev.id])
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
          {collapsed && next && <NextLine step={next} />}
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
