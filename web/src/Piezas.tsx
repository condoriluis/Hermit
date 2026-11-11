import { type ReactNode, useEffect, useRef, useState } from 'react'
import type { Card, PiezasDeTodos, SessionMeta } from '../../shared/types'
import { api } from './api'
import { useDesplazando } from './desplazando'
import './Piezas.css'

/**
 * Lo que comparten las tres galerías («Mis videos», «Mis imágenes», «Mis artículos»): piden todas las piezas terminadas
 * en una sola petición (`GET /api/piezas`) y cada una enseña las de su tipo con `deTipo`. La rejilla y la página se
 * dibujan igual; lo de dentro de cada galería es lo suyo.
 */

/** Cuántas tarjetas se dibujan de una vez. Al acercarse al final, otras tantas. */
const TANDA = 30

/**
 * Las piezas terminadas de todas las cards, del más nuevo al más viejo, con las marcas de redes de los videos. Se vuelve
 * a pedir cuando un hilo empieza o acaba un turno, cuando cambia un archivo de su carpeta (el servidor lo avisa con
 * `etapas`, el mismo aviso del panel de etapas) y cuando cambia algo en redes: lo que llega junto (una acción de redes y
 * su aviso por el WebSocket) se pide una sola vez. `datos` es `null` mientras se mira.
 */
export function usePiezas(cards: Card[], sessions: SessionMeta[]) {
  const [datos, setDatos] = useState<PiezasDeTodos | null>(null)
  const [error, setError] = useState('')
  const [vuelta, setVuelta] = useState(0)
  const otraVuelta = () => setVuelta((n) => n + 1)
  useEffect(() => {
    addEventListener('hermit-redes', otraVuelta)
    addEventListener('hermit-videos', otraVuelta)
    addEventListener('hermit-etapas', otraVuelta)
    return () => {
      removeEventListener('hermit-redes', otraVuelta)
      removeEventListener('hermit-videos', otraVuelta)
      removeEventListener('hermit-etapas', otraVuelta)
    }
  }, [])
  // Lo que cambia lo que hay que mirar: qué cards producen, y cuándo se movió cada hilo de una de ellas.
  const productoras = cards.filter((c) => c.produce).map((c) => c.id)
  const clave = productoras.join() + '|' + sessions.flatMap((s) => (productoras.includes(s.cardId) ? [s.id + s.updatedAt] : [])).join()
  useEffect(() => {
    let vivo = true
    const t = setTimeout(
      () => api<PiezasDeTodos>('/api/piezas').then((r) => vivo && (setDatos(r), setError('')), (e) => vivo && setError(e.message)),
      datos ? 300 : 0
    )
    return () => {
      vivo = false
      clearTimeout(t)
    }
  }, [clave, vuelta])
  return { datos, error, otraVuelta }
}

/**
 * La página de una galería: su título, su cuenta y sus acciones, sobre la rejilla. `cuenta` es el resumen («12 videos
 * terminados…») y `acciones` van a la derecha del título.
 */
export function Galeria({ titulo, cuenta, acciones, children }: { titulo: string; cuenta: ReactNode; acciones?: ReactNode; children: ReactNode }) {
  return (
    <div className="galeria">
      <header className="galeria-head">
        <div>
          <h1>{titulo}</h1>
          <p className="muted">{cuenta}</p>
        </div>
        {acciones && <div className="galeria-acciones">{acciones}</div>}
      </header>
      {children}
    </div>
  )
}

/**
 * Las tarjetas, por tandas: la primera al abrir y otra cada vez que el final se acerca a la vista. Cada pieza que se
 * dibuja pide su primer cuadro en pequeño; las de más abajo no piden nada hasta que bajas. Mientras se desplaza, no
 * responden al ratón (`useDesplazando`): las que pasan bajo el cursor no empiezan a bajarse.
 */
export function Rejilla<T>({ items, children, clase }: { items: T[]; children(item: T): ReactNode; clase?: string }) {
  const [hasta, setHasta] = useState(TANDA)
  const rejilla = useRef<HTMLDivElement>(null)
  const fin = useRef<HTMLDivElement>(null)
  const quedan = items.length > hasta
  useDesplazando(rejilla)
  // Se vuelve a mirar tras cada tanda: si el final sigue cerca (una pantalla alta), entra otra.
  useEffect(() => {
    if (!quedan || !fin.current) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setHasta((n) => n + TANDA), { root: rejilla.current, rootMargin: '0px 0px 600px' })
    io.observe(fin.current)
    return () => io.disconnect()
  }, [quedan, hasta])
  return (
    <div className={clase ?? 'videos'} ref={rejilla}>
      {items.slice(0, hasta).map((item) => children(item))}
      {quedan && <div className="galeria-fin" ref={fin} />}
    </div>
  )
}
