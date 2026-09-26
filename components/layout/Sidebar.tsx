"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/", label: "Tổng quan", icon: "▦" },
  { href: "/seating", label: "Sơ đồ bàn", icon: "◍" },
  { href: "/guests", label: "Khách mời", icon: "☺" },
  { href: "/checkin", label: "Check-in", icon: "✓" },
  { href: "/settings", label: "Cài đặt", icon: "⚙" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[230px] h-full bg-ink p-3 flex flex-col gap-1">
      <div className="text-[11px] uppercase tracking-wider text-white/40 px-3 pt-2 pb-1">Quản lý</div>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              "flex items-center gap-3 px-3 py-2 rounded-card text-sm " +
              (active ? "bg-pr text-ink font-medium" : "text-white/80 hover:bg-white/10")
            }
          >
            <span className="w-4 text-center">{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </aside>
  )
}
