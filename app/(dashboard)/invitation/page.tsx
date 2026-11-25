"use client"

// Invitation designer: theme, wording, families, timeline, dress code, story, photos, gift QR, video.
// Autosaves like Settings; the phone preview on the right updates instantly via postMessage.
import { useEffect, useRef, useState } from "react"
import TemplatePicker from "@/components/invitation/TemplatePicker"
import { CeremonyEditor, GiftEditor, MilestoneEditor, WishesManager } from "@/components/invitation/Editors"
import Icon from "@/components/ui/Icon"
import { inviteCompleteness } from "@/lib/eventHealth"
import PremiumNote from "@/components/ui/PremiumNote"
import { createClient } from "@/lib/supabase/client"
import { resizeImage } from "@/lib/image"
import { TIMELINE_ICONS, templateOf } from "@/lib/inviteThemes"
import type { InviteStyle } from "@/lib/inviteThemes"
import { isPremium } from "@/lib/plan"
import { videoEmbed } from "@/lib/videoEmbed"
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
  "venue_address",
  "music_url",
  "faq",
  "ceremonies",
  "gift_accounts",
  "story_milestones",
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

function Section({ title, desc, children, id }: { title: string; desc?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="bg-surface border border-border rounded-card p-5 sm:p-6 flex flex-col gap-4 scroll-mt-20 transition-shadow">
      <div>
        <h2 className="font-semibold text-[15px] text-text">{title}</h2>
        {desc && <p className="text-sm text-muted mt-0.5">{desc}</p>}
      </div>
      {children}
    </section>
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

function FaqEditor({ items, onChange }: { items: { q: string; a: string }[]; onChange: (next: { q: string; a: string }[]) => void }) {
  const update = (i: number, patch: any) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && (
        <button
          onClick={() => onChange(FAQ_SAMPLES.map((x) => ({ ...x })))}
          className="text-left text-sm text-muted bg-surface-alt rounded-lg p-3 hover:text-text"
        >
          Chưa có câu nào. <span className="underline">Dùng {FAQ_SAMPLES.length} câu mẫu</span> (giờ đón khách, gửi xe, trẻ em, quà mừng) rồi sửa lại.
        </button>
      )}
      {items.map((it, i) => (
        <div key={i} className="flex gap-2 items-start bg-surface-alt rounded-lg p-2">
          <div className="flex-1 flex flex-col gap-2">
            <input className={field} placeholder="Câu hỏi" value={it.q ?? ""} onChange={(e) => update(i, { q: e.target.value })} />
            <textarea className={field} rows={2} placeholder="Trả lời" value={it.a ?? ""} onChange={(e) => update(i, { a: e.target.value })} />
          </div>
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="w-9 h-9 rounded-lg text-muted hover:text-error hover:bg-surface" aria-label="Xóa câu hỏi">
            <Icon name="close" size={14} className="mx-auto" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { q: "", a: "" }])}
        className="inline-flex items-center gap-1.5 border border-border bg-surface hover:bg-surface-hover hover:border-border-hover rounded-lg h-9 px-3 text-sm w-fit"
      >
        <Icon name="plus" size={14} /> Thêm câu hỏi
      </button>
    </div>
  )
}

const FAQ_SAMPLES = [
  { q: "Mấy giờ mình nên có mặt?", a: "Bạn đến trước giờ khai tiệc khoảng 30 phút để chụp ảnh cùng cô dâu chú rể nhé." },
  { q: "Có chỗ gửi xe không?", a: "Nhà hàng có bãi gửi xe máy và ô tô miễn phí ngay cạnh sảnh." },
  { q: "Mình có thể đưa bé đi cùng không?", a: "Rất hoan nghênh các bé! Bạn nhớ tính bé vào số người đi cùng khi xác nhận nhé." },
  { q: "Nếu không đến được thì gửi quà thế nào?", a: "Bạn có thể dùng mã QR ở mục Hộp mừng cưới. Lời chúc của bạn là món quà quý nhất." },
]

export default function InvitationPage() {
  const { eventId, loading } = useEvents()
  const [form, setForm] = useState<any>(null)
  const [gallery, setGallery] = useState<string[]>([])
  const [giftQr, setGiftQr] = useState("")
  const [premium, setPremium] = useState(true)
  const [published, setPublished] = useState(false)
  const [venueName, setVenueName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [firstCode, setFirstCode] = useState<string | null>(null)
  const [ev, setEv] = useState<any>(null)
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
        setVenueName(e.venue_name ?? "")
        setFirstCode(e.guests?.[0]?.code ?? null)
        const { guests: _g, floors: _f, ...rest } = e
        setEv(rest)
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
          venue_address: e.venue_address ?? "",
          music_url: e.music_url ?? "",
          faq: Array.isArray(e.faq) ? e.faq : [],
          ceremonies: Array.isArray(e.ceremonies) ? e.ceremonies : [],
          gift_accounts: Array.isArray(e.gift_accounts) ? e.gift_accounts : [],
          story_milestones: Array.isArray(e.story_milestones) ? e.story_milestones : [],
        })
        setEventDate(e.event_date ?? "")
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

  const [uploadingMusic, setUploadingMusic] = useState(false)
  async function uploadMusic(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (file.size > 15 * 1024 * 1024) return setNotice({ ok: false, text: "File nhạc tối đa 15 MB" })
    setUploadingMusic(true)
    setNotice(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Chưa đăng nhập")
      const ext = (file.name.split(".").pop() || "mp3").toLowerCase().replace(/[^a-z0-9]/g, "")
      const path = `${user.id}/${eventId}/music-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || "audio/mpeg" })
      if (error) throw new Error(error.message)
      set("music_url", supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl)
      setNotice({ ok: true, text: "Đã tải nhạc lên" })
    } catch (err: any) {
      setNotice({ ok: false, text: err.message ?? "Lỗi tải nhạc" })
    }
    setUploadingMusic(false)
  }

  if (loading || (eventId && !form)) return <p className="text-muted">Đang tải...</p>
  if (!eventId) return <p className="text-muted">Bạn chưa có sự kiện nào. Tạo ở trang Tổng quan.</p>

  const previewSrc = `/invite-preview/${eventId}${intro ? "?intro=1" : ""}`
  const activeTemplate: InviteStyle = premium ? templateOf(form.invite_template) : "floral"
  const activeTheme = premium ? form.invite_theme : "classic"

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
          <span>Thiệp chưa công khai nên khách chưa mở được. Bạn vẫn xem trước được ở khung bên cạnh.</span>
          <a href="/settings" className="text-brand hover:underline underline-offset-4">Công khai thiệp trong Cài đặt</a>
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
          {ev && (
            <TemplatePicker
              event={{ ...ev, ...form }}
              cover={gallery[0]}
              second={gallery[1]}
              template={activeTemplate}
              palette={activeTheme}
              premium={premium}
              onChange={(template, palette) => {
                dirty.current = true
                setForm((f: any) => ({ ...f, invite_template: template, invite_theme: palette }))
              }}
            />
          )}
          <InviteMeter ev={{ ...form, gallery, gift_qr_url: giftQr }} premium={premium} />

          <Section id="loi-moi" title="Lời mời và hai bên gia đình" desc="Mục nào để trống sẽ không hiện trên thiệp.">
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

          <Section id="cac-le" title="Các nghi lễ" desc="Lễ vu quy, lễ thành hôn… mỗi lễ một dòng có giờ, nơi tổ chức, nút chỉ đường và lưu vào lịch. Để trống nếu chỉ có tiệc.">
            <CeremonyEditor items={form.ceremonies} onChange={(v) => set("ceremonies", v)} weddingDate={eventDate} />
          </Section>

          <Section id="ban-do" title="Địa chỉ và bản đồ" desc="Thiệp sẽ hiện bản đồ Google ngay trong khung địa điểm, kèm nút Chỉ đường.">
            <div>
              <Label hint={venueName ? `Tên địa điểm: ${venueName} (đổi trong Cài đặt)` : "Tên địa điểm nhập trong Cài đặt"}>Địa chỉ tiệc</Label>
              <input className={field} placeholder="Số 1 Đường ABC, Phường X, Quận Y, Hà Nội" value={form.venue_address} onChange={(e) => set("venue_address", e.target.value)} />
            </div>
            {form.venue_address.trim() && (
              <div className="overflow-hidden rounded-lg border border-border">
                <iframe
                  title="Bản đồ"
                  loading="lazy"
                  className="block w-full h-52 border-0"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent([venueName, form.venue_address].filter(Boolean).join(", "))}&z=16&output=embed`}
                />
              </div>
            )}
          </Section>

          <Section id="anh-cuoi" title="Ảnh cưới" desc="Ảnh đầu tiên làm ảnh bìa, ảnh thứ hai đi kèm câu chuyện. Từ 3 ảnh trở lên sẽ có ảnh lớn xen giữa các mục, còn lại vào album (không giới hạn số ảnh, khách chạm để xem lớn). Ảnh tự nén về tối đa 1200px.">
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
              <Section id="lich-trinh" title="Lịch trình ngày cưới" desc="Các mốc tự xếp theo giờ.">
                <TimelineEditor items={form.timeline} onChange={(next) => set("timeline", next)} />
              </Section>

              <Section id="dress-code" title="Dress code">
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

              <Section id="cau-chuyen" title="Câu chuyện của hai bạn" desc="Hiện kèm ảnh thứ hai trong mục Ảnh cưới.">
                <textarea className={field} rows={5} placeholder="Chúng mình gặp nhau lần đầu vào một chiều mưa Hà Nội…" value={form.love_story} onChange={(e) => set("love_story", e.target.value)} />
                <div>
                  <Label hint="hiện thành dòng thời gian dưới đoạn kể">Các mốc đáng nhớ</Label>
                  <MilestoneEditor items={form.story_milestones} onChange={(v) => set("story_milestones", v)} />
                </div>
              </Section>

              <Section id="mung-cuoi" title="Hộp mừng cưới" desc="Mỗi bên một tài khoản: khách chọn Mừng chú rể hoặc Mừng cô dâu, quét QR hoặc bấm sao chép số tài khoản.">
                <GiftEditor items={form.gift_accounts} onChange={(v) => set("gift_accounts", v)} upload={(f, name) => upload(f, 800, name)} />
                <p className="text-sm text-muted">Hoặc chỉ dùng một mã QR chung:</p>
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

              <Section id="nhac-nen" title="Nhạc nền" desc="Nhạc bắt đầu phát khi khách mở thiệp, có nút bật/tắt ở góc dưới. Tải file MP3 (tối đa 15 MB) hoặc dán link file nhạc.">
                <input className={field} placeholder="https://…/bai-hat.mp3" value={form.music_url} onChange={(e) => set("music_url", e.target.value)} />
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="inline-flex items-center gap-1.5 border border-border bg-surface hover:bg-surface-hover hover:border-border-hover rounded-lg h-9 px-3 text-sm w-fit cursor-pointer">
                    <Icon name="plus" size={14} />
                    {uploadingMusic ? "Đang tải lên…" : form.music_url ? "Đổi file nhạc" : "Tải file nhạc"}
                    <input type="file" accept="audio/*" className="hidden" disabled={uploadingMusic} onChange={uploadMusic} />
                  </label>
                  {form.music_url && (
                    <>
                      <audio src={form.music_url} controls preload="none" className="h-9 max-w-full" />
                      <button onClick={() => set("music_url", "")} className="text-sm text-error hover:underline underline-offset-4">
                        Bỏ nhạc
                      </button>
                    </>
                  )}
                </div>
                {/youtu.?be|spotify|zingmp3|nhaccuatui/i.test(form.music_url) && (
                  <p className="text-xs text-error">Link YouTube, Spotify, Zing MP3 không phát nền được. Hãy tải file MP3 lên.</p>
                )}
              </Section>

              <Section id="hoi-dap" title="Câu hỏi thường gặp" desc="Khách bấm vào từng câu để xem trả lời. Hiện ngay trước mục Xác nhận tham dự.">
                <FaqEditor items={form.faq} onChange={(next) => set("faq", next)} />
              </Section>
            </>
          ) : (
            <PremiumNote title="Lịch trình, dress code, câu chuyện, hộp mừng cưới, nhạc nền, câu hỏi thường gặp">Các phần này có trong gói Premium.</PremiumNote>
          )}

          <Section id="loi-chuc" title="Sổ lời chúc" desc="Khách gửi lời chúc ở cuối thiệp. Ẩn lời chúc không phù hợp, ghim lời chúc hay lên đầu.">
            <WishesManager eventId={eventId} />
          </Section>

          <Section id="video" title="Video cưới" desc="Dán link YouTube, Vimeo hoặc Google Drive. Khách xem video ngay trong thiệp.">
            <input className={field} placeholder="https://youtube.com/watch?v=…" value={form.video_url} onChange={(e) => set("video_url", e.target.value)} />
            {form.video_url.trim() &&
              (() => {
                const v = videoEmbed(form.video_url)
                if (!v) return <p className="text-xs text-error">Link chưa đúng, hãy dán cả đường dẫn bắt đầu bằng https://</p>
                if (v.kind === "link") return <p className="text-xs text-muted">Không phát trực tiếp được link này, thiệp sẽ hiện nút mở video.</p>
                return (
                  <p className="text-xs text-success">
                    Video sẽ phát ngay trong thiệp.{form.video_url.includes("drive.google") ? " Nhớ chia sẻ file ở chế độ “Bất kỳ ai có đường liên kết”." : ""}
                  </p>
                )
              })()}
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
                style={{ width: 394, height: 823, transform: "scale(0.7)" }}
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

/** "Thiệp hoàn thiện x%" with the missing parts, each jumping to its editor block */
function InviteMeter({ ev, premium }: { ev: any; premium: boolean }) {
  const { pct, missing, total } = inviteCompleteness(ev, premium)
  const [open, setOpen] = useState(false)
  const shown = open ? missing : missing.slice(0, 3)
  const r = 15.5
  const c = 2 * Math.PI * r
  const go = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: "smooth", block: "start" })
    el.classList.add("ring-2", "ring-brand/40")
    setTimeout(() => el.classList.remove("ring-2", "ring-brand/40"), 1800)
  }
  return (
    <section className="bg-surface border border-border rounded-card p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90" aria-hidden>
            <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3.5" className="stroke-surface-alt" />
            <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3.5" strokeLinecap="round" className={pct === 100 ? "stroke-success" : "stroke-brand"} strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: "stroke-dashoffset .6s ease" }} />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold tabular-nums">{pct}%</span>
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-[15px] text-text">{pct === 100 ? "Thiệp đã đủ thông tin" : `Thiệp hoàn thiện ${pct}%`}</h2>
          <p className="text-sm text-muted mt-0.5">
            {pct === 100 ? "Khách có đủ mọi thứ cần biết. Mở khung xem trước để kiểm tra lần cuối." : "Thêm các phần dưới đây để khách có đủ thông tin và thiệp đẹp hơn."}
          </p>
        </div>
      </div>
      {missing.length > 0 && (
        <div className="mt-4 -mx-5 sm:-mx-6">
          {shown.map((m) => (
            <div key={m.key} className="flex items-center gap-3 px-5 sm:px-6 py-3 border-t border-border">
              <Icon name="plus" size={16} className="text-faint shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text">
                  {m.title} <span className="text-xs text-muted tabular-nums">+{Math.round((m.weight / total) * 100)}%</span>
                </p>
                <p className="text-xs text-muted mt-0.5">{m.why}</p>
              </div>
              <button onClick={() => go(m.section)} className="shrink-0 h-8 px-3 rounded-lg border border-border text-xs font-medium text-text hover:bg-surface-hover">
                Thêm
              </button>
            </div>
          ))}
          {missing.length > 3 && (
            <button onClick={() => setOpen((o) => !o)} className="px-5 sm:px-6 pt-3 text-xs text-muted hover:text-text">
              {open ? "Thu gọn" : `Xem thêm ${missing.length - 3} mục`}
            </button>
          )}
        </div>
      )}
    </section>
  )
}
