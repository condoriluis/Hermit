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

type NativeModule = {
  hardwareInfo(): HardwareInfo
  /** La decodificación corre en el pool de hilos de libuv: nunca bloquea el event loop. */
  calcularPicosAudio(ruta: string): Promise<Buffer>
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
