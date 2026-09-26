import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { createPaymentUrl } from "@/lib/vnpay"

export async function POST(request: Request) {
  if (!process.env.VNPAY_TMN_CODE || !process.env.VNPAY_HASH_SECRET) {
    return Response.json(
      { error: "PAYMENT_NOT_CONFIGURED", message: "Chưa cấu hình VNPay (VNPAY_TMN_CODE, VNPAY_HASH_SECRET)." },
      { status: 503 }
    )
  }

  const body = await request.json()
  const amount = Math.round(Number(body.amount))
  if (!body.event_id || !Number.isFinite(amount) || amount < 10000) {
    return Response.json({ error: "INVALID", message: "Số tiền tối thiểu 10.000đ." }, { status: 400 })
  }

  const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const id = crypto.randomUUID()
  const message = String(body.message ?? "Mung cuoi").slice(0, 200)

  const { error } = await supabase.from("payments").insert({ id, event_id: body.event_id, amount, message, status: "pending" })
  if (error) {
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  const ip = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0].trim()
  const paymentUrl = createPaymentUrl(id, amount, message, ip)
  return Response.json({ payment_url: paymentUrl })
}
