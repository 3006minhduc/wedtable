"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useEvents } from "@/lib/useEvents"

const BUCKET = "wedding-media"

const REQUIRED: { key: string; label: string }[] = [
  { key: "bride_name", label: "Tên cô dâu" },
  { key: "groom_name", label: "Tên chú rể" },
  { key: "event_date", label: "Ngày cưới" },
  { key: "event_time", label: "Giờ tổ chức" },
  { key: "venue_name", label: "Địa điểm" },
]

function resizeImage(file: File, max: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("resize failed"))), "image/jpeg", 0.88)
    }
    img.onerror = () => reject(new Error("Không đọc được ảnh"))
    img.src = url
  })
}

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
    invite_message: form.invite_message,
    video_url: form.video_url,
    template: form.template,
    show_guest_names_on_map: form.show_guest_names_on_map,
    lock_at: form.lock_at ? new Date(form.lock_at).toISOString() : null,
  }
}

export default function SettingsPage() {
  const { eventId, loading } = useEvents()
  const [form, setForm] = useState<any>(null)
  const [published, setPublished] = useState(false)
  const [tablesCount, setTablesCount] = useState(0)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [attempted, setAttempted] = useState(false)
  const [missing, setMissing] = useState<string[]>([])
  const [publishing, setPublishing] = useState(false)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null)
  const [gallery, setGallery] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [giftQr, setGiftQr] = useState("")
  const [uploadingQr, setUploadingQr] = useState(false)
  const dirty = useRef(false)
  const publishRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!eventId) return
    dirty.current = false
    setForm(null)
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((e) => {
        setGallery(Array.isArray(e.gallery) ? e.gallery : [])
        setGiftQr(e.gift_qr_url ?? "")
        setPublished(!!e.published)
        setTablesCount((e.floors ?? []).reduce((s: number, f: any) => s + (f.tables?.length ?? 0), 0))
        setForm({
          bride_name: e.bride_name ?? "",
          groom_name: e.groom_name ?? "",
          event_date: e.event_date ?? "",
          event_time: e.event_time ? String(e.event_time).slice(0, 5) : "",
          venue_name: e.venue_name ?? "",
          invite_message: e.invite_message ?? "",
          video_url: e.video_url ?? "",
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

  async function saveGallery(next: string[]) {
    setGallery(next)
    await patch({ gallery: next })
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setNotice(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Chưa đăng nhập")
      let next = [...gallery]
      for (const file of files) {
        const blob = await resizeImage(file, 1200)
        const path = `${user.id}/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
        const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" })
        if (error) throw new Error(error.message)
        next = [...next, supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl]
      }
      await saveGallery(next)
      setNotice({ ok: true, text: `Đã tải lên ${files.length} ảnh` })
    } catch (err: any) {
      setNotice({ ok: false, text: err.message ?? "Lỗi tải ảnh" })
    }
    setUploading(false)
    e.target.value = ""
  }

  async function removePhoto(url: string) {
    if (!confirm("Xóa ảnh này?")) return
    const marker = `/object/public/${BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx >= 0) {
      await createClient().storage.from(BUCKET).remove([decodeURIComponent(url.slice(idx + marker.length))])
    }
    await saveGallery(gallery.filter((u) => u !== url))
  }

  async function uploadGiftQr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingQr(true)
    setNotice(null)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Chưa đăng nhập")
      const blob = await resizeImage(file, 900)
      const path = `${user.id}/${eventId}/gift-qr-${Date.now()}.jpg`
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" })
      if (error) throw new Error(error.message)
      const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      const res = await patch({ gift_qr_url: url })
      if (!res.ok) throw new Error((await res.json()).message ?? "Không lưu được")
      setGiftQr(url)
      setNotice({ ok: true, text: "Đã cập nhật mã QR mừng cưới" })
    } catch (err: any) {
      setNotice({ ok: false, text: err.message ?? "Lỗi tải QR" })
    }
    setUploadingQr(false)
    e.target.value = ""
  }

  async function removeGiftQr() {
    await patch({ gift_qr_url: "" })
    setGiftQr("")
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

  const base = "border rounded-card px-3 py-2 text-sm w-full "
  const cls = (key: string) => base + (invalid(key) ? "border-rose bg-rose/5" : "border-border")
  const Label = ({ text, required, k }: { text: string; required?: boolean; k?: string }) => (
    <label className="text-sm text-muted block mb-1">
      {text}
      {required && <span className="text-rose"> *</span>}
      {k && invalid(k) && <span className="text-rose text-xs ml-2">Chưa điền</span>}
    </label>
  )
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const displayUrl = `${origin}/display/${eventId}`

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold text-text">Cài đặt sự kiện</h1>
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
          <button onClick={() => setNotice(null)}>✕</button>
        </div>
      )}

      <section ref={publishRef} className={"rounded-card p-4 flex flex-col gap-3 border " + (published ? "bg-sage/10 border-sage/40" : "bg-surface border-border")}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold text-text">Publish sự kiện</h2>
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
            <button disabled={publishing} onClick={publish} className="bg-pr text-ink font-medium rounded-pill px-5 py-2 text-sm disabled:opacity-50">
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

      <section className="bg-surface border border-border rounded-card p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-text">Thông tin</h2>
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
        <div>
          <Label text="Lời mời gửi khách" />
          <textarea
            className={cls("invite_message")}
            rows={3}
            placeholder="Để trống sẽ dùng lời mời mặc định ấm áp, trân trọng."
            value={form.invite_message}
            onChange={(e) => set("invite_message", e.target.value)}
          />
          <p className="text-xs text-muted mt-1">Đoạn văn ngắn hiển thị đầu thiệp mời, thay cho lời mời mặc định.</p>
        </div>
        <div>
          <Label text="Link video (YouTube...)" />
          <input className={cls("video_url")} value={form.video_url} onChange={(e) => set("video_url", e.target.value)} />
        </div>
        <div>
          <Label text="Mẫu thiệp" />
          <select className={cls("template")} value={form.template} onChange={(e) => set("template", e.target.value)}>
            <option value="co-dien">Cổ điển</option>
            <option value="hien-dai">Hiện đại</option>
            <option value="toi-gian">Tối giản</option>
          </select>
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

      <section className="bg-surface border border-border rounded-card p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-text">Ảnh cưới ({gallery.length})</h2>
        <p className="text-xs text-muted">Không bắt buộc. Ảnh công khai, hiển thị trên thiệp mời. Tự nén về tối đa 1200px.</p>
        <div className="grid grid-cols-3 gap-2">
          {gallery.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-24 object-cover rounded-card" />
              <button onClick={() => removePhoto(url)} className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5">
                ✕
              </button>
            </div>
          ))}
        </div>
        <label className="border border-border rounded-pill px-4 py-2 text-sm w-fit cursor-pointer">
          {uploading ? "Đang tải lên..." : "+ Tải ảnh lên"}
          <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={handleUpload} />
        </label>
      </section>

      <section className="bg-surface border border-border rounded-card p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-text">Mã QR mừng cưới</h2>
        <p className="text-xs text-muted">Không bắt buộc. Tải ảnh QR ngân hàng/ví của cô dâu chú rể, khách mở thiệp sẽ thấy và quét để mừng.</p>
        {giftQr && (
          <div className="flex items-end gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={giftQr} alt="QR mừng cưới" className="w-40 h-40 object-contain border border-border rounded-card bg-white" />
            <button onClick={removeGiftQr} className="text-xs text-rose hover:underline">
              Xóa QR
            </button>
          </div>
        )}
        <label className="border border-border rounded-pill px-4 py-2 text-sm w-fit cursor-pointer">
          {uploadingQr ? "Đang tải lên..." : giftQr ? "Đổi ảnh QR" : "+ Tải ảnh QR"}
          <input type="file" accept="image/*" className="hidden" disabled={uploadingQr} onChange={uploadGiftQr} />
        </label>
      </section>

      <section className="bg-surface border border-border rounded-card p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-text">Tùy chọn</h2>
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

      <section className="bg-surface border border-border rounded-card p-4 flex flex-col gap-2">
        <h2 className="font-semibold text-text">Màn hình trình chiếu (TV/máy chiếu)</h2>
        <p className="text-sm text-muted break-all">{displayUrl}</p>
        <div className="flex gap-2">
          <a className="border border-border rounded-pill px-3 py-1.5 text-sm" href={displayUrl} target="_blank" rel="noreferrer">
            Mở màn hình
          </a>
          <button
            className="border border-border rounded-pill px-3 py-1.5 text-sm"
            onClick={() => navigator.clipboard.writeText(displayUrl).then(() => setNotice({ ok: true, text: "Đã copy link" }))}
          >
            Copy link
          </button>
        </div>
      </section>

      <section className="border border-rose/40 rounded-card p-4">
        <h2 className="font-semibold text-rose mb-2">Vùng nguy hiểm</h2>
        <button onClick={deleteEvent} className="border border-rose text-rose rounded-pill px-4 py-2 text-sm">
          Xóa đám cưới này
        </button>
      </section>
    </div>
  )
}
