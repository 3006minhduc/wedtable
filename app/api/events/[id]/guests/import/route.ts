import { createClient } from "@/lib/supabase/server"

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

  const { data, error } = await supabase.from("guests").insert(rows).select()

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  return Response.json({ added: data?.length ?? 0, skipped: errors.length, errors })
}
