// Creates a fully filled sample wedding (is_demo) so a new user can click through every feature:
// invitation content and photos, a hall with a stage and tables, and guests in every state.
// It can't be published (DB trigger) and doesn't count toward the free-plan wedding limit.
import { createClient } from "@/lib/supabase/server"
import { planErrorResponse } from "@/lib/plan"
import { IMG } from "@/lib/brandImages"
import { sampleLayout } from "@/lib/hall"

const FIRST = ["Hùng", "Lan", "Tuấn", "Mai", "Dũng", "Hương", "Nam", "Thảo", "Long", "Trang", "Phong", "Ngọc", "Quân", "Linh", "Bình", "Yến", "Khoa", "Vy", "Sơn", "Hà", "Đạt", "My", "Huy", "Nhung"]
const PREFIX = ["Bác", "Cô", "Chú", "Anh", "Chị", "Bạn", "Em"]
const SUFFIX = ["", "", " và gia đình", " và vợ", " và chồng", ""]

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export async function POST() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: "UNAUTHORIZED", message: "Chưa đăng nhập." }, { status: 401 })

  // one sample wedding per account is enough
  const { data: existing } = await supabase.from("events").select("id").eq("user_id", user.id).eq("is_demo", true).maybeSingle()
  if (existing) return Response.json({ id: existing.id, existed: true })

  const date = new Date(Date.now() + 45 * 86400000)
  const eventDate = date.toISOString().slice(0, 10)

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      is_demo: true,
      bride_name: "Lan",
      groom_name: "Minh",
      bride_full_name: "Nguyễn Ngọc Lan",
      groom_full_name: "Trần Đức Minh",
      bride_family: "Ông Nguyễn Văn Hải\nBà Phạm Thị Hoa",
      groom_family: "Ông Trần Quốc Bảo\nBà Lê Thị Thu",
      event_date: eventDate,
      event_time: "18:00",
      venue_name: "Trung tâm tiệc cưới mẫu",
      venue_address: "Hồ Hoàn Kiếm, Hà Nội",
      invite_message: "Trân trọng kính mời bạn đến chung vui cùng gia đình chúng mình trong ngày trọng đại.",
      love_story: "Chúng mình gặp nhau trong một chiều mưa Hà Nội, cùng trú dưới mái hiên một quán cà phê nhỏ. Năm năm sau, chúng mình quyết định đi cùng nhau thật lâu.",
      dress_code: "Tông pastel nhẹ nhàng, tránh màu trắng.",
      dress_colors: ["#E8C4C4", "#C9D6C3", "#E9DCC7"],
      timeline: [
        { time: "17:30", title: "Đón khách", note: "Chụp ảnh cùng cô dâu chú rể", icon: "📸" },
        { time: "18:30", title: "Làm lễ", note: "", icon: "💍" },
        { time: "19:00", title: "Khai tiệc", note: "", icon: "🍽️" },
        { time: "20:30", title: "Tiệc ngọt và khiêu vũ", note: "", icon: "💃" },
      ],
      invite_template: "glass",
      invite_theme: "glass",
      gallery: [IMG.aoDai(1200), IMG.hero(1200), IMG.reception(1200), IMG.procession(1200), IMG.banquet(1200), IMG.placeCard(1200)],
      show_guest_names_on_map: true,
    })
    .select()
    .single()
  if (error) {
    const planErr = planErrorResponse(error)
    if (planErr) return planErr
    return Response.json({ error: "INTERNAL_ERROR", message: error.message }, { status: 500 })
  }

  const W = 24
  const H = 16
  const COUNT = 14
  const { positions, stage } = sampleLayout(COUNT, W, H)
  const { data: floor, error: fErr } = await supabase
    .from("floors")
    .insert({ event_id: event.id, name: "Sảnh chính", order_index: 0, hall_w: W, hall_h: H, elements: [stage], layout_template: "rows" })
    .select()
    .single()
  if (fErr) return Response.json({ error: "INTERNAL_ERROR", message: fErr.message }, { status: 500 })

  const { data: tables, error: tErr } = await supabase
    .from("tables")
    .insert(positions.map((p, i) => ({ event_id: event.id, floor_id: floor.id, name: i < 2 ? `Bàn gia đình ${i + 1}` : `Bàn ${i + 1}`, seats: 10, vip: i < 2, ...p })))
    .select()
  if (tErr) return Response.json({ error: "INTERNAL_ERROR", message: tErr.message }, { status: 500 })

  // ~42 guests: most seated and confirmed, some still pending or unseated, a few viewed only
  const guests = Array.from({ length: 42 }, (_, i) => {
    const name = `${PREFIX[i % PREFIX.length]} ${FIRST[(i * 7) % FIRST.length]}${SUFFIX[i % SUFFIX.length]}`
    const companions = SUFFIX[i % SUFFIX.length] ? 1 + (i % 2) : 0
    const seated = i < 32
    return {
      event_id: event.id,
      name,
      phone: "09" + String(10000000 + ((i * 7919) % 89999999)).padStart(8, "0"),
      code: genCode(),
      companions,
      confirmed: i < 30,
      viewed: i < 36,
      table_id: seated ? tables[i % tables.length].id : null,
    }
  })
  await supabase.from("guests").insert(guests)

  return Response.json({ id: event.id })
}
