import { useEffect, useState } from 'react'
import type { Archivo, Card, SessionMeta } from '../../shared/types'
import { api } from './api'
import './Final.css'

/**
 * La entrega de una pieza que no es video (una presentación): lo que se hace con ella terminada, arriba de su fase
 * Entrega del estudio — bajarla, verla en su carpeta y pedirle un cambio de un clic, igual que con un video
 * (`Final.tsx`). Los cambios le llegan al agente como si los escribieras, y no se pueden pedir mientras trabaja.
 */

/** Lo que pide cada cambio de un clic, pensado para una presentación. */
const CAMBIOS: { texto: string; pide: string }[] = [
  { texto: 'Hazla más corta', pide: 'Hazla más corta: quita las diapositivas que sobren y deja lo esencial, sin perder el mensaje ni el cierre.' },
  { texto: 'Más visual', pide: 'Hazla más visual: más imágenes y menos texto por diapositiva, con el mismo contenido.' },
  { texto: 'Cambia el estilo', pide: 'Cambia el estilo visual: otros colores, tipografía y distribución, manteniendo el contenido y las imágenes que sirvan.' },
  { texto: 'Reescribe el guion', pide: 'Reescribe el guion: mismo tema, mejor estructura y textos más claros y contundentes.' }
]
/** No pisa la actual: el servidor pasa el hilo a una carpeta nueva y se lo dice al agente (`otraVersion` en etapas.ts). */
const VERSION = 'Haz otra versión'

/** El botón de cada archivo que se puede bajar, por su extensión. */
const BOTONES: Record<string, { texto: string; descarga: boolean; principal?: boolean }> = {
  '.pptx': { texto: 'Descargar PowerPoint', descarga: true, principal: true },
  '.pdf': { texto: 'Descargar PDF', descarga: true },
  '.html': { texto: 'Ver la vista previa', descarga: false }
}

const ext = (ruta: string) => ruta.slice(ruta.lastIndexOf('.')).toLowerCase()

export function EntregaPieza({ session, card, carpeta, archivos }: { session: SessionMeta; card: Card; carpeta: string; archivos: Archivo[] }) {
  const [pedido, setPedido] = useState('')
  const [error, setError] = useState('')
  const trabaja = session.running || !!session.background?.length || !!session.pendiente
  // El pedido se queda marcado hasta que el agente se pone a trabajar en él.
  useEffect(() => {
    if (trabaja) setPedido('')
  }, [trabaja])

  async function pedir(texto: string, hacer: () => Promise<unknown>) {
    setPedido(texto)
    setError('')
    try {
      await hacer()
    } catch (e) {
      setPedido('')
      setError(e instanceof Error ? e.message : String(e))
    }
  }
  const mandar = (c: (typeof CAMBIOS)[number]) =>
    pedir(c.texto, () => api(`/api/sessions/${session.id}/send`, { text: `${c.pide} Cuando acabes, vuelve a exportar la presentación.` }))
  const src = (a: Archivo) => `/api/sessions/${session.id}/archivo?ruta=${encodeURIComponent(a.ruta)}&t=${Math.round(a.t)}`
  const descargar = (a: Archivo) => `${src(a)}&descarga=${encodeURIComponent(a.ruta.split('/').pop() ?? a.ruta)}`
  const abrir = (ruta: string) => api('/api/open', { path: ruta }).catch((e) => setError(e.message))

  // Los archivos que se entregan: el PowerPoint y el PDF para bajar, la vista previa para abrir.
  const entregas = archivos
    .filter((a) => BOTONES[ext(a.ruta)])
    .sort((a, b) => Number(!!BOTONES[ext(b.ruta)].principal) - Number(!!BOTONES[ext(a.ruta)].principal) || a.ruta.localeCompare(b.ruta))
  if (!entregas.length) return null
  const titulo = card.produce === 'presentacion' ? 'Presentación lista' : 'Pieza lista'

  return (
    <section className="final">
      <div className="final-titulo">{titulo}</div>
      <div className="final-fila">
        {entregas.map((a) => {
          const b = BOTONES[ext(a.ruta)]
          const nombre = a.ruta.split('/').pop() ?? a.ruta
          return b.descarga ? (
            <a key={a.ruta} className={`final-boton ${b.principal ? 'principal' : ''}`} href={descargar(a)} download={nombre} title={`Bajarlo como «${nombre}»`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" />
              </svg>
              {b.texto}
            </a>
          ) : (
            <a key={a.ruta} className="final-boton" href={src(a)} target="_blank" rel="noreferrer" title="Abrirla en una pestaña nueva">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 4h6v6M20 4 10 14M9 5H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-4" />
              </svg>
              {b.texto}
            </a>
          )
        })}
        <button className="final-boton" title={carpeta} onClick={() => abrir(carpeta)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          Ver en la carpeta
        </button>
      </div>
      <div className="final-cambios">
        <span className="muted small">¿Algún cambio?</span>
        {CAMBIOS.map((c) => (
          <button key={c.texto} className={pedido === c.texto ? 'on' : ''} disabled={trabaja || !!pedido} onClick={() => mandar(c)}>
            {c.texto}
          </button>
        ))}
        <button
          className={pedido === VERSION ? 'on' : ''}
          disabled={trabaja || !!pedido}
          title="La hace en una carpeta nueva junto a esta: la versión de ahora se queda como está"
          onClick={() => pedir(VERSION, () => api(`/api/sessions/${session.id}/version`, {}))}
        >
          {VERSION}
        </button>
        {trabaja && <span className="muted small">El agente está trabajando: cuando termine, puedes pedir otro.</span>}
      </div>
      {error && <span className="bad small">{error}</span>}
    </section>
  )
}
