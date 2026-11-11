import { Fragment, type ReactNode, useLayoutEffect, useRef, useState, useEffect, useCallback } from 'react'
import { esDeEstudio } from '../../shared/etapas'
import { FASES, type AgentEvent, type Card, type Fase, type SessionMeta } from '../../shared/types'
import { Editor } from './Editor'
import { useEscritos, useEventos } from './eventos'
import { CarpetaDelHilo, EtapaCuerpo, useAvance, usePasos, type Pasos } from './Etapas'
import { Final } from './Final'
import { EntregaPieza } from './EntregaPieza'
import { Icono } from './Iconos'
import type { PropsDeVideo } from './Monitor'
import { abrirNavegador, PanelNavegador, useNavegadorAbierto } from './Navegador' // navegador de cada hilo
import './Estudio.css'

/**
 * El estudio de video: el mismo marco para todo hilo de un estilo de video, sea cual sea su skill. Arriba las cinco
 * fases (`FASES`), siempre las mismas y en su orden; al centro la elegida, que por defecto es la del agente y va
 * cambiando con él; abajo, en todas las fases, la línea de tiempo; a la derecha, siempre, el chat.
 * Un estilo nuevo no toca nada de aquí: su card dice en qué fase va cada etapa, y el resto sale de sus archivos. La fase
 * Video es la misma para todos (`Editor.tsx`): el video en vivo, sin renderizar, que arma el motor de Hermit, y la línea de
 * tiempo debajo, con sus escenas. El navegador del hilo, si lo abres, va en el centro.
 */

// Vive en shared/etapas.ts, que también lo usa el servidor.
export { esDeEstudio }

/**
 * Una fase como se ve en la barra: sus etapas (por su índice) y cómo va el conjunto. `falta`: la primera sin hacer.
 * `abierta`: se puede ver. Una sin etapas está apagada, salvo la Entrega de un video terminado, que es donde se baja.
 */
type FaseVista = { id: Fase; nombre: string; etapas: number[]; estado: string; falta?: number; abierta: boolean }

function resumir(p: Pasos, deFase: Fase[], terminado: boolean): FaseVista[] {
  return FASES.map((f) => {
    const etapas = p.etapas.flatMap((_, i) => (deFase[i] === f.id ? [i] : []))
    const abierta = etapas.length > 0 || (f.id === 'entrega' && terminado)
    // Hecha si lo están todas (o se saltaron); si no, como va la primera que falta.
    const falta = etapas.find((i) => p.state(i) !== 'hecha' && p.state(i) !== 'saltada')
    return { id: f.id, nombre: f.nombre, etapas, estado: !abierta ? 'vacia' : falta === undefined ? 'hecha' : p.state(falta), falta, abierta }
  })
}

const SIN_EVENTOS: AgentEvent[] = []

export function Estudio({ session, card, head, chat }: { session: SessionMeta; card: Card; head(extra?: ReactNode): ReactNode; chat(bloqueo?: string): ReactNode }) {
  const events = useEventos(session.id) ?? SIN_EVENTOS
  const escritos = useEscritos(session.id)
  const { avance, error } = useAvance(session.id)
  const p = usePasos(avance, events, escritos, session.running || !!session.background?.length)
  // Mientras la etapa actual espera tu voz o tu grabación y el hilo está quieto, el compositor no deja abrir un turno:
  // la etapa es la salida. Con el agente trabajando sí se puede escribir (le llega en mitad del turno, como en el servidor).
  const trabaja = session.running || !!session.background?.length
  const enEspera = !trabaja && p.current >= 0 && p.espera(p.current) ? p.etapas[p.current] : undefined
  const bloqueo = enEspera
    ? `Falta «${enEspera.nombre}» (${enEspera.listo}): entrégalo en su etapa${/\.wav$/i.test(enEspera.listo) ? ' o pide que lo genere' : ''}; el agente no sigue sin eso.`
    : undefined
  // Todas las etapas de un estilo de video dicen su fase.
  const deFase = p.etapas.map((e) => e.fase ?? 'idea')
  // Los videos terminados: con ellos, la fase Entrega deja bajarlos, guardarlos en otra carpeta y pedir un cambio.
  const finales = avance?.finales ?? []
  // Los archivos de la entrega de una pieza que no es video (una presentación, una imagen): lo que se puede bajar.
  const entrega = card.produce === 'presentacion' || card.produce === 'imagen' ? p.etapas.filter((e) => e.fase === 'entrega').flatMap((e) => e.archivos) : []
  const fases = resumir(p, deFase, finales.length > 0)
  const deVideo = fases.find((f) => f.id === 'video')!.etapas

  // La fase que se ve: la del agente, y cambia con él. Si eliges otra, se queda en esa hasta que vuelves a la suya (o
  // él llega a la que elegiste). Terminado, el video; un hilo sin video, su última fase.
  const delAgente = p.current >= 0 ? deFase[p.current] : undefined
  const porDefecto = delAgente ?? (deVideo.length ? 'video' : (fases.findLast((f) => f.etapas.length)?.id ?? 'idea'))
  const [elegida, setElegida] = useState<Fase | null>(null)
  useEffect(() => {
    if (elegida === porDefecto) setElegida(null)
  }, [porDefecto])
  const vista = elegida && fases.find((f) => f.id === elegida)?.abierta ? elegida : porDefecto
  // El navegador del hilo va en el centro, en lugar de la fase. Elegir una fase lo esconde.
  const navegador = useNavegadorAbierto(session.id)
  const elegir = (f: Fase) => {
    abrirNavegador(session.id, false)
    setElegida(f === porDefecto ? null : f)
  }

  const props: PropsDeVideo | undefined = avance
    ? { sessionId: session.id, card, avance, p, deVideo, visible: vista === 'video' && !navegador, onVer: () => elegir('video') }
    : undefined

  // Ancho y colapsado del panel de chat (como en VS Code)
  const [chatAncho, setChatAncho] = useState(() => {
    try {
      const g = Number(localStorage.getItem('hermit-estudio-chat-ancho'))
      return g >= 260 && g <= 700 ? g : 380
    } catch {
      return 380
    }
  })
  const [chatColapsado, setChatColapsado] = useState(() => {
    try {
      return localStorage.getItem('hermit-estudio-chat-colapsado') === 'true'
    } catch {
      return false
    }
  })

  const arrastrando = useRef(false)
  const inicioX = useRef(0)
  const inicioAncho = useRef(0)

  const empezarArrastre = (e: React.PointerEvent) => {
    e.preventDefault()
    arrastrando.current = true
    inicioX.current = e.clientX
    inicioAncho.current = chatAncho
    document.body.classList.add('arrastrando-panel')

    const mover = (ev: PointerEvent) => {
      if (!arrastrando.current) return
      const delta = inicioX.current - ev.clientX
      const nuevo = Math.max(260, Math.min(window.innerWidth - 300, Math.min(750, inicioAncho.current + delta)))
      setChatAncho(nuevo)
      try {
        localStorage.setItem('hermit-estudio-chat-ancho', String(nuevo))
      } catch {}
    }

    const soltar = () => {
      arrastrando.current = false
      document.body.classList.remove('arrastrando-panel')
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
    }

    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
  }

  const toggleColapsar = useCallback(() => {
    setChatColapsado((c) => {
      const sig = !c
      try {
        localStorage.setItem('hermit-estudio-chat-colapsado', String(sig))
      } catch {}
      return sig
    })
  }, [])

  const columnasGrid = chatColapsado
    ? 'minmax(0, 1fr) 0px'
    : `minmax(0, 1fr) ${chatAncho}px`

  return (
    <div
      className={`session estudio ${chatColapsado ? 'chat-colapsado' : ''}`}
      style={{ gridTemplateColumns: columnasGrid }}
    >
      {head(
        <>
          {avance && <CarpetaDelHilo sessionId={session.id} carpeta={avance.carpeta} />}
          <button
            className={`estudio-toggle-chat ${chatColapsado ? 'on' : ''}`}
            title={chatColapsado ? 'Mostrar chat (Ctrl+Alt+B)' : 'Ocultar chat para pantalla completa'}
            onClick={toggleColapsar}
          >
            <Icono de="panelDerecho" />
          </button>
        </>
      )}
      <BarraDeFases fases={fases} p={p} vista={navegador ? null : vista} delAgente={delAgente} error={error} onElegir={elegir} />
      {navegador ? (
        <PanelNavegador hilo={session.id} trabajando={session.running || !!session.background?.length} />
      ) : !avance ? (
        <div className="estudio-centro estudio-cargando muted">{error ? '' : 'Leyendo el avance…'}</div>
      ) : (
        vista !== 'video' && (
          <FaseCentro
            key={vista}
            sessionId={session.id}
            p={p}
            fase={fases.find((f) => f.id === vista)!}
            siguiendo={!elegida}
            arriba={
              vista === 'entrega' &&
              (card.produce === 'presentacion' || card.produce === 'imagen' ? (
                <EntregaPieza session={session} card={card} carpeta={avance.carpeta} archivos={entrega} />
              ) : (
                <Final session={session} card={card} carpeta={avance.carpeta} finales={finales} />
              ))
            }
          />
        )
      )}
      {!props ? <div className="linea" /> : <Editor {...props} />}
      {!chatColapsado && <div className="estudio-separador-resizer" onPointerDown={empezarArrastre} title="Arrastra para cambiar el ancho del chat" />}
      <div className="estudio-chat" style={{ display: chatColapsado ? 'none' : undefined }}>
        {chat(bloqueo)}
      </div>
    </div>
  )
}

/**
 * Las cinco fases, siempre todas y en su orden. El punto de cada una dice cómo va; mientras no termina, al lado sale en
 * qué etapa va; al pasar el ratón, cómo va cada una de sus etapas. La del agente lleva un borde cuando miras otra.
 */
function BarraDeFases({ fases, p, vista, delAgente, error, onElegir }: { fases: FaseVista[]; p: Pasos; vista: Fase | null; delAgente?: Fase; error: string; onElegir(f: Fase): void }) {
  const visibles = fases.filter((f) => f.abierta)
  return (
    <nav className="estudio-fases" aria-label="Fases del video">
      {visibles.map((f, k) => {
        const empezada = f.estado !== 'pendiente' || f.etapas.some((i) => p.etapas[i].hecha)
        const va = f.falta !== undefined && empezada ? p.etapas[f.falta].nombre : undefined
        const suya = f.id === delAgente && f.id !== vista
        const title = f.etapas.length
          ? f.etapas.map((i) => `${p.etapas[i].nombre}: ${p.state(i)}`).join('\n') + (suya ? '\n\nAquí trabaja el agente: púlsala para seguirlo.' : '')
          : f.abierta
            ? 'El video terminado: descárgalo, guárdalo en otra carpeta o pide un cambio.'
            : 'Este estilo no tiene etapas en esta fase.'
        return (
          <Fragment key={f.id}>
            {k > 0 && <span className="fase-sep" aria-hidden="true" />}
            <button className={`fase ${f.estado.replace(' ', '-')} ${f.id === vista ? 'vista' : ''} ${suya ? 'agente' : ''}`} disabled={!f.abierta} aria-current={f.id === vista ? 'step' : undefined} title={title} onClick={() => onElegir(f.id)}>
              <span className="fase-punto" />
              {f.nombre}
              {va && va.toLowerCase() !== f.nombre.toLowerCase() && <span className="muted">· {va}</span>}
            </button>
          </Fragment>
        )
      })}
      {error && <span className="bad small estudio-error" title={error}>{error}</span>}
    </nav>
  )
}

/**
 * Una fase que no es Video: sus etapas en orden, una tras otra, en una columna cómoda de leer. Cada una con su título, su
 * estado y todo lo que dejó o espera. Mientras se sigue al agente, baja a la etapa en la que trabaja. `arriba` va antes
 * que todas: en la Entrega, lo que se hace con el video terminado.
 */
function FaseCentro({ sessionId, p, fase, siguiendo, arriba }: { sessionId: string; p: Pasos; fase: FaseVista; siguiendo: boolean; arriba?: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null)
  const bloques = useRef<Record<number, HTMLElement | null>>({})
  const enCurso = fase.etapas.includes(p.current) ? p.current : -1
  useLayoutEffect(() => {
    const el = caja.current
    const bloque = bloques.current[enCurso]
    if (!siguiendo || !el || !bloque || fase.etapas[0] === enCurso) return
    el.scrollTo({ top: bloque.offsetTop - 16, behavior: el.scrollTop ? 'smooth' : 'instant' })
  }, [enCurso])
  return (
    <div className="estudio-centro estudio-fase" ref={caja}>
      <div className="estudio-columna">
        {arriba}
        {fase.etapas.map((i) => (
          <section key={p.etapas[i].nombre} ref={(el) => void (bloques.current[i] = el)} className="estudio-etapa">
            <EtapaCuerpo sessionId={sessionId} p={p} i={i} />
          </section>
        ))}
      </div>
    </div>
  )
}
