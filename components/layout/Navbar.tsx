"use client"

import Link from "next/link"
import { useEvents } from "@/lib/useEvents"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/ui/Logo"
import UserMenu from "./UserMenu"

export default function Navbar({ onMenu, menuOpen }: { onMenu?: () => void; menuOpen?: boolean }) {
  const { events, eventId, setEventId } = useEvents()

  return (
    <header className="h-14 sticky top-0 z-40 bg-surface border-b border-border flex items-center gap-3 px-3 md:px-0">
      <button
        onClick={onMenu}
        aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
        aria-expanded={menuOpen}
        className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-muted hover:bg-surface-alt shrink-0"
      >
        <Icon name={menuOpen ? "close" : "menu"} size={20} />
      </button>

      <Link href="/" className="flex items-center shrink-0 md:w-[224px] md:px-6" aria-label="WedTable — Tổng quan">
        <Logo />
      </Link>

      <div className="flex-1 flex items-center gap-4 min-w-0 md:pl-6">
        {events.length > 0 && (
          <div className="relative min-w-0">
            <select
              className="appearance-none bg-surface border border-border hover:border-border-hover rounded-lg pl-3 pr-8 h-9 text-sm font-medium text-text max-w-[150px] sm:max-w-[260px] truncate cursor-pointer"
              value={eventId ?? ""}
              onChange={(e) => setEventId(e.target.value)}
              aria-label="Chọn đám cưới"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.bride_name || "?"} &amp; {e.groom_name || "?"}
                </option>
              ))}
            </select>
            <Icon name="chevronDown" size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          </div>
        )}
      </div>

      <div className="md:pr-6">
        <UserMenu />
      </div>
    </header>
  )
}
