// Reads an event (as returned by GET /api/events/[id]) and works out:
//  - the preparation journey: ordered steps, each auto-detected as done from the data, with a
//    "should be done N days before the wedding" milestone
//  - smart suggestions: situational nudges with one action each, which the user can snooze
// Nothing here is ticked by hand; everything is derived from the event's data.
import { estimateTables, hallOf } from "./hall"
import { isPremium } from "./plan"

export type Step = {
  key: string
  title: string
  desc: string
  href: string
  cta: string
  done: boolean
  /** should be finished this many days before the wedding */
  dueDays: number
  /** finish-by date (dd/mm), when the wedding date is known */
  dueText?: string
  /** past its milestone and still not done */
  late: boolean
}

export type Tip = { key: string; icon: string; title: string; desc: string; href: string; cta: string; tone?: "warn" }

export type GuideState = { snoozed?: Record<string, string> }

const SNOOZE_DAYS = 7

function daysUntil(date?: string | null) {
  if (!date) return null
  const d = new Date(date + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

function used(guests: any[], tableId: string) {
  return guests.filter((g) => g.table_id === tableId && !g.no_show).reduce((s, g) => s + 1 + (g.companions ?? 0), 0)
}

export function analyze(ev: any) {
  const floors: any[] = ev?.floors ?? []
  const guests: any[] = ev?.guests ?? []
  const tables = floors.flatMap((f) => f.tables ?? [])
  const gallery: string[] = Array.isArray(ev?.gallery) ? ev.gallery.filter(Boolean) : []
  const active = guests.filter((g) => !g.no_show)
  const unseated = active.filter((g) => !g.table_id)
  const viewed = guests.filter((g) => g.viewed).length
  const pending = guests.filter((g) => !g.confirmed && !g.no_show).length
  const notViewed = guests.filter((g) => !g.viewed && !g.no_show).length
  const checkedIn = guests.filter((g) => g.checked_in).length
  const freeSeats = tables.reduce((s, t) => s + Math.max(0, t.seats - used(guests, t.id)), 0)
  const overTables = tables.filter((t) => used(guests, t.id) > t.seats)
  const left = daysUntil(ev?.event_date)
  const premium = isPremium(ev)
  return { floors, guests, tables, gallery, active, unseated, viewed, pending, notViewed, checkedIn, freeSeats, overTables, left, premium }
}

export function journey(ev: any): { steps: Step[]; done: number; next: Step | null; stage: string; past: boolean } {
  const a = analyze(ev)
  const infoOk = !!(ev?.bride_name && ev?.groom_name && ev?.event_date && ev?.event_time && ev?.venue_name)
  const raw: Omit<Step, "late" | "dueText">[] = [
    {
      key: "info",
      title: "Điền thông tin tiệc",
      desc: infoOk ? `${ev.venue_name}` : "Tên cô dâu chú rể, ngày giờ và nhà hàng",
      href: "/settings",
      cta: "Điền thông tin",
      done: infoOk,
      dueDays: 90,
    },
    {
      key: "invite",
      title: "Hoàn thiện thiệp mời",
      desc:
        a.gallery.length && ev?.venue_address
          ? `${a.gallery.length} ảnh, có bản đồ`
          : [!a.gallery.length && "thêm ảnh cưới", !ev?.venue_address && "thêm địa chỉ để khách xem bản đồ"].filter(Boolean).join(", ").replace(/^./, (c) => c.toUpperCase()),
      href: "/invitation",
      cta: "Mở trang Thiệp mời",
      done: a.gallery.length > 0 && !!ev?.venue_address,
      dueDays: 60,
    },
    {
      key: "seating",
      title: "Vẽ sơ đồ bàn",
      desc: a.tables.length ? `${a.tables.length} bàn trên ${a.floors.length} tầng` : "Đặt bàn, sân khấu và lối đi theo hội trường",
      href: "/seating",
      cta: "Vẽ sơ đồ",
      done: a.tables.length > 0,
      dueDays: 45,
    },
    {
      key: "guests",
      title: "Nhập danh sách khách",
      desc: a.guests.length ? `${a.guests.length} khách` : "Nhập từ Excel cho nhanh, hoặc thêm từng người",
      href: "/guests",
      cta: "Thêm khách",
      done: a.guests.length > 0,
      dueDays: 45,
    },
    {
      key: "publish",
      title: "Công khai thiệp",
      // a sample wedding can't be published, so this step is skipped for it
      desc: ev?.is_demo ? "Đám cưới mẫu không công khai, xem thiệp ở trang Thiệp mời" : ev?.published ? "Khách đã mở được thiệp" : "Khách chỉ mở được link thiệp sau bước này",
      href: "/settings",
      cta: "Công khai",
      done: !!ev?.published || !!ev?.is_demo,
      dueDays: 30,
    },
    {
      key: "send",
      title: "Gửi link thiệp cho khách",
      desc: a.viewed ? `${a.viewed}/${a.guests.length} khách đã mở thiệp` : "Sao chép link hoặc mã QR riêng của từng khách để gửi",
      href: "/guests",
      cta: "Gửi link",
      done: a.viewed > 0,
      dueDays: 30,
    },
    {
      key: "seats",
      title: "Chốt chỗ ngồi",
      desc: a.guests.length && !a.unseated.length ? "Khách nào cũng đã có bàn" : a.unseated.length ? `${a.unseated.length} khách chưa có bàn` : "Xếp khách vào bàn sau khi họ xác nhận",
      href: "/seating",
      cta: "Xếp chỗ",
      done: a.guests.length > 0 && a.unseated.length === 0,
      dueDays: 7,
    },
    {
      key: "day",
      title: "Sẵn sàng cho ngày cưới",
      desc: a.checkedIn ? `${a.checkedIn} khách đã check-in` : "Thử trang Check-in và màn hình Trình chiếu trước ngày cưới",
      href: "/checkin",
      cta: "Mở Check-in",
      done: a.checkedIn > 0 || (a.left !== null && a.left < 0),
      dueDays: 0,
    },
  ]

  const date = ev?.event_date ? new Date(ev.event_date + "T00:00:00") : null
  const steps: Step[] = raw.map((s) => {
    let dueText: string | undefined
    if (date) {
      const d = new Date(date)
      d.setDate(d.getDate() - s.dueDays)
      dueText = s.dueDays === 0 ? "ngày cưới" : `trước ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
    }
    // after the wedding nothing is "late" any more
    return { ...s, dueText, late: !s.done && a.left !== null && a.left >= 0 && a.left < s.dueDays }
  })
  const next = steps.find((s) => !s.done) ?? null
  const left = a.left
  const stage =
    left === null
      ? "Chưa đặt ngày cưới"
      : left < 0
      ? "Đám cưới đã diễn ra"
      : left === 0
      ? "Hôm nay là ngày cưới"
      : left <= 7
      ? `Tuần cuối · còn ${left} ngày`
      : left <= 30
      ? `Gửi thiệp và nhận hồi âm · còn ${left} ngày`
      : left <= 60
      ? `Chuẩn bị thiệp và sơ đồ · còn ${left} ngày`
      : `Còn ${left} ngày`
  return { steps, done: steps.filter((s) => s.done).length, next, stage, past: left !== null && left < 0 }
}

export function suggestions(ev: any, state?: GuideState | null): Tip[] {
  const a = analyze(ev)
  // After the wedding, preparation nudges no longer make sense
  const past = a.left !== null && a.left < 0
  const tips: (Tip | false)[] = past
    ? [
        a.guests.length > 0 && {
          key: "after",
          icon: "check",
          title: `${a.checkedIn}/${a.guests.length} khách đã đến dự`,
          desc: "Xem lại ai đã đến để gửi lời cảm ơn. Gói Premium tải được danh sách ra Excel.",
          href: "/guests",
          cta: "Xem khách",
        },
      ]
    : [
    a.left === 0 && {
      key: "today",
      icon: "display",
      title: "Hôm nay là ngày cưới",
      desc: "Mở Check-in trên điện thoại ở bàn đón khách, và bật Trình chiếu trên màn hình lớn.",
      href: "/checkin",
      cta: "Mở Check-in",
    },
    a.overTables.length > 0 && {
      key: "over:" + a.overTables.map((t) => t.id).join(","),
      icon: "tableRound",
      title: `${a.overTables.length} bàn đang quá chỗ`,
      desc: `${a.overTables.slice(0, 3).map((t) => t.name).join(", ")} có nhiều khách hơn số ghế.`,
      href: "/seating",
      cta: "Xem sơ đồ",
      tone: "warn",
    },
    a.unseated.length > 0 && a.tables.length > 0 && {
      key: "unseated",
      icon: "guests",
      title: `${a.unseated.length} khách chưa có bàn`,
      desc: a.freeSeats > 0 ? `Còn ${a.freeSeats} ghế trống. Kéo tên khách vào bàn trên sơ đồ.` : "Các bàn đã đầy, cần thêm bàn.",
      href: "/seating",
      cta: a.freeSeats > 0 ? "Xếp chỗ" : "Thêm bàn",
    },
    ...a.floors.map((f) => {
      const hall = hallOf(f)
      const n = (f.tables ?? []).length
      const fit = estimateTables(hall.w, hall.h)
      return (
        n > 0 &&
        fit > 0 &&
        n > fit && {
          key: `crowded:${f.id}:${hall.w}x${hall.h}`,
          icon: "seating",
          title: `${f.name} có thể hơi chật`,
          desc: `${n} bàn trong hội trường ${hall.w}×${hall.h} m, vừa khoảng ${fit} bàn. Lối đi sẽ hẹp.`,
          href: "/seating",
          cta: "Đổi kích thước",
          tone: "warn" as const,
        }
      )
    }),
    !!ev?.published && a.left !== null && a.left >= 0 && a.left <= 14 && a.notViewed > 0 && {
      key: "notviewed",
      icon: "mail",
      title: `${a.notViewed} khách chưa mở thiệp`,
      desc: `Còn ${a.left} ngày. Gửi lại link cho những khách này.`,
      href: "/guests",
      cta: "Xem khách",
    },
    !!ev?.published && a.left !== null && a.left >= 0 && a.left <= 10 && a.pending > 0 && {
      key: "pending",
      icon: "guests",
      title: `${a.pending} khách chưa xác nhận`,
      desc: "Nhắc họ xác nhận để chốt số mâm với nhà hàng.",
      href: "/guests",
      cta: "Xem khách",
    },
    !ev?.venue_address && {
      key: "map",
      icon: "pin",
      title: "Thiệp chưa có bản đồ",
      desc: "Thêm địa chỉ để khách bấm Chỉ đường ngay trong thiệp.",
      href: "/invitation",
      cta: "Thêm địa chỉ",
    },
    a.gallery.length > 0 && a.gallery.length < 3 && {
      key: "photos",
      icon: "image",
      title: "Thêm vài ảnh cưới nữa",
      desc: "Từ 3 ảnh trở lên, thiệp có ảnh lớn xen giữa các mục và album đẹp hơn.",
      href: "/invitation",
      cta: "Thêm ảnh",
    },
    a.premium && !ev?.timeline?.length && !!ev?.published && {
      key: "timeline",
      icon: "calendar",
      title: "Thêm lịch trình ngày cưới",
      desc: "Đón khách, làm lễ, khai tiệc… để khách biết nên đến lúc nào.",
      href: "/invitation",
      cta: "Thêm lịch trình",
    },
    a.premium && a.left !== null && a.left >= 1 && a.left <= 3 && {
      key: "display",
      icon: "display",
      title: "Chuẩn bị màn hình tiệc",
      desc: "Mở Trình chiếu trên TV và chọn Tự chuyển: sơ đồ và ảnh cưới thay nhau, khách đến được chào tên.",
      href: ev?.id ? `/display/${ev.id}` : "/",
      cta: "Mở Trình chiếu",
    },
    !a.premium && a.guests.length >= 40 && {
      key: "freelimit",
      icon: "sparkle",
      title: `Đã dùng ${a.guests.length}/50 khách của gói Miễn phí`,
      desc: "Gói Premium không giới hạn khách, thêm tầng, bàn dài và màn hình trình chiếu.",
      href: "/welcome#bang-gia",
      cta: "Xem gói Premium",
    },
  ]
  const now = Date.now()
  const snoozed = state?.snoozed ?? {}
  return (tips.filter(Boolean) as Tip[]).filter((t) => !(snoozed[t.key] && new Date(snoozed[t.key]).getTime() > now))
}

/** Guide state with a tip snoozed for a week (old expired entries dropped) */
export function snooze(state: GuideState | null | undefined, key: string): GuideState {
  const now = Date.now()
  const kept = Object.fromEntries(Object.entries(state?.snoozed ?? {}).filter(([, until]) => new Date(until).getTime() > now))
  return { ...(state ?? {}), snoozed: { ...kept, [key]: new Date(now + SNOOZE_DAYS * 86400000).toISOString() } }
}

export type InviteItem = { key: string; title: string; why: string; weight: number; done: boolean; section: string }

/**
 * How complete the invitation is. Weights reflect what guests notice most (cover photo, map,
 * wording); Premium-only parts count only on Premium. `section` is the id of the editor block.
 */
export function inviteCompleteness(ev: any, premium: boolean) {
  const gallery: string[] = Array.isArray(ev?.gallery) ? ev.gallery.filter(Boolean) : []
  const has = (v: any) => (Array.isArray(v) ? v.filter((x) => x && (typeof x !== "object" || x.time || x.title)).length > 0 : !!String(v ?? "").trim())
  const items: InviteItem[] = [
    { key: "cover", title: "Ảnh bìa", why: "Ảnh đầu tiên làm bìa thiệp, khách thấy ngay khi mở.", weight: 18, done: gallery.length >= 1, section: "anh-cuoi" },
    { key: "map", title: "Địa chỉ và bản đồ", why: "Khách bấm Chỉ đường ngay trong thiệp, không phải hỏi lại.", weight: 16, done: has(ev?.venue_address), section: "ban-do" },
    { key: "message", title: "Lời mời riêng", why: "Lời của chính hai bạn ấm áp hơn câu mời mặc định.", weight: 10, done: has(ev?.invite_message), section: "loi-moi" },
    { key: "families", title: "Thông tin hai bên gia đình", why: "Thiệp truyền thống thường ghi tên bố mẹ hai bên.", weight: 10, done: has(ev?.bride_family) && has(ev?.groom_family), section: "loi-moi" },
    { key: "photos3", title: "Từ 3 ảnh cưới", why: "Có ảnh lớn xen giữa các mục và album đầy đặn hơn.", weight: 10, done: gallery.length >= 3, section: "anh-cuoi" },
    { key: "fullnames", title: "Họ tên đầy đủ cô dâu chú rể", why: "Hiện ở phần báo tin lễ thành hôn.", weight: 5, done: has(ev?.bride_full_name) && has(ev?.groom_full_name), section: "loi-moi" },
    { key: "video", title: "Video cưới", why: "Khách xem pre-wedding ngay trong thiệp.", weight: 5, done: has(ev?.video_url), section: "video" },
    ...(premium
      ? [
          { key: "timeline", title: "Lịch trình ngày cưới", why: "Khách biết giờ đón khách, làm lễ, khai tiệc.", weight: 10, done: has(ev?.timeline), section: "lich-trinh" },
          { key: "story", title: "Câu chuyện của hai bạn", why: "Phần khách hay đọc nhất sau ảnh.", weight: 6, done: has(ev?.love_story), section: "cau-chuyen" },
          { key: "dress", title: "Dress code", why: "Gợi ý trang phục, ảnh chụp chung đẹp và đồng đều hơn.", weight: 4, done: has(ev?.dress_code) || has(ev?.dress_colors), section: "dress-code" },
          { key: "gift", title: "QR mừng cưới", why: "Khách ở xa gửi quà mừng tiện hơn.", weight: 6, done: has(ev?.gift_qr_url), section: "mung-cuoi" },
        ]
      : []),
  ]
  const total = items.reduce((s, i) => s + i.weight, 0)
  const got = items.filter((i) => i.done).reduce((s, i) => s + i.weight, 0)
  return { pct: Math.round((got / total) * 100), missing: items.filter((i) => !i.done), items, total }
}
