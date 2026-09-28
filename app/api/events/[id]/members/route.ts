import { createClient } from "@/lib/supabase/server"

async function requireOwner(supabase: any, eventId: string, userId: string) {
  const { data } = await supabase.from("events").select("id").eq("id", eventId).eq("user_id", userId).maybeSingle()
  return !!data
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }
  if (!(await requireOwner(supabase, params.id, user.id))) {
    return Response.json({ error: "FORBIDDEN", message: "Chỉ chủ sự kiện mới quản lý thành viên." }, { status: 403 })
  }

  const { data, error } = await supabase
    .from("event_members")
    .select("*")
    .eq("event_id", params.id)
    .order("invited_at", { ascending: false })

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }
  return Response.json(data)
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }
  if (!(await requireOwner(supabase, params.id, user.id))) {
    return Response.json({ error: "FORBIDDEN", message: "Chỉ chủ sự kiện mới quản lý thành viên." }, { status: 403 })
  }

  const body = await request.json()
  const email = String(body.email ?? "").trim().toLowerCase()
  const role = String(body.role ?? "")

  if (!email || !email.includes("@")) {
    return Response.json({ error: "INVALID", message: "Email không hợp lệ." }, { status: 400 })
  }
  if (!["design", "setup", "checkin"].includes(role)) {
    return Response.json({ error: "INVALID", message: "Vai trò không hợp lệ." }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("event_members")
    .upsert({ event_id: params.id, email, role }, { onConflict: "event_id,email" })
    .select()
    .single()

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }
  return Response.json(data)
}
