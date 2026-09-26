"use server"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) } }
  )
}

export async function confirmSeat(guestCode: string, tableId: string, companions: number) {
  const { data, error } = await createClient().rpc("confirm_seat", {
    p_code: guestCode,
    p_table_id: tableId,
    p_companions: companions,
  })

  if (error) {
    return { error: "INTERNAL_ERROR", message: error.message }
  }

  revalidatePath(`/invite/${guestCode}`)
  return data as { success?: boolean; error?: string; message?: string }
}

export async function markViewed(guestCode: string) {
  await createClient().rpc("mark_viewed", { p_code: guestCode })
}
