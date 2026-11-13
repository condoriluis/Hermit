import { useEffect, useState } from 'react'
import type { Archivo, Card, SessionMeta } from '../../shared/types'
import { api } from './api'
import './Final.css'

/**
 * La entrega de una pieza que no es video (una presentación, una imagen): lo que se hace con ella terminada, arriba de
 * su fase Entrega del estudio — bajarla, verla en su carpeta y pedirle un cambio de un clic, igual que con un video
 * (`Final.tsx`). Los cambios le llegan al agente como si los escribieras, y no se pueden pedir mientras trabaja.
 */

interface Boton { texto: string; descarga: boolean; principal?: boolean }
interface Config {
  /** Por extensión de archivo: qué botón le toca (las que no están, no se entregan). */
  botones: Record<string, Boton>
  cambios: { texto: string; pide: string }[]
  /** Cómo se pide el cierre del cambio, al final del texto que le llega al agente. */
  cierre: string
  titulo: (n: number) => string
}

const CAMBIOS_PRESENTACION: Config['cambios'] = [
  { texto: 'Hazla más corta', pide: 'Hazla más corta: quita las diapositivas que sobren y deja lo esencial, sin perder el mensaje ni el cierre.' },
  { texto: 'Más visual', pide: 'Hazla más visual: más imágenes y menos texto por diapositiva, con el mismo contenido.' },
  { texto: 'Cambia el estilo', pide: 'Cambia el estilo visual: otros colores, tipografía y distribución, manteniendo el contenido y las imágenes que sirvan.' },
  { texto: 'Reescribe el guion', pide: 'Reescribe el guion: mismo tema, mejor estructura y textos más claros y contundentes.' }
]

const CAMBIOS_IMAGEN: Config['cambios'] = [
  { texto: 'Genera otra', pide: 'Genera otra imagen con el mismo encargo, con una composición o estilo distinto.' },
  { texto: 'Cambia el estilo', pide: 'Cambia el estilo visual de la imagen, manteniendo el tema y el encargo.' }
]

const CAMBIOS_ARTICULO: Config['cambios'] = [
  { texto: 'Reescribe el artículo', pide: 'Reescribe el artículo: mejor estructura y textos más claros y contundentes, sin perder el tema ni las fuentes.' },
  { texto: 'Cambia el tono', pide: 'Cambia el tono del artículo (más cercano, más técnico o más divulgativo), manteniendo los datos y las fuentes.' },
  { texto: 'Mejor el SEO', pide: 'Mejora el SEO del artículo: título, extracto, subtítulos y palabras clave, sin perder el contenido.' }
]

const BOTONES_PRESENTACION: Record<string, Boton> = {
  '.pptx': { texto: 'Descargar PowerPoint', descarga: true, principal: true },
  '.pdf': { texto: 'Descargar PDF', descarga: true },
  '.html': { texto: 'Ver la vista previa', descarga: false }
}

const BOTONES_IMAGEN: Record<string, Boton> = {
  '.png': { texto: 'Descargar imagen', descarga: true },
  '.jpg': { texto: 'Descargar imagen', descarga: true },
  '.jpeg': { texto: 'Descargar imagen', descarga: true },
  '.webp': { texto: 'Descargar imagen', descarga: true }
}

const BOTONES_ARTICULO: Record<string, Boton> = {
  '.html': { texto: 'Ver la vista previa', descarga: false }
}

/** No pisa la actual: el servidor pasa el hilo a una carpeta nueva y se lo dice al agente (`otraVersion` en etapas.ts). */
const VERSION = 'Haz otra versión'

const CONFIG: Record<string, Config> = {
  presentacion: {
    botones: BOTONES_PRESENTACION,
    cambios: CAMBIOS_PRESENTACION,
    cierre: 'Cuando acabes, vuelve a exportar la presentación.',
    titulo: () => 'Presentación lista'
  },
  imagen: {
    botones: BOTONES_IMAGEN,
    cambios: CAMBIOS_IMAGEN,
    cierre: 'Cuando acabes, deja las imágenes nuevas en la carpeta.',
    titulo: (n) => (n > 1 ? 'Imágenes listas' : 'Imagen lista')
  },
  articulo: {
    botones: BOTONES_ARTICULO,
    cambios: CAMBIOS_ARTICULO,
    cierre: 'Cuando acabes, vuelve a publicar el artículo.',
    titulo: () => 'Artículo listo'
  }
}

const ext = (ruta: string) => ruta.slice(ruta.lastIndexOf('.')).toLowerCase()

export function EntregaPieza({ session, card, carpeta, archivos }: { session: SessionMeta; card: Card; carpeta: string; archivos: Archivo[] }) {
  const cfg = CONFIG[card.produce ?? ''] ?? CONFIG.presentacion
  const [pedido, setPedido] = useState('')
  const [error, setError] = useState('')
  // La dirección pública del artículo, de su `publicado.json` (la API del blog de Opciones → Artículos + el slug).
  const [publicado, setPublicado] = useState<string>()
  const trabaja = session.running || !!session.background?.length || !!session.pendiente
  useEffect(() => {
    if (card.produce !== 'articulo') return
    api<{ url?: string }>(`/api/sessions/${session.id}/archivo?ruta=${encodeURIComponent('publicado.json')}`)
      .then((p) => setPublicado(p.url))
      .catch(() => {})
  }, [card.produce, session.id])
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
  const mandar = (c: (typeof cfg.cambios)[number]) => pedir(c.texto, () => api(`/api/sessions/${session.id}/send`, { text: `${c.pide} ${cfg.cierre}` }))
  const src = (a: Archivo) => `/api/sessions/${session.id}/archivo?ruta=${encodeURIComponent(a.ruta)}&t=${Math.round(a.t)}`
  const descargar = (a: Archivo) => `${src(a)}&descarga=${encodeURIComponent(a.ruta.split('/').pop() ?? a.ruta)}`
  const abrir = (ruta: string, esArchivo = false) => api('/api/open', { path: ruta, abrir: esArchivo }).catch((e) => setError(e.message))

  // Los archivos que se entregan: los que tienen botón, el principal (si lo hay) primero y luego por nombre.
  const entregas = archivos
    .filter((a) => cfg.botones[ext(a.ruta)])
    .sort((a, b) => Number(!!cfg.botones[ext(b.ruta)].principal) - Number(!!cfg.botones[ext(a.ruta)].principal) || a.ruta.localeCompare(b.ruta))
  if (!entregas.length) return null
  // Con una sola imagen (o un solo formato), esa es la principal.
  const principal = entregas.findIndex((a) => cfg.botones[ext(a.ruta)].principal)

  return (
    <section className="final">
      <div className="final-titulo">{cfg.titulo(entregas.length)}</div>
      <div className="final-fila">
        {entregas.map((a, i) => {
          const b = cfg.botones[ext(a.ruta)]
          const nombre = a.ruta.split('/').pop() ?? a.ruta
          const esPrincipal = b.principal || (principal === -1 && i === 0)
          return b.descarga ? (
            <a key={a.ruta} className={`final-boton ${esPrincipal ? 'principal' : ''}`} href={descargar(a)} download={nombre} title={`Bajarlo como «${nombre}»`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" />
              </svg>
              {b.texto}
            </a>
          ) : ext(a.ruta) === '.html' ? (
            // La vista previa se abre como archivo, con la app del sistema: un enlace a `/api/…` es localhost y la
            // seguridad de Hermit lo bloquea fuera de su ventana.
            <button key={a.ruta} className={`final-boton ${esPrincipal ? 'principal' : ''}`} onClick={() => abrir(`${carpeta}/${a.ruta}`, true)} title="Abrirla en el navegador">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 4h6v6M20 4 10 14M9 5H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-4" />
              </svg>
              {b.texto}
            </button>
          ) : (
            <a key={a.ruta} className="final-boton" href={src(a)} target="_blank" rel="noreferrer" title="Abrirla en una pestaña nueva">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 4h6v6M20 4 10 14M9 5H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1v-4" />
              </svg>
              {b.texto}
            </a>
          )
        })}
        {card.produce === 'articulo' && publicado && (
          <a className="final-boton principal" href={publicado} target="_blank" rel="noreferrer" title="Abrir el artículo en tu blog">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
            </svg>
            Ver en producción ↗
          </a>
        )}
        <button className="final-boton" title={carpeta} onClick={() => abrir(carpeta)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          Ver en la carpeta
        </button>
      </div>
      <div className="final-cambios">
        <span className="muted small">¿Algún cambio?</span>
        {cfg.cambios.map((c) => (
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
