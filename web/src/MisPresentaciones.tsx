import { useState } from 'react'
import { deTipo, type Card, type PresentacionHecha, type SessionMeta } from '../../shared/types'
import { api } from './api'
import { Confirm } from './Confirm'
import { Icono } from './Iconos'
import { Galeria, Rejilla, usePiezas } from './Piezas'

/**
 * «Mis presentaciones»: las terminadas de las cards que las hacen, de la más nueva a la más vieja. Cada tarjeta es su
 * portada, su título y su fecha; un clic abre su hilo con el guion en el monitor. Su ✕ manda la carpeta entera
 * (guion, imágenes y los `.pptx`/`.pdf` exportados) a la Papelera.
 */

/** La fecha de una presentación: el día y el mes, con el año solo si no es el de ahora. */
const fecha = (t: number) => {
  const d = new Date(t)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) })
}

export function MisPresentaciones({ cards, sessions }: { cards: Card[]; sessions: SessionMeta[] }) {
  const { datos, error } = usePiezas(cards, sessions)
  const [viendo, setViendo] = useState<string | null>(null)
  const presentaciones = datos ? deTipo(datos.piezas, 'presentacion') : []

  return (
    <Galeria
      titulo="Mis presentaciones"
      cuenta={datos ? `${presentaciones.length === 1 ? '1 presentación' : `${presentaciones.length} presentaciones`}, de la más nueva a la más vieja.` : !error && 'Buscando las presentaciones terminadas…'}
    >
      {error && <p className="bad small">{error}</p>}
      {!datos ? null : presentaciones.length ? (
        <Rejilla clase="presentaciones" items={presentaciones}>{(p) => <PresentacionDe key={p.ruta} presentacion={p} onVer={setViendo} />}</Rejilla>
      ) : (
        <p className="estilo-vacio">Aún no hay presentaciones. Cada una sale aquí en cuanto su skill la termina.</p>
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
 * Una presentación terminada: su portada 16:9 (o su icono, si aún no tiene), su título y su fecha. Un clic abre su hilo
 * con el guion en el monitor; si es de una carpeta de fuera, sin hilo, enseña su portada en grande (`onVer`).
 */
function PresentacionDe({ presentacion, onVer }: { presentacion: PresentacionHecha; onVer(src: string): void }) {
  const [borrar, setBorrar] = useState(false)
  const portada = presentacion.portada ? `/api/piezas/archivo?ruta=${encodeURIComponent(presentacion.portada)}&t=${Math.round(presentacion.t)}` : undefined
  const abrir = () => {
    if (presentacion.sessionId) location.hash = `/s/${presentacion.sessionId}/${encodeURIComponent(presentacion.archivo)}`
    else if (portada) onVer(portada)
  }
  return (
    <div className="pieza-card">
      <button className="pieza-borrar" title="Borrar esta presentación" onClick={() => setBorrar(true)}>
        ✕
      </button>
      {borrar && (
        <Confirm
          title={`¿Borrar «${presentacion.titulo}»?`}
          action="Borrar"
          danger
          onClose={() => setBorrar(false)}
          onConfirm={async () => {
            await api('/api/piezas/borrar', { ruta: presentacion.ruta })
            dispatchEvent(new Event('hermit-videos'))
          }}
        >
          Su carpeta entera (el guion, las imágenes y los archivos exportados) va a la Papelera de reciclaje, de donde
          puedes recuperarla.
        </Confirm>
      )}
      <button className="presentacion-tile" title={presentacion.sessionId ? 'Abrir su hilo' : 'Verla'} onClick={abrir}>
        <span className="presentacion-marco">{portada ? <img src={portada} alt="" loading="lazy" /> : <Icono de="diapositivas" />}</span>
        <span className="pieza-titulo">{presentacion.titulo}</span>
        <span className="pieza-dato">{fecha(presentacion.t)}</span>
      </button>
    </div>
  )
}
