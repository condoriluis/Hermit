import { useState } from 'react'
import { deTipo, type Card, type ImagenHecha, type SessionMeta } from '../../shared/types'
import { api } from './api'
import { Confirm } from './Confirm'
import { Icono } from './Iconos'
import { Galeria, Rejilla, usePiezas } from './Piezas'

/**
 * «Mis imágenes»: las imágenes terminadas de las skills que generan imágenes, del más nuevo al más viejo. Cada tarjeta es
 * su imagen; un clic abre su hilo con ella en el monitor. Su ✕ la manda a la Papelera. Se filtran por forma (vertical,
 * horizontal o cuadrada), como en «Mis videos». Las llena la card «Imágenes con IA» (skill `imagenes`); sin ninguna
 * hecha todavía, la galería se ve vacía.
 */
type Forma = 'todas' | 'vertical' | 'horizontal'
/** La orientación de una imagen por su tamaño: vertical, horizontal o cuadrada (queda con las verticales). */
const orientacion = (w: number, h: number): 'vertical' | 'horizontal' | 'cuadrada' => (h > w * 1.02 ? 'vertical' : w > h * 1.02 ? 'horizontal' : 'cuadrada')

export function MisImagenes({ cards, sessions }: { cards: Card[]; sessions: SessionMeta[] }) {
  const { datos, error } = usePiezas(cards, sessions)
  const [viendo, setViendo] = useState<string | null>(null)
  const [forma, setForma] = useState<Forma>('todas')
  // La orientación de cada imagen, cuando su tarjeta la midió al cargarla.
  const [orientadas, setOrientadas] = useState<Record<string, 'vertical' | 'horizontal' | 'cuadrada'>>({})
  const imagenes = datos ? deTipo(datos.piezas, 'imagen') : []
  // Sin medir todavía se enseña en cualquier filtro: al medirla, se coloca sola.
  const enForma = imagenes.filter((i) => {
    const o = orientadas[i.ruta]
    if (!o || forma === 'todas') return true
    return forma === 'horizontal' ? o === 'horizontal' : o !== 'horizontal'
  })

  return (
    <Galeria
      titulo="Mis imágenes"
      cuenta={datos ? `${imagenes.length === 1 ? '1 imagen' : `${imagenes.length} imágenes`}, de la más nueva a la más vieja.` : !error && 'Buscando las imágenes terminadas…'}
      acciones={
        imagenes.length > 0 && (
          <div className="mis-formas" role="group" aria-label="Forma de la imagen">
            <button className={`todas${forma === 'todas' ? ' on' : ''}`} aria-pressed={forma === 'todas'} title="Todas las formas" onClick={() => setForma('todas')}>
              Todas
            </button>
            {(
              [
                ['vertical', 'Verticales', 'vertical', 'De pie, como un TikTok'],
                ['horizontal', 'Horizontales', 'horizontal', 'Apaisadas, como YouTube']
              ] as const
            ).map(([f, nombre, icono, donde]) => (
              <button key={f} className={forma === f ? 'on' : ''} aria-pressed={forma === f} title={`${nombre} · ${donde}`} onClick={() => setForma(f)}>
                <Icono de={icono} />
              </button>
            ))}
          </div>
        )
      }
    >
      {error && <p className="bad small">{error}</p>}
      {!datos ? null : enForma.length ? (
        <Rejilla key={forma} items={enForma}>
          {(i) => (
            <ImagenDe
              key={i.ruta}
              imagen={i}
              orientacion={orientadas[i.ruta]}
              onMedir={(o) => setOrientadas((t) => (t[i.ruta] === o ? t : { ...t, [i.ruta]: o }))}
              onVer={setViendo}
            />
          )}
        </Rejilla>
      ) : (
        <p className="estilo-vacio">{imagenes.length ? 'Aún no hay imágenes de esa forma.' : 'Aún no hay imágenes. Cada una sale aquí en cuanto su skill la genera.'}</p>
      )}
      {viendo && (
        <div className="lightbox" onClick={() => setViendo(null)}>
          <img src={viendo} alt="" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </Galeria>
  )
}

/**
 * Una imagen terminada: la imagen, su título y su archivo, con su forma (vertical, horizontal o cuadrada) dibujada y
 * escrita encima. Un clic abre su hilo con ella en el monitor; si es de una carpeta de fuera, sin hilo, la enseña en
 * grande (`onVer`). `onMedir` le dice a la galería su orientación.
 */
function ImagenDe({ imagen, orientacion: orientada, onMedir, onVer }: { imagen: ImagenHecha; orientacion?: 'vertical' | 'horizontal' | 'cuadrada'; onMedir(o: 'vertical' | 'horizontal' | 'cuadrada'): void; onVer(src: string): void }) {
  const [borrar, setBorrar] = useState(false)
  // La proporción real de la imagen, para que su marco la abrace como el de un video (sin bandas).
  const [tam, setTam] = useState<{ w: number; h: number }>()
  const src = `/api/piezas/archivo?ruta=${encodeURIComponent(imagen.ruta)}&t=${Math.round(imagen.t)}`
  const abrir = () => (imagen.sessionId ? (location.hash = `/s/${imagen.sessionId}/${encodeURIComponent(imagen.archivo)}`) : onVer(src))
  return (
    <div className="pieza-card">
      <button className="pieza-borrar" title="Borrar esta imagen" onClick={() => setBorrar(true)}>
        ✕
      </button>
      {borrar && (
        <Confirm
          title={`¿Borrar «${imagen.titulo}»?`}
          action="Borrar"
          danger
          onClose={() => setBorrar(false)}
          onConfirm={async () => {
            await api('/api/piezas/borrar', { ruta: imagen.ruta })
            dispatchEvent(new Event('hermit-videos'))
          }}
        >
          La imagen va a la Papelera de reciclaje, de donde puedes recuperarla. Lo demás de su carpeta se queda.
        </Confirm>
      )}
      <button className="imagen-tile" style={tam ? ({ '--img-ratio': tam.w / tam.h } as React.CSSProperties) : undefined} title={imagen.sessionId ? 'Abrir su hilo' : 'Verla'} onClick={abrir}>
        <span className="imagen-marco">
          <img
            src={src}
            alt=""
            loading="lazy"
            onLoad={(e) => {
              const i = e.currentTarget
              if (!i.naturalWidth || !i.naturalHeight) return
              setTam({ w: i.naturalWidth, h: i.naturalHeight })
              onMedir(orientacion(i.naturalWidth, i.naturalHeight))
            }}
          />
          {orientada && <span className="video-forma">{orientada === 'cuadrada' ? 'Cuadrada' : orientada === 'vertical' ? 'Vertical' : 'Horizontal'}</span>}
        </span>
        <span className="pieza-titulo">{imagen.titulo}</span>
        <span className="pieza-dato">{imagen.archivo.split('/').pop()}</span>
      </button>
    </div>
  )
}
