import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/components/auth-provider"
import Providers from "@/components/Providers"
import "./globals.css"
import { SessionProvider } from "next-auth/react"


const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Nexora - Learn Languages & Share Cultures",
  description:
    "Join topic-based chat rooms on Nexora to practice languages, explore cultures, and learn together with people from around the world.",
  keywords: "language exchange, cultural exchange, chat rooms, learning, education, multilingual, Nexora",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
