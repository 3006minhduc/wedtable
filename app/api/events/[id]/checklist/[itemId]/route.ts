// One checklist item: PATCH (done, owner, title, note, phase) / DELETE.
import { createClient } from "@/lib/supabase/server"
import { OWNERS, PHASES } from "@/lib/checklistTemplate"

export async function PATCH(request: Request, { params }: { params: { id: string; itemId: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  const raw = await request.json()
  const body: Record<string, any> = {}
  if ("done" in raw) {
    body.done = !!raw.done
    body.done_at = raw.done ? new Date().toISOString() : null
  }
  if ("owner" in raw && (OWNERS as readonly string[]).includes(raw.owner)) body.owner = raw.owner
  if ("title" in raw && String(raw.title).trim()) body.title = String(raw.title).trim().slice(0, 200)
  if ("note" in raw) body.note = String(raw.note ?? "").slice(0, 500)
  if ("phase" in raw && PHASES.some((p) => p.key === raw.phase)) body.phase = raw.phase
  const { data, error } = await supabase.from("checklist_items").update(body).eq("id", params.itemId).eq("event_id", params.id).select().single()
  if (error) return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(_req: Request, { params }: { params: { id: string; itemId: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  const { error } = await supabase.from("checklist_items").delete().eq("id", params.itemId).eq("event_id", params.id)
  if (error) return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  return Response.json({ success: true })
}
