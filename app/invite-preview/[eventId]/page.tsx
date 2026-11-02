"use client"

// Owner-only live preview of the guest invite, embedded as an iframe on /invitation.
// Data comes from the authenticated event API; the editor pushes unsaved edits via postMessage.
import { useEffect, useState } from "react"
import InviteClient from "../../invite/[guestCode]/InviteClient"
import { seatsUsed } from "@/lib/useEvents"

const SAMPLE_GUEST = { id: "preview", name: "Bác Hùng và gia đình", code: "XEMTHU", table_id: null, companions: 0, confirmed: false }

export default function InvitePreviewPage({ params }: { params: { eventId: string } }) {
  // ?intro=1 plays the curtain opening; otherwise the preview starts on the cover
  const [skipIntro] = useState(() => typeof window === "undefined" || new URLSearchParams(window.location.search).get("intro") !== "1")
  const [event, setEvent] = useState<any>(null)
  const [floors, setFloors] = useState<any[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/events/${params.eventId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 401 ? "Bạn cần đăng nhập để xem trước thiệp." : "Không tải được thiệp.")
        return r.json()
      })
      .then((e) => {
        const guests: any[] = e.guests ?? []
        setFloors(
          (e.floors ?? [])
            .sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
            .map((f: any) => ({ ...f, tables: (f.tables ?? []).map((t: any) => ({ ...t, used: seatsUsed(guests, t.id) })) }))
        )
        const { floors: _f, guests: _g, ...rest } = e
        setEvent(rest)
      })
      .catch((err) => setError(err.message))
  }, [params.eventId])

  // Live edits from the editor page (same origin only)
  useEffect(() => {
    function onMessage(m: MessageEvent) {
      if (m.origin !== window.location.origin || m.data?.type !== "wt-invite-preview") return
      setEvent((prev: any) => (prev ? { ...prev, ...m.data.patch } : prev))
    }
    window.addEventListener("message", onMessage)
    window.parent?.postMessage({ type: "wt-invite-preview-ready" }, window.location.origin)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  if (error) return <p className="p-6 text-sm text-muted">{error}</p>
  if (!event) return <p className="p-6 text-sm text-muted">Đang tải bản xem trước…</p>

  return <InviteClient guest={SAMPLE_GUEST} event={event} floors={floors} locked={false} preview skipIntro={skipIntro} />
}
