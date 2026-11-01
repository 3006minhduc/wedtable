import { createClient } from "@/lib/supabase/server"
import { FREE_LIMITS, planErrorResponse } from "@/lib/plan"

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const body = await request.json()
  const guests = body.guests ?? []
  const errors: string[] = []

  const rows = guests
    .filter((g: any) => {
      if (!g.name) {
        errors.push(`Thiếu tên: ${JSON.stringify(g)}`)
        return false
      }
      return true
    })
    .map((g: any) => ({
      event_id: params.id,
      name: g.name,
      phone: g.phone ?? "",
      code: genCode(),
    }))

  if (rows.length === 0) {
    return Response.json({ added: 0, skipped: errors.length, errors })
  }

  // Free plan: refuse the whole import if it would pass the guest limit
  const { data: ev } = await supabase.from("events").select("plan").eq("id", params.id).maybeSingle()
  if (ev && ev.plan !== "premium") {
    const { count } = await supabase.from("guests").select("*", { count: "exact", head: true }).eq("event_id", params.id)
    const room = FREE_LIMITS.guests - (count ?? 0)
    if (rows.length > room) {
      return Response.json(
        {
          error: "PLAN_LIMIT_GUESTS",
          message: `Gói Miễn phí cho tối đa ${FREE_LIMITS.guests} khách, bạn chỉ còn thêm được ${Math.max(0, room)} khách. Nâng cấp Premium để nhập toàn bộ ${rows.length} khách.`,
          upgrade: true,
        },
        { status: 403 }
      )
    }
  }

  const { data, error } = await supabase.from("guests").insert(rows).select()

  if (error) {
    const planErr = planErrorResponse(error)
    if (planErr) return planErr
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  return Response.json({ added: data?.length ?? 0, skipped: errors.length, errors })
}
