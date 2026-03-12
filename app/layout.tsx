import { Inter } from 'next/font/google'
import Image from 'next/image'
import { Toaster } from '@/modules/shared/components/ui/sonner'
import { Renown } from '@/modules/shared/components/renown'
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
            <Renown appName="vetra" url={process.env.NEXT_PUBLIC_RENOWN_URL} />
            <div className="items-right flex min-h-screen flex-col">
              <Navbar />
              <div className="pointer-events-none fixed top-[100px] right-0 z-0 h-[480px] w-full overflow-hidden">
                <Image
                  src="/Vetra-background.png"
                  alt=""
                  width={1024}
                  height={600}
                  className="float-right h-auto w-[1024px]"
                  priority
                />
              </div>
              <main className="z-10 flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
