'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Los videos de ejemplo, en una pila 3D: el que se ve va al frente y los demás suben y se hunden
 * hacia atrás a la izquierda, clicables para elegirlos. Son archivos reales generados con Hermit,
 * sin edición a mano: van en `landing/public/videos/`, el video y su miniatura con el mismo nombre
 * (`animalnovela.mp4` y `animalnovela.jpg`). Para añadir otro, agrega una línea aquí y sube sus dos archivos.
 */
const EJEMPLOS = [
  { archivo: 'animalnovela', estilo: 'Animalnovela', titulo: 'La inspección más sospechosa del bosque', duracion: '1:00' },
  { archivo: 'frutinovela', estilo: 'Frutinovela', titulo: 'Todos Santos: 2 de noviembre', duracion: '0:32' },
  { archivo: 'politica', estilo: 'Explicativo', titulo: '¿Convicción o 25 millones?', duracion: '0:30' },
]

/**
 * Cada puesto dentro de la pila: el activo al frente y, hacia atrás, cada vez más arriba, más
 * hundido, más girado y más transparente. `capa` manda el orden de apilado. Las distancias se
 * encogen con el ancho del video, para que la pila quepa igual en un teléfono.
 */
const PILA = [
  { x: 0, y: 0, z: 0, giro: 0, ladeo: 0, escala: 1, opacidad: 1, capa: 30 },
  { x: -70, y: -40, z: -120, giro: 22, ladeo: -5, escala: 0.91, opacidad: 0.92, capa: 20 },
  { x: -130, y: -75, z: -240, giro: 32, ladeo: -8, escala: 0.82, opacidad: 0.78, capa: 15 },
  { x: -180, y: -105, z: -340, giro: 38, ladeo: -10, escala: 0.74, opacidad: 0.55, capa: 10 },
  { x: -210, y: -125, z: -400, giro: 42, ladeo: -12, escala: 0.68, opacidad: 0, capa: 1 },
]

export default function Ejemplos() {
  const [i, setI] = useState(0)
  const [ancho, setAncho] = useState(0)
  const [visible, setVisible] = useState(false)
  const [resaltado, setResaltado] = useState<number | null>(null)
  const videos = useRef<(HTMLVideoElement | null)[]>([])
  const caja = useRef<HTMLDivElement>(null)
  const inicioToque = useRef<number | null>(null)

  // El ancho de la caja manda: el video de adelante queda centrado y la pila se encoge a su medida.
  useLayoutEffect(() => {
    const el = caja.current
    if (!el) return
    const ro = new ResizeObserver(() => setAncho(el.clientWidth))
    ro.observe(el)
    setAncho(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const anchoVideo = Math.min(300, Math.max(190, ancho * 0.55))
  const altoVideo = Math.round((anchoVideo * 16) / 9)
  const factor = anchoVideo / 300

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
            className="relative mx-auto [perspective:1600px]"
            style={{ width: anchoVideo, height: altoVideo }}
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
            {EJEMPLOS.map((e, n) => {
              const puesto = (n - i + EJEMPLOS.length) % EJEMPLOS.length
              const activo = puesto === 0
              const p = PILA[Math.min(puesto, PILA.length - 1)]
              const alzado = resaltado === n && !activo

              // Al pasar el mouse, la tarjeta sale un poco de la pila y viene al frente.
              const x = (p.x + (alzado ? 34 : 0)) * factor
              const y = (p.y + (alzado ? -16 : 0)) * factor
              const z = (p.z + (alzado ? 110 : 0)) * factor
              const giro = p.giro * (alzado ? 0.5 : 1)
              const ladeo = p.ladeo * (alzado ? 0.55 : 1)
              const escala = p.escala + (alzado ? 0.06 : 0)

              return (
                <button
                  key={e.archivo}
                  type="button"
                  onClick={() => setI(n)}
                  onMouseEnter={() => setResaltado(n)}
                  onMouseLeave={() => setResaltado(null)}
                  onFocus={() => setResaltado(n)}
                  onBlur={() => setResaltado(null)}
                  aria-label={`Ver ${e.titulo}`}
                  aria-current={activo}
                  style={{
                    zIndex: alzado ? p.capa + 5 : p.capa,
                    opacity: alzado ? 1 : p.opacidad,
                    pointerEvents: p.opacidad === 0 && !alzado ? 'none' : undefined,
                    transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${giro}deg) rotateZ(${ladeo}deg) scale(${escala})`,
                    transitionDuration: '700ms',
                    transitionTimingFunction: 'cubic-bezier(.22,1,.36,1)',
                  }}
                  className={`group absolute inset-0 overflow-hidden rounded-[28px] border bg-black shadow-[0_30px_60px_rgba(0,0,0,0.6)] transition-all will-change-transform ${
                    activo ? 'border-line' : 'border-line/60 cursor-pointer'
                  } ${alzado ? 'border-accent/40' : ''}`}
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
                    aria-hidden={!activo}
                    onEnded={() => ir(n + 1)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/40" />

                  <div
                    className={`absolute inset-x-0 bottom-0 p-4 pt-14 bg-gradient-to-t from-black/85 via-black/45 to-transparent transition-opacity duration-500 ${
                      activo ? 'opacity-100' : 'opacity-0'
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
              )
            })}
          </div>

          <div className="flex items-center justify-center gap-5 mt-10">
            <button
              type="button"
              onClick={() => ir(i - 1)}
              aria-label="Video anterior"
              className="p-2.5 rounded-full border border-line bg-panel text-muted hover:text-text hover:border-accent/40 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <p className="text-[11px] font-mono tracking-[0.25em] text-muted">
              <span className="text-text font-bold">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-muted/60"> / {String(EJEMPLOS.length).padStart(2, '0')}</span>
            </p>

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
