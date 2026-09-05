import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const body = await request.json()
  const positions = body.positions ?? []

  const results = await Promise.all(
    positions.map((p: { id: string; x_pct: number; y_pct: number }) =>
      supabase
        .from("tables")
        .update({ x_pct: p.x_pct, y_pct: p.y_pct })
        .eq("id", p.id)
        .eq("event_id", params.id)
    )
  )

  const failed = results.find((r) => r.error)
  if (failed?.error) {
    return Response.json({ error: "INTERNAL_ERROR", message: failed.error.message }, { status: 500 })
  }

  return Response.json({ success: true, updated: positions.length })
}
