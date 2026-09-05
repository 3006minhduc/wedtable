import { createClient } from "@/lib/supabase/server"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; guestId: string } }
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
    .from("guests")
    .update(body)
    .eq("id", params.guestId)
    .eq("event_id", params.id)
    .select()
    .single()

  if (error) {
    return Response.json({ error: "GUEST_NOT_FOUND", message: error.message }, { status: 404 })
  }

  return Response.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; guestId: string } }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const { error } = await supabase
    .from("guests")
    .delete()
    .eq("id", params.guestId)
    .eq("event_id", params.id)

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
