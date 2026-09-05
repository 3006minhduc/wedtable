"use server"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function confirmSeat(guestCode: string, tableId: string, companions: number) {
  const supabase = createClient()

  const { data: guest } = await supabase
    .from("guests")
    .select("*, events(*)")
    .eq("code", guestCode)
    .single()

  if (!guest) {
    return { error: "GUEST_NOT_FOUND", message: "Không tìm thấy khách mời." }
  }

  const event = guest.events
  const lockAt = event && event.lock_at
  if (lockAt && new Date(lockAt).getTime() < Date.now()) {
    return { error: "EVENT_LOCKED", message: "Danh sách đã khóa, không thể thay đổi." }
  }

  const { data: available } = await supabase.rpc("available_seats", { table_id: tableId })
  const seatsLeft = typeof available === "number" ? available : 0

  if (seatsLeft < 1 + companions) {
    return { error: "TABLE_FULL", message: "Bàn này đã đủ chỗ." }
  }

  const { data: updated, error } = await supabase
    .from("guests")
    .update({ table_id: tableId, companions, confirmed: true })
    .eq("code", guestCode)
    .select()
    .single()

  if (error) {
    return { error: "INTERNAL_ERROR", message: error.message }
  }

  revalidatePath(`/invite/${guestCode}`)
  return { success: true, guest: updated }
}

export async function markViewed(guestCode: string) {
  const supabase = createClient()
  await supabase.from("guests").update({ viewed: true }).eq("code", guestCode)
}
