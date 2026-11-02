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
  floral: { label: "Cổ điển hoa lá", desc: "Rèm vải kéo mở, vòng hoa lá, ảnh bìa khung vòm.", palette: "blush", free: true },
  gilded: { label: "Khung vàng photobooth", desc: "Phong bì dấu sáp, khung vàng chạm trên nền đậm, dải ảnh photobooth trượt ra.", palette: "bordeaux" },
  glass: { label: "Kính màu", desc: "Hai cánh cửa kính màu mở ra, hoa hồng viền chì, ảnh trong khung bầu dục.", palette: "glass" },
  emboss: { label: "Hoa văn nổi", desc: "Giấy hoa văn nổi, phong bì dấu sáp, nơ lụa tháo ra, đếm ngược trên nền đậm.", palette: "mauve" },
}

export const templateOf = (id?: string | null): InviteStyle => (id && id in TEMPLATES ? (id as InviteStyle) : "floral")

// Color sets for the guest invite page (events.invite_theme)
export const THEMES: Record<string, { label: string; p: Palette }> = {
  classic: {
    label: "Trắng đỏ đô",
    p: { bg: "#F7F5F3", paper: "#FFFFFF", blush: "#F3E4E6", rose: "#B4505F", wine: "#8E1F2F", sage: "#9AA58F", leaf: "#6F7F66", ink: "#1C1917", muted: "#78716C", line: "#E8E4DF", soft: "#F2EFEB", okBg: "#E7F1EB", deep: "#5C1420", gold: ["#F3DDB0", "#C29A55", "#8A6526"] },
  },
  blush: {
    label: "Hồng phấn",
    p: { bg: "#F7EEEE", paper: "#FCF8F6", blush: "#EBD3D6", rose: "#C48B97", wine: "#7E4152", sage: "#8A9A82", leaf: "#6F8468", ink: "#4A3A3F", muted: "#8F7C82", line: "#E3CCD0", soft: "#EFDDE0", okBg: "#E8EFE5", deep: "#5A2F3D", gold: ["#F4D9CF", "#C99A8A", "#8E5E55"] },
  },
  sage: {
    label: "Xanh sage",
    p: { bg: "#EEF2EC", paper: "#FAFBF7", blush: "#DCE5D6", rose: "#D9A8A0", wine: "#4E6A4B", sage: "#9DB08F", leaf: "#6B8564", ink: "#3B4339", muted: "#7C8778", line: "#CFDCC9", soft: "#E3EBDF", okBg: "#E3EDDC", deep: "#3E5A3E", gold: ["#EBDDB8", "#B59A62", "#7A6438"] },
  },
  ivory: {
    label: "Trắng ngà ánh vàng",
    p: { bg: "#F6F1E7", paper: "#FFFCF5", blush: "#EADFC8", rose: "#C8A96A", wine: "#7A5C2E", sage: "#A9AE8F", leaf: "#7D8466", ink: "#3F382C", muted: "#8A806C", line: "#E5D8BC", soft: "#EFE6D3", okBg: "#EDEBDA", deep: "#4A3A22", gold: ["#F6E3AE", "#C9A04C", "#8C6421"] },
  },
  bordeaux: {
    label: "Đỏ rượu",
    p: { bg: "#F1E4D6", paper: "#F9F1E7", blush: "#EAD4C6", rose: "#94682A", wine: "#6E1121", sage: "#C2A36A", leaf: "#6E5A2A", ink: "#2F1C17", muted: "#7A6458", line: "#DEC9AE", soft: "#EBDCC9", okBg: "#EFE6D2", deep: "#4B0B17", gold: ["#F6E3AE", "#C9A04C", "#8C6421"] },
  },
  glass: {
    label: "Hồng và ô liu",
    p: { bg: "#F6E9E8", paper: "#FCF6F5", blush: "#F1D3D4", rose: "#A8606C", wine: "#5A4536", sage: "#AFBB8E", leaf: "#5F6B3A", ink: "#3A2E2A", muted: "#86716C", line: "#E8D0CF", soft: "#F6E4E3", okBg: "#E9EEDD", deep: "#4F5A2E", gold: ["#EBCDA6", "#B38A58", "#6E4E2E"] },
  },
  mauve: {
    label: "Hồng tro và navy",
    p: { bg: "#EEE4E5", paper: "#F4ECEC", blush: "#E4D2D5", rose: "#8C6872", wine: "#5A4450", sage: "#B7A0A7", leaf: "#6E5A63", ink: "#3D3238", muted: "#83727A", line: "#DACACD", soft: "#EADDDF", okBg: "#E6E7EF", deep: "#3B4566", gold: ["#F2DCDD", "#B89197", "#7E5C64"] },
  },
}

// Short descriptions for the color picker on /invitation. `classic` is the only palette on the free plan.
export const THEME_INFO: Record<string, { desc: string; free?: boolean }> = {
  classic: { desc: "Trắng tinh, điểm đỏ đô.", free: true },
  blush: { desc: "Hồng phấn dịu, lá xanh xám." },
  sage: { desc: "Xanh sage và hồng đào." },
  ivory: { desc: "Trắng ngà, ánh vàng ấm." },
  bordeaux: { desc: "Đỏ rượu, sâm panh và vàng." },
  glass: { desc: "Hồng kính, xanh ô liu, đồng." },
  mauve: { desc: "Hồng tro, điểm xanh navy." },
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
