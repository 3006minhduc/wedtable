"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { NAV_BY_ROLE, useEvents } from "@/lib/useEvents"
import Icon from "@/components/ui/Icon"

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
    <div style={style} className="rounded-full bg-brand-soft text-brand font-semibold flex items-center justify-center text-sm">
      {initial}
    </div>
  )
}

export default function UserMenu() {
  const [user, setUser] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { role } = useEvents()
  const canSettings = (NAV_BY_ROLE[role] ?? NAV_BY_ROLE.owner).includes("/settings")

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

  if (!user) return <div className="w-8 h-8 rounded-full bg-surface-alt" />

  const item = "flex items-center gap-2.5 px-4 min-h-[40px] text-sm text-text hover:bg-surface-alt w-full text-left"

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg pl-1 pr-2 h-10 hover:bg-surface-alt"
      >
        <Avatar user={user} />
        <span className="hidden sm:block text-sm text-text max-w-[140px] truncate">{displayName(user)}</span>
        <Icon name="chevronDown" size={16} className="text-faint" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-card shadow-pop overflow-hidden z-50 py-1">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Avatar user={user} size={40} />
            <div className="min-w-0">
              <div className="text-sm font-medium text-text truncate">{displayName(user)}</div>
              <div className="text-xs text-muted truncate">{user.email || user.phone}</div>
            </div>
          </div>
          <Link href="/profile" className={item} onClick={() => setOpen(false)}>
            <Icon name="user" size={16} className="text-faint" />
            Hồ sơ của tôi
          </Link>
          {canSettings && (
            <Link href="/settings" className={item} onClick={() => setOpen(false)}>
              <Icon name="settings" size={16} className="text-faint" />
              Cài đặt sự kiện
            </Link>
          )}
          <div className="border-t border-border my-1" />
          <button onClick={logout} className={item + " !text-error"}>
            <Icon name="logout" size={16} />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}
