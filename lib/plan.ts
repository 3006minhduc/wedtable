// Plan limits per wedding (events.plan). Database triggers in migration 016 enforce the same numbers.
import { PROMO_END } from "./pricing"

export const FREE_LIMITS = { guests: 50, floors: 1 }

export type PlanEvent = { plan?: string | null; plan_source?: string | null } | null | undefined

export const isPremium = (e: PlanEvent) => e?.plan === "premium"

export const PROMO_END_TEXT = new Date(PROMO_END).toLocaleDateString("vi-VN", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
})

export function planLabel(e: PlanEvent) {
  if (!isPremium(e)) return "Gói Miễn phí"
  return e?.plan_source === "promo" ? `Premium · ưu đãi ra mắt` : "Premium"
}

// Database error codes raised by the plan triggers → friendly Vietnamese messages
export const PLAN_MESSAGES: Record<string, string> = {
  PLAN_LIMIT_GUESTS: `Gói Miễn phí cho tối đa ${FREE_LIMITS.guests} khách. Nâng cấp Premium để thêm khách không giới hạn.`,
  PLAN_LIMIT_FLOORS: "Gói Miễn phí chỉ có 1 tầng. Nâng cấp Premium để thêm tới 3 tầng.",
  PLAN_LIMIT_MEMBERS: "Mời người hỗ trợ là tính năng Premium.",
  PLAN_LIMIT_SHAPE: "Bàn dài là tính năng Premium.",
  PLAN_LIMIT_EVENTS: "Gói Miễn phí cho 1 đám cưới. Nâng cấp đám cưới hiện có lên Premium để tạo thêm.",
  PLAN_PREMIUM_ONLY: "Đây là tính năng Premium.",
}

export function planCode(message?: string | null) {
  const m = String(message ?? "")
  return Object.keys(PLAN_MESSAGES).find((k) => m.includes(k)) ?? null
}

/** Turn a plan-limit database error into a 403 response; null for other errors */
export function planErrorResponse(error: { message?: string } | null | undefined) {
  const code = planCode(error?.message)
  if (!code) return null
  return Response.json({ error: code, message: PLAN_MESSAGES[code], upgrade: true }, { status: 403 })
}

/** For premium-only API routes: returns a 403 response when the event is on the free plan */
export async function requirePremium(supabase: any, eventId: string) {
  const { data } = await supabase.from("events").select("plan").eq("id", eventId).maybeSingle()
  if (data?.plan === "premium") return null
  return Response.json({ error: "PLAN_PREMIUM_ONLY", message: PLAN_MESSAGES.PLAN_PREMIUM_ONLY, upgrade: true }, { status: 403 })
}
