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

  const body = await request.json()

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
