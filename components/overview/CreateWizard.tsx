"use client"

// New wedding in 4 short questions (names → when/where → guests and hall → invitation style).
// On finish it creates the event, sets the hall and builds a sample seating plan, so the user
// lands on an overview that already has something to look at.
import { useState } from "react"
import Icon from "@/components/ui/Icon"
import { estimateTables, HALL_PRESETS, sampleLayout } from "@/lib/hall"
import { TEMPLATES, THEMES, DEFAULT_TEMPLATE } from "@/lib/inviteThemes"
import type { InviteStyle } from "@/lib/inviteThemes"

const STEPS = ["Cô dâu chú rể", "Thời gian, địa điểm", "Khách và hội trường", "Phong cách thiệp"]

export default function CreateWizard({ onCreated, onCancel, onDemo }: { onCreated: (id: string) => void; onCancel?: () => void; onDemo?: () => void }) {
  const [step, setStep] = useState(0)
  const [f, setF] = useState({
    bride_name: "",
    groom_name: "",
    event_date: "",
    event_time: "18:00",
    venue_name: "",
    venue_address: "",
    guests: "150",
    seats: "10",
    hall: "24x16",
    buildPlan: true,
    template: DEFAULT_TEMPLATE as InviteStyle,
  })
  const [err, setErr] = useState("")
  const [saving, setSaving] = useState("")
  const set = (k: keyof typeof f, v: any) => {
    setF((x) => ({ ...x, [k]: v }))
    setErr("")
  }

  const n = Math.round(Number(f.guests))
  const s = Math.round(Number(f.seats))
  const [hw, hh] = f.hall.split("x").map(Number)
  const tablesNeeded = n > 0 && s >= 2 ? Math.ceil(n / s) : 0
  const fit = estimateTables(hw, hh)

  function check(i: number) {
    if (i === 0 && (!f.bride_name.trim() || !f.groom_name.trim())) return "Nhập tên cô dâu và chú rể"
    if (i === 2 && f.buildPlan) {
      if (!(n > 0)) return "Nhập số khách dự kiến"
      if (!(s >= 2 && s <= 30)) return "Số ghế mỗi bàn từ 2 đến 30"
      if (tablesNeeded > 200) return "Tối đa 200 bàn"
    }
    return ""
  }
  function next() {
    const e = check(step)
    if (e) return setErr(e)
    if (step < STEPS.length - 1) setStep(step + 1)
    else finish()
  }

  async function finish() {
    setSaving("Đang tạo đám cưới…")
    setErr("")
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bride_name: f.bride_name.trim(),
          groom_name: f.groom_name.trim(),
          event_date: f.event_date || null,
          event_time: f.event_time || null,
          venue_name: f.venue_name.trim(),
          venue_address: f.venue_address.trim(),
        }),
      })
      const ev = await res.json()
      if (!res.ok) throw new Error(ev.message ?? "Không tạo được đám cưới")
      const json = { "Content-Type": "application/json" }
      // invitation style (the API falls back to the free template on the free plan)
      await fetch(`/api/events/${ev.id}`, { method: "PATCH", headers: json, body: JSON.stringify({ invite_template: f.template, invite_theme: TEMPLATES[f.template].palette }) })
      const floor = ev.floors?.[0]
      if (floor) {
        if (f.buildPlan && tablesNeeded > 0) {
          setSaving("Đang dựng sơ đồ bàn…")
          const { positions, stage } = sampleLayout(tablesNeeded, hw, hh)
          await fetch(`/api/events/${ev.id}/floors/${floor.id}`, { method: "PATCH", headers: json, body: JSON.stringify({ hall_w: hw, hall_h: hh, elements: [stage], layout_template: "rows" }) })
          await fetch(`/api/events/${ev.id}/tables`, {
            method: "POST",
            headers: json,
            body: JSON.stringify({ tables: positions.map((p, i) => ({ floor_id: floor.id, name: `Bàn ${i + 1}`, seats: s, ...p })) }),
          })
        } else {
          await fetch(`/api/events/${ev.id}/floors/${floor.id}`, { method: "PATCH", headers: json, body: JSON.stringify({ hall_w: hw, hall_h: hh }) })
        }
      }
      onCreated(ev.id)
    } catch (e: any) {
      setErr(e.message ?? "Có lỗi, thử lại")
      setSaving("")
    }
  }

  const input = "border border-border hover:border-border-hover focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/10 rounded-lg h-11 px-3 text-sm w-full bg-surface"
  const label = "text-xs text-muted"

  return (
    <div className="bg-surface border border-border rounded-card p-6 sm:p-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-6" aria-label={`Bước ${step + 1}/${STEPS.length}`}>
        {STEPS.map((t, i) => (
          <div key={t} className="flex-1">
            <div className={"h-1 rounded-full " + (i <= step ? "bg-brand" : "bg-surface-alt")} />
            <p className={"text-[11px] mt-1.5 hidden sm:block " + (i === step ? "text-text font-medium" : "text-muted")}>{t}</p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <h2 className="font-serif text-[26px] leading-tight text-text">Hai bạn tên gì?</h2>
          <p className="text-sm text-muted mt-1">Tên này hiện trên thiệp mời và màn hình tiệc. Họ tên đầy đủ có thể thêm sau.</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <label className={label}>
              Tên cô dâu
              <input autoFocus className={input + " mt-1"} placeholder="Lan" value={f.bride_name} onChange={(e) => set("bride_name", e.target.value)} />
            </label>
            <label className={label}>
              Tên chú rể
              <input className={input + " mt-1"} placeholder="Minh" value={f.groom_name} onChange={(e) => set("groom_name", e.target.value)} />
            </label>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 className="font-serif text-[26px] leading-tight text-text">Tiệc cưới khi nào, ở đâu?</h2>
          <p className="text-sm text-muted mt-1">Chưa chốt cũng không sao, bạn sửa được trong Cài đặt. Có ngày cưới thì WedTable nhắc việc theo từng mốc.</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            <label className={label}>
              Ngày cưới
              <input type="date" className={input + " mt-1"} value={f.event_date} onChange={(e) => set("event_date", e.target.value)} />
            </label>
            <label className={label}>
              Giờ đón khách
              <input type="time" className={input + " mt-1"} value={f.event_time} onChange={(e) => set("event_time", e.target.value)} />
            </label>
            <label className={label + " sm:col-span-2"}>
              Nhà hàng / địa điểm
              <input className={input + " mt-1"} placeholder="Trung tâm tiệc cưới…" value={f.venue_name} onChange={(e) => set("venue_name", e.target.value)} />
            </label>
            <label className={label + " sm:col-span-2"}>
              Địa chỉ (để khách xem bản đồ, không bắt buộc)
              <input className={input + " mt-1"} placeholder="Số nhà, đường, quận, thành phố" value={f.venue_address} onChange={(e) => set("venue_address", e.target.value)} />
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="font-serif text-[26px] leading-tight text-text">Khoảng bao nhiêu khách?</h2>
          <p className="text-sm text-muted mt-1">WedTable dựng sẵn sơ đồ hội trường có sân khấu và đủ bàn. Bạn kéo chỉnh lại sau.</p>
          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            <label className={label}>
              Số khách dự kiến
              <input inputMode="numeric" className={input + " mt-1"} value={f.guests} onChange={(e) => set("guests", e.target.value)} />
            </label>
            <label className={label}>
              Ghế mỗi bàn
              <input inputMode="numeric" className={input + " mt-1"} value={f.seats} onChange={(e) => set("seats", e.target.value)} />
            </label>
            <label className={label}>
              Cỡ hội trường
              <select className={input + " mt-1"} value={f.hall} onChange={(e) => set("hall", e.target.value)}>
                {HALL_PRESETS.map((p) => (
                  <option key={p.label} value={`${p.w}x${p.h}`}>
                    {p.label} {p.w}×{p.h} m
                  </option>
                ))}
              </select>
            </label>
          </div>
          {f.buildPlan && tablesNeeded > 0 && (
            <p className={"text-sm mt-3 " + (tablesNeeded > fit ? "text-error" : "text-muted")}>
              Sẽ tạo {tablesNeeded} bàn {s} ghế.{" "}
              {tablesNeeded > fit ? `Hội trường này vừa khoảng ${fit} bàn, nên chọn cỡ lớn hơn.` : `Hội trường vừa khoảng ${fit} bàn.`}
            </p>
          )}
          <label className="flex items-center gap-2 text-sm text-muted mt-4 cursor-pointer">
            <input type="checkbox" checked={!f.buildPlan} onChange={(e) => set("buildPlan", !e.target.checked)} />
            Tôi sẽ tự vẽ sơ đồ sau
          </label>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="font-serif text-[26px] leading-tight text-text">Chọn phong cách thiệp</h2>
          <p className="text-sm text-muted mt-1">Đổi mẫu và bộ màu bất cứ lúc nào ở trang Thiệp mời.</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-5">
            {(Object.keys(TEMPLATES) as InviteStyle[]).map((id) => {
              const t = TEMPLATES[id]
              const p = THEMES[t.palette]?.p
              const on = f.template === id
              return (
                <button
                  key={id}
                  onClick={() => set("template", id)}
                  className={"text-left rounded-lg border p-4 transition-colors " + (on ? "border-brand ring-2 ring-brand/15" : "border-border hover:border-border-hover")}
                >
                  <div className="flex items-center gap-1.5">
                    {p && [p.paper, p.blush, p.rose, p.deep].map((c, i) => <span key={i} className="w-4 h-4 rounded-full border border-border" style={{ background: c }} />)}
                    {on && <Icon name="check" size={16} className="ml-auto text-brand" />}
                  </div>
                  <p className="text-sm font-medium text-text mt-2">{t.label}</p>
                  <p className="text-xs text-muted mt-0.5">{t.desc}</p>
                  {!t.free && <p className="text-[11px] text-muted mt-1.5">Premium</p>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {err && <p className="text-sm text-error mt-4">{err}</p>}

      <div className="flex items-center gap-2 mt-7">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} disabled={!!saving} className="h-10 px-4 rounded-lg border border-border text-sm text-text hover:bg-surface-hover">
            Quay lại
          </button>
        )}
        {onCancel && step === 0 && (
          <button onClick={onCancel} className="h-10 px-4 rounded-lg text-sm text-muted hover:bg-surface-alt hover:text-text">
            Hủy
          </button>
        )}
        <button onClick={next} disabled={!!saving} className="ml-auto h-10 px-5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-60">
          {saving || (step === STEPS.length - 1 ? "Tạo đám cưới" : "Tiếp tục")}
        </button>
      </div>
      {onDemo && step === 0 && (
        <p className="text-sm text-muted mt-5 pt-5 border-t border-border">
          Chưa muốn nhập thật?{" "}
          <button onClick={onDemo} className="text-brand hover:underline underline-offset-4">
            Xem thử với đám cưới mẫu
          </button>{" "}
          có sẵn ảnh, sơ đồ và khách để bấm thử mọi tính năng.
        </p>
      )}
    </div>
  )
}
