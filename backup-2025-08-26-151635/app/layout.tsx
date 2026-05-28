import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/layout/header-modular"
import Footer from "@/components/layout/footer"
import { NotificationProvider, NotificationContainer } from "@/components/ui/modern-notification"
import { ChatProvider } from "@/lib/chat-context"
import { FloatingChatButton } from "@/components/chat/FloatingChatButton"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Marketplace Innovante - La révolution du commerce en ligne",
  description:
    "Découvrez la marketplace du futur avec système de points, chat instantané et fonctionnalités sociales avancées",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <NotificationProvider>
          <ChatProvider>
            <Header />
            <main className="min-h-screen main-content">{children}</main>
            <Footer />
            <NotificationContainer />
            <FloatingChatButton />
          </ChatProvider>
        </NotificationProvider>
      </body>
    </html>
  )
}
