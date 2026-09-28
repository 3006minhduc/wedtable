import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: Request, { params }: { params: { id: string; memberId: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const { data: owned } = await supabase.from("events").select("id").eq("id", params.id).eq("user_id", user.id).maybeSingle()
  if (!owned) {
    return Response.json({ error: "FORBIDDEN", message: "Chỉ chủ sự kiện mới quản lý thành viên." }, { status: 403 })
  }

  const { error } = await supabase.from("event_members").delete().eq("id", params.memberId).eq("event_id", params.id)
  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }
  return Response.json({ success: true })
}
