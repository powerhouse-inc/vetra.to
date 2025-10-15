import { Inter } from 'next/font/google'
import { AuthProvider } from '@/modules/shared/providers/auth-provider'
import { ThemeProvider } from '@/modules/shared/providers/theme-provider'
import { Footer } from '@/shared/components/footer/footer'
import Navbar from '@/shared/components/navbar/navbar'
import { QueryClientProvider } from '@/shared/providers/query-client'
import type { Metadata } from 'next'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Vetra',
  description: 'Vetra',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-muted/30 antialiased`}>
        {/* Background SVG - positioned at the highest level */}
        {/* <div className="fixed inset-0 -z-10">
          <BackgroundSvg className="h-full w-full object-cover" />
        </div> */}

        <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
          <QueryClientProvider>
            <AuthProvider>
              <div className="flex min-h-screen flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
