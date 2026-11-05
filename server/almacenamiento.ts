import { spawn } from 'node:child_process'
import { accessSync, constants, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, rmdirSync, statfsSync, statSync } from 'node:fs'
import { cp, lstat, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter, dirname, isAbsolute, join, parse, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { guardar } from './disco.ts'

/**
 * Dónde guarda Hermit lo que descarga: FFmpeg, el Python de las skills (y sus paquetes), los agentes, el Python de
 * transcripción y sus modelos. Por defecto se queda donde siempre estuvo (dos carpetas heredadas: `hermit` y `youtube`);
 * desde Opciones se puede elegir una carpeta y todo queda junto dentro de ella:
 *
 *     <carpeta>/piezas        FFmpeg, Python de las skills y agentes
 *     <carpeta>/python-hermit  el Python de transcripción
 *     <carpeta>/modelos       los modelos de transcripción y de vectores
 *
 * El archivo que recuerda la elección vive siempre en `%APPDATA%/hermit/almacenamiento.json`, fuera de lo que se mueve.
 * Al cambiar de carpeta se mueve lo descargado; si el destino está en otro disco se copia primero y se borra el original
 * solo cuando el cambio quedó guardado. Nada de esto toca los videos, los hilos ni las cuentas.
 */

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WINDOWS = process.platform === 'win32'
/** En Mac y Linux lo pone scripts/start.mjs; sin él, la misma carpeta que elige él. */
const APPDATA =
  process.env.APPDATA ??
  (process.platform === 'darwin' ? join(homedir(), 'Library', 'Application Support') : process.env.XDG_CONFIG_HOME || join(homedir(), '.config'))
const CONFIG = join(APPDATA, 'hermit', 'almacenamiento.json')

export interface Rutas {
  /** `null` es la carpeta de siempre, que separa `hermit` de `youtube`. */
  raiz: string | null
  piezas: string
  pythonHermit: string
  modelos: string
}

export interface EstadoAlmacenamiento {
  ruta: string
  porDefecto: boolean
  piezas: string
  pythonHermit: string
  modelos: string
  libre: number
  total: number
  moviendo: { desde: string; hacia: string } | null
  error?: string
}

/** La carpeta de siempre, tal como la buscaban las versiones anteriores. */
const DEFECTO: Rutas = {
  raiz: null,
  piezas: join(APPDATA, 'hermit', 'piezas'),
  pythonHermit: join(APPDATA, 'youtube', 'piezas', 'python'),
  modelos: join(APPDATA, 'youtube', 'modelos')
}

export const rutasDe = (raiz: string | null): Rutas => {
  if (!raiz) return DEFECTO
  const r = resolve(raiz)
  return { raiz: r, piezas: join(r, 'piezas'), pythonHermit: join(r, 'python-hermit'), modelos: join(r, 'modelos') }
}

function leerRaiz(): string | null {
  try {
    const j = JSON.parse(readFileSync(CONFIG, 'utf8')) as { raiz?: unknown }
    return typeof j.raiz === 'string' && j.raiz.trim() ? resolve(j.raiz) : null
  } catch {
    return null
  }
}

let actual = rutasDe(leerRaiz())
let moviendo: { desde: string; hacia: string } | null = null
let error: string | undefined

/** Las rutas de ahora. Se pregunta cada vez: cambiar de carpeta no reinicia el servidor. */
export const rutas = () => actual

const visible = (r: Rutas) => r.raiz ?? join(APPDATA, 'hermit')
const clave = (p: string) => (WINDOWS ? resolve(p).toLowerCase() : resolve(p))
const igual = (a: string, b: string) => clave(a) === clave(b)

/** Si `hijo` es `padre` o está dentro. */
function dentro(padre: string, hijo: string): boolean {
  const rel = relative(clave(padre), clave(hijo))
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

function discoDe(ruta: string): { libre: number; total: number } {
  try {
    const s = statfsSync(ruta)
    return { libre: s.bavail * s.bsize, total: s.blocks * s.bsize }
  } catch {
    return { libre: 0, total: 0 }
  }
}

const legible = (bytes: number) => (bytes >= 1e9 ? `${(bytes / 1e9).toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`)

export function estadoAlmacenamiento(): EstadoAlmacenamiento {
  const r = actual
  const base = visible(r)
  const { libre, total } = discoDe(base)
  return { ruta: base, porDefecto: !r.raiz, piezas: r.piezas, pythonHermit: r.pythonHermit, modelos: r.modelos, libre, total, moviendo, error }
}

export const ocupadoAlmacenamiento = () => (moviendo ? 'Hermit está moviendo sus descargas. Espera a que termine.' : null)

/** Los que usan lo descargado (`start.mjs`, los agentes, FFmpeg) lo ven sin reiniciar. */
let puestos: string[] = []
export function aplicarEntorno() {
  const r = actual
  const nuevos = [join(r.piezas, 'bin'), ...(WINDOWS ? [join(r.piezas, 'python', 'python'), join(r.piezas, 'python', 'python', 'Scripts')] : [])]
  const resto = (process.env.PATH ?? '')
    .split(delimiter)
    .filter((p) => p && !puestos.some((x) => igual(x, p)) && !nuevos.some((x) => igual(x, p)))
  puestos = nuevos
  process.env.PATH = [...nuevos, ...resto].join(delimiter)
  if (r.raiz) process.env.HERMIT_DATOS = r.raiz
  else delete process.env.HERMIT_DATOS
}

interface Par {
  nombre: string
  origen: string
  destino: string
}

const paresDe = (desde: Rutas, hacia: Rutas): Par[] =>
  [
    { nombre: 'piezas', origen: desde.piezas, destino: hacia.piezas },
    { nombre: 'python', origen: desde.pythonHermit, destino: hacia.pythonHermit },
    { nombre: 'modelos', origen: desde.modelos, destino: hacia.modelos }
  ].filter((p) => !igual(p.origen, p.destino))

function carpeta(p: string, que: string) {
  mkdirSync(p, { recursive: true })
  if (!statSync(p).isDirectory()) throw new Error(`${que} no es una carpeta: ${p}`)
  try {
    accessSync(p, constants.W_OK)
  } catch {
    throw new Error(`No se puede escribir en ${p}.`)
  }
}

/** Un destino vacío se puede usar; uno con datos no, para no pisar nada. */
function prepararDestino(d: string) {
  if (!existsSync(d)) return
  if (!statSync(d).isDirectory()) throw new Error(`${d} ya existe y no es una carpeta.`)
  if (readdirSync(d).length) throw new Error(`La carpeta ${d} ya tiene datos. Elige una carpeta vacía.`)
  rmSync(d, { recursive: false })
}

/** Lo que hay que comprobar antes de mover nada. */
function comprobarCambio(nueva: Rutas) {
  if (nueva.raiz) {
    if (parse(nueva.raiz).root === nueva.raiz) throw new Error('Elige una carpeta, no la raíz del disco.')
    if (dentro(APP, nueva.raiz)) throw new Error('Esa carpeta está dentro de Hermit. Elige otra.')
    for (const p of [actual.piezas, actual.pythonHermit, actual.modelos]) {
      if (existsSync(p) && dentro(p, nueva.raiz)) throw new Error('Esa carpeta está dentro de lo que se va a mover. Elige otra.')
    }
    carpeta(nueva.raiz, 'La carpeta elegida')
  }
  for (const p of [nueva.piezas, nueva.pythonHermit, nueva.modelos]) {
    carpeta(dirname(p), 'La carpeta de descargas')
    prepararDestino(p)
  }
}

async function tamano(ruta: string): Promise<number> {
  const st = await lstat(ruta)
  if (st.isSymbolicLink()) return 0
  if (!st.isDirectory()) return st.size
  let total = 0
  for (const e of await readdir(ruta)) total += await tamano(join(ruta, e))
  return total
}

/** Copiar a otro disco necesita el doble de espacio un rato: se dice antes, no a mitad. */
async function comprobarEspacio(pares: Par[]) {
  let necesita = 0
  let destino = ''
  for (const p of pares) {
    if (!existsSync(p.origen)) continue
    if (statSync(p.origen).dev === statSync(dirname(p.destino)).dev) continue
    necesita += await tamano(p.origen)
    destino = dirname(p.destino)
  }
  if (!necesita) return
  const { libre } = discoDe(destino)
  if (libre < necesita + 100e6) throw new Error(`No hay espacio en ${destino}: hacen falta ${legible(necesita)} y quedan ${legible(libre)}.`)
}

/** Borra las carpetas que quedaron vacías al mover, sin tocar nada fuera de los datos de Hermit. */
function limpiarVacios(r: Rutas) {
  for (const p of [r.piezas, r.pythonHermit, r.modelos]) {
    let d = dirname(p)
    for (let i = 0; i < 2 && dentro(APPDATA, d); i++) {
      try {
        rmdirSync(d)
        d = dirname(d)
      } catch {
        break
      }
    }
  }
}

/** Mueve las tres carpetas. Devuelve cómo deshacerlo y cómo terminar de borrar los originales. */
export async function moverDatos(desde: Rutas, hacia: Rutas): Promise<{ deshacer(): void; finalizar(): void }> {
  const pares = paresDe(desde, hacia).filter((p) => existsSync(p.origen))
  if (!pares.length) return { deshacer() {}, finalizar() {} }

  for (const p of pares) {
    carpeta(dirname(p.destino), 'La carpeta de descargas')
    prepararDestino(p.destino)
  }

  const mismoDisco = pares.every((p) => statSync(p.origen).dev === statSync(dirname(p.destino)).dev)
  if (mismoDisco) {
    const hechos: Par[] = []
    try {
      for (const p of pares) {
        renameSync(p.origen, p.destino)
        hechos.push(p)
      }
    } catch (e) {
      for (const p of hechos.reverse()) {
        try {
          renameSync(p.destino, p.origen)
        } catch {}
      }
      throw e
    }
    return {
      deshacer() {
        for (const p of [...pares].reverse()) {
          try {
            if (existsSync(p.destino) && !existsSync(p.origen)) renameSync(p.destino, p.origen)
          } catch {}
        }
      },
      finalizar: () => limpiarVacios(desde)
    }
  }

  // Otro disco: se copia a un `.moviendo` y solo se pone en su sitio cuando están todas.
  const copiados: { p: Par; tmp: string }[] = []
  const instalados: Par[] = []
  try {
    for (const p of pares) {
      const tmp = p.destino + '.moviendo'
      rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
      await cp(p.origen, tmp, { recursive: true, preserveTimestamps: true, errorOnExist: true, force: false, verbatimSymlinks: true })
      copiados.push({ p, tmp })
    }
    for (const { p, tmp } of copiados) {
      renameSync(tmp, p.destino)
      instalados.push(p)
    }
  } catch (e) {
    for (const p of instalados) {
      try {
        rmSync(p.destino, { recursive: true, force: true })
      } catch {}
    }
    for (const { tmp } of copiados) {
      try {
        rmSync(tmp, { recursive: true, force: true })
      } catch {}
    }
    throw e
  }

  return {
    deshacer() {
      for (const p of instalados) {
        try {
          rmSync(p.destino, { recursive: true, force: true })
        } catch {}
      }
    },
    finalizar() {
      for (const p of pares) {
        try {
          rmSync(p.origen, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
        } catch {}
      }
      limpiarVacios(desde)
    }
  }
}

function escribirRaiz(raiz: string | null) {
  mkdirSync(dirname(CONFIG), { recursive: true })
  guardar(CONFIG, JSON.stringify(raiz ? { raiz } : {}, null, 2))
}

function normalizar(entrada: string | null): string | null {
  if (entrada === null) return null
  let p = entrada.trim().replace(/^"(.*)"$/, '$1')
  if (!p) return null
  if (p === '~') p = homedir()
  else if (p.startsWith('~/') || p.startsWith('~\\')) p = join(homedir(), p.slice(2))
  return resolve(p)
}

/**
 * Cambia la carpeta. Si ya hay descargas las mueve en segundo plano; la interfaz mira `moviendo` hasta que acaba. No
 * escribe la elección hasta que el movimiento salió bien, y si falla deshace lo copiado.
 */
export async function cambiarAlmacenamiento(entrada: string | null): Promise<EstadoAlmacenamiento> {
  if (moviendo) throw new Error('Ya se están moviendo las descargas. Espera a que termine.')
  const raiz = normalizar(entrada)
  if ((raiz ?? null) === (actual.raiz ?? null) || (raiz && actual.raiz && igual(raiz, actual.raiz))) return estadoAlmacenamiento()

  const nueva = rutasDe(raiz)
  comprobarCambio(nueva)
  const pares = paresDe(actual, nueva)
  const conDatos = pares.filter((p) => existsSync(p.origen))
  error = undefined

  if (!conDatos.length) {
    escribirRaiz(raiz)
    actual = nueva
    aplicarEntorno()
    return estadoAlmacenamiento()
  }

  await comprobarEspacio(conDatos)
  moviendo = { desde: visible(actual), hacia: visible(nueva) }
  const antes = actual
  void (async () => {
    try {
      const cambio = await moverDatos(antes, nueva)
      try {
        escribirRaiz(raiz)
        actual = nueva
        aplicarEntorno()
      } catch (e) {
        cambio.deshacer()
        throw e
      }
      cambio.finalizar()
    } catch (e) {
      error = e instanceof Error ? e.message : String(e)
    } finally {
      moviendo = null
    }
  })()
  return estadoAlmacenamiento()
}

/** Abre la carpeta actual en el explorador; solo esa, no una ruta cualquiera. */
export function abrirCarpeta() {
  const ruta = visible(actual)
  mkdirSync(ruta, { recursive: true })
  const [cmd, args] = WINDOWS
    ? ['explorer.exe', [ruta]]
    : process.platform === 'darwin'
      ? ['open', [ruta]]
      : ['xdg-open', [ruta]]
  spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true }).on('error', () => {}).unref()
}

aplicarEntorno()
