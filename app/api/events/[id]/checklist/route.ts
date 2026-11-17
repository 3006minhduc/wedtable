// Checklist of a wedding. GET: items. POST { setup } builds the list from the template (replacing
// any existing items), POST { item } adds one custom item. RLS decides who may read/write.
import { createClient } from "@/lib/supabase/server"
import { buildChecklist, CEREMONIES, OWNERS, PHASES, REGIONS, VENUES } from "@/lib/checklistTemplate"
import type { ChecklistSetup } from "@/lib/checklistTemplate"

async function auth() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}
const unauthorized = () => Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
const fail = (message: string, status = 500) => Response.json({ error: "INTERNAL_ERROR", message }, { status })

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await auth()
  if (!user) return unauthorized()
  const { data, error } = await supabase.from("checklist_items").select("*").eq("event_id", params.id).order("sort").order("created_at")
  if (error) return fail(error.message)
  const { data: ev } = await supabase.from("events").select("checklist_setup").eq("id", params.id).maybeSingle()
  return Response.json({ items: data ?? [], setup: ev?.checklist_setup ?? null })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { supabase, user } = await auth()
  if (!user) return unauthorized()
  const body = await request.json()

  if (body.setup) {
    const s = body.setup
    const setup: ChecklistSetup = {
      region: REGIONS.some((r) => r.key === s.region) ? s.region : "bac",
      ceremonies: (Array.isArray(s.ceremonies) ? s.ceremonies : []).filter((c: string) => CEREMONIES.some((x) => x.key === c)),
      venue: VENUES.some((v) => v.key === s.venue) ? s.venue : "nhahang",
    }
    const rows = buildChecklist(setup).map((r) => ({ ...r, event_id: params.id }))
    // keep what the couple already ticked when they rebuild: match by title
    const { data: old } = await supabase.from("checklist_items").select("title, done, done_at, owner").eq("event_id", params.id)
    const prev = new Map((old ?? []).map((o) => [o.title, o]))
    for (const r of rows as any[]) {
      const p = prev.get(r.title)
      if (p) Object.assign(r, { done: p.done, done_at: p.done_at, owner: p.owner })
    }
    const { error: delErr } = await supabase.from("checklist_items").delete().eq("event_id", params.id)
    if (delErr) return fail(delErr.message)
    const { data, error } = await supabase.from("checklist_items").insert(rows).select()
    if (error) return fail(error.message)
    // remember the answers (collaborators without event edit rights simply skip this)
    await supabase.from("events").update({ checklist_setup: setup }).eq("id", params.id)
    return Response.json({ items: data, setup })
  }

  if (body.item) {
    const t = String(body.item.title ?? "").trim().slice(0, 200)
    if (!t) return fail("Nhập tên việc", 400)
    const row = {
      event_id: params.id,
      title: t,
      phase: PHASES.some((p) => p.key === body.item.phase) ? body.item.phase : "m1",
      owner: (OWNERS as readonly string[]).includes(body.item.owner) ? body.item.owner : "Cả hai",
      note: String(body.item.note ?? "").slice(0, 500),
      sort: 1000,
    }
    const { data, error } = await supabase.from("checklist_items").insert(row).select().single()
    if (error) return fail(error.message)
    return Response.json(data)
  }

  return fail("Thiếu dữ liệu", 400)
}
