import { Be_Vietnam_Pro, Cormorant_Garamond, Great_Vibes, Newsreader, Playfair_Display } from "next/font/google"

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
