import { verifyCallback } from "@/lib/vnpay"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query: Record<string, string> = {}
  url.searchParams.forEach((v, k) => {
    query[k] = v
  })

  const valid = process.env.VNPAY_HASH_SECRET ? verifyCallback(query) : false
  let status = "invalid"

  if (valid) {
    status = query.vnp_ResponseCode === "00" ? "paid" : "failed"
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        await createAdminClient().from("payments").update({ status }).eq("id", query.vnp_TxnRef)
      } catch {}
    }
  }

  return Response.redirect(`${url.origin}/payment/result?status=${status}`, 302)
}
