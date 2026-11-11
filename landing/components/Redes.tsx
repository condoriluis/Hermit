import React from 'react'
import { TiktokLogo, WhatsappLogo, YoutubeLogo } from './Icons'

// Los canales del proyecto, en el pie de la página. YouTube abre youtube.com; cuando exista el canal del proyecto,
// se pone su enlace en NEXT_PUBLIC_YOUTUBE_URL (en Vercel) sin tocar código. WhatsApp es el de soporte, el mismo del
// pago por QR. TikTok hoy es @devnovelas; pasa a @myhermit en un mes.
const WHATSAPP = (process.env.NEXT_PUBLIC_WHATSAPP_SOPORTE || '').replace(/\D/g, '')
const CANALES = [
  {
    nombre: 'YouTube',
    url: process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://www.youtube.com',
    Icono: YoutubeLogo
  },
  {
    nombre: 'WhatsApp',
    url: WHATSAPP ? `https://wa.me/${WHATSAPP}` : 'https://web.whatsapp.com',
    Icono: WhatsappLogo
  },
  {
    nombre: 'TikTok',
    url: 'https://www.tiktok.com/@devnovelas',
    Icono: TiktokLogo
  }
]

export default function Redes() {
  return (
    <div className="flex items-center justify-center gap-3">
      {CANALES.map(({ nombre, url, Icono }) => (
        <a
          key={nombre}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={nombre}
          title={nombre}
          className="w-9 h-9 rounded-full border border-line bg-panel-2 flex items-center justify-center text-muted hover:text-text hover:border-line-strong transition-colors"
        >
          <Icono className="w-4 h-4" />
        </a>
      ))}
    </div>
  )
}
