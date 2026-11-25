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

export async function confirmSeat(guestCode: string, tableId: string, companions: number, dietary = "", note = "", side = "") {
  const { data, error } = await createClient().rpc("confirm_seat", {
    p_code: guestCode,
    p_table_id: tableId,
    p_companions: companions,
    p_dietary: dietary.slice(0, 300),
    p_note: note.slice(0, 1000),
    p_side: side || null,
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

export async function addWish(guestCode: string, message: string, name?: string) {
  const { data, error } = await createClient().rpc("add_wish", { p_code: guestCode, p_message: message.slice(0, 500), p_name: name ?? null })
  if (error) return { error: "INTERNAL_ERROR", message: error.message }
  return data as { success?: boolean; error?: string; message?: string }
}

export async function getWishes(guestCode: string) {
  const { data } = await createClient().rpc("get_wishes", { p_code: guestCode })
  return (Array.isArray(data) ? data : []) as { id: string; name: string; message: string; pinned: boolean; created_at: string; mine: boolean }[]
}
