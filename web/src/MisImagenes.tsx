import { useState } from 'react'
import { deTipo, type Card, type ImagenHecha, type SessionMeta } from '../../shared/types'
import { api } from './api'
import { Confirm } from './Confirm'
import { Galeria, Rejilla, usePiezas } from './Piezas'

/**
 * «Mis imágenes»: las imágenes terminadas de las skills que generan imágenes, del más nuevo al más viejo. Cada tarjeta es
 * su imagen; un clic abre su hilo con ella en el monitor. Su ✕ la manda a la Papelera. Las llena la card «Imágenes con IA»
 * (skill `imagenes`); sin ninguna hecha todavía, la galería se ve vacía.
 */
export function MisImagenes({ cards, sessions }: { cards: Card[]; sessions: SessionMeta[] }) {
  const { datos, error } = usePiezas(cards, sessions)
  const [viendo, setViendo] = useState<string | null>(null)
  const imagenes = datos ? deTipo(datos.piezas, 'imagen') : []

  return (
    <Galeria
      titulo="Mis imágenes"
      cuenta={datos ? `${imagenes.length === 1 ? '1 imagen' : `${imagenes.length} imágenes`}, de la más nueva a la más vieja.` : !error && 'Buscando las imágenes terminadas…'}
    >
      {error && <p className="bad small">{error}</p>}
      {!datos ? null : imagenes.length ? (
        <Rejilla items={imagenes}>{(i) => <ImagenDe key={i.ruta} imagen={i} onVer={setViendo} />}</Rejilla>
      ) : (
        <p className="estilo-vacio">Aún no hay imágenes. Cada una sale aquí en cuanto su skill la genera.</p>
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
 * Una imagen terminada: la imagen, su título y su archivo. Un clic abre su hilo con ella en el monitor; si es de una
 * carpeta de fuera, sin hilo, la enseña en grande (`onVer`).
 */
function ImagenDe({ imagen, onVer }: { imagen: ImagenHecha; onVer(src: string): void }) {
  const [borrar, setBorrar] = useState(false)
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
      <button className="imagen-tile" title={imagen.sessionId ? 'Abrir su hilo' : 'Verla'} onClick={abrir}>
        <span className="imagen-marco">
          <img src={src} alt="" loading="lazy" />
        </span>
        <span className="pieza-titulo">{imagen.titulo}</span>
        <span className="pieza-dato">{imagen.archivo.split('/').pop()}</span>
      </button>
    </div>
  )
}
