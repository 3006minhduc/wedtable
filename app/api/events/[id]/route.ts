import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const { data: event, error } = await supabase
    .from("events")
    .select("*, floors(*, tables(*)), guests(*)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !event) {
    return Response.json({ error: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." }, { status: 404 })
  }

  const guests = event.guests ?? []
  const stats = {
    total: guests.length,
    confirmed: guests.filter((g: any) => g.confirmed).length,
    pending: guests.filter((g: any) => !g.confirmed && !g.no_show).length,
    no_show: guests.filter((g: any) => g.no_show).length,
    checked_in: guests.filter((g: any) => g.checked_in).length,
  }

  return Response.json({ ...event, _stats: stats })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const raw = await request.json()
  const ALLOWED = [
    "bride_name", "groom_name", "event_date", "event_time", "venue_name", "venue_type", "menu", "invite_message",
    "published", "lock_at", "template", "gallery", "video_url", "show_guest_names_on_map", "gift_qr_url",
  ]
  const body: Record<string, any> = {}
  for (const k of ALLOWED) if (k in raw) body[k] = raw[k]

  if (body.published === true) {
    const { data: current } = await supabase
      .from("events")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()
    if (!current) {
      return Response.json({ error: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." }, { status: 404 })
    }
    const merged: Record<string, any> = { ...current, ...body }
    const missing: string[] = []
    if (!String(merged.bride_name ?? "").trim()) missing.push("Tên cô dâu")
    if (!String(merged.groom_name ?? "").trim()) missing.push("Tên chú rể")
    if (!merged.event_date) missing.push("Ngày cưới")
    if (!merged.event_time) missing.push("Giờ tổ chức")
    if (!String(merged.venue_name ?? "").trim()) missing.push("Địa điểm")
    const { count } = await supabase.from("tables").select("*", { count: "exact", head: true }).eq("event_id", params.id)
    if (!count) missing.push("Ít nhất 1 bàn (trong Sơ đồ bàn)")
    if (missing.length > 0) {
      return Response.json(
        { error: "MISSING_FIELDS", message: "Còn thông tin bắt buộc chưa điền: " + missing.join(", "), missing },
        { status: 400 }
      )
    }
  }

  const { data, error } = await supabase
    .from("events")
    .update(body)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  return Response.json(data)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id)

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
