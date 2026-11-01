"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Icon from "@/components/ui/Icon"
import { NAV_BY_ROLE, useEvents } from "@/lib/useEvents"

const NAV_ITEMS = [
  { href: "/", label: "Tổng quan", icon: "overview" },
  { href: "/seating", label: "Sơ đồ bàn", icon: "seating" },
  { href: "/guests", label: "Khách mời", icon: "guests" },
  { href: "/checkin", label: "Check-in", icon: "checkin" },
  { href: "/settings", label: "Cài đặt", icon: "settings" },
]

export default function Sidebar({ role = "owner" }: { role?: string }) {
  const pathname = usePathname()
  const { eventId } = useEvents()
  const allowed = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.owner
  const items = NAV_ITEMS.filter((item) => allowed.includes(item.href))

  return (
    <aside className="w-[224px] h-full bg-surface border-r border-border px-3 py-4 flex flex-col gap-0.5">
      <p className="text-xs text-faint px-3 pb-2">Đám cưới</p>
      {items.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              "flex items-center gap-2.5 px-3 min-h-[38px] rounded-lg text-sm transition-colors " +
              (active ? "bg-brand-soft text-brand font-medium" : "text-muted hover:bg-surface-alt hover:text-text")
            }
          >
            <Icon name={item.icon} />
            {item.label}
          </Link>
        )
      })}

      {eventId && (
        <div className="mt-auto pt-4 border-t border-border">
          <a
            href={`/display/${eventId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 px-3 min-h-[38px] rounded-lg text-sm text-muted hover:bg-surface-alt hover:text-text"
          >
            <Icon name="display" />
            Trình chiếu
            <Icon name="external" size={14} className="ml-auto text-faint" />
          </a>
        </div>
      )}
    </aside>
  )
}
