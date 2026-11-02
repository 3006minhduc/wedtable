import type { Metadata } from "next"
import { Be_Vietnam_Pro, Newsreader } from "next/font/google"
import "./globals.css"

const sans = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
})

const serif = Newsreader({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: "WedTable — Thiệp mời, sơ đồ bàn và check-in cho đám cưới",
  description: "Gửi thiệp mời riêng cho từng khách, để khách tự chọn chỗ ngồi trên sơ đồ bàn và check-in bằng QR.",
  // The design is light-only; ask browsers with forced dark mode to keep our colors
  other: { "color-scheme": "light only" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  )
}
