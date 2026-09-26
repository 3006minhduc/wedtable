"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useEvents } from "@/lib/useEvents"

const BUCKET = "wedding-media"

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
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("resize failed"))), "image/jpeg", 0.85)
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

export default function SettingsPage() {
  const { eventId, loading, reload } = useEvents()
  const [form, setForm] = useState<any>(null)
  const [msg, setMsg] = useState("")
  const [saving, setSaving] = useState(false)
  const [gallery, setGallery] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  async function saveGallery(next: string[]) {
    setGallery(next)
    await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gallery: next }),
    })
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    setMsg("")
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
      setMsg(`Đã tải lên ${files.length} ảnh`)
    } catch (err: any) {
      setMsg(err.message ?? "Lỗi tải ảnh")
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

  useEffect(() => {
    if (!eventId) return
    fetch(`/api/events/${eventId}`)
      .then((r) => r.json())
      .then((e) => {
        setGallery(Array.isArray(e.gallery) ? e.gallery : [])
        return e
      })
      .then((e) =>
        setForm({
          bride_name: e.bride_name ?? "",
          groom_name: e.groom_name ?? "",
          event_date: e.event_date ?? "",
          event_time: e.event_time ?? "",
          venue_name: e.venue_name ?? "",
          menu: e.menu ?? "",
          video_url: e.video_url ?? "",
          template: e.template ?? "co-dien",
          published: !!e.published,
          show_guest_names_on_map: !!e.show_guest_names_on_map,
          lock_at: toLocalInput(e.lock_at),
        })
      )
  }, [eventId])

  async function save() {
    setSaving(true)
    setMsg("")
    const body = {
      ...form,
      event_date: form.event_date || null,
      event_time: form.event_time || null,
      lock_at: form.lock_at ? new Date(form.lock_at).toISOString() : null,
    }
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const d = await res.json()
    setSaving(false)
    setMsg(res.ok ? "Đã lưu cài đặt" : d.message ?? "Lỗi khi lưu")
    if (res.ok) reload()
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

  const set = (k: string, v: any) => setForm({ ...form, [k]: v })
  const input = "border border-border rounded-card px-3 py-2 text-sm w-full"
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  const displayUrl = `${origin}/display/${eventId}`

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-text">Cài đặt sự kiện</h1>

      <section className="bg-surface border border-border rounded-card p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-text">Thông tin</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className={input} placeholder="Tên cô dâu" value={form.bride_name} onChange={(e) => set("bride_name", e.target.value)} />
          <input className={input} placeholder="Tên chú rể" value={form.groom_name} onChange={(e) => set("groom_name", e.target.value)} />
          <input className={input} type="date" value={form.event_date} onChange={(e) => set("event_date", e.target.value)} />
          <input className={input} type="time" value={form.event_time} onChange={(e) => set("event_time", e.target.value)} />
        </div>
        <input className={input} placeholder="Địa điểm" value={form.venue_name} onChange={(e) => set("venue_name", e.target.value)} />
        <textarea className={input} rows={3} placeholder="Thực đơn" value={form.menu} onChange={(e) => set("menu", e.target.value)} />
        <input className={input} placeholder="Link video (YouTube...)" value={form.video_url} onChange={(e) => set("video_url", e.target.value)} />
        <select className={input} value={form.template} onChange={(e) => set("template", e.target.value)}>
          <option value="co-dien">Cổ điển</option>
          <option value="hien-dai">Hiện đại</option>
          <option value="toi-gian">Tối giản</option>
        </select>
      </section>

      <section className="bg-surface border border-border rounded-card p-4 flex flex-col gap-3">
        <h2 className="font-semibold text-text">Ảnh cưới ({gallery.length})</h2>
        <p className="text-xs text-muted">Ảnh công khai, hiển thị trên thiệp mời của khách. Tự nén về tối đa 1200px.</p>
        <div className="grid grid-cols-3 gap-2">
          {gallery.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-24 object-cover rounded-card" />
              <button
                onClick={() => removePhoto(url)}
                className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5"
              >
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
        <h2 className="font-semibold text-text">Công khai &amp; khóa danh sách</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
          Publish (khách mở được thiệp mời, màn hình realtime hoạt động)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.show_guest_names_on_map} onChange={(e) => set("show_guest_names_on_map", e.target.checked)} />
          Hiện tên khách trên sơ đồ bàn (màn hình realtime)
        </label>
        <div>
          <label className="text-sm text-muted block mb-1">Khóa thay đổi từ thời điểm</label>
          <input className={input} type="datetime-local" value={form.lock_at} onChange={(e) => set("lock_at", e.target.value)} />
          <p className="text-xs text-muted mt-1">Sau thời điểm này khách không tự đổi bàn được nữa. Để trống = không khóa.</p>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button disabled={saving} onClick={save} className="bg-pr text-ink font-medium rounded-pill px-5 py-2 text-sm disabled:opacity-50">
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
        {msg && <span className="text-sm text-sage">{msg}</span>}
      </div>

      <section className="bg-surface border border-border rounded-card p-4 flex flex-col gap-2">
        <h2 className="font-semibold text-text">Màn hình trình chiếu (TV/máy chiếu)</h2>
        <p className="text-sm text-muted break-all">{displayUrl}</p>
        <div className="flex gap-2">
          <a className="border border-border rounded-pill px-3 py-1.5 text-sm" href={displayUrl} target="_blank" rel="noreferrer">
            Mở màn hình
          </a>
          <button className="border border-border rounded-pill px-3 py-1.5 text-sm" onClick={() => navigator.clipboard.writeText(displayUrl).then(() => setMsg("Đã copy link"))}>
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
