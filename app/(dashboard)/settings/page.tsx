"use client"

import { useEffect, useRef, useState } from "react"
import Icon from "@/components/ui/Icon"
import { ROLE_LABEL, useEvents } from "@/lib/useEvents"
import PremiumNote from "@/components/ui/PremiumNote"
import { isPremium } from "@/lib/plan"


const REQUIRED: { key: string; label: string }[] = [
  { key: "bride_name", label: "Tên cô dâu" },
  { key: "groom_name", label: "Tên chú rể" },
  { key: "event_date", label: "Ngày cưới" },
  { key: "event_time", label: "Giờ tổ chức" },
  { key: "venue_name", label: "Địa điểm" },
]

function toLocalInput(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function buildBody(form: any) {
  return {
    bride_name: form.bride_name,
    groom_name: form.groom_name,
    event_date: form.event_date || null,
    event_time: form.event_time || null,
    venue_name: form.venue_name,
    template: form.template,
    show_guest_names_on_map: form.show_guest_names_on_map,
    lock_at: form.lock_at ? new Date(form.lock_at).toISOString() : null,
  }
}

type TabId = "info" | "options" | "members"

const TABS: { id: TabId; label: string; hash: string; ownerOnly?: boolean }[] = [
  { id: "info", label: "Thông tin chung", hash: "thong-tin" },
  { id: "options", label: "Tùy chọn & trình chiếu", hash: "tuy-chon" },
  { id: "members", label: "Thành viên", hash: "thanh-vien", ownerOnly: true },
]

const ROLE_OPTIONS = [
  { value: "design", label: "Thiết kế", desc: "Sửa nội dung, ảnh, QR mừng cưới, giao diện sơ đồ bàn. Không thấy danh sách khách." },
  { value: "setup", label: "Setup", desc: "Quản lý bàn và khách mời." },
  { value: "checkin", label: "Check-in", desc: "Chỉ dùng trang Check-in." },
]

function MembersSection({ eventId }: { eventId: string }) {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("setup")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/events/${eventId}/members`)
    if (res.ok) setMembers(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  async function addMember() {
    if (!email.trim()) return
    setSaving(true)
    setMsg(null)
    const res = await fetch(`/api/events/${eventId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), role }),
    })
    const d = await res.json()
    setSaving(false)
    if (res.ok) {
      setEmail("")
      setMsg({ ok: true, text: `Đã mời ${email.trim()}. Họ đăng nhập bằng Google với email này để nhận quyền.` })
      load()
    } else {
      setMsg({ ok: false, text: d.message ?? "Không thêm được thành viên." })
    }
  }

  async function removeMember(id: string) {
    if (!confirm("Gỡ quyền của thành viên này?")) return
    await fetch(`/api/events/${eventId}/members/${id}`, { method: "DELETE" })
    load()
  }

  return (
    <section className="bg-surface border border-border rounded-card p-5 sm:p-6 flex flex-col gap-4">
      <h2 className="font-semibold text-[15px] text-text">Thành viên hỗ trợ</h2>
      <p className="text-xs text-muted">
        Mời người khác hỗ trợ theo vai trò. Họ chỉ cần đăng nhập WedTable bằng Google với đúng email bên dưới.
      </p>

      {msg && (
        <div className={"text-sm rounded-card px-3 py-2 flex justify-between " + (msg.ok ? "bg-pr-l text-pr-d" : "bg-rose/10 text-rose")}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)}><Icon name="close" size={14} /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="border border-border rounded-card px-3 py-2 text-sm flex-1"
          placeholder="Email cộng tác viên"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select className="border border-border rounded-card px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <button disabled={saving || !email.trim()} onClick={addMember} className="bg-text text-surface hover:bg-text/90 font-medium rounded-pill px-4 py-2 text-sm disabled:opacity-50 whitespace-nowrap">
          {saving ? "Đang mời..." : "+ Mời"}
        </button>
      </div>
      <p className="text-xs text-muted">{ROLE_OPTIONS.find((r) => r.value === role)?.desc}</p>

      {loading ? (
        <p className="text-sm text-muted">Đang tải...</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted">Chưa có thành viên nào.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div className="text-text">{m.email}</div>
                <div className="text-xs text-muted">
                  {ROLE_LABEL[m.role] ?? m.role} · {m.user_id ? "Đã tham gia" : "Đang chờ đăng nhập"}
                </div>
              </div>
              <button onClick={() => removeMember(m.id)} className="text-rose text-xs hover:underline">
                Gỡ
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function SettingsPage() {
  const { eventId, loading, role } = useEvents()
  const [form, setForm] = useState<any>(null)
  const [published, setPublished] = useState(false)
  const [tablesCount, setTablesCount] = useState(0)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [attempted, setAttempted] = useState(false)
  const [missing, setMissing] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [premium, setPremium] = useState(true)
  const dirty = useRef(false)
  const [tab, setTabState] = useState<TabId>("info")

  // Remember the open tab in the URL (#tuy-chon...) so reload/back keeps it
  useEffect(() => {
    const fromHash = TABS.find((t) => "#" + t.hash === window.location.hash)
    if (fromHash) setTabState(fromHash.id)
  }, [])

  function setTab(id: TabId) {
    setTabState(id)
    const t = TABS.find((x) => x.id === id)
    if (t) history.replaceState(null, "", "#" + t.hash)
  }
  const publishRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!eventId) return
    dirty.current = false
    setForm(null)
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((e) => {
        setPremium(isPremium(e))
        setPublished(!!e.published)
        setTablesCount((e.floors ?? []).reduce((s: number, f: any) => s + (f.tables?.length ?? 0), 0))
        setForm({
          bride_name: e.bride_name ?? "",
          groom_name: e.groom_name ?? "",
          event_date: e.event_date ?? "",
          event_time: e.event_time ? String(e.event_time).slice(0, 5) : "",
          venue_name: e.venue_name ?? "",
          template: e.template ?? "co-dien",
          show_guest_names_on_map: !!e.show_guest_names_on_map,
          lock_at: toLocalInput(e.lock_at),
        })
      })
  }, [eventId])

  // Tự động lưu sau khi ngừng gõ
  useEffect(() => {
    if (!form || !dirty.current) return
    setSaveState("saving")
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildBody(form)),
        })
        setSaveState(res.ok ? "saved" : "error")
      } catch {
        setSaveState("error")
      }
    }, 800)
    return () => clearTimeout(t)
  }, [form, eventId])

  function set(key: string, value: any) {
    dirty.current = true
    setForm((f: any) => ({ ...f, [key]: value }))
  }

  const isEmpty = (key: string) => !String(form?.[key] ?? "").trim()
  const invalid = (key: string) => attempted && !published && isEmpty(key)

  async function patch(body: any) {
    return fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  async function publish() {
    setAttempted(true)
    setNotice(null)
    const list = REQUIRED.filter((f) => isEmpty(f.key)).map((f) => f.label)
    if (tablesCount === 0) list.push("Ít nhất 1 bàn (trong Sơ đồ bàn)")
    setMissing(list)
    if (list.length > 0) {
      setTab("info")
      publishRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setPublishing(true)
    try {
      const res = await patch({ ...buildBody(form), published: true })
      const d = await res.json()
      if (res.ok) {
        setPublished(true)
        setAttempted(false)
        setNotice({ ok: true, text: "Đã publish sự kiện. Khách mở được link mời." })
      } else if (d.missing) {
        setMissing(d.missing)
        setTab("info")
      } else {
        setNotice({ ok: false, text: d.message ?? "Không publish được." })
      }
    } catch {
      setNotice({ ok: false, text: "Lỗi kết nối, vui lòng thử lại." })
    }
    setPublishing(false)
  }

  async function unpublish() {
    if (!confirm("Hủy publish? Khách sẽ không mở được link mời cho đến khi bạn publish lại.")) return
    setPublishing(true)
    const res = await patch({ published: false })
    setPublishing(false)
    if (res.ok) {
      setPublished(false)
      setMissing([])
      setNotice({ ok: true, text: "Đã hủy publish." })
    } else {
      setNotice({ ok: false, text: "Không hủy được, vui lòng thử lại." })
    }
  }

  async function deleteEvent() {
    if (!confirm("Xóa vĩnh viễn đám cưới này cùng toàn bộ bàn và khách?")) return
    await fetch(`/api/events/${eventId}`, { method: "DELETE" })
    try {
      localStorage.removeItem("wt_event")
    } catch {}
    window.location.href = "/"
  }

  if (loading || (eventId && !form)) return <p className="text-muted">Đang tải...</p>
  if (!eventId) return <p className="text-muted">Bạn chưa có sự kiện nào. Tạo ở trang Tổng quan.</p>

  const base = "border rounded-lg min-h-10 px-3 py-2 text-sm w-full bg-surface hover:border-border-hover focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/10 "
  const cls = (key: string) => base + (invalid(key) ? "border-rose bg-rose/5" : "border-border")
  const Label = ({ text, required, k }: { text: string; required?: boolean; k?: string }) => (
    <label className="text-sm font-medium text-text block mb-1.5">
      {text}
      {required && <span className="text-rose"> *</span>}
      {k && invalid(k) && <span className="text-rose text-xs ml-2">Chưa điền</span>}
    </label>
  )
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const displayUrl = `${origin}/display/${eventId}`

  return (
    <div className="max-w-3xl flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-serif text-[28px] leading-tight tracking-[-0.01em] text-text">Cài đặt sự kiện</h1>
        <span className="text-xs text-muted">
          {saveState === "saving" && "Đang lưu..."}
          {saveState === "saved" && "✓ Đã tự động lưu"}
          {saveState === "error" && <span className="text-rose">Lưu thất bại, kiểm tra kết nối</span>}
          {saveState === "idle" && "Thay đổi được tự động lưu"}
        </span>
      </div>

      {notice && (
        <div className={"text-sm rounded-card px-3 py-2 flex justify-between " + (notice.ok ? "bg-pr-l text-pr-d" : "bg-rose/10 text-rose")}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)}><Icon name="close" size={14} /></button>
        </div>
      )}

      {role !== "owner" && (
        <div className="text-sm bg-pr-l text-pr-d rounded-card px-3 py-2">
          Bạn đang hỗ trợ với vai trò <strong>{ROLE_LABEL[role] ?? role}</strong>. Một số mục chỉ chủ sự kiện mới thấy.
        </div>
      )}

      {role === "owner" && (
        <section ref={publishRef} className={"rounded-card p-4 flex flex-col gap-3 border " + (published ? "bg-sage/10 border-sage/40" : "bg-surface border-border")}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-[15px] text-text">Publish sự kiện</h2>
              <p className="text-sm text-muted">
                {published
                  ? "Sự kiện đã publish. Khách mở được thiệp mời và màn hình trình chiếu."
                  : "Sự kiện chưa publish. Khách chưa mở được link mời."}
              </p>
            </div>
            {published ? (
              <button disabled={publishing} onClick={unpublish} className="border border-border text-muted rounded-pill px-4 py-2 text-sm disabled:opacity-50">
                Hủy publish
              </button>
            ) : (
              <button disabled={publishing} onClick={publish} className="bg-brand text-white hover:bg-brand-hover font-medium rounded-pill px-5 py-2 text-sm disabled:opacity-50">
                {publishing ? "Đang publish..." : "Publish sự kiện"}
              </button>
            )}
          </div>
          {!published && missing.length > 0 && (
            <div className="bg-rose/10 border border-rose/30 rounded-card px-3 py-3 text-sm text-rose">
              <div className="font-medium mb-1">Chưa thể publish, còn thông tin bắt buộc đang trống:</div>
              <ul className="list-disc pl-5">
                {missing.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <div role="tablist" aria-label="Nhóm cài đặt" className="flex gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] border-b border-border -mb-2">
        {TABS.filter((t) => !t.ownerOnly || role === "owner").map((t) => {
          const active = tab === t.id
          const alert = t.id === "info" && attempted && !published && missing.length > 0
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={
                "relative whitespace-nowrap px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors " +
                (active ? "border-pr text-text font-medium" : "border-transparent text-muted hover:text-text")
              }
            >
              {t.label}
              {alert && <span className="absolute top-2 right-1.5 w-1.5 h-1.5 rounded-full bg-rose" />}
            </button>
          )
        })}
      </div>

      {tab === "info" && (
      <section className="bg-surface border border-border rounded-card p-5 sm:p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-[15px] text-text">Thông tin</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label text="Tên cô dâu" required k="bride_name" />
            <input className={cls("bride_name")} value={form.bride_name} onChange={(e) => set("bride_name", e.target.value)} />
          </div>
          <div>
            <Label text="Tên chú rể" required k="groom_name" />
            <input className={cls("groom_name")} value={form.groom_name} onChange={(e) => set("groom_name", e.target.value)} />
          </div>
          <div>
            <Label text="Ngày cưới" required k="event_date" />
            <input className={cls("event_date")} type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} />
          </div>
          <div>
            <Label text="Giờ tổ chức" required k="event_time" />
            <input className={cls("event_time")} type="time" value={form.event_time} onChange={(e) => set("event_time", e.target.value)} />
          </div>
        </div>
        <div>
          <Label text="Địa điểm" required k="venue_name" />
          <input className={cls("venue_name")} value={form.venue_name} onChange={(e) => set("venue_name", e.target.value)} />
        </div>
        <div className={"text-sm flex items-center justify-between " + (attempted && !published && tablesCount === 0 ? "text-rose" : "text-muted")}>
          <span>
            Số bàn đã tạo: <strong>{tablesCount}</strong> <span className="text-rose">*</span> (cần ít nhất 1 để publish)
          </span>
          <a href="/seating" className="underline">
            Tạo bàn
          </a>
        </div>
      </section>

      )}

      {tab === "options" && (
      <>
      <section className="bg-surface border border-border rounded-card p-5 sm:p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-[15px] text-text">Tùy chọn</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.show_guest_names_on_map} onChange={(e) => set("show_guest_names_on_map", e.target.checked)} />
          Hiện tên khách trên sơ đồ bàn (màn hình trình chiếu)
        </label>
        <div>
          <Label text="Khóa thay đổi từ thời điểm" />
          <input className={cls("lock_at")} type="datetime-local" value={form.lock_at} onChange={(e) => set("lock_at", e.target.value)} />
          <p className="text-xs text-muted mt-1">Sau thời điểm này khách không tự đổi bàn được nữa. Để trống = không khóa.</p>
        </div>
      </section>

      <section className="bg-surface border border-border rounded-card p-5 sm:p-6 flex flex-col gap-3">
        <h2 className="font-semibold text-[15px] text-text">Màn hình trình chiếu (TV/máy chiếu)</h2>
        <p className="text-sm text-muted break-all">{displayUrl}</p>
        <div className="flex gap-2">
          <a className="border border-border bg-surface hover:bg-surface-hover hover:border-border-hover rounded-pill px-3 py-1.5 text-sm" href={displayUrl} target="_blank" rel="noreferrer">
            Mở màn hình
          </a>
          <button
            className="border border-border bg-surface hover:bg-surface-hover hover:border-border-hover rounded-pill px-3 py-1.5 text-sm"
            onClick={() => navigator.clipboard.writeText(displayUrl).then(() => setNotice({ ok: true, text: "Đã copy link" }))}
          >
            Copy link
          </button>
        </div>
      </section>

      </>
      )}

      {tab === "members" && role === "owner" && (premium ? <MembersSection eventId={eventId} /> : <PremiumNote title="Mời người hỗ trợ">Mời người nhà, bạn bè hỗ trợ thiết kế, xếp bàn, check-in là tính năng Premium.</PremiumNote>)}

      {tab === "options" && role === "owner" && (
        <section className="border border-rose/40 rounded-card p-4">
          <h2 className="font-semibold text-rose mb-2">Vùng nguy hiểm</h2>
          <button onClick={deleteEvent} className="border border-error/40 text-error hover:bg-error/5 rounded-pill px-4 py-2 text-sm">
            Xóa đám cưới này
          </button>
        </section>
      )}
    </div>
  )
}
