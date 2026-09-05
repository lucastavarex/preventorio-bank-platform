import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ActivateOrganization } from '@/components/activate-organization'
import { Providers } from '@/components/providers'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'Banco do Preventório',
  description: 'Portal interno do Banco do Preventório',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        <ClerkProvider taskUrls={{ 'choose-organization': '/sign-in/tasks' }}>
          <Providers>
            <ActivateOrganization />
            <Toaster />
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  )
}
