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
  const { count } = await supabase
    .from("floors")
    .select("*", { count: "exact", head: true })
    .eq("event_id", params.id)

  if ((count ?? 0) >= 3) {
    return Response.json({ error: "MAX_FLOORS", message: "Tối đa 3 tầng." }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("floors")
    .insert({ event_id: params.id, name: body.name || `Tầng ${(count ?? 0) + 1}`, order_index: count ?? 0 })
    .select()
    .single()

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }
  return Response.json(data)
}
