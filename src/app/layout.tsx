import type { Metadata } from 'next'
import { DM_Sans, Syne } from 'next/font/google'
import localFont from 'next/font/local'
import { LayoutChrome } from '@/components/layout-chrome'
import { AuthProvider } from '@/contexts/auth-context'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'E17 CRM',
  description: 'E17 CRM lead management platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={`${syne.variable} ${dmSans.variable} ${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <LayoutChrome>{children}</LayoutChrome>
        </AuthProvider>
      </body>
    </html>
  )
}
