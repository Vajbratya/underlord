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
  title: "UNDERLORD — As Cinzas da Coroa Submersa",
  description:
    "Tática turn-based em hex. Você é o último Underlord. Comande broods de minions e descarregue 14 séculos de raiva contra um reino inteiro de heróis insuportáveis.",
  generator: "v0.app",
  icons: {
    icon: "/images/app-icon.jpg",
    apple: "/images/app-icon.jpg",
  },
  openGraph: {
    title: "UNDERLORD — As Cinzas da Coroa Submersa",
    description:
      "Hex tactics dark-fantasy. 14 séculos de raiva contra heróis insuportáveis.",
    images: ["/images/cover.jpg"],
  },
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
      // Browser extensions (Tag Assistant, Grammarly, etc.) inject attributes
      // onto <html> before React hydrates. We don't render any dynamic data
      // on this element ourselves, so suppress the noisy mismatch warning.
      suppressHydrationWarning
    >
      <body className="font-sans antialiased min-h-dvh">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
