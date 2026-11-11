import { useEffect, useState } from 'react'
import type { ActualizacionHermit, AgentesAlDia } from '../../shared/types'
import { api } from './api'
import { Confirm } from './Confirm'
import { Icono } from './Iconos'

/**
 * Mientras baja, cada cuánto se pregunta cómo va; si no, cada cuánto se mira si la ventana ya sabe de una versión nueva
 * (pregunta solo a electron/main.ts, que la busca en el cobro: una liberada en un live se ve en minutos).
 */
const BAJANDO = 1000
const CADA = 60_000

/**
 * Abajo de la barra lateral de la app que se vende: si hay una versión nueva de Hermit, el botón que la pone. Lo sabe la
 * ventana de Hermit (electron/main.ts): al confirmar baja solo lo que cambió, cierra Hermit y la vuelve a abrir actualizada.
 */
export function ActualizarHermit() {
  const hermit = window.hermit
  const [a, setA] = useState<ActualizacionHermit>()
  const [preguntar, setPreguntar] = useState(false)
  const bajando = a?.avance !== undefined

  useEffect(() => {
    if (!hermit) return
    const mirar = () => void hermit.actualizacion().then(setA, () => {})
    mirar()
    const t = setInterval(mirar, bajando ? BAJANDO : CADA)
    return () => clearInterval(t)
  }, [hermit, bajando])

  if (!hermit || !a?.nueva) return null
  if (bajando)
    return (
      <span className="muted small pie-nota">
        {a.avance === 1 ? 'Poniendo la versión nueva…' : a.sinRed ? `Sin internet: Hermit ${a.nueva} sigue bajando cuando vuelva` : `Bajando Hermit ${a.nueva}… ${Math.round(a.avance! * 100)} %`}
      </span>
    )
  return (
    <>
      <button className="topbar-update" title={a.novedad ? `Hermit ${a.nueva}\n${a.novedad}` : `Actualizar a Hermit ${a.nueva}`} onClick={() => setPreguntar(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M6 11l6-6 6 6" />
        </svg>
        Nueva versión · {a.nueva}
      </button>
      {a.error && <span className="bad small">{a.error}</span>}
      {preguntar && (
        <Confirm title={`¿Actualizar a Hermit ${a.nueva}?`} action={a.aMano ? 'Descargar' : 'Actualizar'} onConfirm={() => hermit.actualizar().then(setA)} onClose={() => setPreguntar(false)}>
          {a.aMano
            ? 'Se baja en tu navegador. Cierra Hermit y arrastra la nueva a Aplicaciones, encima de esta: tus videos y tus hilos se quedan.'
            : 'Se baja solo lo que cambió desde tu versión. Después Hermit se cierra y se vuelve a abrir ya actualizada: se detiene lo que esté haciendo, y tus videos y tus hilos se quedan.'}
        </Confirm>
      )}
    </>
  )
}

/** «Claude Code», «Claude Code y Codex», «Claude Code, Codex y OpenCode». */
const juntar = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}` : xs[0])

/**
 * En el header: si Claude Code, Codex u OpenCode sacaron una versión más nueva que la que tienes (`server/agentes.ts`),
 * el botón que la baja, con sus modelos nuevos — un icono con punto ámbar y las versiones en el tooltip. Los hilos
 * abiertos siguen con la de antes; los nuevos van con la nueva. Mientras baja, un punto que gira.
 */
export function AvisoAgentes() {
  const [a, setA] = useState<AgentesAlDia>()
  const [preguntar, setPreguntar] = useState(false)
  const leer = () => api<AgentesAlDia>('/api/agentes/al-dia').then(setA, () => {})
  useEffect(() => void leer(), [])
  const actualizando = !!a?.actualizando
  useEffect(() => {
    if (!actualizando) return
    const id = setInterval(leer, 2000)
    return () => clearInterval(id)
  }, [actualizando])

  if (a?.actualizando)
    return (
      <button className="topbar-btn" disabled title={a.actualizando} aria-label={a.actualizando}>
        <Icono de="reabrir" />
      </button>
    )
  if (!a?.nuevos.length)
    return a?.error ? (
      <button className="topbar-btn mal" title={a.error} aria-label={a.error}>
        <Icono de="reabrir" />
      </button>
    ) : null
  const nombres = a.nuevos.map((n) => n.nombre)
  const titulo = nombres.length === 1 ? `Actualizar ${nombres[0]}` : 'Actualizar los agentes'
  const versiones = a.nuevos.map((n) => `${n.nombre}: ${n.de} → ${n.a}`).join('\n')
  return (
    <>
      <button className="topbar-btn aviso" title={`${titulo}\n${versiones}`} aria-label={titulo} onClick={() => setPreguntar(true)}>
        <Icono de="reabrir" />
        <span className="punto-aviso" />
      </button>
      {preguntar && (
        <Confirm title={`¿${titulo}?`} action="Actualizar" onConfirm={() => api<AgentesAlDia>('/api/agentes/actualizar', {}).then(setA)} onClose={() => setPreguntar(false)}>
          Se baja la versión nueva de {juntar(a.nuevos.map((n) => `${n.nombre} (${n.de} → ${n.a}, unos ${n.pesa})`))}, con sus modelos nuevos. Puedes seguir
          trabajando: los chats abiertos siguen con la de antes, y los nuevos ya van con la nueva.
          {a.error && <span className="bad small fila-extra">La última vez falló: {a.error}</span>}
        </Confirm>
      )}
    </>
  )
}
