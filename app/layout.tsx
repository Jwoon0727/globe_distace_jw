import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import PwaRegister from '@/components/pwa-register'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
  colorScheme: 'dark',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Distance Globe',
  description: '회전하는 지구본에서 출발지·도착지 거리를 측정하는 앱',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Distance Globe',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${GeistSans.variable} ${GeistMono.variable} bg-black`}>
      <body className={`${GeistSans.className} antialiased bg-black text-white`}>
        {children}
        <PwaRegister />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
