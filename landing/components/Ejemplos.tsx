'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react'

/**
 * Los videos de ejemplo, en una pila 3D simétrica: el que se ve va al frente, al centro, y los
 * demás se reparten a los dos lados, cada vez más hundidos, girados y transparentes. Se eligen con
 * un clic y se pasan arrastrando con el mouse o con el dedo, hacia la izquierda o la derecha. Son
 * archivos reales generados con Hermit, sin edición a mano: van en Cloudinary
 * (`res.cloudinary.com/dpxtci7sn`) y el póster sale del mismo video con `portada()`, así que no
 * hay ninguna imagen que subir aparte. Para añadir otro, sube su `.mp4` a Cloudinary (la parte que
 * va tras `/upload/`) y agrega una línea aquí.
 */
const CLOUDINARY = 'https://res.cloudinary.com/dpxtci7sn/video/upload'
const EJEMPLOS = [
  { id: 'v1794420660/files/el-diff-final%20%281%29', estilo: 'El Diff', titulo: 'Hermit: qué es, para qué sirve y para quién', duracion: '0:52' },
  { id: 'v1794276084/files/devnovela-nunca-hagas-deploy-viernes', estilo: 'Devnovela', titulo: 'Nunca hagas deploy un viernes', duracion: '0:51' },
  { id: 'v1794277465/files/devnovela-git-vs-github', estilo: 'Devnovela', titulo: 'Git vs GitHub', duracion: '—' },
  { id: 'v1794273538/files/crimen-muneco-chuky', estilo: 'Crimen', titulo: 'El muñeco Chucky', duracion: '0:30' },
  { id: 'v1794277105/files/reddit-abuela-sigue-llamandome', estilo: 'Reddit', titulo: 'Abuela sigue llamándome', duracion: '—' },
  { id: 'v1794277198/files/politica-vida-donal-tromp-ee', estilo: 'Política', titulo: 'La vida de Donald Trump', duracion: '—' },
  { id: 'v1794276410/files/animalnovela-formato-vertical', estilo: 'Animalnovela', titulo: 'La inspección más sospechosa del bosque', duracion: '1:00' },
  { id: 'v1794276221/files/frutinovela-todos-santos-2-noviembre', estilo: 'Frutinovela', titulo: 'Todos Santos: 2 de noviembre', duracion: '0:32' },
  { id: 'v1794276459/files/motivacional-vida-continua-somos-triunfadores', estilo: 'Motivacional', titulo: 'La vida continúa: somos triunfadores', duracion: '0:41' },
]

/** El video, recomprimido por Cloudinary (`q_auto`): baja de peso sin que se note. */
const video = (id: string) => `${CLOUDINARY}/q_auto/${id}.mp4`
/** El póster: el primer cuadro del mismo video (`.mp4` → `.jpg`), con `so_0`. */
const portada = (id: string) => `${CLOUDINARY}/so_0,q_auto/${id}.jpg`

/** Cuánto se aparta cada tarjeta del centro, en anchos de video: más es más separado. */
const SEPARACION = 0.62
/** Cuánto hay que arrastrar, en píxeles, para pasar de video. */
const UMBRAL_ARRASTRE = 40

export default function Ejemplos() {
  const [i, setI] = useState(0)
  const [ancho, setAncho] = useState(0)
  const [visible, setVisible] = useState(false)
  const [resaltado, setResaltado] = useState<number | null>(null)
  const [silenciado, setSilenciado] = useState(true)
  const videos = useRef<(HTMLVideoElement | null)[]>([])
  const caja = useRef<HTMLDivElement>(null)
  const inicioArrastre = useRef<number | null>(null)
  const huboArrastre = useRef(0)

  // El ancho de la caja manda: la tarjeta de adelante va al centro y las de los lados se acomodan a
  // su medida, para que las dos puntas quepan sin salirse de la pantalla.
  useLayoutEffect(() => {
    const el = caja.current
    if (!el) return
    const ro = new ResizeObserver(() => setAncho(el.clientWidth))
    ro.observe(el)
    setAncho(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const maxLado = Math.floor(EJEMPLOS.length / 2) // distribuye los videos simétricamente a izq/der
  // Cuántas tarjetas caben a cada lado sin salirse de la pantalla: en el celular solo una, y las
  // demás se recogen detrás de la pila; en escritorio se ven todas como antes.
  const ladoVisible = ancho < 700 ? 1 : ancho < 1050 ? 2 : maxLado
  const separacion = ancho < 700 ? 0.55 : SEPARACION
  const anchoVideo = Math.min(300, Math.max(140, ancho / (1 + 2 * 2 * separacion))) // tamaño fijo: siempre 2 visibles a cada lado
  const altoVideo = Math.round((anchoVideo * 16) / 9)
  const factor = anchoVideo / 300

  /** Pasa al video `paso` (da la vuelta al llegar al final). */
  const ir = useCallback((paso: number) => {
    setI((i) => (paso + EJEMPLOS.length) % EJEMPLOS.length)
  }, [])

  // Solo corre el video que se está viendo; los demás se pausan, se resetean al inicio y
  // vuelven a mostrar su portada (v.load() cancela la reproducción y restaura el poster).
  useEffect(() => {
    videos.current.forEach((v, n) => {
      if (!v) return
      if (n === i && visible) {
        v.muted = silenciado
        v.play().catch(() => {})
      } else {
        v.pause()
        v.load() // resetea al frame 0 y muestra la portada
      }
    })
  }, [i, visible, silenciado])

  // Si la sección sale de la pantalla, se pausa: no gasta batería de nadie.
  useEffect(() => {
    const el = caja.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Arrastrar en el eje X, con el mouse o el dedo, pasa de video; un clic corto no arrastra.
  const soltar = (e: PointerEvent<HTMLDivElement>) => {
    const desde = inicioArrastre.current
    inicioArrastre.current = null
    if (desde === null) return
    const d = e.clientX - desde
    if (Math.abs(d) < UMBRAL_ARRASTRE) return
    ir(i + (d < 0 ? 1 : -1))
    huboArrastre.current = Date.now()
  }

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
            Estos videos los hizo Hermit solo, sin edición manual. Elige uno para verlo, o desliza a los lados.
          </p>
        </div>

        <div ref={caja} className="relative max-w-4xl mx-auto">
          <div
            className="relative mx-auto [perspective:1600px] [touch-action:pan-y]"
            style={{ width: anchoVideo, height: altoVideo }}
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse' && e.button !== 0) return
              inicioArrastre.current = e.clientX
            }}
            onPointerMove={(e) => {
              if (inicioArrastre.current === null) return
              if (Math.abs(e.clientX - inicioArrastre.current) > 10 && !e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.setPointerCapture(e.pointerId)
              }
            }}
            onPointerUp={soltar}
            onPointerCancel={() => {
              inicioArrastre.current = null
            }}
          >
            {EJEMPLOS.map((e, n) => {
              const puesto = (n - i + EJEMPLOS.length) % EJEMPLOS.length
              // La distancia con signo al centro: los puestos de la derecha suman, los de la izquierda restan.
              const rel = puesto <= maxLado ? puesto : puesto - EJEMPLOS.length
              const lado = Math.abs(rel)
              const signo = rel === 0 ? 0 : rel < 0 ? -1 : 1
              const activo = rel === 0
              const alzado = resaltado === n && !activo
              // Más allá de `ladoVisible` la tarjeta no cabe en pantalla: se recoge detrás de la
              // pila (centro, hundida y transparente) y entra deslizándose al acercarse al frente.
              const oculto = lado > ladoVisible

              // A los dos lados, la misma separación. Cada vez más hundida, girada hacia el centro y
              // transparente. Al pasar el mouse, la tarjeta sale un poco y viene al frente.
              const x = oculto ? 0 : rel * anchoVideo * separacion + (alzado ? signo * 14 : 0)
              const y = oculto ? 0 : lado * 10 * factor + (alzado ? -10 : 0)
              const z = oculto ? -800 * factor : (-lado * 150 + (alzado ? 120 : 0)) * factor
              const giro = oculto ? 0 : -signo * Math.min(40, 22 + lado * 8) * (alzado ? 0.45 : 1)
              const escala = oculto ? 0.8 : Math.max(0.6, 1 - lado * 0.08) + (alzado ? 0.05 : 0)

              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    if (Date.now() - huboArrastre.current < 300) return
                    setI(n)
                  }}
                  onMouseEnter={() => setResaltado(n)}
                  onMouseLeave={() => setResaltado(null)}
                  onFocus={() => setResaltado(n)}
                  onBlur={() => setResaltado(null)}
                  aria-label={`Ver ${e.titulo}`}
                  aria-current={activo}
                  style={{
                    zIndex: oculto ? 0 : 40 - lado * 8 + (alzado ? 5 : 0),
                    opacity: oculto ? 0 : alzado ? 1 : Math.max(0.38, 1 - lado * 0.16),
                    visibility: oculto ? 'hidden' : 'visible',
                    transform: `translate3d(${x}px, ${y}px, ${z}px) rotateY(${giro}deg) scale(${escala})`,
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
                    src={video(e.id)}
                    poster={portada(e.id)}
                    muted={silenciado}
                    playsInline
                    preload="none"
                    aria-hidden={!activo}
                    onEnded={() => ir(n + 1)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
                </button>
              )
            })}
          </div>

          {/* El dato del video va fuera de la tarjeta: dentro taparía los subtítulos que trae el propio video. */}
          <div className="mt-7 text-center">
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-panel-2 border border-line text-muted uppercase">
              {EJEMPLOS[i].estilo}
            </span>
            <p className="text-lg font-bold text-text font-heading mt-2.5">{EJEMPLOS[i].titulo}</p>
            <p className="text-[11px] text-muted font-mono mt-1">MP4 1080×1920 · {EJEMPLOS[i].duracion} · sin edición</p>
          </div>

          <div className="flex items-center justify-center gap-5 mt-6">
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
                  key={e.id}
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

            <button
              type="button"
              onClick={() => setSilenciado((s) => !s)}
              aria-label={silenciado ? 'Activar audio' : 'Silenciar'}
              className="p-2.5 rounded-full border border-line bg-panel text-muted hover:text-text hover:border-accent/40 transition-all"
            >
              {silenciado ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
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
