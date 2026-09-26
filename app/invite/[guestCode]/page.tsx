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

async function getInvite(guestCode: string) {
  const { data } = await createClient().rpc("get_invite", { p_code: guestCode })
  return data as { guest: any; event: any; floors: any[] } | null
}

export async function generateMetadata({ params }: { params: { guestCode: string } }) {
  const invite = await getInvite(params.guestCode)
  if (!invite) {
    return { title: "Thiệp mời - WebTable" }
  }
  const event = invite.event
  return {
    title: `Thiệp mời - ${event.bride_name} & ${event.groom_name}`,
    description: `Bạn được mời đến đám cưới ngày ${event.event_date}`,
    openGraph: {
      images: event.gallery && event.gallery[0] ? [event.gallery[0]] : [],
    },
  }
}

export default async function InvitePage({ params }: { params: { guestCode: string } }) {
  const invite = await getInvite(params.guestCode)

  if (!invite) {
    notFound()
  }

  const { guest, event, floors } = invite
  const lockAt = event.lock_at
  const locked = lockAt ? new Date(lockAt).getTime() < Date.now() : false

  return <InviteClient guest={guest} event={event} floors={floors ?? []} locked={locked} />
}
