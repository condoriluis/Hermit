/**
 * Recursos de la máquina para el trabajo de los agentes: cuántos hilos puede usar cada uno y un
 * vigilante que mira la memoria del sistema y de los procesos que cuelga Hermit.
 *
 * Nada de esto toca la calidad del video: los límites son de procesos y de concurrencia, nunca de
 * resolución, FPS, bitrate ni CRF. Y el vigilante solo avisa y frena trabajo nuevo — jamás mata un
 * proceso: si la memoria aprieta, `repartir` (sessions.ts) deja los videos en cola hasta que baje.
 */

import { hardware, ramLibreBytes } from './gobernador.ts'
import { procesosNativo, prioridadNativa, type ProcesoInfo } from './native.ts'

export type { ProcesoInfo }

/**
 * Debajo de esto libre el vigilante marca «critico»: no arranca videos nuevos ni baja más agentes por
 * la puerta de atrás. Los que ya trabajan siguen: el trabajo en curso nunca se interrumpe.
 */
export const CRITICO = 1e9
/** Por debajo de esto (y sobre CRITICO) el estado es «aviso»: se muestra, pero nada se frena. */
export const AVISO = 2e9

/** Cada cuánto mira el vigilante la memoria y los procesos. */
const CADA_MS = 15_000
/** Cuántos procesos raíz se les baja la prioridad a la vez en el peor momento: no un goteo de syscalls. */
const PRIORIZADOS = 8

/**
 * Los hilos que puede usar cada agente según cuántos trabajan a la vez: con uno solo tiene todos los
 * núcleos (nada se hace más lento); con varios se reparten, para que WhisperX, Torch o FFmpeg de uno
 * no acaparen la máquina y congelen a los demás. Piso de 2: con menos, un render se arrastraría.
 */
export function hilosPara(agentes: number): number {
  return Math.max(2, Math.min(hardware.nucleos, Math.floor(hardware.nucleos / Math.max(1, agentes))))
}

/** Las variables que leen NumPy, Torch, OpenBLAS, MKL y Accelerate (macOS) para sus hilos. */
const HILOS_ENV = ['OMP_NUM_THREADS', 'MKL_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'NUMEXPR_NUM_THREADS', 'VECLIB_MAXIMUM_THREADS']
/** Las que puso Hermit: se actualizan en cada reparto. Las que puso el usuario, nunca se tocan. */
const puestas = new Set<string>()

/**
 * Deja en `process.env` el techo de hilos para los procesos que nazcan de aquí en adelante (los
 * agentes y, por herencia, su Python, FFmpeg y Remotion). Si el usuario ya definió una, se respeta.
 */
export function fijarHilos(agentes: number) {
  const hilos = String(hilosPara(agentes))
  for (const varName of HILOS_ENV) {
    if (!puestas.has(varName) && process.env[varName] !== undefined) continue
    if (process.env[varName] !== hilos) process.env[varName] = hilos
   puestas.add(varName)
  }
}

/** Si la memoria libre está en zona crítica: `repartir` la consulta antes de arrancar nada pesado. */
export function critico(): boolean {
  return ramLibreBytes() < CRITICO
}

export interface ArbolAgente {
  pid: number
  nombre: string
  /** MB que suma el proceso y todos sus descendientes (sus renders, FFmpeg, Chrome…). */
  mb: number
}

/**
 * Los procesos que cuelgan directo del servidor (cada CLI de agente es hijo suyo) con la memoria de
 * todo su árbol. Función pura: la prueba no necesita el módulo de Rust ni procesos reales.
 */
export function arbolesDe(procesos: ProcesoInfo[], raiz: number): { totalMb: number; raices: ArbolAgente[] } {
  const porPadre = new Map<number, ProcesoInfo[]>()
  for (const p of procesos) {
    const lista = porPadre.get(p.ppid) ?? []
    lista.push(p)
    porPadre.set(p.ppid, lista)
  }
  let totalMb = 0
  const raices = (porPadre.get(raiz) ?? []).map((raizProc) => {
    let mb = raizProc.memoriaMb
    const vistos = new Set([raizProc.pid])
    const pila = [raizProc.pid]
    while (pila.length) {
      for (const hijo of porPadre.get(pila.pop()!) ?? []) {
        if (vistos.has(hijo.pid)) continue
        vistos.add(hijo.pid)
        mb += hijo.memoriaMb
        pila.push(hijo.pid)
      }
    }
    totalMb += mb
    return { pid: raizProc.pid, nombre: raizProc.nombre, mb: Math.round(mb) }
  })
  raices.sort((a, b) => b.mb - a.mb)
  return { totalMb: Math.round(totalMb), raices }
}

export interface EstadoVigilante {
  nivel: 'ok' | 'aviso' | 'critico'
  libreMb: number
  totalMb: number
  /** MB que suman los procesos colgados del servidor: los agentes y todo lo que lanzan. */
  agentesMb: number
  /** Los que más pesan ahora mismo, para el aviso. */
  procesos: ArbolAgente[]
  fecha: string
}

let estado: EstadoVigilante | null = null
/** Los procesos a los que ya se les bajó la prioridad en este episodio crítico (Windows). */
const bajados = new Set<number>()

/** Lo último que vio el vigilante; `null` hasta la primera pasada. Lo lee «Tu equipo». */
export function estadoVigilante(): EstadoVigilante | null {
  return estado
}

function nivelDe(libre: number): EstadoVigilante['nivel'] {
  return libre < CRITICO ? 'critico' : libre < AVISO ? 'aviso' : 'ok'
}

async function pasada() {
  const libre = ramLibreBytes()
  const nivel = nivelDe(libre)
  let agentesMb = 0
  let procesos: ArbolAgente[] = []
  const lista = await procesosNativo()
  const arboles = lista ? arbolesDe(lista, process.pid) : null
  if (arboles) {
    agentesMb = arboles.totalMb
    procesos = arboles.raices.slice(0, 5)
  }
  if (!estado || estado.nivel !== nivel) {
    const mb = (libre / 1e6).toFixed(0)
    console.warn(`[recursos] memoria ${nivel === 'ok' ? 'volvió a la normal' : `en zona ${nivel}`}: ${mb} MB libres` + (agentesMb ? `, ${agentesMb} MB en agentes` : ''))
  }
  // Prioridad baja solo donde se puede devolver (Windows, vía el módulo nativo): en Linux y macOS
  // un `nice` más alto no se quita sin privilegios, así que ahí el vigilante solo avisa y frena.
  if (arboles) {
    if (nivel === 'critico') {
      for (const p of arboles.raices.slice(0, PRIORIZADOS)) {
        if (!bajados.has(p.pid) && prioridadNativa(p.pid, true)) bajados.add(p.pid)
      }
    } else {
      // Vuelva la memoria o no, cada uno sale de la lista: el que ya murió no tiene prioridad que devolver.
      for (const pid of [...bajados]) {
        prioridadNativa(pid, false)
        bajados.delete(pid)
      }
    }
  }
  estado = { nivel, libreMb: Math.round(libre / 1e6), totalMb: Math.round(hardware.totalMb), agentesMb, procesos, fecha: new Date().toISOString() }
}

let vigilando = false
/**
 * El vigilante: mira la memoria cada 15 s, deja constancia de en qué zona está y, solo en Windows,
 * baja la prioridad de los agentes mientras dure la zona crítica (y la devuelve al salir). No mata
 * nada ni toca el trabajo en curso; lo que frena es `repartir` consultando `critico()`.
 */
export function vigilar() {
  if (vigilando) return
  vigilando = true
  const tick = () => void pasada().catch((e) => console.warn('[recursos] la pasada falló:', e instanceof Error ? e.message : e))
  tick()
  setInterval(tick, CADA_MS).unref()
}
