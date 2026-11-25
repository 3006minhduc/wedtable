"use client"

// Editors on /invitation for the migration-024 content: ceremonies, gift accounts per family,
// love-story milestones, and guestbook moderation.
import { useEffect, useState } from "react"
import Icon from "@/components/ui/Icon"

const field =
  "border border-border rounded-lg h-9 px-2.5 text-sm bg-surface w-full hover:border-border-hover focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/10"
const addBtn = "inline-flex items-center gap-1.5 border border-border bg-surface hover:bg-surface-hover hover:border-border-hover rounded-lg h-9 px-3 text-sm w-fit"
const removeBtn = "w-9 h-9 shrink-0 rounded-lg text-muted hover:text-error hover:bg-surface flex items-center justify-center"

export type Ceremony = { name: string; date: string; time: string; place: string; address: string }
export type GiftAccount = { side: "groom" | "bride"; bank: string; number: string; holder: string; qr?: string }
export type Milestone = { year: string; title: string; text: string }

// ---------------------------------------------------------------- ceremonies

const CEREMONY_PRESETS: Ceremony[] = [
  { name: "Lễ vu quy", date: "", time: "08:00", place: "Tư gia nhà gái", address: "" },
  { name: "Lễ thành hôn", date: "", time: "10:00", place: "Tư gia nhà trai", address: "" },
]

export function CeremonyEditor({ items, onChange, weddingDate }: { items: Ceremony[]; onChange: (v: Ceremony[]) => void; weddingDate?: string }) {
  const update = (i: number, patch: Partial<Ceremony>) => onChange(items.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && (
        <button type="button" onClick={() => onChange(CEREMONY_PRESETS.map((c) => ({ ...c, date: weddingDate ?? "" })))} className="text-left text-sm text-muted bg-surface-alt rounded-lg p-3 hover:text-text">
          Chưa có lễ nào. <span className="underline">Thêm sẵn Lễ vu quy và Lễ thành hôn</span> rồi sửa giờ, nơi tổ chức.
        </button>
      )}
      {items.map((c, i) => (
        <div key={i} className="bg-surface-alt rounded-lg p-3 flex gap-2 items-start">
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_0.8fr] gap-2">
            <input className={field + " col-span-2 sm:col-span-1"} list="ceremony-names" placeholder="Tên lễ" value={c.name} onChange={(e) => update(i, { name: e.target.value })} />
            <input className={field} type="date" value={c.date} onChange={(e) => update(i, { date: e.target.value })} aria-label="Ngày" />
            <input className={field} type="time" value={c.time} onChange={(e) => update(i, { time: e.target.value })} aria-label="Giờ" />
            <input className={field + " col-span-2 sm:col-span-1"} placeholder="Nơi tổ chức (vd. Tư gia nhà gái)" value={c.place} onChange={(e) => update(i, { place: e.target.value })} />
            <input className={field + " col-span-2"} placeholder="Địa chỉ" value={c.address} onChange={(e) => update(i, { address: e.target.value })} />
          </div>
          <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className={removeBtn} aria-label="Xóa lễ">
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
      <datalist id="ceremony-names">
        {["Lễ dạm ngõ", "Lễ ăn hỏi", "Lễ vu quy", "Lễ thành hôn", "Lễ gia tiên", "Lễ rước dâu", "Tiệc cưới nhà gái", "Tiệc cưới nhà trai"].map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <button type="button" onClick={() => onChange([...items, { name: "", date: weddingDate ?? "", time: "", place: "", address: "" }])} className={addBtn}>
        <Icon name="plus" size={14} /> Thêm lễ
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- gift accounts

export function GiftEditor({ items, onChange, upload }: { items: GiftAccount[]; onChange: (v: GiftAccount[]) => void; upload: (file: File, name: string) => Promise<string> }) {
  const sides: GiftAccount["side"][] = ["groom", "bride"]
  const get = (side: GiftAccount["side"]) => items.find((a) => a.side === side) ?? { side, bank: "", number: "", holder: "", qr: "" }
  const set = (side: GiftAccount["side"], patch: Partial<GiftAccount>) => {
    const next = sides.map((s) => (s === side ? { ...get(s), ...patch } : get(s)))
    onChange(next.filter((a) => a.bank || a.number || a.holder || a.qr))
  }
  const [busy, setBusy] = useState<string | null>(null)
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {sides.map((side) => {
        const a = get(side)
        return (
          <div key={side} className="bg-surface-alt rounded-lg p-3 flex flex-col gap-2">
            <p className="text-sm font-medium text-text">{side === "groom" ? "Nhà trai (mừng chú rể)" : "Nhà gái (mừng cô dâu)"}</p>
            <input className={field} placeholder="Ngân hàng (vd. Vietcombank)" value={a.bank} onChange={(e) => set(side, { bank: e.target.value })} />
            <input className={field} inputMode="numeric" placeholder="Số tài khoản" value={a.number} onChange={(e) => set(side, { number: e.target.value })} />
            <input className={field} placeholder="Chủ tài khoản" value={a.holder} onChange={(e) => set(side, { holder: e.target.value.toUpperCase() })} />
            <div className="flex items-center gap-2">
              {a.qr && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.qr} alt="QR" className="w-14 h-14 object-contain bg-white rounded border border-border" />
              )}
              <label className={addBtn + " cursor-pointer"}>
                <Icon name="qr" size={14} /> {busy === side ? "Đang tải…" : a.qr ? "Đổi ảnh QR" : "Tải ảnh QR"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ""
                    if (!f) return
                    setBusy(side)
                    try {
                      set(side, { qr: await upload(f, `gift-${side}-${Date.now()}.jpg`) })
                    } finally {
                      setBusy(null)
                    }
                  }}
                />
              </label>
              {a.qr && (
                <button type="button" onClick={() => set(side, { qr: "" })} className="text-sm text-error hover:underline underline-offset-4">
                  Bỏ QR
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------- love-story milestones

export function MilestoneEditor({ items, onChange }: { items: Milestone[]; onChange: (v: Milestone[]) => void }) {
  const update = (i: number, patch: Partial<Milestone>) => onChange(items.map((m, idx) => (idx === i ? { ...m, ...patch } : m)))
  return (
    <div className="flex flex-col gap-2">
      {items.map((m, i) => (
        <div key={i} className="bg-surface-alt rounded-lg p-2 flex gap-2 items-start">
          <div className="flex-1 grid grid-cols-[90px_1fr] gap-2">
            <input className={field} placeholder="Năm" value={m.year} onChange={(e) => update(i, { year: e.target.value })} />
            <input className={field} placeholder="Mốc (vd. Lần đầu gặp nhau)" value={m.title} onChange={(e) => update(i, { title: e.target.value })} />
            <textarea className={field + " col-span-2 h-auto py-2"} rows={2} placeholder="Vài dòng kể lại (không bắt buộc)" value={m.text} onChange={(e) => update(i, { text: e.target.value })} />
          </div>
          <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className={removeBtn} aria-label="Xóa mốc">
            <Icon name="close" size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { year: "", title: "", text: "" }])} className={addBtn}>
        <Icon name="plus" size={14} /> Thêm mốc
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- guestbook moderation

type WishRow = { id: string; name: string; message: string; hidden: boolean; pinned: boolean; created_at: string }

export function WishesManager({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<WishRow[] | null>(null)
  const [err, setErr] = useState("")
  useEffect(() => {
    fetch(`/api/events/${eventId}/wishes`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject((await r.json()).message)))
      .then(setRows)
      .catch((e) => setErr(String(e || "Không tải được lời chúc")))
  }, [eventId])
  async function patch(id: string, body: Partial<WishRow>) {
    setRows((rs) => rs?.map((w) => (w.id === id ? { ...w, ...body } : w)) ?? rs)
    await fetch(`/api/events/${eventId}/wishes`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) })
  }
  async function remove(id: string) {
    if (!confirm("Xóa hẳn lời chúc này?")) return
    setRows((rs) => rs?.filter((w) => w.id !== id) ?? rs)
    await fetch(`/api/events/${eventId}/wishes?wish=${id}`, { method: "DELETE" })
  }
  if (err) return <p className="text-sm text-error">{err}</p>
  if (!rows) return <p className="text-sm text-muted">Đang tải…</p>
  if (!rows.length) return <p className="text-sm text-muted">Chưa có lời chúc nào. Khách gửi ở cuối thiệp, lời chúc sẽ hiện ở đây.</p>
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((w) => (
        <li key={w.id} className={"rounded-lg border border-border p-3 " + (w.hidden ? "opacity-50" : "")}>
          <p className="text-sm text-text">“{w.message}”</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted flex-wrap">
            <span className="font-medium text-text">{w.name}</span>
            <span>{new Date(w.created_at).toLocaleString("vi-VN")}</span>
            <button type="button" onClick={() => patch(w.id, { pinned: !w.pinned })} className="hover:text-text underline-offset-4 hover:underline">
              {w.pinned ? "Bỏ ghim" : "Ghim lên đầu"}
            </button>
            <button type="button" onClick={() => patch(w.id, { hidden: !w.hidden })} className="hover:text-text underline-offset-4 hover:underline">
              {w.hidden ? "Hiện lại" : "Ẩn khỏi thiệp"}
            </button>
            <button type="button" onClick={() => remove(w.id)} className="text-error hover:underline underline-offset-4">
              Xóa
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
