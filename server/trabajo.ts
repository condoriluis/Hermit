import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, parse, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { EstadoTrabajo } from '../shared/types.ts'
import { guardar } from './disco.ts'
import { VENTA } from '../shared/venta.ts'

/** Este repo, cuando Hermit corre desde aquí. */
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
/** Donde trabaja la copia del repo: fuera de él. Espacio en disco la mira también desde la instalada. */
export const TRABAJO_DEV = join(process.env.LOCALAPPDATA || join(homedir(), '.local', 'share'), 'hermit-dev', 'trabajo')

/**
 * La carpeta donde trabajan los hilos de video y de Ideas: `<app>/trabajo` en la app que se vende. Corriendo desde el
 * repo va fuera de él, porque dentro Claude y Codex leerían en cada hilo las reglas para programar Hermit (CLAUDE.md y
 * AGENTS.md), y un video de prueba no se haría como en la computadora de un cliente.
 *
 * Se puede cambiar desde Opciones → Espacio en disco: la elección se guarda en `data/trabajo.json` y se aplica sin
 * reiniciar. Los videos y sesiones existentes no se mueven (son tuyos); solo los nuevos van a la carpeta nueva.
 */

const APPDATA =
  process.env.APPDATA ??
  (process.platform === 'darwin' ? join(homedir(), 'Library', 'Application Support') : process.env.XDG_CONFIG_HOME || join(homedir(), '.config'))

/** El archivo que recuerda la carpeta elegida. Vive fuera del repo para no versionarse. */
const CONFIG_TRABAJO = join(APPDATA, 'hermit', 'trabajo.json')

function leerRaizTrabajo(): string | null {
  try {
    const j = JSON.parse(readFileSync(CONFIG_TRABAJO, 'utf8')) as { raiz?: unknown }
    return typeof j.raiz === 'string' && j.raiz.trim() ? resolve(j.raiz) : null
  } catch {
    return null
  }
}

/** La raiz elegida por el usuario, o null si es la de por defecto. */
let raizElegida: string | null = leerRaizTrabajo()

/** La carpeta de trabajo efectiva: la elegida o la de por defecto. */
function carpetaEfectiva(app: string, raiz: string | null): string {
  if (raiz) return raiz
  return !VENTA && resolve(app) === REPO ? TRABAJO_DEV : join(app, 'trabajo')
}

/**
 * La carpeta donde trabajan los hilos de video y de Ideas.
 */
export const carpetaTrabajo = (app: string) => carpetaEfectiva(app, raizElegida)

export function estadoTrabajo(app: string): EstadoTrabajo {
  const ruta = carpetaEfectiva(app, raizElegida)
  const porDefecto = !raizElegida
  return { ruta, porDefecto }
}

/**
 * Cambia la carpeta de trabajo. Los videos existentes no se mueven: son del usuario.
 * Solo los nuevos hilos irán a la nueva carpeta.
 */
export function cambiarTrabajo(app: string, entrada: string | null): EstadoTrabajo {
  let nueva: string | null = null
  if (entrada !== null) {
    let p = entrada.trim().replace(/^"(.*)"$/, '$1')
    if (p === '~') p = homedir()
    else if (p.startsWith('~/') || p.startsWith('~\\')) p = join(homedir(), p.slice(2))
    if (p) nueva = resolve(p)
  }

  if (nueva) {
    if (parse(nueva).root === nueva) throw new Error('Elige una carpeta, no la raíz del disco.')
    if (resolve(nueva) === resolve(REPO)) throw new Error('Esa carpeta es el repo de Hermit. Elige otra.')
    mkdirSync(nueva, { recursive: true })
    if (!statSync(nueva).isDirectory()) throw new Error(`${nueva} no es una carpeta.`)
  }

  raizElegida = nueva
  mkdirSync(dirname(CONFIG_TRABAJO), { recursive: true })
  guardar(CONFIG_TRABAJO, JSON.stringify(nueva ? { raiz: nueva } : {}, null, 2))

  if (nueva) mkdirSync(nueva, { recursive: true })
  return estadoTrabajo(app)
}

/** Si existe, abre la carpeta de trabajo en el explorador. */
export function abrirCarpetaTrabajo(app: string): void {
  const ruta = carpetaEfectiva(app, raizElegida)
  if (!existsSync(ruta)) mkdirSync(ruta, { recursive: true })
}
