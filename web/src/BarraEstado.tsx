import { useState } from 'react'
import { api } from './api'
import { ActualizarHermit } from './Actualizar'
import { abrirBienvenida } from './Bienvenida'
import { VENTA } from '../../shared/venta'
import './Marco.css'

/**
 * La barra de estado fija (24px), abajo de todo como en un IDE: a la izquierda, si el backend responde y el botón que
 * aplica sus cambios (en la app que se vende no hay nada que reiniciar: llega con una versión nueva, y su aviso va a la
 * derecha); a la derecha, la versión, el agente/modelo de lo que miras y cuántos hilos trabajan.
 */
export function BarraEstado({
  connected,
  fallo,
  trabajando,
  nombres,
  modelo,
  version
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
}) {
  const [error, setError] = useState('')
  return (
    <footer className="estado-barra">
      <div className="estado-izq">
        <span className={`dot ${connected ? 'ok' : 'bad'}`} />
        <span className="estado-texto">{connected ? 'Conectado' : 'Reconectando…'}</span>
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
        <ActualizarHermit />
        {modelo && <span className="estado-modelo" title="Agente y modelo de esta vista">{modelo}</span>}
        {version && (
          <button className="estado-btn estado-version" title="Versión de Hermit — abre la bienvenida" onClick={abrirBienvenida}>
            Hermit {version}
          </button>
        )}
      </div>
    </footer>
  )
}
