import { createClient } from "@/lib/supabase/server"

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
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
  const companions = Number(body.companions ?? 0)

  if (!body.event_id || !body.name) {
    return Response.json({ error: "INVALID", message: "Thiếu tên hoặc sự kiện." }, { status: 400 })
  }

  if (body.table_id) {
    const { data: available } = await supabase.rpc("available_seats", { table_id: body.table_id })
    const left = typeof available === "number" ? available : 0
    if (left < 1 + companions) {
      return Response.json({ error: "TABLE_FULL", message: "Bàn này đã đủ chỗ." }, { status: 409 })
    }
  }

  const { data, error } = await supabase
    .from("guests")
    .insert({
      event_id: body.event_id,
      table_id: body.table_id || null,
      name: body.name,
      phone: body.phone ?? "",
      code: genCode(),
      companions,
      confirmed: true,
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      walk_in: true,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }
  return Response.json({ success: true, guest: data })
}
