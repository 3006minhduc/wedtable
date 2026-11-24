export type Palette = {
  bg: string; paper: string; blush: string; rose: string; wine: string
  sage: string; leaf: string; ink: string; muted: string; line: string; soft: string; okBg: string
  /** Dark background (gilded hero, glass photo section, RSVP and countdown band on non-floral templates) */
  deep: string
  /** Metal stops light, mid, dark: gold frame (gilded), lead cames (glass), accents */
  gold: [string, string, string]
}

/** Invite template = intro effect + decorations + layout (events.invite_template).
 *  Colors are chosen separately (events.invite_theme), every palette works with every template. */
export type InviteStyle = "floral" | "gilded" | "glass" | "emboss" | "daisy" | "veil" | "vinyl" | "scrapbook"

export type TemplateGroup = "classic" | "traditional" | "modern" | "photo"
export const TEMPLATE_GROUPS: Record<TemplateGroup, string> = { classic: "Thanh lịch", traditional: "Truyền thống", modern: "Hiện đại", photo: "Ảnh cưới" }

// Ids stay as stored in events.invite_template; the looks behind them were rebuilt on 2026-11-23.
// `palettes`: suggested color sets for this template, first = default.
export const TEMPLATES: Record<InviteStyle, { label: string; desc: string; palette: string; palettes: string[]; group: TemplateGroup; free?: boolean }> = {
  floral: { label: "Ngà dập nổi", desc: "Phong bì giấy ngà dập nổi hoa mẫu đơn, dấu sáp, tên khách in ngay trên phong bì. Chạm vào, bốn nắp lần lượt mở ra ảnh cưới.", palette: "ngaxam", palettes: ["ngaxam", "classic", "blush", "sage"], group: "classic", free: true },
  gilded: { label: "Hỷ sơn mài", desc: "Cửa gỗ sơn mài đỏ chạm hoa mẫu đơn, mây vàng; núm chữ Hỷ vàng. Chạm vào, hai cánh cửa mở ra ánh đèn ấm.", palette: "son", palettes: ["son", "bordeaux", "noir"], group: "traditional" },
  glass: { label: "Cuộn phim", desc: "Như chiếu phim nhựa cũ: đếm ngược 3-2-1, đèn chớp rồi ảnh cưới hiện trong khung phim có lỗ răng cưa. Album là một dải phim.", palette: "noir", palettes: ["noir", "navy", "forest", "ivory"], group: "photo" },
  emboss: { label: "Hộp lụa nơ", desc: "Hộp thiệp bọc lụa hồng, vòng hoa hồng dập nổi, ruy băng satin thắt nơ và thẻ tên khách. Chạm vào, nơ tháo, nắp hộp nhấc lên.", palette: "sen", palettes: ["sen", "blush", "ivory", "classic"], group: "classic" },
  veil: { label: "Vén voan", desc: "Tấm voan cưới trắng viền ren phủ lên ảnh cưới, chạm vào là voan được vén lên. Thẻ ảnh vòm viền ren, chuỗi ngọc trai.", palette: "voan", palettes: ["voan", "blush", "classic"], group: "classic" },
  vinyl: { label: "Đĩa than", desc: "Vỏ đĩa in tên hai bạn; chạm vào, đĩa trượt ra quay với ảnh cưới làm nhãn, kim đĩa hạ xuống. Lịch trình là danh sách bài hát.", palette: "dia", palettes: ["dia", "noir", "navy"], group: "modern" },
  scrapbook: { label: "Sổ kỷ niệm", desc: "Bìa sổ giấy kraft dán băng keo hoa; mở ra là trang sổ với ảnh polaroid, chữ viết tay và con dấu ngày cưới.", palette: "kraft", palettes: ["kraft", "blush", "sage"], group: "modern" },
  daisy: { label: "Hoa cúc phong bì", desc: "Bông cúc thêu trên phong bì, ánh vàng chạy dọc chỉ thêu rồi nắp mở ra khung hoa nền xanh.", palette: "daisy", palettes: ["daisy", "blush", "sage"], group: "classic" },
}

export const templateOf = (id?: string | null): InviteStyle => (id && id in TEMPLATES ? (id as InviteStyle) : "floral")

// Color sets for the guest invite page (events.invite_theme). Built from 2026–2027 stationery palettes:
// paper + one ink + one metal foil, plus a deep stock color for dark sections.
export const THEMES: Record<string, { label: string; p: Palette }> = {
  classic: {
    label: "Ngà và đỏ đô",
    p: { bg: "#EFE9E1", paper: "#FBF8F3", blush: "#F1E2DF", rose: "#9A3B45", wine: "#7A1C2A", sage: "#A3A88F", leaf: "#6E7559", ink: "#2A2220", muted: "#7B6F68", line: "#E4DAD0", soft: "#F3ECE4", okBg: "#E9EFE6", deep: "#5E1420", gold: ["#F4E2B6", "#C9A257", "#8D6726"] },
  },
  ivory: {
    label: "Ngà và mocha",
    p: { bg: "#EEE7DC", paper: "#FAF6EF", blush: "#EEDFCB", rose: "#8E6A48", wine: "#5E4331", sage: "#B5A58A", leaf: "#7A6A52", ink: "#2F2620", muted: "#82766A", line: "#E3D7C5", soft: "#F3ECE1", okBg: "#ECEBDD", deep: "#4A3628", gold: ["#F2DDB8", "#C9A26E", "#8A6A3E"] },
  },
  blush: {
    label: "Hồng tro và rose gold",
    p: { bg: "#EFE3E1", paper: "#FBF6F4", blush: "#EDD5D5", rose: "#9C6474", wine: "#6F4352", sage: "#C9A9B2", leaf: "#7E6A60", ink: "#3E3034", muted: "#8A767B", line: "#E6D3D3", soft: "#F4E8E7", okBg: "#EDEEE6", deep: "#4E2C38", gold: ["#F3D9CB", "#C8967A", "#8E5F4A"] },
  },
  daisy: {
    label: "Be giấy và xanh pastel",
    // sage = pastel blue of the cover background, deep = wine (light template: RSVP stays on paper)
    p: { bg: "#ECE2D6", paper: "#F7EFE5", blush: "#F2D3CF", rose: "#A0606A", wine: "#8E1F2F", sage: "#A9BCD9", leaf: "#5F6B4C", ink: "#3A2A2A", muted: "#8A7A72", line: "#E4D5C6", soft: "#F3E9DD", okBg: "#EEF0E2", deep: "#8E1F2F", gold: ["#F6E2B0", "#C9A46A", "#8A6A32"] },
  },
  sen: {
    label: "Hồng lụa và mận",
    p: { bg: "#EFE4DE", paper: "#F6EEE9", blush: "#EFD3D3", rose: "#C98892", wine: "#7A2E45", sage: "#C9B5B0", leaf: "#8C6A6E", ink: "#4A3A3C", muted: "#8C7A7C", line: "#E6D5D3", soft: "#FBF5F2", okBg: "#E8EFE6", deep: "#5E7C6A", gold: ["#F3E3C2", "#C9A66B", "#8E6E3C"] },
  },
  voan: {
    label: "Trắng voan và vàng hồng",
    p: { bg: "#F5EFEC", paper: "#FBF8F6", blush: "#F3E3E1", rose: "#C79A9E", wine: "#6E4A55", sage: "#D9CFC8", leaf: "#8E7B72", ink: "#4A3E40", muted: "#8E8183", line: "#E8DDDA", soft: "#FFFFFF", okBg: "#EEF0E8", deep: "#6E4A55", gold: ["#F4E6D2", "#C9A27A", "#8E6E4E"] },
  },
  dia: {
    label: "Rượu vang và vàng đồng",
    p: { bg: "#F1E9E1", paper: "#F8F2EB", blush: "#EAD5CF", rose: "#B45A5F", wine: "#5A1E2A", sage: "#C8B7A6", leaf: "#6E5A4E", ink: "#2E2224", muted: "#7E6E6A", line: "#E2D3C9", soft: "#F6EEE6", okBg: "#ECEBDF", deep: "#3A121B", gold: ["#F2DDB4", "#C79A5B", "#8A6534"] },
  },
  kraft: {
    label: "Giấy kraft và hồng phấn",
    p: { bg: "#E9DECD", paper: "#FBF7EF", blush: "#F4C6C3", rose: "#E0767A", wine: "#9A3540", sage: "#B9CDB0", leaf: "#6E8A62", ink: "#3B3330", muted: "#7E716A", line: "#E6DACB", soft: "#FFFDF8", okBg: "#E7EFE2", deep: "#9A3540", gold: ["#F6E3B4", "#D6A956", "#8E6A2E"] },
  },
  ngaxam: {
    label: "Ngà xám và nâu khói",
    // blush = envelope paper, paper = page paper (warm grey), ink = smoky brown
    p: { bg: "#D9D1C6", paper: "#E2DBD1", blush: "#E9E2D7", rose: "#8A7666", wine: "#5B4B3F", sage: "#B9AE9F", leaf: "#6F6658", ink: "#4E433A", muted: "#7E7165", line: "#C7BCAF", soft: "#F1ECE3", okBg: "#E4E2D6", deep: "#5B4B3F", gold: ["#F3EBDD", "#B9A88F", "#8C7A63"] },
  },
  son: {
    label: "Đỏ son và vàng kim",
    p: { bg: "#F4E9D8", paper: "#FBF5EA", blush: "#F3DCCB", rose: "#A8343A", wine: "#8E1418", sage: "#D9B77A", leaf: "#7A5A1E", ink: "#2B1712", muted: "#7D6556", line: "#E8D6BC", soft: "#F6ECDD", okBg: "#F1E8D2", deep: "#8E1418", gold: ["#FBE7A6", "#D9A93F", "#9C6F1C"] },
  },
  ink: {
    label: "Mực đen và xanh coban",
    p: { bg: "#ECEAE5", paper: "#FBFAF7", blush: "#ECEFF7", rose: "#2F4BA0", wine: "#1D1B19", sage: "#C9C2B6", leaf: "#4E5A48", ink: "#1D1B19", muted: "#706B64", line: "#E0DBD2", soft: "#F3F1EC", okBg: "#E8ECE3", deep: "#1D1B19", gold: ["#DCE3F5", "#2F4BA0", "#1E2F66"] },
  },
  mauve: {
    label: "Hồng tro và navy",
    p: { bg: "#ECE4E5", paper: "#F8F3F3", blush: "#EDDDE0", rose: "#8D6670", wine: "#574250", sage: "#C2A6AF", leaf: "#6E5A63", ink: "#3A3036", muted: "#85757B", line: "#E2D3D6", soft: "#F2E9EA", okBg: "#E6E8EF", deep: "#2B3656", gold: ["#F1DCDD", "#BE979F", "#7E5C66"] },
  },
  sage: {
    label: "Sage và champagne",
    p: { bg: "#E9ECE4", paper: "#F8F7F1", blush: "#E1E6DA", rose: "#8C7449", wine: "#4F6450", sage: "#A9B8A2", leaf: "#5E7360", ink: "#2F362F", muted: "#77806F", line: "#D9DFD2", soft: "#EEF1E9", okBg: "#E4ECDF", deep: "#3C5041", gold: ["#EFDDBA", "#D4B896", "#957A4F"] },
  },
  glass: {
    label: "Hồng và ô liu",
    p: { bg: "#F0E6E4", paper: "#FCF7F5", blush: "#F1D6D6", rose: "#9E5D69", wine: "#54443A", sage: "#B3BE93", leaf: "#5B693A", ink: "#372D29", muted: "#85716C", line: "#E9D5D3", soft: "#F7EAE8", okBg: "#E9EEDD", deep: "#46522A", gold: ["#EBCFA9", "#B48B58", "#6C4D2D"] },
  },
  bordeaux: {
    label: "Đỏ rượu và vàng",
    p: { bg: "#EDE2D6", paper: "#F9F2E8", blush: "#EAD4C6", rose: "#93692E", wine: "#6B1020", sage: "#C2A36A", leaf: "#6E5A2A", ink: "#2C1A16", muted: "#7A6458", line: "#DEC9AE", soft: "#F1E5D6", okBg: "#EFE6D2", deep: "#4A0B16", gold: ["#F7E6B4", "#CBA352", "#8C6421"] },
  },
  forest: {
    label: "Xanh rêu và vàng",
    p: { bg: "#E7E8DF", paper: "#F7F4EA", blush: "#E3E5D6", rose: "#8E7340", wine: "#2D4A38", sage: "#A9B596", leaf: "#48624F", ink: "#23302A", muted: "#6F786C", line: "#D9DBCB", soft: "#EEEFE4", okBg: "#E4EBDD", deep: "#24392C", gold: ["#F1DEB0", "#C49A55", "#86642C"] },
  },
  navy: {
    label: "Navy và vàng",
    p: { bg: "#E6E7EA", paper: "#F8F6F1", blush: "#E3E5EC", rose: "#8C7444", wine: "#1C2A4A", sage: "#AEB6C6", leaf: "#4A5878", ink: "#1E2433", muted: "#6E7384", line: "#D8DAE0", soft: "#EEEFF2", okBg: "#E5EAE6", deep: "#1C2A4A", gold: ["#F2DFAE", "#C9A84C", "#8A6E2A"] },
  },
  noir: {
    label: "Đen và vàng",
    p: { bg: "#E4E1DB", paper: "#FAF7F0", blush: "#ECE6DA", rose: "#8F7337", wine: "#1F1D1B", sage: "#B7AE97", leaf: "#59533F", ink: "#22201D", muted: "#77726A", line: "#DFD8CA", soft: "#F1ECE2", okBg: "#E8E9E0", deep: "#1B1A18", gold: ["#F5E3B0", "#C8A24F", "#86662A"] },
  },
}

// Short descriptions for the color picker on /invitation. `classic` is the only palette on the free plan.
export const THEME_INFO: Record<string, { desc: string; free?: boolean }> = {
  classic: { desc: "Giấy ngà, mực đỏ đô, ép kim vàng. Trang trọng kiểu Việt.", free: true },
  ivory: { desc: "Giấy ngà ấm, mực nâu mocha, champagne. Xu hướng 2026." },
  blush: { desc: "Hồng tro dịu, ép kim vàng hồng." },
  daisy: { desc: "Giấy be, đỏ rượu, vàng đồng, nền bìa xanh pastel." },
  son: { desc: "Đỏ son, giấy điều, ép kim vàng. Thiệp cưới truyền thống." },
  sen: { desc: "Lụa hồng phấn, ruy băng hồng ruốc, chữ màu mận." },
  voan: { desc: "Trắng voan, hồng phấn, ánh vàng hồng." },
  dia: { desc: "Đỏ rượu đậm, kem, vàng đồng. Kiểu đĩa nhạc cổ điển." },
  kraft: { desc: "Giấy kraft, hồng đào, xanh lá nhạt, chữ viết tay." },
  ngaxam: { desc: "Giấy ngà xám dập nổi, mực nâu khói. Nhẹ nhàng, sang." },
  ink: { desc: "Giấy trắng, mực đen, một điểm xanh coban. Kiểu tạp chí." },
  mauve: { desc: "Hồng tro, điểm xanh navy, viền vàng hồng." },
  sage: { desc: "Xanh sage, giấy ngà, ép kim champagne." },
  glass: { desc: "Hồng kính, xanh ô liu, nẹp đồng." },
  bordeaux: { desc: "Đỏ rượu, sâm panh, ép kim vàng." },
  forest: { desc: "Giấy xanh rêu đậm, ngà và vàng đồng." },
  navy: { desc: "Xanh navy nửa đêm, ngà và vàng gương. Hợp tiệc tối." },
  noir: { desc: "Giấy đen, chữ ngà, ép kim vàng. Sang và hiện đại." },
}

export const TIMELINE_ICONS = ["🥂", "💍", "⛪", "🍽️", "💃", "📸", "🎂", "🎶", "🚗", "💐"]

/** Frosted pink glass with soft light spots, as a CSS background (used by the "glass" template and its card) */
export function glassTexture(p: Palette) {
  const spots = [
    [18, 22, 9], [72, 14, 7], [40, 48, 11], [85, 60, 8], [15, 78, 10], [60, 86, 7], [50, 20, 5], [30, 65, 6],
  ]
    .map(([x, y, r]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.55) 0, rgba(255,255,255,0) ${r}%)`)
    .join(", ")
  return `${spots}, linear-gradient(160deg, ${p.soft} 0%, ${p.blush} 55%, ${p.soft} 100%)`
}
