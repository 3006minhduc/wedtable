// Guestbook moderation for the couple (and the "design" helper role, via RLS):
// GET list, PATCH { id, hidden?, pinned? }, DELETE ?wish=<id>.
import { createClient } from "@/lib/supabase/server"

async function auth() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await auth()
  if (!user) return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  const { data, error } = await supabase.from("wishes").select("id, name, message, hidden, pinned, created_at").eq("event_id", params.id).order("created_at", { ascending: false }).limit(500)
  if (error) return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await auth()
  if (!user) return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  const raw = await request.json()
  const body: Record<string, boolean> = {}
  if ("hidden" in raw) body.hidden = !!raw.hidden
  if ("pinned" in raw) body.pinned = !!raw.pinned
  const { data, error } = await supabase.from("wishes").update(body).eq("id", raw.id).eq("event_id", params.id).select().single()
  if (error) return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await auth()
  if (!user) return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  const wish = new URL(request.url).searchParams.get("wish")
  const { error } = await supabase.from("wishes").delete().eq("id", wish).eq("event_id", params.id)
  if (error) return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  return Response.json({ success: true })
}
