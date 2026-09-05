import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; tableId: string } }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const body = await request.json()

  const { data, error } = await supabase
    .from("tables")
    .update(body)
    .eq("id", params.tableId)
    .eq("event_id", params.id)
    .select()
    .single()

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  return Response.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; tableId: string } }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const { error } = await supabase
    .from("tables")
    .delete()
    .eq("id", params.tableId)
    .eq("event_id", params.id)

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
