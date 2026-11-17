"use client"

// Wedding checklist: built from a template the first time (region, ceremonies, party venue), then
// fully the couple's own: tick, reassign, rename, add, delete. Items with an auto_key are ticked by
// WedTable itself from the event's data (same detection as the overview journey).
import { useCallback, useEffect, useState } from "react"
import Icon from "@/components/ui/Icon"
import { useEvents } from "@/lib/useEvents"
import { journey } from "@/lib/eventHealth"
import { CEREMONIES, OWNERS, PHASES, phaseDue, REGIONS, VENUES } from "@/lib/checklistTemplate"
import type { ChecklistSetup } from "@/lib/checklistTemplate"

type Item = { id: string; phase: string; title: string; note: string; owner: string; ceremony: string | null; auto_key: string | null; done: boolean }

const fmt = (d: Date) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`

export default function ChecklistPage() {
  const { eventId, loading } = useEvents()
  const [detail, setDetail] = useState<any>(null)
  const [items, setItems] = useState<Item[] | null>(null)
  const [setup, setSetup] = useState<ChecklistSetup | null>(null)
  const [editingSetup, setEditingSetup] = useState(false)
  const [filter, setFilter] = useState("Tất cả")
  const [hideDone, setHideDone] = useState(false)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!eventId) return
    const [a, b] = await Promise.all([fetch(`/api/events/${eventId}`), fetch(`/api/events/${eventId}/checklist`)])
    if (a.ok) setDetail(await a.json())
    if (b.ok) {
      const d = await b.json()
      setItems(d.items)
      setSetup(d.setup)
    } else {
      setItems([])
      setError((await b.json().catch(() => ({}))).message ?? "Không tải được checklist")
    }
  }, [eventId])
  useEffect(() => {
    load()
  }, [load])

  if (loading || !items) return <p className="text-muted">Đang tải...</p>
  if (!eventId) return <p className="text-muted">Bạn chưa có sự kiện nào. Tạo ở trang Tổng quan.</p>

  async function build(s: ChecklistSetup) {
    const res = await fetch(`/api/events/${eventId}/checklist`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ setup: s }) })
    const d = await res.json()
    if (!res.ok) return setError(d.message ?? "Không tạo được checklist")
    setItems(d.items)
    setSetup(d.setup)
    setEditingSetup(false)
    setError("")
  }

  if (items.length === 0 || editingSetup) {
    return (
      <div className="flex flex-col gap-6 max-w-3xl">
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-text">Checklist đám cưới</h1>
          <p className="text-sm text-muted mt-1">Trả lời 3 câu, WedTable soạn danh sách việc theo đúng phong tục và các lễ của hai bạn. Sửa, thêm, bớt thoải mái sau đó.</p>
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        <SetupForm initial={setup} rebuilding={items.length > 0} onSubmit={build} onCancel={items.length > 0 ? () => setEditingSetup(false) : undefined} />
      </div>
    )
  }

  const steps = detail ? journey(detail).steps : []
  const autoDone = (k: string | null) => !!k && !!steps.find((s) => s.key === k)?.done
  const autoHref = (k: string | null) => steps.find((s) => s.key === k)?.href ?? "/"
  const isDone = (i: Item) => (i.auto_key ? autoDone(i.auto_key) : i.done)
  const total = items.length
  const done = items.filter(isDone).length
  const pct = Math.round((done / total) * 100)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdue = items.filter((i) => !isDone(i) && (phaseDue(i.phase, detail?.event_date)?.getTime() ?? Infinity) < today.getTime()).length

  async function patch(id: string, body: Partial<Item>) {
    setItems((list) => list!.map((x) => (x.id === id ? { ...x, ...body } : x)))
    await fetch(`/api/events/${eventId}/checklist/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  }
  async function remove(id: string) {
    setItems((list) => list!.filter((x) => x.id !== id))
    await fetch(`/api/events/${eventId}/checklist/${id}`, { method: "DELETE" })
  }
  async function add(phase: string, title: string) {
    const res = await fetch(`/api/events/${eventId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item: { phase, title, owner: filter === "Tất cả" ? "Cả hai" : filter } }),
    })
    if (res.ok) {
      const row = await res.json()
      setItems((list) => [...list!, row])
    }
  }

  const region = REGIONS.find((r) => r.key === setup?.region)?.label

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-[28px] leading-tight text-text">Checklist đám cưới</h1>
          <p className="text-sm text-muted mt-1">
            {region ? `${region} · ` : ""}
            {(setup?.ceremonies ?? []).map((c) => CEREMONIES.find((x) => x.key === c)?.label).filter(Boolean).join(", ")}
          </p>
        </div>
        <button onClick={() => setEditingSetup(true)} className="h-9 px-3 rounded-lg border border-border bg-surface text-sm hover:bg-surface-hover">
          Sửa vùng miền và các lễ
        </button>
      </div>

      <section className="bg-surface border border-border rounded-card p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-serif text-3xl tabular-nums">
              {done}
              <span className="text-faint text-xl"> / {total} việc</span>
            </p>
            <p className="text-sm text-muted mt-1">{overdue > 0 ? <span className="text-error">{overdue} việc đã quá hạn</span> : "Không có việc nào quá hạn"}</p>
          </div>
          <p className="font-serif text-3xl tabular-nums">{pct}%</p>
        </div>
        <div className="h-1.5 rounded-full bg-surface-alt overflow-hidden mt-3">
          <div className="h-full bg-brand rounded-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-4">
          {["Tất cả", ...OWNERS].map((o) => (
            <button
              key={o}
              onClick={() => setFilter(o)}
              className={"h-8 px-3 rounded-full text-xs border " + (filter === o ? "bg-text text-surface border-text" : "border-border text-muted hover:text-text bg-surface")}
            >
              {o}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-xs text-muted cursor-pointer">
            <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> Ẩn việc đã xong
          </label>
        </div>
      </section>

      {PHASES.map((p) => {
        const list = items.filter((i) => i.phase === p.key && (filter === "Tất cả" || i.owner === filter) && !(hideDone && isDone(i)))
        const all = items.filter((i) => i.phase === p.key)
        const due = phaseDue(p.key, detail?.event_date)
        const late = due && due.getTime() < today.getTime() && all.some((i) => !isDone(i))
        return (
          <section key={p.key} className="bg-surface border border-border rounded-card p-5">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <h2 className="font-semibold text-[15px] text-text">{p.label}</h2>
              <span className={"text-xs " + (late ? "text-error" : "text-muted")}>
                {all.filter(isDone).length}/{all.length} xong{due ? ` · ${p.key === "d0" ? "ngày" : p.key === "after" ? "tới" : "trước"} ${fmt(due)}` : ""}
                {late ? " · quá hạn" : ""}
              </span>
            </div>
            <div className="mt-2 -mx-5">
              {list.map((i) => (
                <Row key={i.id} item={i} done={isDone(i)} autoHref={i.auto_key ? autoHref(i.auto_key) : null} onPatch={(b) => patch(i.id, b)} onRemove={() => remove(i.id)} />
              ))}
              {list.length === 0 && <p className="px-5 py-3 text-sm text-muted border-t border-border">Không có việc nào{filter !== "Tất cả" ? ` của ${filter}` : ""}.</p>}
            </div>
            <AddItem onAdd={(t) => add(p.key, t)} />
          </section>
        )
      })}
    </div>
  )
}

function Row({ item, done, autoHref, onPatch, onRemove }: { item: Item; done: boolean; autoHref: string | null; onPatch: (b: Partial<Item>) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const cer = CEREMONIES.find((c) => c.key === item.ceremony)?.label
  return (
    <div className="flex items-start gap-3 px-5 py-3 border-t border-border group">
      <input
        type="checkbox"
        className="mt-1 w-4 h-4 accent-[rgb(var(--brand-rgb))] shrink-0"
        checked={done}
        disabled={!!autoHref}
        title={autoHref ? "WedTable tự đánh dấu khi bạn làm xong việc này trong app" : undefined}
        onChange={(e) => onPatch({ done: e.target.checked })}
        aria-label="Đánh dấu xong"
      />
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            className="w-full border border-border rounded-md h-8 px-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              setEditing(false)
              if (title.trim() && title !== item.title) onPatch({ title: title.trim() })
              else setTitle(item.title)
            }}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          />
        ) : (
          <p className={"text-sm " + (done ? "text-muted line-through" : "text-text")} onDoubleClick={() => !autoHref && setEditing(true)}>
            {item.title}
            {autoHref && (
              <a href={autoHref} className="ml-2 align-middle inline-flex h-5 px-1.5 items-center rounded text-[11px] bg-success/10 text-success no-underline">
                WedTable tự đánh dấu
              </a>
            )}
            {cer && <span className="ml-2 align-middle inline-flex h-5 px-1.5 items-center rounded text-[11px] bg-surface-alt text-muted">{cer}</span>}
          </p>
        )}
        {item.note && <p className="text-xs text-muted mt-0.5 leading-relaxed">{item.note}</p>}
      </div>
      <select
        value={item.owner}
        onChange={(e) => onPatch({ owner: e.target.value })}
        className="h-8 text-xs border border-border rounded-md bg-surface px-1.5 shrink-0"
        aria-label="Người phụ trách"
      >
        {OWNERS.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      {!autoHref && (
        <div className="flex shrink-0 opacity-60 group-hover:opacity-100">
          <button onClick={() => setEditing(true)} className="w-8 h-8 rounded-md text-muted hover:text-text hover:bg-surface-hover text-xs" aria-label="Sửa tên việc">
            Sửa
          </button>
          <button onClick={onRemove} className="w-8 h-8 rounded-md text-muted hover:text-error hover:bg-surface-hover flex items-center justify-center" aria-label="Xoá việc">
            <Icon name="trash" size={15} />
          </button>
        </div>
      )}
    </div>
  )
}

function AddItem({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [v, setV] = useState("")
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (!v.trim()) return
    setBusy(true)
    await onAdd(v.trim())
    setV("")
    setBusy(false)
  }
  return (
    <div className="flex gap-2 mt-3">
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Thêm việc riêng của bạn…"
        className="flex-1 border border-border rounded-lg h-9 px-3 text-sm bg-surface focus:border-brand focus:outline-none"
      />
      <button onClick={submit} disabled={busy || !v.trim()} className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-surface-hover disabled:opacity-50">
        Thêm
      </button>
    </div>
  )
}

function SetupForm({ initial, rebuilding, onSubmit, onCancel }: { initial: ChecklistSetup | null; rebuilding: boolean; onSubmit: (s: ChecklistSetup) => Promise<void>; onCancel?: () => void }) {
  const [region, setRegion] = useState(initial?.region ?? "bac")
  const [cer, setCer] = useState<Set<string>>(new Set(initial?.ceremonies ?? ["danngo", "anhoi", "giatien", "tiec"]))
  const [venue, setVenue] = useState(initial?.venue ?? "nhahang")
  const [busy, setBusy] = useState(false)
  const chip = (on: boolean) => "rounded-lg border px-3 py-2 text-left text-sm transition-colors " + (on ? "border-brand bg-brand-soft text-brand" : "border-border hover:border-border-hover text-text")
  return (
    <div className="bg-surface border border-border rounded-card p-6 flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-text">1. Đám cưới theo phong tục miền nào?</p>
        <p className="text-xs text-muted mt-0.5">Lễ nghi, số tráp và cách gọi các lễ khác nhau giữa các miền.</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {REGIONS.map((r) => (
            <button key={r.key} onClick={() => setRegion(r.key)} className={chip(region === r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-text">2. Hai bạn tổ chức những lễ nào?</p>
        <div className="grid sm:grid-cols-3 gap-2 mt-3">
          {CEREMONIES.map((c) => {
            const on = cer.has(c.key)
            return (
              <button
                key={c.key}
                onClick={() => setCer((s) => {
                  const n = new Set(s)
                  if (n.has(c.key)) n.delete(c.key)
                  else n.add(c.key)
                  return n
                })}
                className={chip(on)}
              >
                <span className="flex items-center gap-1.5 font-medium">
                  {on && <Icon name="check" size={14} />}
                  {c.label}
                </span>
                <span className="block text-xs text-muted mt-0.5">{c.desc}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-text">3. Tiệc cưới tổ chức ở đâu?</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {VENUES.map((v) => (
            <button key={v.key} onClick={() => setVenue(v.key)} className={chip(venue === v.key)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>
      {rebuilding && <p className="text-xs text-muted">Soạn lại sẽ thay danh sách theo lựa chọn mới. Việc đã tick và người phụ trách của các việc giống tên được giữ lại; việc bạn tự thêm sẽ mất.</p>}
      <div className="flex items-center gap-2">
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            await onSubmit({ region, ceremonies: Array.from(cer) as any, venue })
            setBusy(false)
          }}
          className="h-10 px-5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-60"
        >
          {busy ? "Đang soạn…" : rebuilding ? "Soạn lại checklist" : "Tạo checklist"}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="h-10 px-4 rounded-lg text-sm text-muted hover:text-text hover:bg-surface-hover">
            Hủy
          </button>
        )}
      </div>
    </div>
  )
}
