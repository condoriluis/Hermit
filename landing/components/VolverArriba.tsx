'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

// Botón flotante para volver arriba: aparece al bajar y su anillo se llena con lo recorrido de la página.
const CIRCUNFERENCIA = 2 * Math.PI * 15.5
const DESDE = 600

export default function VolverArriba() {
  const [progreso, setProgreso] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cuadro = 0
    const medir = () => {
      cuadro = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const y = window.scrollY
      setProgreso(max > 0 ? Math.min(1, y / max) : 0)
      setVisible(y > DESDE)
    }
    const alHacerScroll = () => {
      if (!cuadro) cuadro = requestAnimationFrame(medir)
    }
    medir()
    addEventListener('scroll', alHacerScroll, { passive: true })
    addEventListener('resize', alHacerScroll)
    return () => {
      removeEventListener('scroll', alHacerScroll)
      removeEventListener('resize', alHacerScroll)
      if (cuadro) cancelAnimationFrame(cuadro)
    }
  }, [])

  return (
    <button
      type="button"
      aria-label="Volver arriba"
      title="Volver arriba"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full border border-line bg-panel/80 backdrop-blur-md flex items-center justify-center text-muted hover:text-text hover:border-line-strong transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      }`}
    >
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r="15.5" fill="none" stroke="#263244" strokeWidth="2.5" />
        <circle
          cx="20"
          cy="20"
          r="15.5"
          fill="none"
          stroke="#4f8cff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA * (1 - progreso)}
          style={{ transition: 'stroke-dashoffset 0.15s linear' }}
        />
      </svg>
      <ArrowUp className="w-4 h-4 relative" />
    </button>
  )
}
