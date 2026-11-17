// Wedding checklist template. A new checklist is built from these items, filtered by the couple's
// answers (region, which ceremonies they hold, party at home or at a restaurant); after that every
// item is the couple's own and can be edited, reassigned or deleted.
// Notes per region reflect common Northern / Central / Southern Vietnamese customs; families differ,
// so they are tips, not rules.

export type Region = "bac" | "trung" | "nam"
export type Ceremony = "danngo" | "anhoi" | "giatien" | "nhatho" | "chua" | "tiec"
export type Venue = "nhahang" | "nha"
export type Phase = "m12" | "m3" | "m1" | "w1" | "d0" | "after"
export type ChecklistSetup = { region: Region; ceremonies: Ceremony[]; venue: Venue }

export const REGIONS: { key: Region; label: string }[] = [
  { key: "bac", label: "Miền Bắc" },
  { key: "trung", label: "Miền Trung" },
  { key: "nam", label: "Miền Nam" },
]

export const CEREMONIES: { key: Ceremony; label: string; desc: string }[] = [
  { key: "danngo", label: "Dạm ngõ", desc: "Nhà trai sang thưa chuyện" },
  { key: "anhoi", label: "Ăn hỏi / Đám hỏi", desc: "Trao tráp, mâm quả" },
  { key: "giatien", label: "Lễ gia tiên, rước dâu", desc: "Xin dâu, rước dâu" },
  { key: "nhatho", label: "Lễ nhà thờ", desc: "Hôn phối Công giáo" },
  { key: "chua", label: "Lễ ở chùa", desc: "Lễ hằng thuận" },
  { key: "tiec", label: "Tiệc cưới", desc: "Đãi khách" },
]

export const VENUES: { key: Venue; label: string }[] = [
  { key: "nhahang", label: "Nhà hàng / trung tâm tiệc" },
  { key: "nha", label: "Tại nhà (dựng rạp)" },
]

export const OWNERS = ["Cả hai", "Cô dâu", "Chú rể", "Nhà gái", "Nhà trai"] as const

/** Phases with the day offset (relative to the wedding) an item should be done by */
export const PHASES: { key: Phase; label: string; offset: number }[] = [
  { key: "m12", label: "6–12 tháng trước", offset: -180 },
  { key: "m3", label: "2–3 tháng trước", offset: -60 },
  { key: "m1", label: "1 tháng trước", offset: -21 },
  { key: "w1", label: "Tuần cuối", offset: -3 },
  { key: "d0", label: "Ngày cưới", offset: 0 },
  { key: "after", label: "Sau cưới", offset: 14 },
]

type Tpl = {
  phase: Phase
  title: string
  owner: (typeof OWNERS)[number]
  ceremony?: Ceremony
  venue?: Venue
  /** done automatically from WedTable data (keys of lib/eventHealth journey steps) */
  auto?: "invite" | "send" | "seating" | "guests" | "seats" | "day"
  note?: string | Partial<Record<Region, string>>
}

export const TEMPLATE: Tpl[] = [
  // ---- 6–12 months ----
  { phase: "m12", title: "Xem ngày giờ đẹp, chốt ngày cưới", owner: "Cả hai", note: "Hỏi ý hai bên gia đình trước khi chốt." },
  { phase: "m12", title: "Lập ngân sách, thống nhất phần chi của hai nhà", owner: "Cả hai" },
  { phase: "m12", title: "Lập danh sách khách sơ bộ của hai nhà", owner: "Cả hai" },
  { phase: "m12", title: "Đặt nhà hàng, chọn sảnh và thực đơn", owner: "Cả hai", venue: "nhahang", note: "Hỏi rõ số mâm tối thiểu, phí phát sinh, thời gian chốt số mâm." },
  { phase: "m12", title: "Thuê rạp, bàn ghế, đầu bếp nấu cỗ", owner: "Nhà trai", venue: "nha", note: "Xin phép tổ dân phố nếu dựng rạp ngoài đường." },
  { phase: "m12", title: "Chọn studio chụp ảnh cưới", owner: "Cả hai" },
  { phase: "m12", title: "Chọn và đặt lịch trang điểm cô dâu", owner: "Cô dâu" },
  {
    phase: "m12",
    title: "Lễ dạm ngõ: nhà trai sang thưa chuyện",
    owner: "Nhà trai",
    ceremony: "danngo",
    note: { bac: "Lễ vật đơn giản: trầu cau, chè, rượu, bánh.", trung: "Còn gọi là lễ chạm ngõ, lễ vật chủ yếu là trầu cau.", nam: "Lễ coi mắt / nói chuyện, mang trầu rượu sang nhà gái." },
  },
  // ---- 2–3 months ----
  { phase: "m3", title: "Chụp ảnh cưới", owner: "Cả hai" },
  { phase: "m3", title: "May hoặc thuê váy cưới, áo dài", owner: "Cô dâu" },
  { phase: "m3", title: "Chuẩn bị vest, áo dài cho chú rể", owner: "Chú rể" },
  { phase: "m3", title: "Đặt nhẫn cưới", owner: "Chú rể" },
  {
    phase: "m3",
    title: "Đặt tráp ăn hỏi",
    owner: "Nhà trai",
    ceremony: "anhoi",
    note: { bac: "Số tráp lẻ: 5, 7, 9 hoặc 11 (trầu cau, chè, rượu, bánh cốm, phu thê, hoa quả).", trung: "Tráp gọn: trầu cau, rượu, chè, bánh, có nơi thêm heo quay.", nam: "Mâm quả số chẵn: 6 hoặc 8 mâm (trầu cau, rượu trà, bánh phu thê, heo quay, nữ trang)." },
  },
  { phase: "m3", title: "Chọn đội bê tráp và đội đỡ tráp", owner: "Cả hai", ceremony: "anhoi", note: { bac: "Nhà trai nam thanh niên chưa vợ, nhà gái nữ chưa chồng, số người bằng số tráp.", nam: "Đội bưng quả và đỡ quả số chẵn." } },
  { phase: "m3", title: "Đăng ký kết hôn tại UBND xã, phường", owner: "Cả hai", note: "Mang căn cước, giấy xác nhận tình trạng hôn nhân nếu khác nơi cư trú." },
  { phase: "m3", title: "Học giáo lý hôn nhân, đặt lịch với cha xứ", owner: "Cả hai", ceremony: "nhatho" },
  { phase: "m3", title: "Hẹn chùa, chuẩn bị lễ hằng thuận", owner: "Cả hai", ceremony: "chua" },
  { phase: "m3", title: "Thiết kế thiệp mời online trên WedTable", owner: "Cả hai", auto: "invite" },
  { phase: "m3", title: "Đặt xe hoa và xe đưa đón họ hàng", owner: "Nhà trai" },
  { phase: "m3", title: "Đặt MC, ban nhạc hoặc DJ", owner: "Cả hai", ceremony: "tiec" },
  { phase: "m3", title: "Đặt hoa cưới, trang trí cổng và phông cưới", owner: "Cả hai" },
  { phase: "m3", title: "Nhập danh sách khách vào WedTable", owner: "Cả hai", auto: "guests" },
  // ---- 1 month ----
  { phase: "m1", title: "Gửi link thiệp cho khách", owner: "Cả hai", auto: "send" },
  { phase: "m1", title: "In thiệp giấy cho ông bà, người lớn tuổi", owner: "Nhà gái", note: "Người lớn tuổi thường quý thiệp trao tận tay." },
  { phase: "m1", title: "Vẽ sơ đồ bàn trong WedTable", owner: "Cả hai", auto: "seating" },
  { phase: "m1", title: "Chốt số mâm với nhà hàng", owner: "Cả hai", venue: "nhahang", note: "Nhìn số khách đã xác nhận trên WedTable, cộng thêm 5–10% dự phòng." },
  { phase: "m1", title: "Chốt thực đơn và số mâm với đầu bếp", owner: "Nhà trai", venue: "nha" },
  {
    phase: "m1",
    title: "Tổ chức lễ ăn hỏi",
    owner: "Nhà trai",
    ceremony: "anhoi",
    note: { bac: "Thường trước cưới vài tuần, nhiều nhà gộp cùng ngày cưới.", trung: "Lễ hỏi gọn, có nơi làm cùng ngày cưới.", nam: "Đám hỏi, nhiều nơi tổ chức trước 1–3 tháng." },
  },
  { phase: "m1", title: "Mua sắm đồ cưới: chăn ga, giường cưới, đồ dùng phòng tân hôn", owner: "Nhà trai" },
  { phase: "m1", title: "Chuẩn bị quà cảm ơn cho khách, phù dâu, phù rể", owner: "Cả hai" },
  // ---- last week ----
  { phase: "w1", title: "Gọi xác nhận lại tất cả dịch vụ", owner: "Cả hai" },
  { phase: "w1", title: "Xếp chỗ cho khách đã xác nhận", owner: "Cả hai", auto: "seats" },
  { phase: "w1", title: "Chuẩn bị phong bì, tiền lễ, tiền lẻ", owner: "Nhà gái" },
  { phase: "w1", title: "Thử trang điểm, làm tóc", owner: "Cô dâu" },
  { phase: "w1", title: "Bày bàn thờ gia tiên: hương, nến, hoa quả", owner: "Nhà gái", ceremony: "giatien" },
  { phase: "w1", title: "Phân công người đón khách và mở trang Check-in", owner: "Cả hai", auto: "day" },
  { phase: "w1", title: "Chuẩn bị đồ dùng ngày cưới: nhẫn, giấy tờ, kim chỉ, thuốc", owner: "Cô dâu" },
  // ---- wedding day ----
  {
    phase: "d0",
    title: "Lễ gia tiên và rước dâu",
    owner: "Cả hai",
    ceremony: "giatien",
    note: { bac: "Lễ xin dâu ở nhà gái, rước dâu về làm lễ gia tiên nhà trai.", trung: "Lễ vu quy ở nhà gái, lễ thành hôn ở nhà trai.", nam: "Lễ rước dâu, buổi tối có lễ lên đèn ở nhà trai." },
  },
  { phase: "d0", title: "Lễ hôn phối tại nhà thờ", owner: "Cả hai", ceremony: "nhatho" },
  { phase: "d0", title: "Lễ hằng thuận tại chùa", owner: "Cả hai", ceremony: "chua" },
  { phase: "d0", title: "Đón khách, check-in bằng WedTable", owner: "Cả hai", ceremony: "tiec" },
  { phase: "d0", title: "Bật màn hình trình chiếu sơ đồ và ảnh cưới", owner: "Cả hai", ceremony: "tiec" },
  { phase: "d0", title: "Tổ chức tiệc cưới", owner: "Cả hai", ceremony: "tiec" },
  { phase: "d0", title: "Nhận và ghi sổ tiền mừng", owner: "Nhà gái", note: "Giao cho một người tin cậy giữ sổ và hòm tiền." },
  // ---- after ----
  {
    phase: "after",
    title: "Lễ lại mặt",
    owner: "Cả hai",
    note: { bac: "Lại mặt sau 2 ngày cưới, mang lễ về nhà gái.", trung: "Về thăm nhà gái sau 2–4 ngày.", nam: "Lễ lại mặt / về nhà sau vài ngày." },
  },
  { phase: "after", title: "Gửi lời cảm ơn khách đã đến dự", owner: "Cả hai" },
  { phase: "after", title: "Thanh toán các dịch vụ còn lại", owner: "Cả hai" },
  { phase: "after", title: "Tổng kết tiền mừng và chi phí", owner: "Cả hai" },
  { phase: "after", title: "Lưu ảnh, video cưới về nơi an toàn", owner: "Cả hai" },
]

/** Template items for a setup, ready to insert */
export function buildChecklist(setup: ChecklistSetup) {
  const cer = new Set(setup.ceremonies)
  return TEMPLATE.filter((t) => (!t.ceremony || cer.has(t.ceremony)) && (!t.venue || t.venue === setup.venue)).map((t, i) => ({
    phase: t.phase,
    title: t.title,
    owner: t.owner,
    ceremony: t.ceremony ?? null,
    auto_key: t.auto ?? null,
    note: typeof t.note === "string" ? t.note : t.note?.[setup.region] ?? "",
    sort: i,
  }))
}

/** Due date of a phase for a wedding date, or null */
export function phaseDue(phase: string, eventDate?: string | null) {
  const p = PHASES.find((x) => x.key === phase)
  if (!p || !eventDate) return null
  const d = new Date(eventDate + "T00:00:00")
  d.setDate(d.getDate() + p.offset)
  return d
}
