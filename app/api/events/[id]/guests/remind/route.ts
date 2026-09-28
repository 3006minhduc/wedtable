import { createClient } from "@/lib/supabase/server"
import { sendZaloMessage, buildReminderMessage } from "@/lib/zalo"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const guestIds: string[] | undefined = body.guest_ids

  const { data: event } = await supabase.from("events").select("*").eq("id", params.id).single()

  if (!event) {
    return Response.json({ error: "EVENT_NOT_FOUND", message: "Không tìm thấy sự kiện." }, { status: 404 })
  }

  let query = supabase.from("guests").select("*").eq("event_id", params.id)
  if (guestIds && guestIds.length > 0) {
    query = query.in("id", guestIds)
  } else {
    query = query.eq("confirmed", false)
  }

  const { data: guests, error } = await query

  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  let sent = 0
  let failed = 0

  for (const guest of guests ?? []) {
    try {
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${guest.code}`
      const message = buildReminderMessage(guest.name, String(event.event_date ?? ""), inviteUrl)
      await sendZaloMessage(guest.phone, message)
      await supabase
        .from("guests")
        .update({
          remind_count: (guest.remind_count ?? 0) + 1,
          last_remind_at: new Date().toISOString(),
        })
        .eq("id", guest.id)
      sent++
    } catch {
      failed++
    }
  }

  return Response.json({ sent, failed })
}
