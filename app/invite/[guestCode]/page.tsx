import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import InviteClient from "./InviteClient"

export const dynamic = "force-dynamic"

function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function getGuest(guestCode: string) {
  const supabase = createClient()
  const { data: guest } = await supabase
    .from("guests")
    .select("*, events(*), tables(*, floors(*))")
    .eq("code", guestCode)
    .single()
  return guest
}

export async function generateMetadata({ params }: { params: { guestCode: string } }) {
  const guest = await getGuest(params.guestCode)
  if (!guest || !guest.events) {
    return { title: "Thiệp mời - WebTable" }
  }
  const event = guest.events
  return {
    title: `Thiệp mời - ${event.bride_name} & ${event.groom_name}`,
    description: `Bạn được mời đến đám cưới ngày ${event.event_date}`,
    openGraph: {
      images: event.gallery && event.gallery[0] ? [event.gallery[0]] : [],
    },
  }
}

export default async function InvitePage({ params }: { params: { guestCode: string } }) {
  const guest = await getGuest(params.guestCode)

  if (!guest || !guest.events) {
    notFound()
  }

  const event = guest.events
  const lockAt = event && event.lock_at
  const locked = lockAt ? new Date(lockAt).getTime() < Date.now() : false

  const supabase = createClient()
  const { data: floors } = await supabase
    .from("floors")
    .select("*, tables(*)")
    .eq("event_id", event.id)
    .order("order_index", { ascending: true })

  return (
    <InviteClient
      guest={guest}
      event={event}
      floors={floors ?? []}
      locked={locked}
    />
  )
}
