import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false })

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  const { data: memberships } = await supabase.from("event_members").select("event_id, role")
  const roleMap = new Map((memberships ?? []).map((m) => [m.event_id, m.role]))

  const withRole = (data ?? []).map((e) => ({
    ...e,
    _role: e.user_id === user.id ? "owner" : roleMap.get(e.id) ?? "member",
  }))

  return Response.json(withRole)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const body = await request.json()

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      bride_name: body.bride_name ?? "",
      groom_name: body.groom_name ?? "",
      event_date: body.event_date ?? null,
      venue_name: body.venue_name ?? "",
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  const { data: floor, error: floorError } = await supabase
    .from("floors")
    .insert({ event_id: event.id, name: "Tầng 1", order_index: 0 })
    .select()
    .single()

  if (floorError) {
    return Response.json({ error: "INTERNAL_ERROR", message: floorError.message }, { status: 500 })
  }

  return Response.json({ ...event, floors: [floor] })
}
