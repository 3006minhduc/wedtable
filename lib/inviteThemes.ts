export type Palette = {
  bg: string; paper: string; blush: string; rose: string; wine: string
  sage: string; leaf: string; ink: string; muted: string; line: string; soft: string; okBg: string
  /** Dark background for hero/intro (gilded style) */
  deep?: string
  /** Gold gradient stops: light, mid, dark (gilded style) */
  gold?: [string, string, string]
}

/** Decoration set: "floral" = garland + curtain intro, "gilded" = gold baroque frame + envelope intro + photo strip */
export type InviteStyle = "floral" | "gilded"

// Color sets for the guest invite page (events.invite_theme)
export const THEMES: Record<string, { label: string; style?: InviteStyle; p: Palette }> = {
  classic: {
    label: "Trắng đỏ đô",
    p: { bg: "#F7F5F3", paper: "#FFFFFF", blush: "#F3E4E6", rose: "#B4505F", wine: "#8E1F2F", sage: "#9AA58F", leaf: "#6F7F66", ink: "#1C1917", muted: "#78716C", line: "#E8E4DF", soft: "#F2EFEB", okBg: "#E7F1EB" },
  },
  blush: {
    label: "Hồng phấn",
    p: { bg: "#F7EEEE", paper: "#FCF8F6", blush: "#EBD3D6", rose: "#C48B97", wine: "#7E4152", sage: "#8A9A82", leaf: "#6F8468", ink: "#4A3A3F", muted: "#8F7C82", line: "#E3CCD0", soft: "#EFDDE0", okBg: "#E8EFE5" },
  },
  sage: {
    label: "Xanh sage",
    p: { bg: "#EEF2EC", paper: "#FAFBF7", blush: "#DCE5D6", rose: "#D9A8A0", wine: "#4E6A4B", sage: "#9DB08F", leaf: "#6B8564", ink: "#3B4339", muted: "#7C8778", line: "#CFDCC9", soft: "#E3EBDF", okBg: "#E3EDDC" },
  },
  ivory: {
    label: "Trắng ngà ánh vàng",
    p: { bg: "#F6F1E7", paper: "#FFFCF5", blush: "#EADFC8", rose: "#C8A96A", wine: "#7A5C2E", sage: "#A9AE8F", leaf: "#7D8466", ink: "#3F382C", muted: "#8A806C", line: "#E5D8BC", soft: "#EFE6D3", okBg: "#EDEBDA" },
  },
  bordeaux: {
    label: "Đỏ rượu khung vàng",
    style: "gilded",
    p: { bg: "#F1E4D6", paper: "#F9F1E7", blush: "#EAD4C6", rose: "#94682A", wine: "#6E1121", sage: "#C2A36A", leaf: "#6E5A2A", ink: "#2F1C17", muted: "#7A6458", line: "#DEC9AE", soft: "#EBDCC9", okBg: "#EFE6D2", deep: "#4B0B17", gold: ["#F6E3AE", "#C9A04C", "#8C6421"] },
  },
}

// Short descriptions for the theme picker on /invitation. Add a new theme by adding an entry to THEMES
// (palette) and here (description); `classic` is the only theme on the free plan.
export const THEME_INFO: Record<string, { desc: string; free?: boolean }> = {
  classic: { desc: "Trắng tinh, chữ nâu mực, điểm đỏ đô. Trang trọng, hợp mọi tiệc.", free: true },
  blush: { desc: "Hồng phấn dịu, lá xanh xám. Lãng mạn, nhẹ nhàng.", },
  sage: { desc: "Xanh sage và hồng đào. Tươi, hợp tiệc ngoài trời, sân vườn." },
  ivory: { desc: "Trắng ngà ánh vàng. Cổ điển, ấm và sang." },
  bordeaux: { desc: "Phong bì dấu sáp, khung vàng chạm trên nền đỏ rượu, dải ảnh photobooth trượt ra." },
}

export const TIMELINE_ICONS = ["🥂", "💍", "⛪", "🍽️", "💃", "📸", "🎂", "🎶", "🚗", "💐"]
