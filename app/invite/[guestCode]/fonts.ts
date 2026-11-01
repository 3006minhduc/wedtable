import { Be_Vietnam_Pro, Cormorant_Garamond } from "next/font/google"

// Invite-only fonts (both cover Vietnamese diacritics)
export const serif = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--iv-serif",
  display: "swap",
})

export const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500"],
  variable: "--iv-sans",
  display: "swap",
})
