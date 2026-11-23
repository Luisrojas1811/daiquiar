import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/cinzel'
import '@fontsource/lato/300.css'
import '@fontsource/lato/400.css'
import '@fontsource/lato/700.css'
import '@fontsource/lato/400-italic.css'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://daiquiar.com.ar'),
  openGraph: {
    title: 'Daiquiar Indumentaria · Moda femenina',
    description: 'Bodies, catsuits y conjuntos. 10% OFF por transferencia y envíos a todo el país.',
    url: 'https://daiquiar.com.ar',
    siteName: 'Daiquiar',
    locale: 'es_AR',
    type: 'website',
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: 'Daiquiar' }],
  },
  title: 'Daiquiar Indumentaria · Moda femenina',
  description: 'Indumentaria femenina seleccionada con amor, con envíos a todo el país.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
