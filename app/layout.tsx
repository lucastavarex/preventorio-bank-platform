import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'
import { ActivateOrganization } from '@/components/activate-organization'
import { Providers } from '@/components/providers'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const fontSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
})

const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
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
    <html lang="pt-BR" className={`${fontSans.variable} ${fontMono.variable}`}>
      <body className="antialiased">
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
