import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const body = await request.json()

  const row: Record<string, any> = {
    event_id: params.id,
    floor_id: body.floor_id,
    name: body.name ?? "Bàn mới",
    seats: body.seats ?? 10,
    x_pct: body.x_pct ?? 50,
    y_pct: body.y_pct ?? 50,
    vip: body.vip ?? false,
  }
  // Only send shape when it isn't the default, so this works before migration 014 runs
  if (body.shape === "rect") row.shape = "rect"

  const { data, error } = await supabase
    .from("tables")
    .insert(row)
    .select()
    .single()

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  return Response.json(data)
}
