"use client"

// Invitation designer: theme, wording, families, timeline, dress code, story, photos, gift QR, video.
// Autosaves like Settings; the phone preview on the right updates instantly via postMessage.
import { useEffect, useRef, useState } from "react"
import Icon from "@/components/ui/Icon"
import PremiumNote from "@/components/ui/PremiumNote"
import { createClient } from "@/lib/supabase/client"
import { resizeImage } from "@/lib/image"
import { TEMPLATES, THEMES, THEME_INFO, TIMELINE_ICONS, glassTexture, templateOf } from "@/lib/inviteThemes"
import type { InviteStyle, Palette } from "@/lib/inviteThemes"
import { isPremium } from "@/lib/plan"
import { useEvents } from "@/lib/useEvents"

const BUCKET = "wedding-media"

const TEXT_FIELDS = [
  "invite_theme",
  "invite_template",
  "invite_message",
  "bride_full_name",
  "groom_full_name",
  "bride_family",
  "groom_family",
  "love_story",
  "dress_code",
  "dress_colors",
  "timeline",
  "video_url",
] as const

const field =
  "border border-border rounded-lg min-h-10 px-3 py-2 text-sm w-full bg-surface hover:border-border-hover focus:outline-none focus:border-brand focus:ring-[3px] focus:ring-brand/10"

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <span className="text-sm font-medium text-text">{children}</span>
      {hint && <span className="text-xs text-muted ml-2">{hint}</span>}
    </div>
  )
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface border border-border rounded-card p-5 sm:p-6 flex flex-col gap-4">
      <div>
        <h2 className="font-semibold text-[15px] text-text">{title}</h2>
        {desc && <p className="text-sm text-muted mt-0.5">{desc}</p>}
      </div>
      {children}
    </section>
  )
}

/** Mini mock of a template's cover, drawn in the currently chosen colors */
function TemplateMock({ id, p }: { id: InviteStyle; p: Palette }) {
  const names = (
    <>
      <span className="text-[8px] tracking-[0.25em] uppercase" style={{ color: p.rose }}>
        Kính mời
      </span>
      <span className="text-[15px] italic leading-none text-center" style={{ color: p.wine, fontFamily: "var(--font-serif)" }}>
        Ngọc Anh &amp; Minh Khoa
      </span>
      <span className="text-[9px] tracking-[0.2em]" style={{ color: p.muted }}>
        20 · 12 · 2026
      </span>
    </>
  )
  const box = "w-[62%] h-[80%] flex flex-col items-center justify-center gap-0.5"
  if (id === "gilded")
    return (
      <div className="h-32 flex items-center justify-center" style={{ background: `radial-gradient(ellipse at 50% 30%, ${p.wine}, ${p.deep})` }}>
        <div className={box + " rounded-[3px]"} style={{ background: p.paper, boxShadow: `0 0 0 2px ${p.gold[1]}, 0 0 0 4px ${p.gold[2]}, 0 6px 14px rgba(0,0,0,0.4)` }}>
          {names}
        </div>
      </div>
    )
  if (id === "glass")
    return (
      <div className="h-32 flex items-center justify-center" style={{ background: glassTexture(p) }}>
        <div className={box + " rounded-t-[60px] rounded-b-[3px]"} style={{ background: p.paper, boxShadow: `0 0 0 2px ${p.gold[2]}, 0 0 0 5px ${p.blush}, 0 0 0 7px ${p.gold[2]}` }}>
          {names}
        </div>
      </div>
    )
  if (id === "emboss")
    return (
      <div className="relative h-32 flex items-center justify-center overflow-hidden" style={{ background: p.paper }}>
        <div className={box + " rounded-[14px]"} style={{ background: p.paper, boxShadow: `inset 2px 3px 4px ${p.muted}66, inset -2px -2px 3px rgba(255,255,255,0.9)` }}>
          {names}
        </div>
        <div className="absolute inset-x-0 top-[44%] h-3" style={{ background: `linear-gradient(180deg, ${p.blush}, ${p.paper}, ${p.sage})`, opacity: 0.9 }} />
        <div className="absolute inset-y-0 left-1/2 -ml-1.5 w-3" style={{ background: `linear-gradient(90deg, ${p.blush}, ${p.paper}, ${p.sage})`, opacity: 0.9 }} />
      </div>
    )
  return (
    <div className="relative h-32 flex flex-col items-center justify-center gap-1" style={{ background: p.paper }}>
      <div className="absolute inset-x-0 top-0 h-12" style={{ background: `radial-gradient(ellipse at top, ${p.blush}, transparent 70%)` }} />
      <span className="relative w-8 h-8 rounded-full flex items-center justify-center text-[11px] italic" style={{ background: p.blush, color: p.wine, boxShadow: `0 0 0 1px ${p.rose}`, fontFamily: "var(--font-serif)" }}>
        A&amp;K
      </span>
      <span className="relative flex flex-col items-center gap-0.5">{names}</span>
    </div>
  )
}

function TemplateCard({ id, p, active, locked, onPick }: { id: InviteStyle; p: Palette; active: boolean; locked: boolean; onPick: () => void }) {
  const t = TEMPLATES[id]
  return (
    <button
      onClick={onPick}
      disabled={locked}
      aria-pressed={active}
      className={
        "relative text-left rounded-card border overflow-hidden transition-colors disabled:cursor-not-allowed " +
        (active ? "border-brand ring-2 ring-brand/20" : "border-border hover:border-border-hover")
      }
    >
      <TemplateMock id={id} p={p} />
      {locked && (
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 h-5 px-1.5 rounded bg-surface/90 text-[10px] text-muted">
          <Icon name="lock" size={10} /> Premium
        </span>
      )}
      <div className="px-3 py-2.5 border-t border-border bg-surface">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-text">{t.label}</span>
          {active && <Icon name="check" size={16} className="text-brand" />}
        </div>
        <p className="text-xs text-muted mt-0.5 leading-snug">{t.desc}</p>
      </div>
    </button>
  )
}

function PaletteChip({ id, active, locked, onPick }: { id: string; active: boolean; locked: boolean; onPick: () => void }) {
  const t = THEMES[id]
  const p = t.p
  return (
    <button
      onClick={onPick}
      disabled={locked}
      aria-pressed={active}
      title={THEME_INFO[id]?.desc}
      className={
        "flex items-center gap-2.5 rounded-lg border px-3 h-12 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed " +
        (active ? "border-brand ring-2 ring-brand/20" : "border-border hover:border-border-hover")
      }
    >
      <span className="flex -space-x-1.5 shrink-0" aria-hidden>
        {[p.paper, p.blush, p.wine, p.deep].map((c, i) => (
          <span key={i} className="w-5 h-5 rounded-full border border-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" style={{ background: c }} />
        ))}
      </span>
      <span className="text-sm text-text leading-tight">{t.label}</span>
      {locked && <Icon name="lock" size={12} className="text-muted ml-auto" />}
      {active && !locked && <Icon name="check" size={14} className="text-brand ml-auto" />}
    </button>
  )
}

function TimelineEditor({ items, onChange }: { items: any[]; onChange: (next: any[]) => void }) {
  const input = "border border-border rounded-lg h-9 px-2 text-sm bg-surface"
  const update = (i: number, patch: any) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const sortByTime = () => onChange([...items].sort((a, b) => String(a.time).localeCompare(String(b.time))))
  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && <p className="text-sm text-muted">Chưa có mốc nào. Ví dụ: 17:30 Đón khách, 18:00 Làm lễ, 18:30 Khai tiệc.</p>}
      {items.map((it, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 bg-surface-alt rounded-lg p-2">
          <select className={input + " w-16"} value={it.icon ?? ""} onChange={(e) => update(i, { icon: e.target.value })} aria-label="Biểu tượng">
            {TIMELINE_ICONS.map((ic) => (
              <option key={ic} value={ic}>
                {ic}
              </option>
            ))}
          </select>
          <input className={input + " w-28"} type="time" value={it.time ?? ""} onChange={(e) => update(i, { time: e.target.value })} onBlur={sortByTime} aria-label="Giờ" />
          <input className={input + " flex-1 min-w-[140px]"} placeholder="Tên hoạt động" value={it.title ?? ""} onChange={(e) => update(i, { title: e.target.value })} />
          <input className={input + " w-full sm:flex-1"} placeholder="Ghi chú (không bắt buộc)" value={it.note ?? ""} onChange={(e) => update(i, { note: e.target.value })} />
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="w-9 h-9 rounded-lg text-muted hover:text-error hover:bg-surface" aria-label="Xóa mốc">
            <Icon name="close" size={14} className="mx-auto" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { icon: TIMELINE_ICONS[items.length % TIMELINE_ICONS.length], time: "", title: "", note: "" }])}
        className="inline-flex items-center gap-1.5 border border-border bg-surface hover:bg-surface-hover hover:border-border-hover rounded-lg h-9 px-3 text-sm w-fit"
      >
        <Icon name="plus" size={14} /> Thêm mốc
      </button>
    </div>
  )
}

export default function InvitationPage() {
  const { eventId, loading } = useEvents()
  const [form, setForm] = useState<any>(null)
  const [gallery, setGallery] = useState<string[]>([])
  const [giftQr, setGiftQr] = useState("")
  const [premium, setPremium] = useState(true)
  const [published, setPublished] = useState(false)
  const [firstCode, setFirstCode] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingQr, setUploadingQr] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [intro, setIntro] = useState(false)
  const dirty = useRef(false)
  const frame = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    if (!eventId) return
    dirty.current = false
    setForm(null)
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((e) => {
        setGallery(Array.isArray(e.gallery) ? e.gallery : [])
        setGiftQr(e.gift_qr_url ?? "")
        setPremium(isPremium(e))
        setPublished(!!e.published)
        setFirstCode(e.guests?.[0]?.code ?? null)
        setForm({
          invite_theme: e.invite_theme ?? "blush",
          invite_template: templateOf(e.invite_template),
          invite_message: e.invite_message ?? "",
          bride_full_name: e.bride_full_name ?? "",
          groom_full_name: e.groom_full_name ?? "",
          bride_family: e.bride_family ?? "",
          groom_family: e.groom_family ?? "",
          love_story: e.love_story ?? "",
          dress_code: e.dress_code ?? "",
          dress_colors: Array.isArray(e.dress_colors) ? e.dress_colors : [],
          timeline: Array.isArray(e.timeline) ? e.timeline : [],
          video_url: e.video_url ?? "",
        })
      })
  }, [eventId])

  // Push every change to the preview iframe right away
  function pushPreview(patch: any) {
    frame.current?.contentWindow?.postMessage({ type: "wt-invite-preview", patch }, window.location.origin)
  }
  useEffect(() => {
    if (form) pushPreview({ ...form, gallery, gift_qr_url: giftQr })
  }, [form, gallery, giftQr])
  // When the iframe (re)loads it asks for the current unsaved state
  useEffect(() => {
    function onMessage(m: MessageEvent) {
      if (m.origin === window.location.origin && m.data?.type === "wt-invite-preview-ready" && form) {
        pushPreview({ ...form, gallery, gift_qr_url: giftQr })
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  })

  // Autosave
  useEffect(() => {
    if (!form || !dirty.current) return
    setSaveState("saving")
    const t = setTimeout(async () => {
      const body: Record<string, any> = {}
      for (const k of TEXT_FIELDS) body[k] = form[k]
      try {
        const res = await patch(body)
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

  function patch(body: any) {
    return fetch(`/api/events/${eventId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
  }

  async function upload(file: File, max: number, name: string) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Chưa đăng nhập")
    const blob = await resizeImage(file, max)
    const path = `${user.id}/${eventId}/${name}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" })
    if (error) throw new Error(error.message)
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
  }

  async function saveGallery(next: string[]) {
    setGallery(next)
    await patch({ gallery: next })
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (files.length === 0) return
    setUploading(true)
    setNotice(null)
    try {
      let next = [...gallery]
      for (const f of files) next = [...next, await upload(f, 1200, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`)]
      await saveGallery(next)
      setNotice({ ok: true, text: `Đã tải lên ${files.length} ảnh` })
    } catch (err: any) {
      setNotice({ ok: false, text: err.message ?? "Lỗi tải ảnh" })
    }
    setUploading(false)
  }

  async function removePhoto(url: string) {
    if (!confirm("Xóa ảnh này?")) return
    const marker = `/object/public/${BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx >= 0) await createClient().storage.from(BUCKET).remove([decodeURIComponent(url.slice(idx + marker.length))])
    await saveGallery(gallery.filter((u) => u !== url))
  }

  async function moveCover(url: string) {
    await saveGallery([url, ...gallery.filter((u) => u !== url)])
    setNotice({ ok: true, text: "Đã đặt làm ảnh bìa" })
  }

  async function uploadGiftQr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploadingQr(true)
    setNotice(null)
    try {
      const url = await upload(file, 900, `gift-qr-${Date.now()}.jpg`)
      const res = await patch({ gift_qr_url: url })
      if (!res.ok) throw new Error((await res.json()).message ?? "Không lưu được")
      setGiftQr(url)
      setNotice({ ok: true, text: "Đã cập nhật mã QR mừng cưới" })
    } catch (err: any) {
      setNotice({ ok: false, text: err.message ?? "Lỗi tải QR" })
    }
    setUploadingQr(false)
  }

  if (loading || (eventId && !form)) return <p className="text-muted">Đang tải...</p>
  if (!eventId) return <p className="text-muted">Bạn chưa có sự kiện nào. Tạo ở trang Tổng quan.</p>

  const previewSrc = `/invite-preview/${eventId}${intro ? "?intro=1" : ""}`
  const themeIds = Object.keys(THEMES)
  const templateIds = Object.keys(TEMPLATES) as InviteStyle[]
  const activeTemplate: InviteStyle = premium ? templateOf(form.invite_template) : "floral"
  const activeTheme = premium ? form.invite_theme : "classic"
  const shownPalette = (THEMES[activeTheme] ?? THEMES.blush).p

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-[28px] leading-tight tracking-[-0.01em] text-text">Thiệp mời</h1>
          <p className="text-sm text-muted mt-1">Chọn giao diện và nội dung khách sẽ thấy khi mở link mời.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-xs text-muted">
            {saveState === "saving" && "Đang lưu…"}
            {saveState === "saved" && "✓ Đã tự động lưu"}
            {saveState === "error" && <span className="text-error">Lưu thất bại, kiểm tra kết nối</span>}
            {saveState === "idle" && "Thay đổi được tự động lưu"}
          </span>
          <a href={previewSrc} target="_blank" rel="noreferrer" className="lg:hidden inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-surface hover:bg-surface-hover">
            <Icon name="external" size={14} /> Xem trước
          </a>
          {published && firstCode && (
            <a href={`/invite/${firstCode}`} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-surface hover:bg-surface-hover">
              <Icon name="external" size={14} /> Mở thiệp thật
            </a>
          )}
        </div>
      </div>

      {!published && (
        <div className="text-sm rounded-lg px-4 py-3 bg-surface-alt text-text flex items-center justify-between gap-3 flex-wrap">
          <span>Thiệp chưa publish nên khách chưa mở được. Bạn vẫn xem trước được ở khung bên cạnh.</span>
          <a href="/settings" className="text-brand hover:underline underline-offset-4">Publish trong Cài đặt</a>
        </div>
      )}

      {notice && (
        <div className={"text-sm rounded-lg px-4 py-3 flex items-center justify-between gap-3 " + (notice.ok ? "bg-success/10 text-success" : "bg-error/10 text-error")}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} aria-label="Đóng thông báo">
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <Section
            title="Mẫu thiệp"
            desc={premium ? "Hiệu ứng mở thiệp, trang trí và cách trình bày. Chọn mẫu sẽ gợi ý bộ màu đi kèm, bạn đổi màu ở mục dưới." : "Gói Miễn phí dùng mẫu Cổ điển hoa lá. Nâng cấp Premium để mở các mẫu khác."}
          >
            <div className="grid grid-cols-2 gap-3">
              {templateIds.map((id) => (
                <TemplateCard
                  key={id}
                  id={id}
                  p={shownPalette}
                  active={activeTemplate === id}
                  locked={!premium && !TEMPLATES[id].free}
                  onPick={() => {
                    if (id === activeTemplate) return
                    dirty.current = true
                    setForm((f: any) => ({ ...f, invite_template: id, invite_theme: TEMPLATES[id].palette }))
                  }}
                />
              ))}
            </div>
          </Section>

          <Section title="Màu sắc" desc={premium ? "Bộ màu nào cũng dùng được với mọi mẫu thiệp." : "Gói Miễn phí dùng bộ màu Trắng đỏ đô."}>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {themeIds.map((id) => (
                <PaletteChip key={id} id={id} active={activeTheme === id} locked={!premium && !THEME_INFO[id]?.free} onPick={() => set("invite_theme", id)} />
              ))}
            </div>
          </Section>

          <Section title="Lời mời và hai bên gia đình" desc="Mục nào để trống sẽ không hiện trên thiệp.">
            <div>
              <Label hint="Để trống sẽ dùng lời mời mặc định">Lời mời gửi khách</Label>
              <textarea className={field} rows={3} value={form.invite_message} onChange={(e) => set("invite_message", e.target.value)} placeholder="Tình yêu của chúng tôi sẽ trọn vẹn hơn khi có sự hiện diện của bạn…" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Họ tên đầy đủ cô dâu</Label>
                <input className={field} placeholder="Nguyễn Thị Hoa" value={form.bride_full_name} onChange={(e) => set("bride_full_name", e.target.value)} />
              </div>
              <div>
                <Label>Họ tên đầy đủ chú rể</Label>
                <input className={field} placeholder="Trần Văn Minh" value={form.groom_full_name} onChange={(e) => set("groom_full_name", e.target.value)} />
              </div>
              <div>
                <Label>Nhà gái</Label>
                <textarea className={field} rows={3} placeholder={"Ông Nguyễn Văn A\nBà Lê Thị B\nHà Nội"} value={form.bride_family} onChange={(e) => set("bride_family", e.target.value)} />
              </div>
              <div>
                <Label>Nhà trai</Label>
                <textarea className={field} rows={3} placeholder={"Ông Trần Văn C\nBà Phạm Thị D\nHải Phòng"} value={form.groom_family} onChange={(e) => set("groom_family", e.target.value)} />
              </div>
            </div>
          </Section>

          <Section title="Ảnh cưới" desc="Ảnh đầu tiên làm ảnh bìa, ảnh thứ hai đi kèm câu chuyện, còn lại vào album. Ảnh tự nén về tối đa 1200px.">
            {gallery.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {gallery.map((url, i) => (
                  <div key={url} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full aspect-square object-cover rounded-lg" />
                    {i === 0 && <span className="absolute left-1.5 top-1.5 h-5 px-1.5 rounded bg-ink/80 text-white text-[10px] flex items-center">Ảnh bìa</span>}
                    <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {i !== 0 ? (
                        <button onClick={() => moveCover(url)} className="h-7 px-2 rounded bg-surface/95 text-[11px] text-text shadow-pop">
                          Làm ảnh bìa
                        </button>
                      ) : (
                        <span />
                      )}
                      <button onClick={() => removePhoto(url)} className="w-7 h-7 rounded bg-surface/95 text-error shadow-pop" aria-label="Xóa ảnh">
                        <Icon name="trash" size={14} className="mx-auto" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <label className="inline-flex items-center gap-1.5 border border-border bg-surface hover:bg-surface-hover hover:border-border-hover rounded-lg h-9 px-3 text-sm w-fit cursor-pointer">
              <Icon name="image" size={16} />
              {uploading ? "Đang tải lên…" : "Tải ảnh lên"}
              <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={handleUpload} />
            </label>
          </Section>

          {premium ? (
            <>
              <Section title="Lịch trình ngày cưới" desc="Các mốc tự xếp theo giờ.">
                <TimelineEditor items={form.timeline} onChange={(next) => set("timeline", next)} />
              </Section>

              <Section title="Dress code">
                <textarea className={field} rows={2} placeholder="Trang phục lịch sự, ưu tiên tông pastel." value={form.dress_code} onChange={(e) => set("dress_code", e.target.value)} />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted">Màu gợi ý:</span>
                  {form.dress_colors.map((c: string, i: number) => (
                    <span key={i} className="relative">
                      <input
                        type="color"
                        value={c}
                        onChange={(e) => set("dress_colors", form.dress_colors.map((x: string, idx: number) => (idx === i ? e.target.value : x)))}
                        className="w-10 h-10 rounded-full border border-border cursor-pointer p-0.5 bg-surface"
                        aria-label={`Màu ${i + 1}`}
                      />
                      <button
                        onClick={() => set("dress_colors", form.dress_colors.filter((_: string, idx: number) => idx !== i))}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center"
                        aria-label="Xóa màu"
                      >
                        <Icon name="close" size={10} />
                      </button>
                    </span>
                  ))}
                  {form.dress_colors.length < 5 && (
                    <button onClick={() => set("dress_colors", [...form.dress_colors, "#E8C4C4"])} className="w-10 h-10 rounded-full border border-dashed border-border-hover text-muted hover:text-text" aria-label="Thêm màu">
                      <Icon name="plus" size={16} className="mx-auto" />
                    </button>
                  )}
                </div>
              </Section>

              <Section title="Câu chuyện của hai bạn" desc="Hiện kèm ảnh thứ hai trong mục Ảnh cưới.">
                <textarea className={field} rows={5} placeholder="Chúng mình gặp nhau lần đầu vào một chiều mưa Hà Nội…" value={form.love_story} onChange={(e) => set("love_story", e.target.value)} />
              </Section>

              <Section title="Hộp mừng cưới" desc="Tải ảnh mã QR ngân hàng hoặc ví điện tử, khách quét để gửi quà mừng.">
                {giftQr && (
                  <div className="flex items-end gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={giftQr} alt="Mã QR mừng cưới" className="w-36 h-36 object-contain border border-border rounded-lg bg-white" />
                    <button
                      onClick={async () => {
                        await patch({ gift_qr_url: "" })
                        setGiftQr("")
                      }}
                      className="text-sm text-error hover:underline underline-offset-4"
                    >
                      Xóa QR
                    </button>
                  </div>
                )}
                <label className="inline-flex items-center gap-1.5 border border-border bg-surface hover:bg-surface-hover hover:border-border-hover rounded-lg h-9 px-3 text-sm w-fit cursor-pointer">
                  <Icon name="qr" size={16} />
                  {uploadingQr ? "Đang tải lên…" : giftQr ? "Đổi ảnh QR" : "Tải ảnh QR"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingQr} onChange={uploadGiftQr} />
                </label>
              </Section>
            </>
          ) : (
            <PremiumNote title="Lịch trình, dress code, câu chuyện, hộp mừng cưới">Các phần này có trong gói Premium.</PremiumNote>
          )}

          <Section title="Video cưới" desc="Dán link YouTube hoặc Google Drive, thiệp sẽ có nút xem video.">
            <input className={field} placeholder="https://youtube.com/…" value={form.video_url} onChange={(e) => set("video_url", e.target.value)} />
          </Section>
        </div>

        {/* Live phone preview */}
        <aside className="hidden lg:flex flex-col items-center gap-3 sticky top-20">
          <div className="w-[300px] h-[600px] rounded-[44px] bg-ink p-3 shadow-float">
            <div className="w-full h-full rounded-[34px] overflow-hidden bg-surface">
              <iframe
                key={previewKey + (intro ? "-intro" : "")}
                ref={frame}
                src={previewSrc}
                title="Xem trước thiệp mời"
                className="border-0 origin-top-left"
                style={{ width: 390, height: 780, transform: "scale(0.7)" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => {
                setIntro(true)
                setPreviewKey((k) => k + 1)
              }}
              className="h-9 px-3 rounded-lg border border-border bg-surface hover:bg-surface-hover"
            >
              Xem màn mở thiệp
            </button>
            <button
              onClick={() => {
                setIntro(false)
                setPreviewKey((k) => k + 1)
              }}
              className="h-9 px-3 rounded-lg text-muted hover:text-text hover:bg-surface-alt"
            >
              Tải lại
            </button>
          </div>
          <p className="text-xs text-faint text-center max-w-[280px]">Bản xem trước dùng khách mẫu &quot;Bác Hùng và gia đình&quot;. Nút xác nhận ở đây không gửi gì.</p>
        </aside>
      </div>
    </div>
  )
}
