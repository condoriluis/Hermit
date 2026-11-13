/**
 * Módulo nativo de Rust (`crates/hermit-native`): lo que en Node costaba un subproceso
 * de FFmpeg por cada audio o recorrer la máquina entera para leer la memoria.
 *
 * Se carga una sola vez. Si el `.node` no está (una copia sin compilar), todo
 * devuelve `null` y el servidor sigue por los caminos de siempre.
 */

import { createRequire } from 'node:module'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface HardwareInfo {
  cpuCores: number
  totalMemoryMb: number
  availableMemoryMb: number
}

/** Un proceso visto por el vigilante de recursos (`procesos()` de Rust). */
export interface ProcesoInfo {
  pid: number
  ppid: number
  nombre: string
  memoriaMb: number
}

type NativeModule = {
  hardwareInfo(): HardwareInfo
  /** La decodificación corre en el pool de hilos de libuv: nunca bloquea el event loop. */
  calcularPicosAudio(ruta: string): Promise<Buffer>
  /** Todos los procesos de la máquina (pid, padre, nombre, MB). `null`-equivalente si no hay módulo. */
  procesos?(): Promise<ProcesoInfo[]>
  /** Baja/devuelve la prioridad de un proceso. Solo Windows la cambia de verdad; en los demás SO responde `false`. */
  prioridad?(pid: number, baja: boolean): boolean
}

const RUTA_NODE = join(dirname(fileURLToPath(import.meta.url)), 'native', 'hermit_native.node')
/** En las pruebas de la onda se fuerza el camino de FFmpeg: así se prueba el respaldo. */
const DESACTIVADO = process.env.HERMIT_SIN_NATIVO === '1'

let modulo: NativeModule | null | undefined

function nativo(): NativeModule | null {
  if (modulo !== undefined) return modulo
  if (DESACTIVADO) return (modulo = null)
  if (!existsSync(RUTA_NODE)) {
    console.warn('[native] hermit_native.node no está: se usan los caminos de siempre')
    return (modulo = null)
  }
  try {
    modulo = createRequire(import.meta.url)(RUTA_NODE) as NativeModule
    return modulo
  } catch (error) {
    console.error('[native] no se pudo cargar el módulo de Rust:', error)
    return (modulo = null)
  }
}

/** Núcleos y memoria de la máquina, sin volver a recorrerla. `null` si no hay módulo. */
export function hardwareInfo(): HardwareInfo | null {
  try {
    return nativo()?.hardwareInfo() ?? null
  } catch (error) {
    console.warn('[native] hardwareInfo falló:', error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Picos de la onda de un audio (uno cada 20 ms, de 0 a 255), calculados en Rust.
 * `null` si el módulo no está, si el formato no se pudo decodificar o si no hay
 * muestras: entonces el que llama usa FFmpeg.
 */
export async function picosAudioNativo(ruta: string): Promise<Uint8Array | null> {
  const mod = nativo()
  if (!mod) return null
  try {
    const picos = await mod.calcularPicosAudio(ruta)
    return picos.length ? picos : null
  } catch (error) {
    console.warn('[native] la onda de Rust falló, se usa FFmpeg:', error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * La lista de procesos de la máquina para el vigilante de recursos: quién cuelga de quién y cuánta
 * memoria toma cada uno. `null` si el módulo no está o no se pudo leer — el vigilante sigue midiendo
 * solo la memoria libre del sistema.
 */
export async function procesosNativo(): Promise<ProcesoInfo[] | null> {
  const mod = nativo()
  if (!mod?.procesos) return null
  try {
    return await mod.procesos()
  } catch (error) {
    console.warn('[native] no se pudieron leer los procesos:', error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Baja la prioridad de un proceso (`baja: true`) o la devuelve a la normal. Solo Windows la aplica
 * — en Linux y macOS el `nice` no se puede devolver sin privilegios, así que responde `false` y el
 * vigilante no insiste. `false` también si el proceso ya no existe o el módulo no está.
 */
export function prioridadNativa(pid: number, baja: boolean): boolean {
  try {
    return nativo()?.prioridad?.(pid, baja) ?? false
  } catch {
    return false
  }
}
