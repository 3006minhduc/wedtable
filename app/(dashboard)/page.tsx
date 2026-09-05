import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardHome() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-text mb-2">Dashboard tổng quan</h1>
      <p className="text-muted">Chào mừng bạn đến với WebTable.</p>
    </div>
  )
}
