'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Los videos de ejemplo, en un marco vertical (tipo TikTok): el que se ve va al centro y de los
 * vecinos asoma un pedazo, clicable para elegirlo. Son archivos reales generados con Hermit, sin
 * edición a mano: van en `landing/public/videos/`, el video y su miniatura con el mismo nombre
 * (`animalnovela.mp4` y `animalnovela.jpg`). Para añadir otro, agrega una línea aquí y sube sus dos archivos.
 */
const EJEMPLOS = [
  { archivo: 'animalnovela', estilo: 'Animalnovela', titulo: 'La inspección más sospechosa del bosque', duracion: '1:00' },
  { archivo: 'frutinovela', estilo: 'Frutinovela', titulo: 'Todos Santos: 2 de noviembre', duracion: '0:32' },
  { archivo: 'politica', estilo: 'Explicativo', titulo: '¿Convicción o 25 millones?', duracion: '0:30' },
]

/** Separación entre un video y el siguiente. */
const HUECO = 16
/** Lo que se ve del degradado en los bordes: los vecinos se pierden hacia los lados. */
const DESVANECIDO = 'linear-gradient(to right, transparent, black 7%, black 93%, transparent)'

export default function Ejemplos() {
  const [i, setI] = useState(0)
  const [ancho, setAncho] = useState(0)
  const [visible, setVisible] = useState(false)
  const videos = useRef<(HTMLVideoElement | null)[]>([])
  const caja = useRef<HTMLDivElement>(null)
  const inicioToque = useRef<number | null>(null)

  // El ancho de la caja manda: así el video elegido queda centrado y los vecinos asoman justo un pedazo.
  useLayoutEffect(() => {
    const el = caja.current
    if (!el) return
    const ro = new ResizeObserver(() => setAncho(el.clientWidth))
    ro.observe(el)
    setAncho(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const anchoVideo = Math.min(300, Math.max(190, ancho * 0.55))
  const salto = anchoVideo + HUECO
  const corrimiento = ancho / 2 - anchoVideo / 2 - i * salto

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
    const el = caja.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

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
            Estos videos los hizo Hermit solo, sin edición manual. Elige uno para verlo.
          </p>
        </div>

        <div ref={caja} className="relative max-w-2xl mx-auto">
          <div
            className="overflow-hidden"
            style={{ maskImage: DESVANECIDO, WebkitMaskImage: DESVANECIDO }}
            onTouchStart={(e) => {
              inicioToque.current = e.touches[0].clientX
            }}
            onTouchEnd={(e) => {
              if (inicioToque.current === null) return
              const d = e.changedTouches[0].clientX - inicioToque.current
              if (Math.abs(d) > 40) ir(i + (d < 0 ? 1 : -1))
              inicioToque.current = null
            }}
          >
            <div
              className="flex items-center transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] will-change-transform"
              style={{ gap: HUECO, transform: `translate3d(${corrimiento}px, 0, 0)` }}
            >
              {EJEMPLOS.map((e, n) => (
                <button
                  key={e.archivo}
                  type="button"
                  onClick={() => setI(n)}
                  aria-label={`Ver ${e.titulo}`}
                  aria-current={n === i}
                  style={{ width: anchoVideo }}
                  className={`relative shrink-0 aspect-[9/16] rounded-[1.75rem] overflow-hidden border bg-black shadow-2xl transition-all duration-500 ${
                    n === i
                      ? 'border-line cursor-default'
                      : 'border-line/60 opacity-40 scale-[0.88] cursor-pointer hover:opacity-70'
                  }`}
                >
                  <video
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
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  <div
                    className={`absolute inset-x-0 bottom-0 p-4 pt-14 bg-gradient-to-t from-black/85 via-black/45 to-transparent transition-opacity duration-500 ${
                      n === i ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-white uppercase backdrop-blur-sm">
                      {e.estilo}
                    </span>
                    <p className="text-sm font-bold text-white font-heading mt-2">{e.titulo}</p>
                    <p className="text-[11px] text-white/60 font-mono mt-0.5">
                      MP4 1080×1920 · {e.duracion} · sin edición
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-5 mt-8">
            <button
              type="button"
              onClick={() => ir(i - 1)}
              aria-label="Video anterior"
              className="p-2.5 rounded-full border border-line bg-panel text-muted hover:text-text hover:border-accent/40 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
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

            <button
              type="button"
              onClick={() => ir(i + 1)}
              aria-label="Video siguiente"
              className="p-2.5 rounded-full border border-line bg-panel text-muted hover:text-text hover:border-accent/40 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-8">
          Todos se generaron en una computadora normal y los archivos quedan en tu equipo.
        </p>
      </div>
    </section>
  )
}
