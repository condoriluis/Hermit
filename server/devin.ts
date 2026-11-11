import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { CuentaClaude, Model } from '../shared/types.ts'
import type { AgentOptions, AgentRun } from './agent.ts'
import { entornoSinLlaves } from './acceso.ts'
import { conectar, soltar, startAcp, valoresDe, type Conexion, type OpcionAcp, type SaborAcp } from './acp.ts'
import { asegurarAgente, rutaAgente } from './agentes.ts'
import { guardar } from './disco.ts'

/**
 * Devin, el agente de Cognition (`devin acp`), por ACP (`server/acp.ts`), como en Zed o JetBrains. Trabaja con la cuenta
 * de Devin de cada quien: la misma de la app de Devin y de Windsurf.
 *
 * A diferencia de los demás, `devin acp` NO usa las credenciales del CLI (`devin auth login`): el servidor ACP exige que
 * el anfitrión lo autentique en cada proceso (`authenticate` con `devin-browser`, el flujo PKCE del navegador; también
 * acepta `meta.api_key`). Por eso la cuenta se conecta por ACP, como Antigravity, y no en una ventana del CLI. Cuando la
 * persona ya tiene sesión de Devin/Windsurf en el navegador, el flujo termina solo en unos segundos.
 *
 * No hay token que guardar ni que borrar: cada proceso se autentica al abrirse, y «conectada» es haber completado ese
 * flujo alguna vez en esta computadora (`cuenta.json`). Sin permisos: `acp.ts` acepta cada herramienta, y el modo
 * `bypass` de Devin aprueba las suyas sin preguntar, como el `yolo` de los demás.
 */

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATOS = join(APP, 'data', 'devin')
const MODELOS = join(DATOS, 'modelos.json')
const CUENTA = join(DATOS, 'cuenta.json')
/** «Salir» no puede borrar la credencial del propio Devin: deja esta marca y `lanzar` pide reconectar, como los demás. */
const SALIO = join(DATOS, 'salio')
const SIN_CUENTA = 'Conecta tu cuenta de Devin en Opciones.'
/** El enlace que imprime mientras espera el navegador, si lo da. */
const ENLACE = /https?:\/\/\S+/i

/**
 * La llave con que `devin acp` se autentica sin navegador (`_meta.api_key` del `authenticate`): la de
 * `WINDSURF_API_KEY` si la hay, o la `windsurf_api_key` del `credentials.toml` que escribe el propio Devin al entrar
 * (con `auth login` o con el flujo del navegador). Sin ella, el `authenticate` abre el navegador.
 */
/** Si la llave guardada ya no sirve (venceu o se revocó), el siguiente `authenticate` va por el navegador. */
let llaveMala = false

function apiKey(): string | undefined {
  if (llaveMala) return undefined
  if (process.env.WINDSURF_API_KEY) return process.env.WINDSURF_API_KEY
  const dir =
    process.platform === 'win32' ? (process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'))
    : process.platform === 'darwin' ? join(homedir(), 'Library', 'Application Support')
    : (process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'))
  try {
    return /windsurf_api_key\s*=\s*"([^"]+)"/.exec(readFileSync(join(dir, 'devin', 'credentials.toml'), 'utf8'))?.[1]
  } catch {
    return undefined
  }
}

/** Lo que la sesión dice de los modelos, como los guarda Hermit para el catálogo. Y deja la marca de cuenta conectada. */
function guardarModelos(opciones: OpcionAcp[]) {
  const modelo = opciones.find((o) => o.category === 'model' || o.id === 'model')
  const nivel = opciones.find((o) => /thought|reason|effort/i.test(`${o.category ?? ''} ${o.id ?? ''}`))
  const lista: Model[] = valoresDe(modelo).map((v) => ({
    id: `devin:${v.value}`,
    label: `Devin · ${v.name ?? v.value}`,
    efforts: valoresDe(nivel).map((n) => n.value),
    defaultEffort: nivel?.currentValue
  }))
  if (!lista.length) return
  mkdirSync(DATOS, { recursive: true })
  guardar(MODELOS, JSON.stringify(lista, null, 2))
  guardar(CUENTA, JSON.stringify({ conectada: true }))
}

const SABOR: SaborAcp = {
  nombre: 'Devin',
  prefijo: 'devin',
  lanzar() {
    if (existsSync(SALIO)) throw new Error(SIN_CUENTA)
    const exe = rutaAgente('devin')
    if (!exe) throw new Error('Devin aún no está descargado.')
    return { command: exe, args: ['acp'], env: entornoSinLlaves() }
  },
  alTexto(linea) {
    if (login && !login.url) {
      const m = ENLACE.exec(linea)
      if (m) login.url = m[0].replace(/[),.;\]]+$/, '')
    }
  },
  autenticar: 'devin-browser',
  authMeta: () => {
    const key = apiKey()
    return key ? { api_key: key } : undefined
  },
  modo: 'bypass',
  sinCuenta: SIN_CUENTA,
  alVerModelos: guardarModelos
}

export const startDevin = (opts: AgentOptions): AgentRun => startAcp(SABOR, opts)

/** Una sesión vacía de ACP: autentica, la abre y guarda los modelos que la cuenta ofrece (y la marca de cuenta). */
async function probar(vivo?: (c: Conexion) => void): Promise<void> {
  const c = conectar(SABOR, { cwd: tmpdir() } as AgentOptions)
  vivo?.(c)
  try {
    await c.ini
    const s = await c.rpc.request('session/new', { cwd: tmpdir(), mcpServers: [] }, 180_000)
    guardarModelos(s?.configOptions ?? [])
    // Si fue por el navegador, `credentials.toml` ya tiene la llave nueva: la próxima vez no hace falta el clic.
    llaveMala = false
  } finally {
    soltar(SABOR, c)
  }
}

/** Los modelos que vio la última sesión; con cuenta (o llave del Devin del usuario) y sin catálogo, una sesión de prueba. */
export async function modelosDevin(): Promise<Model[]> {
  if (!rutaAgente('devin') || existsSync(SALIO) || (!existsSync(CUENTA) && !apiKey())) return []
  try {
    const guardados: Model[] = JSON.parse(readFileSync(MODELOS, 'utf8'))
    if (guardados.length) return guardados
  } catch {
    // Nunca se vio una sesión.
  }
  try {
    await probar()
    return JSON.parse(readFileSync(MODELOS, 'utf8')) as Model[]
  } catch {
    return []
  }
}

/** La cuenta es el flujo ACP: «conectada» es tenerla marcada o la llave del Devin del usuario. */
export function cuentaDevin(): CuentaClaude {
  const conectada = !!rutaAgente('devin') && !existsSync(SALIO) && (existsSync(CUENTA) || !!apiKey()) && !login
  return {
    conectada,
    quien: conectada ? 'Cuenta de Devin' : undefined,
    conectando: login && { url: login.url },
    error: fallo || undefined
  }
}

export const conectandoDevin = () => (login ? 'Se está conectando la cuenta de Devin. Termina de autorizarla en el navegador.' : null)

/** Mientras se conecta: el enlace si el agente lo da y el proceso que espera. */
type Login = { url?: string; c?: Conexion }
let login: Login | undefined
let fallo = ''

/**
 * Conecta la cuenta: abre `devin acp` y hace `authenticate`; el propio Devin abre el navegador (o termina solo si ya
 * hay sesión de Devin/Windsurf). Al acabar, una sesión vacía dice qué modelos tiene la cuenta.
 */
export async function conectarDevin(): Promise<CuentaClaude> {
  if (login) return cuentaDevin()
  const este: Login = (login = {})
  fallo = ''
  void (async () => {
    const exe = rutaAgente('devin') ?? (await asegurarAgente('devin'))
    if (!exe) throw new Error('Devin aún no está descargado.')
    rmSync(SALIO, { force: true })
    // Con llave guardada se prueba primero (sin navegador); si ya no sirve, una vez por el flujo del navegador.
    for (let intento = 0; ; intento++) {
      try {
        await probar((c) => (este.c = c))
        return
      } catch (e) {
        if (intento === 0 && apiKey()) {
          llaveMala = true
          continue
        }
        throw e
      }
    }
  })()
    .catch((e) => {
      if (login === este) fallo = e instanceof Error ? e.message : String(e)
    })
    .finally(() => {
      if (login === este) login = undefined
    })
  return cuentaDevin()
}

/** Deja de esperar al navegador. */
export function cancelarDevin(): CuentaClaude {
  const c = login?.c
  login = undefined
  c?.rpc.close()
  return cuentaDevin()
}

/** Quita la marca de cuenta y pide reconectar la próxima vez (la credencial del Devin del usuario no se toca). */
export function salirDevin(): CuentaClaude {
  rmSync(CUENTA, { force: true })
  rmSync(MODELOS, { force: true })
  mkdirSync(DATOS, { recursive: true })
  guardar(SALIO, '')
  return cuentaDevin()
}
