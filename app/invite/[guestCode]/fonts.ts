import { Be_Vietnam_Pro, Newsreader } from "next/font/google"

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
