"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/", label: "Tổng quan" },
  { href: "/seating", label: "Sơ đồ bàn" },
  { href: "/guests", label: "Khách mời" },
  { href: "/checkin", label: "Check-in" },
  { href: "/settings", label: "Cài đặt" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[230px] shrink-0 bg-ink min-h-screen p-4">
      <div className="text-white font-semibold text-lg mb-6 px-2">WebTable</div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "px-3 py-2 rounded-card bg-pr text-ink font-medium text-sm"
                  : "px-3 py-2 rounded-card text-white/80 hover:bg-white/10 text-sm"
              }
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
