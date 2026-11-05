import { freemem, totalmem } from 'node:os'
import { hardwareInfo } from './native.ts'

/**
 * Estado de los recursos de la máquina (ADR 0011).
 *
 * El hardware se lee una sola vez; la memoria disponible, cada vez que se pregunta.
 * Con el módulo de Rust eso es un refresco de memoria (barato); sin él se usa
 * `os.freemem`, y todo sigue funcionando igual, solo un poco más lento.
 */

const HARDWARE = (() => {
  const nativo = hardwareInfo()
  return Object.freeze({
    totalMb: Math.max(1, Math.round(nativo?.totalMemoryMb ?? totalmem() / (1024 * 1024))),
    nucleos: Math.max(1, nativo?.cpuCores ?? 1),
  })
})()

export const hardware = HARDWARE

/** La RAM libre ahora mismo, en bytes. */
export function ramLibreBytes(): number {
  const libreMb = hardwareInfo()?.availableMemoryMb
  if (libreMb !== undefined && Number.isFinite(libreMb) && libreMb >= 0) return Math.round(libreMb * 1024 * 1024)
  return freemem()
}

/** Lo que la interfaz enseña: memoria libre, total y si conviene avisar. */
export function estadoRecursos(): { libre: number; total: number; porcentaje: number; alerta: boolean } {
  const libre = Math.round(ramLibreBytes() / (1024 * 1024))
  return {
    libre,
    total: HARDWARE.totalMb,
    porcentaje: Math.round((libre / HARDWARE.totalMb) * 100),
    alerta: libre < 1500,
  }
}
