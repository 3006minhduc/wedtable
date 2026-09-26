import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const code = (searchParams.get("code") ?? "").trim().toUpperCase()
  const eventId = searchParams.get("event_id")

  if (!code || !eventId) {
    return Response.json({ guest: null, action: "not_found" }, { status: 400 })
  }

  const { data: guest } = await supabase
    .from("guests")
    .select("id, name, phone, code, companions, checked_in, no_show, tables(name)")
    .eq("event_id", eventId)
    .eq("code", code)
    .maybeSingle()

  if (!guest) {
    return Response.json({ guest: null, action: "not_found" })
  }

  return Response.json({
    guest,
    action: guest.checked_in ? "already_checked_in" : "ready_to_checkin",
  })
}
