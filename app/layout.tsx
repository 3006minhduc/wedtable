import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "WedTable",
  description: "Quản lý bàn tiệc cưới thông minh",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
