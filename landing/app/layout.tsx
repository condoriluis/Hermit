import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const headingFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['600', '700', '800'],
  display: 'swap',
})

const sansFont = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
})

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Hermit — Crea videos, artículos y contenido con Inteligencia Artificial en tu PC',
  description:
    'Una aplicación sencilla para tu computadora donde eliges qué quieres crear (un video para TikTok, un artículo para blog o programar tareas) y la IA lo genera paso a paso frente a ti.',
  keywords: [
    'Hermit',
    'crear videos con IA',
    'videos TikTok automáticos',
    'artículos de blog IA',
    'aplicación de escritorio IA',
    'luchodev',
  ],
  authors: [{ name: 'luchodev', url: 'https://github.com/condoriluis/Hermit' }],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Hermit — Crea videos y artículos con Inteligencia Artificial en tu PC',
    description:
      'Elige lo que quieres hacer en una tarjeta y mira cómo la IA genera el contenido en tu computadora.',
    url: 'https://github.com/condoriluis/Hermit',
    siteName: 'Hermit',
    images: [
      {
        url: '/icon.svg',
        width: 520,
        height: 520,
        alt: 'Hermit',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`dark scroll-smooth ${headingFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      <body className="bg-bg text-text antialiased min-h-screen flex flex-col justify-between selection:bg-accent selection:text-on-solid font-sans">
        {children}
      </body>
    </html>
  )
}
