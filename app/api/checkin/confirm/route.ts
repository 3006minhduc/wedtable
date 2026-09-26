import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const body = await request.json()
  const undo = body.undo === true

  const { data, error } = await supabase
    .from("guests")
    .update(
      undo
        ? { checked_in: false, checked_in_at: null }
        : { checked_in: true, checked_in_at: new Date().toISOString(), confirmed: true, no_show: false }
    )
    .eq("id", body.guest_id)
    .eq("event_id", body.event_id)
    .select()
    .single()

  if (error) {
    return Response.json({ error: "GUEST_NOT_FOUND", message: error.message }, { status: 404 })
  }
  return Response.json({ success: true, guest: data })
}
