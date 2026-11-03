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
export type InviteStyle = "floral" | "gilded" | "glass" | "emboss"

export const TEMPLATES: Record<InviteStyle, { label: string; desc: string; palette: string; free?: boolean }> = {
  floral: { label: "Cổ điển hoa lá", desc: "Rèm vải kéo mở, vòng hoa lá, ảnh bìa khung vòm.", palette: "classic", free: true },
  gilded: { label: "Khung vàng photobooth", desc: "Phong bì dấu sáp, khung vàng chạm trên nền đậm, dải ảnh photobooth trượt ra.", palette: "bordeaux" },
  glass: { label: "Kính màu", desc: "Hai cánh cửa kính màu mở ra, hoa hồng viền chì, ảnh trong khung bầu dục.", palette: "glass" },
  emboss: { label: "Hoa văn nổi", desc: "Giấy hoa văn nổi, phong bì dấu sáp, nơ lụa tháo ra, đếm ngược trên nền đậm.", palette: "mauve" },
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
