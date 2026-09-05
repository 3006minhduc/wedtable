import { createClient } from "@/lib/supabase/server"

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const filter = searchParams.get("filter")
  const tableId = searchParams.get("table_id")

  let query = supabase.from("guests").select("*").eq("event_id", params.id)

  if (filter === "confirmed") query = query.eq("confirmed", true)
  if (filter === "pending") query = query.eq("confirmed", false).eq("no_show", false)
  if (filter === "checked_in") query = query.eq("checked_in", true)
  if (filter === "no_show") query = query.eq("no_show", true)
  if (tableId) query = query.eq("table_id", tableId)

  const { data: guests, error } = await query.order("created_at", { ascending: false })

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  const { data: allGuests } = await supabase.from("guests").select("confirmed, no_show, checked_in").eq("event_id", params.id)
  const stats = {
    total: allGuests?.length ?? 0,
    confirmed: allGuests?.filter((g) => g.confirmed).length ?? 0,
    pending: allGuests?.filter((g) => !g.confirmed && !g.no_show).length ?? 0,
    no_show: allGuests?.filter((g) => g.no_show).length ?? 0,
    checked_in: allGuests?.filter((g) => g.checked_in).length ?? 0,
  }

  return Response.json({ guests, stats })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const body = await request.json()

  const { data, error } = await supabase
    .from("guests")
    .insert({
      event_id: params.id,
      name: body.name,
      phone: body.phone ?? "",
      code: genCode(),
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  return Response.json(data)
}
