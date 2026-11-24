import { Be_Vietnam_Pro, Cormorant_Garamond, Cormorant_SC, Great_Vibes, Newsreader, Pinyon_Script, Playfair_Display } from "next/font/google"

// Invite fonts = same families as the app (DESIGN.md §3), both cover Vietnamese diacritics
export const serif = Newsreader({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--iv-serif",
  display: "swap",
  adjustFontFallback: false,
})

export const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500"],
  variable: "--iv-sans",
  display: "swap",
})

// "Daisy envelope" template: flowing script for names and titles, light caps serif for small lines
export const script = Great_Vibes({
  subsets: ["latin", "vietnamese"],
  weight: "400",
  variable: "--iv-script",
  display: "swap",
})

export const caps = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600"],
  variable: "--iv-caps",
  display: "swap",
})

// High-contrast display serif for the editorial and film templates (has Vietnamese)
export const display = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--iv-display",
  display: "swap",
})

// "Ngà dập nổi" template: formal copperplate script for names and titles, small caps for set text (both have Vietnamese)
export const pinyon = Pinyon_Script({ subsets: ["latin", "vietnamese"], weight: "400", variable: "--iv-pinyon", display: "swap" })
export const smallcaps = Cormorant_SC({ subsets: ["latin", "vietnamese"], weight: ["500", "600", "700"], variable: "--iv-sc", display: "swap" })
