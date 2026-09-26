"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-bg">
      <div
        className={
          "fixed inset-y-0 left-0 z-30 w-[230px] shrink-0 transition-transform md:static md:translate-x-0 " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <Sidebar />
      </div>
      {open && <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
