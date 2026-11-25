import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { notFound } from "next/navigation"
import InviteClient from "./InviteClient"

export const dynamic = "force-dynamic"

function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) } }
  )
}

async function getInvite(guestCode: string) {
  const { data } = await createClient().rpc("get_invite", { p_code: guestCode })
  return data as { error?: string; guest: any; event: any; floors: any[] } | null
}

export async function generateMetadata({ params }: { params: { guestCode: string } }) {
  const invite = await getInvite(params.guestCode)
  if (!invite || invite.error) {
    return { title: "Thiệp mời - WedTable" }
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

  if (invite.error === "NOT_PUBLISHED") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="max-w-sm bg-surface border border-border rounded-card p-8 text-center">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="w-9 h-9 mx-auto mb-3 text-brand" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
          <h1 className="text-lg font-semibold text-text mb-2">Thiệp mời chưa được công bố</h1>
          <p className="text-sm text-muted">Chủ tiệc chưa mở thiệp mời này. Vui lòng quay lại sau hoặc liên hệ trực tiếp với cô dâu chú rể.</p>
        </div>
      </div>
    )
  }

  const { guest, event, floors } = invite
  const lockAt = event.lock_at
  // RSVP closes at the lock time, and in any case once the wedding day is over (Vietnam time)
  const dayOver = event.event_date ? new Date(`${event.event_date}T23:59:59+07:00`).getTime() < Date.now() : false
  const locked = dayOver || (lockAt ? new Date(lockAt).getTime() < Date.now() : false)

  return <InviteClient guest={guest} event={event} floors={floors ?? []} locked={locked} />
}
