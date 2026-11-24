// Calendar file (.ics) for a guest's invite: opens the phone's calendar app with the wedding and a reminder
// the day before. Public (same data the invite shows, through the get_invite RPC). RFC 5545: escaped text,
// UTC times, folded lines, CRLF.
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n")

/** fold content lines longer than 75 octets (UTF-8) */
function fold(line: string) {
  const enc = new TextEncoder()
  const out: string[] = []
  let cur = ""
  for (const ch of Array.from(line)) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) {
      out.push(cur)
      cur = ch
    } else cur += ch
  }
  out.push(cur)
  return out.join("\r\n ")
}

/** wedding wall-clock time in Vietnam (UTC+7, no daylight saving) → UTC stamp */
function utcStamp(date: string, time: string | null, addHours = 0) {
  const [y, m, d] = date.split("-").map(Number)
  const [hh, mm] = (time ?? "00:00").slice(0, 5).split(":").map(Number)
  const t = new Date(Date.UTC(y, m - 1, d, hh - 7 + addHours, mm))
  const p = (n: number) => String(n).padStart(2, "0")
  return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}T${p(t.getUTCHours())}${p(t.getUTCMinutes())}00Z`
}

export async function GET(_req: Request, { params }: { params: { guestCode: string } }) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  })
  const { data } = await supabase.rpc("get_invite", { p_code: params.guestCode })
  const ev = (data as any)?.event
  if (!ev || (data as any)?.error || !ev.event_date) return new Response("Không tìm thấy thiệp", { status: 404 })

  const title = `Đám cưới ${[ev.bride_name, ev.groom_name].filter(Boolean).join(" & ")}`
  const place = [ev.venue_name, ev.venue_address].filter(Boolean).join(", ")
  const now = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  const stamp = `${now.getUTCFullYear()}${p(now.getUTCMonth() + 1)}${p(now.getUTCDate())}T${p(now.getUTCHours())}${p(now.getUTCMinutes())}00Z`
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WedTable//Thiep cuoi//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.id}@wedtable.vercel.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${utcStamp(ev.event_date, ev.event_time)}`,
    `DTEND:${utcStamp(ev.event_date, ev.event_time, 4)}`,
    `SUMMARY:${esc(title)}`,
    place ? `LOCATION:${esc(place)}` : "",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${esc(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean)
  return new Response(lines.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dam-cuoi.ics"',
      "Cache-Control": "no-store",
    },
  })
}
