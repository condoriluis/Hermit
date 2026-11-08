import { useState } from 'react'
import { deTipo, type ArticuloHecho, type Card, type SessionMeta } from '../../shared/types'
import { api } from './api'
import { Confirm } from './Confirm'
import { Icono } from './Iconos'
import { Galeria, Rejilla, usePiezas } from './Piezas'

/**
 * «Mis artículos»: los artículos terminados de las skills que escriben artículos, del más nuevo al más viejo. Cada tarjeta
 * es su portada, su título y su fecha; un clic abre su hilo con el artículo en el monitor. Su ✕ manda la carpeta entera
 * (el artículo, su portada y lo publicado) a la Papelera.
 */

/** La fecha de un artículo: el día y el mes, con el año solo si no es el de ahora. */
const fecha = (t: number) => {
  const d = new Date(t)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) })
}

export function MisArticulos({ cards, sessions }: { cards: Card[]; sessions: SessionMeta[] }) {
  const { datos, error } = usePiezas(cards, sessions)
  const [viendo, setViendo] = useState<string | null>(null)
  const articulos = datos ? deTipo(datos.piezas, 'articulo') : []

  return (
    <Galeria
      titulo="Mis artículos"
      cuenta={datos ? `${articulos.length === 1 ? '1 artículo' : `${articulos.length} artículos`}, del más nuevo al más viejo.` : !error && 'Buscando los artículos terminados…'}
    >
      {error && <p className="bad small">{error}</p>}
      {!datos ? null : articulos.length ? (
        <Rejilla items={articulos}>{(a) => <ArticuloDe key={a.ruta} articulo={a} onVer={setViendo} />}</Rejilla>
      ) : (
        <p className="estilo-vacio">Aún no hay artículos. Cada uno sale aquí en cuanto su skill lo termina.</p>
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
 * Un artículo terminado: su portada 16:9 (o su icono, si aún no tiene), su título y su fecha. Un clic abre su hilo con el
 * artículo en el monitor; si es de una carpeta de fuera, sin hilo, enseña su portada en grande (`onVer`).
 */
function ArticuloDe({ articulo, onVer }: { articulo: ArticuloHecho; onVer(src: string): void }) {
  const [borrar, setBorrar] = useState(false)
  const portada = articulo.portada ? `/api/piezas/archivo?ruta=${encodeURIComponent(articulo.portada)}&t=${Math.round(articulo.t)}` : undefined
  const abrir = () => {
    if (articulo.sessionId) location.hash = `/s/${articulo.sessionId}/${encodeURIComponent(articulo.archivo)}`
    else if (portada) onVer(portada)
  }
  return (
    <div className="pieza-card">
      <button className="pieza-borrar" title="Borrar este artículo" onClick={() => setBorrar(true)}>
        ✕
      </button>
      {borrar && (
        <Confirm
          title={`¿Borrar «${articulo.titulo}»?`}
          action="Borrar"
          danger
          onClose={() => setBorrar(false)}
          onConfirm={async () => {
            await api('/api/piezas/borrar', { ruta: articulo.ruta })
            dispatchEvent(new Event('hermit-videos'))
          }}
        >
          Su carpeta entera (el artículo, su portada y lo publicado) va a la Papelera de reciclaje, de donde puedes
          recuperarla. Lo que ya está publicado en tu blog sigue igual.
        </Confirm>
      )}
      <button className="articulo-tile" title={articulo.sessionId ? 'Abrir su hilo' : 'Verlo'} onClick={abrir}>
        <span className="articulo-marco">{portada ? <img src={portada} alt="" loading="lazy" /> : <Icono de="lapiz" />}</span>
        <span className="pieza-titulo">{articulo.titulo}</span>
        <span className="pieza-dato">{fecha(articulo.t)}</span>
      </button>
    </div>
  )
}
