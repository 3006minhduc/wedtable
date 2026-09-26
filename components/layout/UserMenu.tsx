"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function displayName(user: any) {
  const md = user?.user_metadata ?? {}
  return md.full_name || md.name || (user?.email ? user.email.split("@")[0] : user?.phone) || "Người dùng"
}

export function Avatar({ user, size = 32 }: { user: any; size?: number }) {
  const md = user?.user_metadata ?? {}
  const src = md.avatar_url || md.picture
  const initial = displayName(user).charAt(0).toUpperCase()
  const style = { width: size, height: size }

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" referrerPolicy="no-referrer" style={style} className="rounded-full object-cover" />
  }
  return (
    <div style={style} className="rounded-full bg-pr text-ink font-semibold flex items-center justify-center text-sm">
      {initial}
    </div>
  )
}

export default function UserMenu() {
  const [user, setUser] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [])

  async function logout() {
    await createClient().auth.signOut()
    window.location.href = "/login"
  }

  if (!user) return <div className="w-8 h-8 rounded-full bg-bg" />

  const item = "flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-bg w-full text-left"

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-pill border border-border pl-1 pr-2 py-1 hover:bg-bg"
      >
        <Avatar user={user} />
        <span className="hidden sm:block text-sm text-text max-w-[120px] truncate">{displayName(user)}</span>
        <span className="text-muted text-xs">▾</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-card shadow-lg overflow-hidden z-50">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Avatar user={user} size={40} />
            <div className="min-w-0">
              <div className="text-sm font-medium text-text truncate">{displayName(user)}</div>
              <div className="text-xs text-muted truncate">{user.email || user.phone}</div>
            </div>
          </div>
          <Link href="/profile" className={item} onClick={() => setOpen(false)}>
            Hồ sơ của tôi
          </Link>
          <Link href="/settings" className={item} onClick={() => setOpen(false)}>
            Cài đặt sự kiện
          </Link>
          <div className="border-t border-border" />
          <button onClick={logout} className={item + " text-rose"}>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}
