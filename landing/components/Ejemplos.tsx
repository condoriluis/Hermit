'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Los videos de ejemplo, en un marco vertical (tipo TikTok), de uno en uno.
 * Son archivos reales generados con Hermit, sin edición a mano: van en `landing/public/videos/`,
 * el video y su miniatura con el mismo nombre (`animalnovela.mp4` y `animalnovela.jpg`).
 * Para añadir otro, agrega una línea aquí y sube sus dos archivos.
 */
const EJEMPLOS = [
  { archivo: 'animalnovela', estilo: 'Animalnovela', titulo: 'La inspección más sospechosa del bosque', duracion: '1:00' },
  { archivo: 'frutinovela', estilo: 'Frutinovela', titulo: 'Todos Santos: 2 de noviembre', duracion: '0:32' },
  { archivo: 'politica', estilo: 'Explicativo', titulo: '¿Convicción o 25 millones?', duracion: '0:30' },
]

export default function Ejemplos() {
  const [i, setI] = useState(0)
  const [visible, setVisible] = useState(false)
  const videos = useRef<(HTMLVideoElement | null)[]>([])
  const marco = useRef<HTMLDivElement>(null)
  const inicioToque = useRef<number | null>(null)

  /** Pasa al video `paso` (da la vuelta al llegar al final). */
  const ir = useCallback((paso: number) => {
    setI((i) => (paso + EJEMPLOS.length) % EJEMPLOS.length)
  }, [])

  // Solo corre el video que se está viendo, y sin sonido. Los demás se quedan quietos.
  useEffect(() => {
    videos.current.forEach((v, n) => {
      if (!v) return
      if (n === i && visible) v.play().catch(() => {})
      else v.pause()
    })
  }, [i, visible])

  // Si la sección sale de la pantalla, se pausa: no gasta batería de nadie.
  useEffect(() => {
    const el = marco.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const actual = EJEMPLOS[i]

  return (
    <section id="ejemplos" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs uppercase font-mono tracking-widest text-accent font-bold">
            Hecho con Hermit
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-text font-heading tracking-tight mt-2">
            Mira lo que ya se creó
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted">
            Estos videos los hizo Hermit solo, sin edición manual. Desliza para ver otro.
          </p>
        </div>

        <div className="relative max-w-md mx-auto flex items-center justify-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={() => ir(i - 1)}
            aria-label="Video anterior"
            className="shrink-0 p-2.5 rounded-full border border-line bg-panel text-muted hover:text-text hover:border-accent/40 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={marco}
            onTouchStart={(e) => {
              inicioToque.current = e.touches[0].clientX
            }}
            onTouchEnd={(e) => {
              if (inicioToque.current === null) return
              const d = e.changedTouches[0].clientX - inicioToque.current
              if (Math.abs(d) > 40) ir(i + (d < 0 ? 1 : -1))
              inicioToque.current = null
            }}
            className="relative w-full max-w-[320px] aspect-[9/16] rounded-[1.75rem] overflow-hidden border border-line bg-black shadow-2xl"
          >
            {EJEMPLOS.map((e, n) => (
              <video
                key={e.archivo}
                ref={(el) => {
                  videos.current[n] = el
                }}
                src={`/videos/${e.archivo}.mp4`}
                poster={`/videos/${e.archivo}.jpg`}
                muted
                playsInline
                preload="none"
                aria-hidden={n !== i}
                onEnded={() => ir(n + 1)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  n === i ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
            ))}

            <div className="absolute inset-x-0 bottom-0 p-4 pt-14 bg-gradient-to-t from-black/85 via-black/45 to-transparent">
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white uppercase backdrop-blur-sm">
                {actual.estilo}
              </span>
              <p className="text-sm font-bold text-white font-heading mt-2">{actual.titulo}</p>
              <p className="text-[11px] text-white/60 font-mono mt-0.5">
                MP4 1080×1920 · {actual.duracion} · sin edición
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => ir(i + 1)}
            aria-label="Video siguiente"
            className="shrink-0 p-2.5 rounded-full border border-line bg-panel text-muted hover:text-text hover:border-accent/40 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          {EJEMPLOS.map((e, n) => (
            <button
              key={e.archivo}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Ver ${e.titulo}`}
              className={`h-1.5 rounded-full transition-all ${
                n === i ? 'w-6 bg-accent' : 'w-1.5 bg-line hover:bg-muted'
              }`}
            />
          ))}
        </div>

        <p className="text-center text-xs text-muted mt-8">
          Todos se generaron en una computadora normal y los archivos quedan en tu equipo.
        </p>
      </div>
    </section>
  )
}
