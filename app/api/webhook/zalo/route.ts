import crypto from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendZaloMessage } from "@/lib/zalo"

export async function POST(request: Request) {
  const raw = await request.text()

  const secret = process.env.ZALO_OA_SECRET
  const signature = request.headers.get("x-zevent-signature")
  if (secret && signature) {
    const appId = process.env.ZALO_APP_ID ?? ""
    const expected = crypto.createHash("sha256").update(appId + raw + secret).digest("hex")
    if (expected !== signature.replace(/^mac=/, "")) {
      return Response.json({ error: "INVALID_SIGNATURE" }, { status: 401 })
    }
  }

  let payload: any = {}
  try {
    payload = JSON.parse(raw)
  } catch {
    return Response.json({ ok: true })
  }

  if (payload.event_name === "user_send_text" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const text = String(payload.message?.text ?? "").trim().toUpperCase()
    const userId = payload.sender?.id
    if (text && userId) {
      const { data: guest } = await createAdminClient()
        .from("guests")
        .select("name, confirmed, tables(name)")
        .eq("code", text)
        .maybeSingle()
      const tableName = (guest as any)?.tables?.name
      const reply = guest
        ? `Xin chao ${guest.name}. Trang thai: ${guest.confirmed ? "da xac nhan" : "chua xac nhan"}. Ban: ${tableName ?? "chua co"}.`
        : "Vui long gui ma thiep moi (6 ky tu) de tra cuu."
      try {
        await sendZaloMessage(userId, reply)
      } catch {}
    }
  }

  return Response.json({ ok: true })
}
