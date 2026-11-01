"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"
import { EXEMPT_ROUTES, NAV_BY_ROLE, useEvents } from "@/lib/useEvents"

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { role, loading, eventId } = useEvents()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (loading || !eventId) return
    if (EXEMPT_ROUTES.includes(pathname)) return
    const allowed = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.owner
    if (!allowed.includes(pathname) && allowed.length > 0) {
      router.replace(allowed[0])
    }
  }, [loading, eventId, role, pathname, router])

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Navbar onMenu={() => setOpen((o) => !o)} menuOpen={open} />
      <div className="flex flex-1 min-h-0">
        <div
          className={
            "fixed top-14 bottom-0 left-0 z-30 transition-transform duration-200 md:sticky md:top-14 md:self-start md:h-[calc(100vh-3.5rem)] md:translate-x-0 shrink-0 " +
            (open ? "translate-x-0 shadow-pop md:shadow-none" : "-translate-x-full")
          }
        >
          <Sidebar role={role} />
        </div>
        {open && <div className="fixed inset-0 top-14 bg-ink/30 z-20 md:hidden" onClick={() => setOpen(false)} />}
        <main key={pathname} className="page-enter flex-1 min-w-0 px-4 py-5 md:px-8 md:py-7">
          <div className="max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
