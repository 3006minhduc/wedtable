"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, displayName } from "@/components/layout/UserMenu"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        setUser(data.user)
        setName(displayName(data.user))
      })
  }, [])

  async function save() {
    setSaving(true)
    setMsg("")
    const { data, error } = await createClient().auth.updateUser({ data: { full_name: name.trim() } })
    setSaving(false)
    if (error) {
      setMsg(error.message)
      return
    }
    setUser(data.user)
    setMsg("Đã lưu tên hiển thị")
  }

  if (!user) return <p className="text-muted">Đang tải...</p>

  const provider = user.app_metadata?.provider ?? "email"
  const providerLabel = provider === "google" ? "Google" : provider === "phone" ? "Số điện thoại" : "Email / mật khẩu"
  const created = user.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : ""

  return (
    <div className="max-w-xl flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-text">Hồ sơ của tôi</h1>

      <section className="bg-surface border border-border rounded-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Avatar user={user} size={64} />
          <div className="min-w-0">
            <div className="font-medium text-text truncate">{displayName(user)}</div>
            <div className="text-sm text-muted truncate">{user.email || user.phone}</div>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted block mb-1">Tên hiển thị</label>
          <input
            className="border border-border rounded-card px-3 py-2 text-sm w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={saving || !name.trim()}
            onClick={save}
            className="bg-pr text-ink font-medium rounded-pill px-5 py-2 text-sm disabled:opacity-50"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          {msg && <span className="text-sm text-sage">{msg}</span>}
        </div>
      </section>

      <section className="bg-surface border border-border rounded-card p-5 text-sm flex flex-col gap-2">
        <div className="flex justify-between">
          <span className="text-muted">Đăng nhập bằng</span>
          <span className="text-text">{providerLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Ngày tạo tài khoản</span>
          <span className="text-text">{created}</span>
        </div>
      </section>
    </div>
  )
}
