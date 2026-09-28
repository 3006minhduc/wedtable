import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, { params }: { params: { id: string; floorId: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const raw = await request.json()
  const ALLOWED = ["name", "elements", "background_url", "background_opacity", "layout_template"]
  const body: Record<string, any> = {}
  for (const k of ALLOWED) if (k in raw) body[k] = raw[k]

  const { data, error } = await supabase
    .from("floors")
    .update(body)
    .eq("id", params.floorId)
    .eq("event_id", params.id)
    .select()
    .single()

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }
  return Response.json(data)
}

export async function DELETE(request: Request, { params }: { params: { id: string; floorId: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const { error } = await supabase.from("floors").delete().eq("id", params.floorId).eq("event_id", params.id)
  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }
  return Response.json({ success: true })
}
