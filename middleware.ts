import { NextResponse, type NextRequest } from "next/server"

// Visitors without a Supabase session see the marketing page at "/".
// Signed-in users keep "/" as their dashboard overview.
export function middleware(req: NextRequest) {
  const signedIn = req.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"))
  if (!signedIn) {
    const url = req.nextUrl.clone()
    url.pathname = "/welcome"
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ["/"] }
