import { useEffect, useState } from 'react'
import { api } from './api'
import { VENTA } from '../../shared/venta'
import { Icono, esIcono } from './Iconos'
import './Marco.css'

/** Un hilo que terminó o te espera sin que lo miraras, para la campana de la barra de estado. */
export interface Terminado {
  id: string
  titulo: string
  tarjeta?: string
  icono?: string
  error: boolean
  espera: boolean
}

/**
 * La barra de estado fija (24px), abajo de todo como en un IDE: a la izquierda, si el backend responde y el botón que
 * aplica sus cambios (en la app que se vende no hay nada que reiniciar: llega con una versión nueva, y su aviso va a la
 * derecha); a la derecha, la versión, el agente/modelo de lo que miras, cuántos hilos trabajan y la campana con lo que
 * terminó o te espera sin que lo miraras, junto a los avisos de la comunidad sin leer.
 */
export function BarraEstado({
  connected,
  fallo,
  trabajando,
  nombres,
  modelo,
  version,
  terminadas,
  avisosComunidad,
  alAbrir,
  alComunidad
}: {
  connected: boolean
  /** Por qué no se pudo leer el estado la última vez (vacío si va bien). */
  fallo: string
  trabajando: number
  /** Los títulos de los hilos que trabajan, para el tooltip. */
  nombres: string[]
  /** «Claude · Opus 5.5», lo de la vista abierta; vacío si no hay nada que decir. */
  modelo: string
  version: string
  /** Los hilos que terminaron o esperan sin verse, del más nuevo al más viejo. */
  terminadas: Terminado[]
  /** Los avisos de la comunidad sin leer. */
  avisosComunidad: number
  alAbrir(id: string): void
  alComunidad(): void
}) {
  const [error, setError] = useState('')
  const [acerca, setAcerca] = useState(false)
  const [notif, setNotif] = useState(false)

  useEffect(() => {
    if (!acerca) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAcerca(false)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [acerca])

  useEffect(() => {
    if (!notif) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNotif(false)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [notif])

  const total = terminadas.length + avisosComunidad
  const mostradas = terminadas.slice(0, 8)

  return (
    <footer className="estado-barra">
      <div className="estado-izq">
        <span className={`dot ${connected ? 'ok' : 'bad'}`} />
        <span className="estado-texto">{connected ? 'En línea' : 'Reconectando…'}</span>
        {trabajando > 0 && (
          <span className="estado-tareas" title={nombres.join('\n')}>
            {trabajando} trabajando
          </span>
        )}
        {!VENTA && (
          <button
            className="estado-btn"
            disabled={trabajando > 0 || !connected}
            title={trabajando ? 'Espera a que ningún agente esté trabajando' : 'Aplica los cambios del servidor (la interfaz se actualiza sola)'}
            onClick={() => api('/api/restart', {}).catch((e) => setError(e.message))}
          >
            Reiniciar backend
          </button>
        )}
        {(error || fallo) && (
          <span className="bad estado-error" title={error || fallo}>
            {error || fallo}
          </span>
        )}
      </div>
      <div className="estado-der">
        {modelo && <span className="estado-modelo" title="Agente y modelo de esta vista">{modelo}</span>}
        {version && (
          <button className="estado-btn estado-version" title={`Hermit ${version}`} onClick={() => setAcerca(true)}>
            Hermit {version}
          </button>
        )}
        <div className="estado-campana">
          <button
            className="estado-btn estado-notif"
            title={total ? `${total} ${total === 1 ? 'novedad' : 'novedades'} sin ver` : 'Notificaciones'}
            aria-label="Notificaciones"
            onClick={() => setNotif(!notif)}
          >
            <Icono de="campana" />
            {total > 0 && <span className="topbar-cuenta">{total > 99 ? '99+' : total}</span>}
          </button>
          {notif && (
            <>
              <div className="menu-backdrop" onClick={() => setNotif(false)} />
              <div className="notif-panel" role="dialog" aria-label="Notificaciones">
                {!total ? (
                  <p className="notif-vacio">Todo al día: no hay nada nuevo.</p>
                ) : (
                  <>
                    {mostradas.map((t) => (
                      <button
                        key={t.id}
                        className="notif-item"
                        onClick={() => {
                          setNotif(false)
                          alAbrir(t.id)
                        }}
                      >
                        <span className="notif-icono">
                          <Icono de={t.icono && esIcono(t.icono) ? t.icono : 'hilo'} />
                        </span>
                        <span className="notif-texto">
                          <span className="notif-titulo">{t.titulo}</span>
                          <span className={`notif-detalle${t.error ? ' mal' : ''}`}>
                            {t.error ? 'Se detuvo con un error' : t.espera ? 'Te espera' : 'Terminó'}
                            {t.tarjeta ? ` · ${t.tarjeta}` : ''}
                          </span>
                        </span>
                      </button>
                    ))}
                    {terminadas.length > mostradas.length && <p className="notif-mas">y {terminadas.length - mostradas.length} más en la barra lateral</p>}
                    {avisosComunidad > 0 && (
                      <button
                        className="notif-item"
                        onClick={() => {
                          setNotif(false)
                          alComunidad()
                        }}
                      >
                        <span className="notif-icono">
                          <Icono de="personas" />
                        </span>
                        <span className="notif-texto">
                          <span className="notif-titulo">Comunidad</span>
                          <span className="notif-detalle">{avisosComunidad === 1 ? '1 aviso sin leer' : `${avisosComunidad} avisos sin leer`}</span>
                        </span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {acerca && (
        <div className="modal-backdrop" onClick={() => setAcerca(false)}>
          <div className="modal acerca" role="dialog" aria-modal="true" aria-label="Acerca de Hermit" onClick={(e) => e.stopPropagation()}>
            <button className="acerca-cerrar" aria-label="Cerrar" title="Cerrar (Esc)" onClick={() => setAcerca(false)}>
              <Icono de="cerrar" />
            </button>
            <div className="acerca-logo">
              <img src="/icon.svg" alt="" />
            </div>
            <h2>Hermit</h2>
            <span className="acerca-version">Versión {version}</span>
            <p className="acerca-texto">Hermit hace videos, artículos, presentaciones e imágenes con agentes de IA: eliges un estilo, le das un tema y lo ves trabajar paso a paso.</p>
            <p className="acerca-credito">Desarrollado por luchodev</p>
          </div>
        </div>
      )}
    </footer>
  )
}
