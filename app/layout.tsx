import type { Metadata, Viewport } from "next"
import { Cinzel, JetBrains_Mono, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-display",
})
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "UNDERLORD — Ashes of the Sunken Crown",
  description:
    "Turn-based dark-fantasy tactics. Command minion broods, raid the overworld, and reclaim the Sunken Crown as the resurrected Underlord.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#1a0f0a",
  userScalable: false,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cinzel.variable} ${jetbrains.variable} bg-background`}
    >
      <body className="font-sans antialiased min-h-dvh">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
