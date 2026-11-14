/**
 * El cobro de Hermit: el apoyo mensual o anual con PayPal, las cuentas gratis y la clave que revisa la app
 * (`server/licencia.ts`). Hermit es gratis: el apoyo es opcional y quita el recordatorio de la app. La página
 * (myhermit.vercel.app) suscribe desde el navegador (`POST /suscribir`, que da el enlace de pago de PayPal) y,
 * pagada, `/gracias` enseña la clave y el instalador; la clave llega también por correo. La
 * app crea una cuenta gratis con su `equipo` (`plan: 'gratis'`, que da una de plan `cuenta`) para entrar a la comunidad;
 * su clave solo llega por correo (`unirse`).
 * Al abrir y cada pocas horas, Hermit pregunta cómo va su clave (`POST /licencia`). La respuesta va firmada con `FIRMA`
 * (Ed25519): Hermit la guarda y, sin internet, vale hasta su `hasta` sin que se pueda alargar a mano.
 *
 * PayPal manda: cada aviso (`POST /webhook/paypal`) y cada revisión vuelven a leer la suscripción o la orden de su API,
 * así que un aviso perdido o repetido solo cambia cuándo se entera Hermit. En D1, `licencias` (una por suscripción o
 * lugar gratis) y `equipos` (las computadoras de cada clave, `EQUIPOS` como mucho). El mensual es una suscripción
 * (`paypal`) a un plan de su monto, que se crea la primera vez (`paypal_ids`).
 *
 * El anual es una orden de PayPal (`orden`) que se cobra una vez: no se renueva sola (estado `pagado`). Cada cobro de la
 * fila suma un año, y el cron avisa antes de que se acabe con un enlace para pagar el siguiente (`/renovar`), con la
 * misma clave. Lo cobrado de cada orden se guarda en `paypal_pagos`, así que un aviso repetido no suma dos veces. La
 * orden aprobada hay que cobrarla (`capture`): lo hace quien se entere primero, `/gracias` o el aviso.
 *
 * Del 24 al 28 de octubre de 2026 también se pudo pagar con Stripe; nadie llegó a pagar y se quitó. De entonces queda
 * la columna `stripe`, vacía.
 *
 * El apoyo cuesta lo mismo para todos (`PRECIO_MENSUAL` o `PRECIO_ANUAL`). Las `FUNDADORES` primeras personas que apoyan
 * son fundadoras (`fundador`) para siempre: más beneficios que quien llega después. Cada suscripción conserva el monto
 * y la moneda con que se creó: las nuevas, en `MONEDA`.
 * Cuando Hermit se vendía, las primeras personas se unieron gratis de por vida (plan `gratis`, `GRATIS` como mucho): son
 * fundadoras como las primeras que apoyan (`esFundador`) y no tienen el recordatorio. Ya no se dan.
 *
 * También da el instalador: `GET /descargar` es la última versión, libre; la de Mac (Intel), la de Mac con Apple Silicon
 * y la de Linux, con `?so=mac`, `?so=mac-arm64` y `?so=linux` (también en `/version`). Está en R2
 * (`DESCARGAS`) y lo sube `npm run publicar` por partes, con `PUBLICAR`: pesa más de lo que aceptan wrangler (300 MiB)
 * y una petición a un Worker (100 MB). `ultima.json` dice cuál es la última. Y las actualizaciones de la app instalada
 * (electron-updater): `GET /actualizaciones/latest.yml` dice cuál es la nueva, y de su instalador baja solo los pedazos
 * que cambiaron, con el mapa de bloques de cada versión (`.blockmap`). Se quedan los mapas de todas y los últimos
 * instaladores.
 *
 * Lo que pide la Ley Federal de Protección al Consumidor (art. 76 Bis VIII y IX) para un cobro recurrente: suscribirse
 * exige aceptar el cobro automático y los términos (se guarda cuándo y qué versión), cancelar da un folio, y el cron de
 * cada mañana avisa por correo (Resend) al menos 5 días antes de cada cobro. El año pagado de una vez no tiene cobro
 * automático: se aceptan sus términos y el pago único.
 *
 * Y la comunidad (`/comunidad/*`, en `comunidad.ts`), de quien tiene una licencia activa.
 */
import type { VersionLiberable } from '../../shared/types.ts'
import { comunidad, creditos } from './comunidad.ts'

export interface Env {
  DB: D1Database
  DESCARGAS: R2Bucket
  /** La llave de `npm run publicar`. */
  PUBLICAR?: string
  /** `prueba` cobra en el sandbox de PayPal; `produccion`, de verdad. Las llaves son las de la app de PayPal de ese modo. */
  PAYPAL_MODO: 'prueba' | 'produccion'
  PAYPAL_CLIENT_ID?: string
  PAYPAL_SECRET?: string
  /** El id del webhook de esa app: con él, PayPal confirma que un aviso es suyo. */
  PAYPAL_WEBHOOK_ID?: string
  /** La llave privada Ed25519 en PKCS8 y base64. */
  FIRMA: string
  /** La dirección de este Worker, para la página a la que vuelve el cliente tras pagar. */
  ORIGEN: string
  PRECIO_MENSUAL: number
  PRECIO_ANUAL: number
  /** La moneda de esos precios, con su código de PayPal. */
  MONEDA: string
  /** Los lugares gratis de por vida que se dieron cuando Hermit se vendía: ya no se dan. */
  GRATIS: number
  /** Las primeras personas que apoyan, fundadoras (hasta `FUNDADORES_HASTA` si se pone, una fecha ISO). */
  FUNDADORES: number
  FUNDADORES_HASTA?: string
  /** Para los correos (avisos de cobro y folios). Sin ella, no se mandan: se anotan en el registro. */
  RESEND_API_KEY?: string
  /** De quién salen (`Hermit <avisos@TU-DOMINIO-VERIFICADO>`, dominio verificado en Resend) y adónde se responden. */
  CORREO_DE: string
  CORREO_RESPUESTA: string
}

/** `gratis`: un lugar gratis de por vida, de cuando Hermit se vendía; `cuenta`: una cuenta gratis, sin apoyo. */
type Plan = 'mensual' | 'anual' | 'gratis' | 'cuenta'
/**
 * `gratis` para un lugar gratis de por vida o una cuenta (para quitárselos, `cancelled`) y `pagado` para un año pagado
 * de una vez, que vale hasta `pagado_hasta` sin renovarse.
 */
export type Estado = 'pending' | 'authorized' | 'paused' | 'cancelled' | 'gratis' | 'pagado'

export interface Fila {
  id: string
  clave: string
  email: string
  plan: Plan
  monto: number
  /** La moneda de `monto`, con su código de PayPal: la de `MONEDA` al crearse. */
  moneda: string
  fundador: number
  enlace: string | null
  estado: Estado
  pagado_hasta: string | null
  autorizada: string | null
  creada: string
  revisada: string | null
  acepto: string | null
  terminos: string | null
  folio: string | null
  cancelada: string | null
  avisado_para: string | null
  /** El `PAYPAL_MODO` con que se creó. */
  modo: string
  /** La suscripción mensual de PayPal. */
  paypal: string | null
  /** Un año pagado de una vez con PayPal: la última orden que se abrió para ella. */
  orden: string | null
}

/** Lo que el cobro guarda de una suscripción o de los pagos del año. `hasta`: su próximo cobro o su fin, si se sabe. */
export interface Lectura {
  estado: Estado
  hasta?: string
}

/** Un año pagado de una vez con PayPal: no se renueva solo. */
const deUnaVez = (f: Pick<Fila, 'orden'>) => !!f.orden

/** Cuántos se han unido: los lugares gratis tomados y las suscripciones pagadas alguna vez (de ellas, las de fundador). */
export interface Cuenta {
  fundadores: number
  /** Las que apoyan hoy: pagadas y sin vencer, aunque ya cancelaran. */
  apoyan: number
}

type Tarifas = Pick<Env, 'FUNDADORES' | 'FUNDADORES_HASTA' | 'PRECIO_MENSUAL' | 'PRECIO_ANUAL' | 'MONEDA'>

/** Una suscripción de PayPal, con lo que se lee de ella. `approve` (en `links`) es adonde va el cliente. */
interface SuscripcionPaypal {
  id: string
  status: string
  plan_id?: string
  custom_id?: string
  subscriber?: { email_address?: string }
  billing_info?: { next_billing_time?: string }
  links?: { rel: string; href: string }[]
}

/** Una orden de PayPal: `payer-action` (en `links`) es adonde va el cliente; `custom_id`, su fila. */
interface OrdenPaypal {
  id: string
  status: string
  links?: { rel: string; href: string }[]
  purchase_units?: { custom_id?: string; payments?: { captures?: { status: string; amount: { value: string; currency_code: string }; create_time?: string }[] } }[]
}

/** Un aviso de PayPal: solo dice qué cambió. */
interface AvisoPaypal {
  event_type?: string
  resource?: {
    id?: string
    custom_id?: string
    billing_agreement_id?: string
    purchase_units?: { custom_id?: string }[]
    supplementary_data?: { related_ids?: { order_id?: string } }
  }
}

/** Un pago de un año pagado de una vez: lo cobrado de una orden de PayPal. */
export interface Pago {
  status: string
  transaction_amount: number
  currency_id: string
  date_approved?: string | null
}

const PAYPAL = { produccion: 'https://api-m.paypal.com', prueba: 'https://api-m.sandbox.paypal.com' }
/** Los pagos que valen: aprobados, o en reclamo mientras no se resuelva en contra (entonces pasan a `charged_back`). */
const VALEN = new Set(['approved', 'in_mediation'])
/** El estado de un cobro de PayPal, con el nombre que entiende `leerPagos`. */
const COBRO_PAYPAL: Record<string, string> = {
  COMPLETED: 'approved',
  PARTIALLY_REFUNDED: 'approved',
  PENDING: 'pending',
  REFUNDED: 'refunded',
  REVERSED: 'charged_back',
  DECLINED: 'rejected',
  FAILED: 'rejected'
}
const DIA = 24 * 3600_000
/** Sin internet, Hermit sigue abierta hasta una semana desde la última respuesta. */
const SIN_CONEXION = 7 * DIA
/** Cada cuánto se vuelve a leer de PayPal una suscripción al revisarla; pendiente, casi siempre (esperan el pago). */
const REVISAR = 6 * 3600_000
const REVISAR_PENDIENTE = 10_000
/** Las computadoras que pueden usar una clave a la vez: las que preguntaron en los últimos `VISTO`. */
const EQUIPOS = 2
const VISTO = 30 * DIA
/** Las cuentas gratis que se piden (o se vuelven a pedir) desde una misma conexión en un día. */
const CUENTAS_AL_DIA = 5
/** Los pagos que una conexión puede abrir al día (cada uno puede crear una suscripción u orden en PayPal). */
const PAGOS_AL_DIA = 20
/** 32 letras y números sin los que se confunden (0, 1, I, O). */
const ALFABETO = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
export const CLAVE = /^HERMIT(-[2-9A-HJ-NP-Z]{4}){4}$/
export const EQUIPO = /^[\w-]{8,64}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/**
 * Lo que sube `npm run publicar` de cada sistema: el instalador (el .exe de Windows, el .dmg de Mac, el AppImage de Linux),
 * el .zip con que se actualiza la de Mac, sus mapas de bloques y `latest.yml` (`latest-mac.yml`, `latest-linux.yml`), el
 * que lee electron-updater. `tipo` es lo que va tras la versión: el de cada archivo que se poda.
 */
const BINARIO = /^Hermit-(?:Setup-)?\d+\.\d+\.\d+(?<tipo>\.exe|-mac-(?:arm64|x64)\.(?:dmg|zip)|-linux-(?:arm64|x86_64)\.AppImage)$/
const AL_DIA = /^latest(-mac|-arm64-mac|-linux)?\.yml$/
const publicable = (archivo: string) => AL_DIA.test(archivo) || BINARIO.test(archivo.replace(/\.blockmap$/, ''))
/**
 * Cada sistema que se descarga (`?so=`) y dónde dice cuál es su última versión. Sin `so`, Windows. La de Mac con Apple
 * Silicon sale en su propia máquina y tiene su última aparte; `mac` es la de Intel.
 */
const ULTIMAS = { windows: 'ultima.json', mac: 'ultima-mac.json', 'mac-arm64': 'ultima-mac-arm64.json', linux: 'ultima-linux.json' } as const
/** Lo que lee electron-updater de cada sistema. */
const YML = { windows: 'latest.yml', mac: 'latest-mac.yml', 'mac-arm64': 'latest-arm64-mac.yml', linux: 'latest-linux.yml' } as const
const NOMBRES = { windows: 'Windows', mac: 'Mac con Intel', 'mac-arm64': 'Mac con Apple Silicon', linux: 'Linux' } as const
type Sistema = keyof typeof ULTIMAS
export const sistema = (so: string | null): Sistema => (so && so !== 'windows' && Object.hasOwn(ULTIMAS, so) ? (so as Sistema) : 'windows')
/** El sistema del que `archivo` es el instalador; `undefined` si no es uno (el .zip de Mac, un mapa, latest.yml). */
export function instaladorDe(archivo: string): Sistema | undefined {
  const tipo = BINARIO.exec(archivo)?.groups?.tipo
  if (tipo?.endsWith('.dmg')) return tipo.includes('arm64') ? 'mac-arm64' : 'mac'
  return tipo === '.exe' ? 'windows' : tipo?.endsWith('.AppImage') ? 'linux' : undefined
}
/** El sistema de un instalador, del .zip de Mac o de su mapa de bloques; `undefined` si no es uno. */
export function sistemaDelBinario(archivo: string): Sistema | undefined {
  const tipo = BINARIO.exec(archivo.replace(/\.blockmap$/, ''))?.groups?.tipo
  if (!tipo) return
  if (tipo === '.exe') return 'windows'
  if (tipo.endsWith('.AppImage')) return 'linux'
  return tipo.includes('arm64') ? 'mac-arm64' : 'mac'
}
/** La versión en el nombre de un archivo publicado (`0.3.4`). */
export const versionDe = (archivo: string) => /\d+\.\d+\.\d+/.exec(archivo)?.[0]
/** El sistema de un `latest*.yml`. */
export const sistemaDelYml = (archivo: string): Sistema => (Object.entries(YML).find(([, y]) => y === archivo)?.[0] as Sistema | undefined) ?? 'windows'
/** De cada tipo de archivo (el .exe, el .dmg y el .zip de Mac, el AppImage) se quedan el último y el de antes en R2, por si alguien lo está bajando al publicar. */
const INSTALADORES = 2

/**
 * De los instaladores de un tipo en R2, los que sobran: los que pasan de los `INSTALADORES` más nuevos, salvo los de
 * `guardar` (las versiones de `anterior/`, que aún se dan a quien no apoya, aunque detrás hayan salido varias).
 */
export function sobran(objetos: { key: string; uploaded: Date }[], guardar: string[]): string[] {
  return [...objetos]
    .sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime())
    .slice(INSTALADORES)
    .map((o) => o.key)
    .filter((key) => !guardar.includes(/\d+\.\d+\.\d+/.exec(key)?.[0] ?? ''))
}
/**
 * De las claves `Hermit-*` de R2, las que la poda a fondo borra: todo instalador o mapa de bloques cuya versión no
 * esté en `conservar` (la última y la `anterior/` de cada sistema). Lo que no es un binario versionado —`latest.yml`,
 * cualquier otra cosa— se queda.
 */
export function aPodar(claves: string[], conservar: ReadonlySet<string>): string[] {
  return claves.filter((k) => {
    const v = versionDe(k)
    return !!v && !conservar.has(v) && BINARIO.test(k.replace(/\.blockmap$/, ''))
  })
}
/** La versión de los términos que acepta el cliente: la fecha de su «Última actualización» (myhermit.vercel.app/terminos). */
const TERMINOS = /^\d{4}-\d{2}-\d{2}$/
/**
 * Si una fila de `licencias` hace fundadora a su correo, para siempre: un apoyo de los primeros que se llegó a pagar, o
 * un lugar gratis de por vida que sigue en pie. `t` es el nombre de la tabla en la consulta.
 */
export function esFundador(t: string) {
  return `((${t}.fundador = 1 AND ${t}.autorizada IS NOT NULL) OR (${t}.plan = 'gratis' AND ${t}.estado = 'gratis'))`
}
/** Se avisa del cobro cuando faltan esto o menos días: el cron corre cada mañana, así que el aviso llega con 6 o 7. */
const AVISO = 7 * DIA
/**
 * Cada versión nueva es primero de quien apoya (un apoyo pagado o un lugar gratis de por vida, en esa computadora), y
 * `ANTICIPO` después pasa a ser de todos. Antes de eso, a los demás se les sigue dando la anterior, que se guarda en
 * `anterior/` al publicar; el creador la da a todos antes, desde la comunidad (`/comunidad/liberar`), cuando una meta
 * del roadmap se cumple. Sin él, un arreglo urgente sale para todos de inmediato (`paraTodos` al publicar).
 */
const ANTICIPO = 7 * DIA
/** Lo que la página de Hermit llama desde el navegador. */
const PUBLICAS = new Set(['/precio', '/version', '/suscribir', '/suscripcion', '/paypal', '/creditos'])
/** Quién vende, al pie de cada correo (Ley N.º 453, de Bolivia): su nombre, domicilio y contacto están en los términos de la página, no aquí. */
const PROVEEDOR = 'Hermit, de luchodev · Quién vende, su domicilio y su contacto: https://myhermit.vercel.app/terminos'

/** `ultima.json` en `DESCARGAS`. */
interface Ultima {
  archivo: string
  version: string
  bytes: number
  publicado: string
  /** Desde cuándo la recibe todo el mundo; antes, solo quien apoya. Sin él (las de antes), ya es de todos. */
  todos?: string
  /** La de Mac, firmada y notarizada por Apple: abre a la primera, sin «Abrir de todos modos». */
  firmada?: boolean
}

export class Rechazo extends Error {
  status: number
  constructor(status: number, mensaje: string) {
    super(mensaje)
    this.status = status
  }
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url)
    if (!PUBLICAS.has(url.pathname)) return atender(req, env, ctx, url)
    // La página de Hermit (myhermit.vercel.app) enseña el precio y la versión, y suscribe: también sus errores se leen.
    const r =
      req.method === 'OPTIONS'
        ? new Response(null, { status: 204, headers: { 'access-control-allow-methods': 'GET, POST', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' } })
        : await atender(req, env, ctx, url)
    r.headers.set('access-control-allow-origin', '*')
    return r
  },

  /** Cada mañana: el aviso de los cobros que vienen. */
  async scheduled(_evento: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(avisarCobros(env).catch((e) => console.error('Avisos de cobro', e instanceof Error ? e.message : e)))
    ctx.waitUntil(env.DB.prepare('DELETE FROM cupos WHERE creado < ?').bind(new Date(Date.now() - 2 * DIA).toISOString()).run())
  }
} satisfies ExportedHandler<Env>

async function atender(req: Request, env: Env, ctx: ExecutionContext, url: URL): Promise<Response> {
  try {
    if (req.method === 'GET' && url.pathname === '/precio') return json(await precios(env))
    // Los Fundadores que pidieron salir en los créditos de la página.
    if (req.method === 'GET' && url.pathname === '/creditos') return json({ fundadores: await creditos(env) })
    if (req.method === 'GET' && url.pathname === '/version') return json(await ultimaPara(req, env, sistema(url.searchParams.get('so'))))
    if (req.method === 'GET' && url.pathname === '/ultima') return await ultimaLigera(req, env, ctx, sistema(url.searchParams.get('so')))
    if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname === '/descargar') {
      const so = sistema(url.searchParams.get('so'))
      const u = await ultimaPara(req, env, so)
      // `?so=mac` (el enlace de la página y de los correos) deja elegir entre la de Apple Silicon y la de Intel; la que
      // aún no va firmada por Apple dice antes cómo se abre la primera vez.
      if ((so === 'mac' || so === 'mac-arm64') && !url.searchParams.has('visto')) {
        const arm = so === 'mac-arm64' ? u : await ultimaPara(req, env, 'mac-arm64').catch(() => undefined)
        const intel = so === 'mac' ? u : undefined
        if ([intel, arm].some((m) => m && !m.firmada) || (intel && arm)) return avisoMac(intel, arm)
      }
      return servir(req, env, u.archivo, u.bytes, { 'content-disposition': `attachment; filename="${u.archivo}"` })
    }
    if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname.startsWith('/actualizaciones/')) return await actualizaciones(req, env, url)
    if (url.pathname.startsWith('/publicar/')) return await publicar(req, env, url)
    if (req.method === 'POST' && url.pathname === '/podar') return await podar(req, env, url.searchParams.has('seco'))
    if (req.method === 'GET' && url.pathname === '/gracias') return await gracias(env, url)
    if (req.method === 'GET' && url.pathname === '/renovar') return await renovacion(env, url)
    if (req.method === 'POST' && url.pathname === '/webhook/paypal') return await webhookPaypal(req, env, ctx)
    if (req.method === 'GET' && url.pathname === '/paypal') return json(await configPaypal(env))
    if (req.method === 'POST' && url.pathname === '/suscribir') return await suscribir(env, await cuerpo(req), await conexion(req))
    if (req.method === 'POST' && url.pathname === '/suscripcion') return await suscripcion(env, await cuerpo(req), await conexion(req))
    if (req.method === 'POST' && url.pathname === '/licencia') return await licencia(env, await cuerpo(req))
    if (req.method === 'POST' && url.pathname === '/cancelar') return await cancelar(env, await cuerpo(req))
    if (req.method === 'POST' && url.pathname === '/pago') return await pago(env, await cuerpo(req))
    if (req.method === 'POST' && url.pathname === '/admin/apoyo') return await apoyoManual(req, env)
    if (url.pathname === '/comunidad' || url.pathname.startsWith('/comunidad/')) return await comunidad(req, env, url)
    return json({ error: 'No existe' }, 404)
  } catch (error) {
    if (error instanceof Rechazo) return json({ error: error.message }, error.status)
    console.error(url.pathname, error instanceof Error ? error.message : error)
    return json({ error: 'Algo falló en el cobro de Hermit. Intenta otra vez en un momento.' }, 500)
  }
}

async function ultima(env: Env, so: Sistema = 'windows'): Promise<Ultima> {
  const u = await env.DESCARGAS.get(ULTIMAS[so])
  if (!u) throw new Rechazo(404, so === 'windows' ? 'Todavía no hay una versión de Hermit para descargar.' : `Todavía no hay una versión de Hermit para ${NOMBRES[so]}.`)
  return u.json<Ultima>()
}

/** Cuánto guarda la caché `/ultima`: la piden todas las apps abiertas cada pocos minutos. */
const ULTIMA_EN_CACHE = 30

/**
 * El vistazo de la app instalada (electron/main.ts): la última versión de `so`. Si cambia (salió una), la app pregunta
 * por ella de inmediato. Es igual para todos: va en caché.
 */
async function ultimaLigera(req: Request, env: Env, ctx: ExecutionContext, so: Sistema): Promise<Response> {
  const cache = typeof caches === 'undefined' ? undefined : caches.default
  const llave = new Request(new URL(`/ultima?so=${so}`, req.url))
  const guardada = await cache?.match(llave)
  if (guardada) return guardada
  const u = await (await env.DESCARGAS.get(ULTIMAS[so]))?.json<Ultima>()
  const r = json(u ? { version: u.version, ...(u.todos ? { todos: u.todos } : {}) } : {}, 200, { 'cache-control': `public, max-age=${ULTIMA_EN_CACHE}` })
  if (cache) ctx.waitUntil(cache.put(llave, r.clone()))
  return r
}

/** Si `u` ya es de todos (`todos` pasó o no lo tiene). */
export const deTodos = (u: Pick<Ultima, 'todos'>, ahora = Date.now()) => !u.todos || ahora >= Date.parse(u.todos)

/** `u`, de todos desde `ahora` si aún era solo de quien apoya; si ya lo era, igual. */
export const liberada = <U extends Pick<Ultima, 'todos'>>(u: U, ahora: string): U => (deTodos(u, Date.parse(ahora)) ? u : { ...u, todos: ahora })

/**
 * Para el creador (`/comunidad/liberar`): la última versión de cada sistema y, si aún es solo de quien apoya, desde
 * cuándo será de todos. Con `liberar`, lo es ya: cuando una meta del roadmap se cumple. No hay que compilar nada; las
 * apps abiertas lo ven en su siguiente vistazo a `/ultima`.
 */
export async function liberar(env: Env, liberar: boolean): Promise<VersionLiberable[]> {
  const ahora = new Date().toISOString()
  const sistemas = await Promise.all(
    (Object.keys(ULTIMAS) as Sistema[]).map(async (so) => {
      const u = await (await env.DESCARGAS.get(ULTIMAS[so]))?.json<Ultima>()
      if (!u) return
      const nueva = liberar ? liberada(u, ahora) : u
      if (nueva !== u) await env.DESCARGAS.put(ULTIMAS[so], JSON.stringify(nueva), { httpMetadata: { contentType: 'application/json' } })
      return { so, version: nueva.version, ...(deTodos(nueva) ? {} : { todos: nueva.todos }) }
    })
  )
  return sistemas.filter((s) => s !== undefined)
}

/**
 * Si quien pregunta apoya hoy: la app manda su clave y su computadora (`x-hermit-clave`, `x-hermit-equipo`), y la clave
 * es de un apoyo vigente (mensual, anual o un lugar gratis de por vida), en esa computadora.
 */
async function apoya(req: Request, env: Env): Promise<boolean> {
  const clave = (req.headers.get('x-hermit-clave') ?? '').replace(/\s+/g, '').toUpperCase()
  const equipo = req.headers.get('x-hermit-equipo') ?? ''
  if (!CLAVE.test(clave) || !EQUIPO.test(equipo)) return false
  const f = await env.DB.prepare("SELECT l.estado, l.pagado_hasta FROM licencias l JOIN equipos e ON e.clave = l.clave WHERE l.clave = ? AND e.equipo = ? AND l.plan IN ('mensual', 'anual', 'gratis')")
    .bind(clave, equipo)
    .first<Pick<Fila, 'estado' | 'pagado_hasta'>>()
  return !!f && vigencia(f, Date.now()).activa
}

/** La llave de publicar: la del creador. Con ella, siempre la última versión. */
const conLlave = (req: Request, env: Env) => !!env.PUBLICAR && iguales(req.headers.get('authorization') ?? '', `Bearer ${env.PUBLICAR}`)
const delCreador = (req: Request, env: Env) => conLlave(req, env)

/**
 * La versión que le toca a quien pregunta: la última, o la anterior si la última todavía es solo de quien apoya; entonces
 * `nueva` dice cuál es esa, para que la página la enseñe. Con la llave de publicar, siempre la última: de ella
 * sale el número de la siguiente (scripts/version-venta.mjs).
 */
async function ultimaPara(req: Request, env: Env, so: Sistema): Promise<Ultima & { nueva?: string }> {
  const u = await ultima(env, so)
  if (deTodos(u) || delCreador(req, env) || (await apoya(req, env))) return u
  const anterior = await anteriorDe(env, so)
  if (anterior) return { ...anterior, nueva: u.version }
  // Sin el instalador de la anterior, la última ya se le da a todos: sin `todos`, que diría que aún no.
  const { todos: _, ...deTodas } = u
  return deTodas
}

/** La versión de antes de `so`, la que se da a quien no apoya, si su instalador sigue en R2; si no, a todos la última. */
async function anteriorDe(env: Env, so: Sistema): Promise<Ultima | undefined> {
  const a = await (await env.DESCARGAS.get(`anterior/${ULTIMAS[so]}`))?.json<Ultima>()
  return a && (await env.DESCARGAS.head(a.archivo)) ? a : undefined
}

/**
 * Lo que pide electron-updater: `latest.yml`, que nunca se guarda en caché, y los instaladores y sus mapas por pedazos.
 * Mientras la última sea solo de quien apoya, a los demás se les da el `latest.yml` de la anterior, y los archivos de la
 * última no: con el número de `/ultima`, que es público, cualquiera armaría su nombre.
 */
async function actualizaciones(req: Request, env: Env, url: URL): Promise<Response> {
  const archivo = decodeURIComponent(url.pathname.slice('/actualizaciones/'.length))
  if (!publicable(archivo)) throw new Rechazo(404, 'No existe')
  const yml = AL_DIA.test(archivo)
  let llave = archivo
  const so = yml ? sistemaDelYml(archivo) : sistemaDelBinario(archivo)
  const u = so && (await (await env.DESCARGAS.get(ULTIMAS[so]))?.json<Ultima>())
  const deQuienApoya = !!u && !deTodos(u) && (yml || versionDe(archivo) === u.version)
  if (so && deQuienApoya && !delCreador(req, env) && !(await apoya(req, env)) && (await anteriorDe(env, so))) {
    if (!yml) throw new Rechazo(404, 'No existe')
    if (await env.DESCARGAS.head(`anterior/${archivo}`)) llave = `anterior/${archivo}`
  }
  const cabeza = await env.DESCARGAS.head(llave)
  if (!cabeza) throw new Rechazo(404, 'No existe')
  return servir(req, env, llave, cabeza.size, yml ? { 'content-type': 'text/yaml; charset=utf-8', 'cache-control': 'no-store' } : {})
}

/** Un archivo de `DESCARGAS`, entero o el pedazo que pide `Range`. */
export async function servir(req: Request, env: Env, archivo: string, bytes: number, extra: Record<string, string>): Promise<Response> {
  const rango = rangoDe(req.headers.get('range'), bytes)
  const cabeceras = new Headers({
    'content-type': 'application/octet-stream',
    'accept-ranges': 'bytes',
    'content-length': String(rango ? rango.length : bytes),
    ...extra
  })
  if (rango) cabeceras.set('content-range', `bytes ${rango.offset}-${rango.offset + rango.length - 1}/${bytes}`)
  const status = rango ? 206 : 200
  if (req.method === 'HEAD') return new Response(null, { status, headers: cabeceras })
  const obj = await env.DESCARGAS.get(archivo, rango ? { range: rango } : undefined)
  if (!obj) throw new Rechazo(404, 'No se encontró el archivo.')
  cabeceras.set('etag', obj.httpEtag)
  return new Response(obj.body, { status, headers: cabeceras })
}

/** `bytes=100-199`, `bytes=100-` o `bytes=-50`, dentro del archivo. Uno que no se entiende se ignora: va entero. */
export function rangoDe(cabecera: string | null, bytes: number): { offset: number; length: number } | undefined {
  const m = /^bytes=(\d*)-(\d*)$/.exec(cabecera?.trim() ?? '')
  if (!m || (!m[1] && !m[2])) return
  const desde = m[1] ? Number(m[1]) : Math.max(0, bytes - Number(m[2]))
  const hasta = m[1] && m[2] ? Math.min(Number(m[2]), bytes - 1) : bytes - 1
  if (desde > hasta) return
  return { offset: desde, length: hasta - desde + 1 }
}

/**
 * La subida por partes de `scripts/publicar.mjs`: `inicio` la abre, cada `parte` (`?n=1`, `2`…) lleva un pedazo y
 * `fin` la cierra. Un instalador, al cerrarse, pasa a ser el último de su sistema (`ULTIMAS`), y de cada tipo de archivo
 * quedan solo `INSTALADORES` en R2.
 * Las subidas que no terminan, R2 las borra solas a la semana.
 */
async function publicar(req: Request, env: Env, url: URL): Promise<Response> {
  if (!conLlave(req, env)) throw new Rechazo(401, 'No autorizado.')
  const archivo = url.searchParams.get('archivo') ?? ''
  if (!publicable(archivo)) throw new Rechazo(400, 'El archivo debe ser un instalador de Hermit (.exe, .dmg, .zip de Mac o .AppImage), su .blockmap o latest.yml.')
  if (req.method === 'POST' && url.pathname === '/publicar/inicio')
    return json({ upload: (await env.DESCARGAS.createMultipartUpload(archivo, { httpMetadata: { contentType: 'application/octet-stream' } })).uploadId })
  const subida = env.DESCARGAS.resumeMultipartUpload(archivo, url.searchParams.get('upload') ?? '')
  if (req.method === 'PUT' && url.pathname === '/publicar/parte') {
    const n = Number(url.searchParams.get('n'))
    if (!Number.isInteger(n) || n < 1 || !req.body) throw new Rechazo(400, 'Parte inválida.')
    return json(await subida.uploadPart(n, req.body))
  }
  if (req.method === 'POST' && url.pathname === '/publicar/fin') {
    const { partes, version, paraTodos, firmada } = (await cuerpo(req)) as { partes: R2UploadedPart[]; version: string; paraTodos?: boolean; firmada?: boolean }
    const so = instaladorDe(archivo)
    const previa = so ? await (await env.DESCARGAS.get(ULTIMAS[so]))?.json<Ultima>() : undefined
    // macOS solo pone encima una versión firmada por el mismo equipo de Apple: una sin firma dejaría a todos sin actualizar.
    if (previa?.firmada && !firmada) throw new Rechazo(409, `La última de ${NOMBRES[so!]} va firmada por Apple: una sin firma no se podría poner encima. Faltan los secretos de Apple en GitHub.`)
    if (so && previa && previa.version !== String(version) && (deTodos(previa) || !(await anteriorDe(env, so)))) {
      const yml = YML[so]
      const actual = await env.DESCARGAS.get(yml)
      // Sin `todos`: la anterior ya es de todos, aunque su fecha no hubiera llegado.
      const { todos: _, ...anterior } = previa
      await env.DESCARGAS.put(`anterior/${ULTIMAS[so]}`, JSON.stringify(anterior), { httpMetadata: { contentType: 'application/json' } })
      if (actual) await env.DESCARGAS.put(`anterior/${yml}`, await actual.arrayBuffer(), { httpMetadata: { contentType: 'text/yaml; charset=utf-8' } })
    }
    const obj = await subida.complete(partes)
    const tipo = BINARIO.exec(archivo)?.groups?.tipo
    if (tipo) {
      const iguales = (await env.DESCARGAS.list({ prefix: 'Hermit-' })).objects.filter((o) => BINARIO.exec(o.key)?.groups?.tipo === tipo)
      const anteriores = await Promise.all(Object.values(ULTIMAS).map(async (n) => (await (await env.DESCARGAS.get(`anterior/${n}`))?.json<Ultima>())?.version))
      const viejos = sobran(iguales, anteriores.filter((v) => v !== undefined))
      if (viejos.length) await env.DESCARGAS.delete(viejos)
    }
    if (!so) return json({ archivo, bytes: obj.size })
    // La misma versión otra vez (se volvió a publicar) conserva cuándo salió; una nueva es de quien apoya `ANTICIPO`.
    const misma = previa?.version === String(version)
    const publicado = misma ? previa.publicado : new Date().toISOString()
    const todos = paraTodos ? undefined : misma ? previa.todos : new Date(Date.parse(publicado) + ANTICIPO).toISOString()
    const u: Ultima = { archivo, version: String(version), bytes: obj.size, publicado, ...(todos ? { todos } : {}), ...(firmada ? { firmada: true } : {}) }
    await env.DESCARGAS.put(ULTIMAS[so], JSON.stringify(u), { httpMetadata: { contentType: 'application/json' } })
    return json(u)
  }
  throw new Rechazo(404, 'No existe')
}

/**
 * La poda a fondo (`POST /podar`, con la llave PUBLICAR): deja en R2 solo lo que se sirve —la última versión y la
 * `anterior/` de cada sistema, con sus mapas de bloques— y borra todo instalador versionado de más, también los
 * `.blockmap`, que la poda de cada publicación no toca. La corre `node scripts/podar.mjs`; no hace falta en cada
 * versión, pero deja el bucket en lo justo.
 */
async function podar(req: Request, env: Env, seco: boolean): Promise<Response> {
  if (!conLlave(req, env)) throw new Rechazo(401, 'No autorizado.')
  const conservar = new Set<string>()
  for (const so of Object.keys(ULTIMAS) as Sistema[]) {
    const u = await (await env.DESCARGAS.get(ULTIMAS[so]))?.json<Ultima>()
    const a = await anteriorDe(env, so)
    if (u?.version) conservar.add(u.version)
    if (a?.version) conservar.add(a.version)
  }
  if (!conservar.size) throw new Rechazo(409, 'No hay versiones registradas: no se poda un bucket vacío.')
  const tamaños = new Map<string, number>()
  let cursor: string | undefined
  do {
    const p = await env.DESCARGAS.list({ prefix: 'Hermit-', cursor })
    for (const o of p.objects) tamaños.set(o.key, o.size)
    cursor = p.truncated ? p.cursor : undefined
  } while (cursor)
  const borrados = aPodar([...tamaños.keys()], conservar)
  const bytes = borrados.reduce((s, k) => s + (tamaños.get(k) ?? 0), 0)
  if (seco) return json({ conservar: [...conservar].sort(), archivos: borrados.length, mb: Math.round(bytes / 1048576), claves: borrados })
  for (let i = 0; i < borrados.length; i += 1000) await env.DESCARGAS.delete(borrados.slice(i, i + 1000))
  return json({ conservar: [...conservar].sort(), archivos: borrados.length, mb: Math.round(bytes / 1048576) })
}

/** El precio de hoy. Las suscripciones de prueba y las cuentas gratis no cuentan: solo las pagadas de verdad y los lugares gratis de por vida. */
async function precios(env: Env) {
  const c = await env.DB.prepare(
    `SELECT COUNT(CASE WHEN autorizada IS NOT NULL AND fundador = 1 THEN 1 END) AS fundadores,
            COUNT(CASE WHEN julianday(pagado_hasta) > julianday('now') THEN 1 END) AS apoyan
     FROM licencias WHERE plan IN ('mensual', 'anual') AND modo = 'produccion'`
  ).first<Cuenta>()
  return tarifa(c ?? { fundadores: 0, apoyan: 0 }, env)
}

/** El precio, el mismo para todos. `quedan`: los lugares de fundador que quedan; `apoyan`, para las metas del roadmap. */
export function tarifa(c: Cuenta, env: Tarifas, ahora = Date.now()) {
  const abierto = !env.FUNDADORES_HASTA || ahora < Date.parse(env.FUNDADORES_HASTA)
  return {
    quedan: abierto ? Math.max(0, Number(env.FUNDADORES) - c.fundadores) : 0,
    mensual: Number(env.PRECIO_MENSUAL),
    anual: Number(env.PRECIO_ANUAL),
    moneda: env.MONEDA,
    apoyan: c.apoyan
  }
}

/**
 * Crea la suscripción mensual en PayPal, o la orden del año, pendiente de pago, y da el enlace donde el cliente paga. Desde la página, sin `equipo`, nada más: la clave se ve en `/gracias` cuando se confirma el pago, nunca antes, porque cualquiera puede
 * escribir el correo de otro. Desde la app de antes, con su `equipo`, también la clave, que espera el pago. Con `plan`
 * `gratis`, una cuenta gratis (solo desde la app): la clave, ya activa.
 */
async function suscribir(env: Env, c: Record<string, unknown>, desde: string): Promise<Response> {
  const email = String(c.email ?? '').trim().toLowerCase()
  if (!EMAIL.test(email) || email.length > 254) throw new Rechazo(400, 'Escribe un correo válido.')
  const plan: Plan = c.plan === 'gratis' ? 'gratis' : c.plan === 'anual' ? 'anual' : 'mensual'
  const equipo = c.equipo === undefined && plan !== 'gratis' ? undefined : equipoDe(c)
  // El consentimiento expreso de los términos y, si se paga, del cobro automático (Ley N.º 453, Bolivia), con la versión aceptada.
  // La versión publicada la manda la página (`TERMINOS` en landing/lib/cobro.ts); la app no la fija y no manda ninguna, así
  // que vale el día en que aceptó. Una versión vieja se sigue aceptando: solo se comprueba que sea una fecha.
  const acepto = new Date().toISOString()
  const terminos = String(c.terminos ?? '') || acepto.slice(0, 10)
  if (c.acepto !== true || !TERMINOS.test(terminos))
    throw new Rechazo(400, plan === 'gratis' ? 'Para unirte, acepta los términos.' : 'Para suscribirte, acepta el cobro automático y los términos.')
  if (plan === 'gratis') return unirse(env, email, equipo!, acepto, terminos, desde, c.porCorreo === true)
  if (!(await cupo(env, desde, 'pago', PAGOS_AL_DIA))) throw new Rechazo(429, 'Desde esta conexión ya se hicieron muchos pagos hoy. Prueba mañana.')
  // Con una ya pagada, otra cobraría dos veces; con un lugar gratis de por vida, no hace falta. Con una cuenta, sí se apoya.
  await sinOtra(env, email, true)
  const p = await precios(env)
  // Un doble clic, o volver a abrir el pago: la misma suscripción pendiente de la última hora, si sigue en la moneda de hoy.
  const previa = await env.DB.prepare(
    "SELECT * FROM licencias WHERE email = ? AND plan = ? AND moneda = ? AND estado = 'pending' AND enlace IS NOT NULL AND (paypal IS NOT NULL OR orden IS NOT NULL) AND creada > ? ORDER BY creada DESC LIMIT 1"
  )
    .bind(email, plan, p.moneda, new Date(Date.now() - 3600_000).toISOString())
    .first<Fila>()
  if (previa) {
    await env.DB.prepare('UPDATE licencias SET acepto = ?, terminos = ? WHERE id = ?').bind(acepto, terminos, previa.id).run()
    return json(equipo ? { clave: previa.clave, enlace: previa.enlace } : { enlace: previa.enlace })
  }

  const fila = await crearPendiente(env, email, plan, p, acepto, terminos)
  // Dónde se paga y en qué columna queda: la orden del año o la suscripción mensual.
  let abierto: { columna: 'orden' | 'paypal'; id: string; enlace: string }
  try {
    abierto = plan === 'anual' ? { columna: 'orden', ...(await ordenPaypal(env, fila)) } : { columna: 'paypal', ...(await suscripcionPaypal(env, fila)) }
  } catch (error) {
    await env.DB.prepare('DELETE FROM licencias WHERE id = ?').bind(fila.id).run()
    throw error instanceof Rechazo ? new Rechazo(502, 'PayPal no pudo abrir el pago. Revisa tu correo e intenta otra vez.') : error
  }
  await env.DB.prepare(`UPDATE licencias SET ${abierto.columna} = ?, enlace = ?, revisada = ? WHERE id = ?`)
    .bind(abierto.id, abierto.enlace ?? null, new Date().toISOString(), fila.id)
    .run()
  if (!equipo) return json({ enlace: abierto.enlace })
  await recordarEquipo(env, fila.clave, equipo, Date.now())
  return json({ clave: fila.clave, enlace: abierto.enlace })
}

/** La fila `pending` de un apoyo por PayPal, antes de abrir su cobro (orden del año o suscripción mensual). */
async function crearPendiente(env: Env, email: string, plan: 'mensual' | 'anual', p: Awaited<ReturnType<typeof precios>>, acepto: string, terminos: string): Promise<Fila> {
  const fila: Fila = {
    id: crypto.randomUUID(),
    clave: nuevaClave(),
    email,
    plan,
    monto: plan === 'anual' ? p.anual : p.mensual,
    moneda: p.moneda,
    fundador: p.quedan > 0 ? 1 : 0,
    enlace: null,
    estado: 'pending',
    pagado_hasta: null,
    autorizada: null,
    creada: acepto,
    revisada: null,
    acepto,
    terminos,
    folio: null,
    cancelada: null,
    avisado_para: null,
    modo: env.PAYPAL_MODO,
    paypal: null,
    orden: null
  }
  await env.DB.prepare('INSERT INTO licencias (id, clave, email, plan, monto, moneda, fundador, estado, creada, acepto, terminos, modo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(fila.id, fila.clave, email, plan, fila.monto, fila.moneda, fila.fundador, fila.estado, fila.creada, acepto, terminos, fila.modo)
    .run()
  return fila
}

/**
 * Lo que el botón de PayPal de la página necesita para abrirse ahí mismo: el client id (público por diseño, va en el
 * JavaScript de cualquier sitio que cobre con PayPal) y el plan mensual. El año sigue con su orden y su enlace.
 */
async function configPaypal(env: Env) {
  const plan = await idPaypal(env, `${env.PAYPAL_MODO}:mensual:${env.MONEDA}:${Number(env.PRECIO_MENSUAL)}`)
  if (!plan || !env.PAYPAL_CLIENT_ID) throw new Rechazo(503, 'El pago con PayPal no está disponible ahora. Intenta en un rato.')
  return { client_id: env.PAYPAL_CLIENT_ID, plan }
}

/**
 * Registra la suscripción mensual que el botón de PayPal de la página acaba de aprobar: la fila queda pendiente y la
 * clave se da en `/gracias` cuando PayPal la confirme, igual que con el enlace. Antes se comprueba en PayPal que sea
 * nuestro plan y que no esté cancelada ni vencida; si ya estaba registrada (un reintento del botón), la misma fila.
 */
async function suscripcion(env: Env, c: Record<string, unknown>, desde: string): Promise<Response> {
  const email = String(c.email ?? '').trim().toLowerCase()
  if (!EMAIL.test(email) || email.length > 254) throw new Rechazo(400, 'Escribe un correo válido.')
  const acepto = new Date().toISOString()
  const terminos = String(c.terminos ?? '') || acepto.slice(0, 10)
  if (c.acepto !== true || !TERMINOS.test(terminos))
    throw new Rechazo(400, 'Para suscribirte, acepta el cobro automático y los términos.')
  const id = String(c.suscripcion ?? '')
  if (!/^I-[A-Z0-9]+$/i.test(id)) throw new Rechazo(400, 'Suscripción inválida.')
  if (!(await cupo(env, desde, 'pago', PAGOS_AL_DIA))) throw new Rechazo(429, 'Desde esta conexión ya se hicieron muchos pagos hoy. Prueba mañana.')
  const ya = await env.DB.prepare('SELECT id FROM licencias WHERE paypal = ?').bind(id).first<{ id: string }>()
  if (ya) return json({ id: ya.id })
  // Si ya hay un apoyo activo con ese correo no se registra otra: la recién aprobada se cancela en PayPal para que no
  // cobre todos los meses sin fila que la respalde.
  try {
    await sinOtra(env, email, true)
  } catch (error) {
    await paypal(env, 'POST', `/v1/billing/subscriptions/${id}/cancel`, { reason: 'Ya tiene otra suscripción de Hermit' }).catch(() => {})
    throw error
  }
  const p = await precios(env)
  const s = await paypal<SuscripcionPaypal>(env, 'GET', `/v1/billing/subscriptions/${id}`)
  if (s.plan_id !== (await planPaypal(env, p.mensual, p.moneda))) throw new Rechazo(400, 'Esa suscripción no es del plan de Hermit.')
  if (s.status !== 'ACTIVE' && s.status !== 'APPROVAL_PENDING') throw new Rechazo(400, 'Esa suscripción ya no está vigente. Vuelve a pagarla desde la página.')
  const pagador = s.subscriber?.email_address?.trim().toLowerCase()
  if (pagador && pagador !== email) throw new Rechazo(400, 'La suscripción está a nombre de otro correo.')
  const fila = await crearPendiente(env, email, 'mensual', p, acepto, terminos)
  await env.DB.prepare('UPDATE licencias SET paypal = ?, revisada = ? WHERE id = ?').bind(id, new Date().toISOString(), fila.id).run()
  return json({ id: fila.id })
}

/** La página de PayPal en español, sin dirección de envío, y de vuelta a `/gracias` al pagar o al salir. */
function experiencia(env: Env, f: Fila, accion: 'PAY_NOW' | 'SUBSCRIBE_NOW') {
  const vuelta = `${env.ORIGEN}/gracias?s=${f.id}`
  return { brand_name: 'Hermit', locale: 'es-XL', shipping_preference: 'NO_SHIPPING', user_action: accion, return_url: vuelta, cancel_url: vuelta }
}

/** El enlace `rel` de lo que dio PayPal. */
function enlacePaypal(links: { rel: string; href: string }[] | undefined, rel: string): string {
  const href = links?.find((l) => l.rel === rel)?.href
  if (!href) throw new Rechazo(502, `PayPal no dio el enlace ${rel}`)
  return href
}

/** La suscripción mensual en PayPal, al plan de su monto. Lleva la fila en `custom_id`. */
async function suscripcionPaypal(env: Env, f: Fila): Promise<{ id: string; enlace: string }> {
  const s = await paypal<SuscripcionPaypal>(env, 'POST', '/v1/billing/subscriptions', {
    plan_id: await planPaypal(env, f.monto, f.moneda),
    custom_id: f.id,
    subscriber: { email_address: f.email },
    application_context: experiencia(env, f, 'SUBSCRIBE_NOW')
  })
  return { id: s.id, enlace: enlacePaypal(s.links, 'approve') }
}

/** Un año pagado de una vez: una orden de PayPal con la fila en `custom_id`, que se cobra cuando el cliente la aprueba. */
async function ordenPaypal(env: Env, f: Fila): Promise<{ id: string; enlace: string }> {
  const o = await paypal<OrdenPaypal>(env, 'POST', '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{ custom_id: f.id, description: 'Hermit - plan anual', soft_descriptor: 'HERMIT', amount: { currency_code: f.moneda, value: f.monto.toFixed(2) } }],
    payment_source: { paypal: { experience_context: experiencia(env, f, 'PAY_NOW') } }
  })
  return { id: o.id, enlace: enlacePaypal(o.links, 'payer-action') }
}

/** El plan mensual de PayPal de `monto` en `moneda`, que se crea la primera vez (y el producto «Hermit», también una vez). */
async function planPaypal(env: Env, monto: number, moneda: string): Promise<string> {
  const llave = `${env.PAYPAL_MODO}:mensual:${moneda}:${monto}`
  const plan = await idPaypal(env, llave)
  if (plan) return plan
  const deProducto = `${env.PAYPAL_MODO}:producto`
  const producto =
    (await idPaypal(env, deProducto)) ??
    (await guardarIdPaypal(env, deProducto, (await paypal<{ id: string }>(env, 'POST', '/v1/catalogs/products', { name: 'Hermit', type: 'SERVICE', category: 'SOFTWARE' })).id))
  const nuevo = await paypal<{ id: string }>(env, 'POST', '/v1/billing/plans', {
    product_id: producto,
    name: 'Hermit - plan mensual',
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency: { interval_unit: 'MONTH', interval_count: 1 },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: monto.toFixed(2), currency_code: moneda } }
      }
    ],
    // Un cobro que falla se reintenta; tras tres, PayPal la suspende (`paused`) y vale hasta lo pagado.
    payment_preferences: { auto_bill_outstanding: true, payment_failure_threshold: 3 }
  })
  return guardarIdPaypal(env, llave, nuevo.id)
}

async function idPaypal(env: Env, llave: string): Promise<string | undefined> {
  return (await env.DB.prepare('SELECT id FROM paypal_ids WHERE llave = ?').bind(llave).first<{ id: string }>())?.id
}

/** Guarda el id, o se queda con el que otra petición guardó antes. */
async function guardarIdPaypal(env: Env, llave: string, id: string): Promise<string> {
  await env.DB.prepare('INSERT OR IGNORE INTO paypal_ids (llave, id) VALUES (?, ?)').bind(llave, id).run()
  return (await idPaypal(env, llave)) ?? id
}

/**
 * Abre el pago del año siguiente de un año pagado de una vez: la misma fila y la misma clave. Antes guarda lo cobrado
 * de la orden que deja de ser la última. Da adónde ir a pagar.
 */
async function renovar(env: Env, f: Fila): Promise<string> {
  if (f.orden) await cobrarOrden(env, f, f.orden)
  const o = await ordenPaypal(env, f)
  await env.DB.prepare('UPDATE licencias SET orden = ?, enlace = ? WHERE id = ?').bind(o.id, o.enlace, f.id).run()
  return o.enlace
}

/**
 * Una cuenta gratis, para la comunidad, activa desde ya. Su clave solo va al correo: así cada cuenta es de un correo
 * de verdad, y quien escribe uno ajeno no entra. Pedirla otra vez la vuelve a mandar. La misma computadora (reinstaló
 * Hermit) recupera la suya, y también un lugar gratis de por vida que ya tuviera. `desde` (su conexión) pide pocas al
 * día. La app de antes no manda `porCorreo` y espera la clave: se le dice dónde escribirla.
 */
async function unirse(env: Env, email: string, equipo: string, acepto: string, terminos: string, desde: string, porCorreo: boolean): Promise<Response> {
  const suya = await env.DB.prepare("SELECT l.clave FROM licencias l JOIN equipos e ON e.clave = l.clave WHERE e.equipo = ? AND l.estado = 'gratis' LIMIT 1")
    .bind(equipo)
    .first<{ clave: string }>()
  if (suya) return json({ clave: suya.clave })
  if (!(await cupo(env, desde, 'cuenta', CUENTAS_AL_DIA))) throw new Rechazo(429, 'Desde esta conexión ya se pidieron muchas cuentas hoy. Prueba mañana.')
  let clave = (await env.DB.prepare("SELECT clave FROM licencias WHERE email = ? AND plan = 'cuenta' AND estado = 'gratis' LIMIT 1").bind(email).first<{ clave: string }>())?.clave
  if (!clave) {
    await sinOtra(env, email, false)
    clave = nuevaClave()
    await env.DB.prepare(
      `INSERT INTO licencias (id, clave, email, plan, monto, fundador, estado, autorizada, creada, acepto, terminos, modo)
       VALUES (?, ?, ?, 'cuenta', 0, 0, 'gratis', ?, ?, ?, ?, ?)`
    )
      .bind(crypto.randomUUID(), clave, email, acepto, acepto, acepto, terminos, env.PAYPAL_MODO)
      .run()
  }
  const enviada = await correo(env, email, 'Tu cuenta de Hermit', [
    'Hola:',
    'Ya tienes tu cuenta de Hermit: con ella entras a la comunidad. Hermit es gratis y lo seguirá siendo.',
    `Tu clave es ${clave}. Escríbela en Hermit para entrar, y guárdala: con ella entras desde otra computadora (dos a la vez). También queda en Opciones de Hermit.`,
    'Hermit trabaja con tu propia cuenta de IA (Claude, ChatGPT, Gemini, Devin y más), que pagas aparte a su proveedor. Si tienes dudas, responde a este correo.'
  ]).catch((e) => (console.error('Correo de la cuenta', e instanceof Error ? e.message : e), false))
  if (!enviada) throw new Rechazo(502, 'No pudimos mandarte el correo con tu clave. Prueba en un rato.')
  if (!porCorreo) throw new Rechazo(409, `Te mandamos tu clave a ${email}. Escríbela en Opciones de Hermit, en «Ya apoyo».`)
  return json({ enviada: true })
}

/**
 * Un correo con un apoyo activo (también un año pagado que no se acaba) o con un lugar gratis de por vida no se
 * suscribe ni se une otra vez. Con una cuenta gratis, sí apoya (`apoyar`), pero no abre otra cuenta.
 */
async function sinOtra(env: Env, email: string, apoyar: boolean) {
  const { results } = await env.DB.prepare(
    "SELECT plan, estado FROM licencias WHERE email = ? AND (estado IN ('authorized', 'gratis') OR (estado = 'pagado' AND julianday(pagado_hasta) > julianday('now')))"
  )
    .bind(email)
    .all<Pick<Fila, 'plan' | 'estado'>>()
  if (results.some((f) => f.plan === 'gratis'))
    throw new Rechazo(409, 'Ese correo ya tiene Hermit gratis de por vida. Usa su clave: está en Opciones de Hermit, en la computadora donde te uniste.')
  if (results.some((f) => f.estado === 'authorized' || f.estado === 'pagado'))
    throw new Rechazo(409, 'Ya hay un apoyo activo con ese correo. Usa su clave: te la mandamos por correo y está en Opciones de Hermit.')
  if (!apoyar && results.length) throw new Rechazo(409, 'Ese correo ya tiene una cuenta de Hermit. Su clave te llegó por correo, en «Tu cuenta de Hermit».')
}

/** Si la clave sigue activa en esta computadora, firmado. Lee la suscripción o los pagos de PayPal si hace rato que no. */
async function licencia(env: Env, c: Record<string, unknown>): Promise<Response> {
  const equipo = equipoDe(c)
  let fila = await porClave(env, c.clave)
  const ahora = Date.now()
  const revisada = fila.revisada ? Date.parse(fila.revisada) : 0
  // Si PayPal no contesta, vale lo último que dijo.
  if ((fila.paypal || deUnaVez(fila)) && ahora - revisada > (fila.estado === 'pending' ? REVISAR_PENDIENTE : REVISAR))
    fila = await refrescar(env, fila).catch(() => fila)
  if (!(await recordarEquipo(env, fila.clave, equipo, ahora)))
    throw new Rechazo(409, `Esta clave ya se usa en ${EQUIPOS} computadoras. Si cambiaste de computadora, escríbenos y la liberamos.`)
  return firmada(env, fila, equipo, ahora)
}

/** Cancela la suscripción en PayPal. Lo ya pagado sigue valiendo hasta su fecha. */
async function cancelar(env: Env, c: Record<string, unknown>): Promise<Response> {
  const equipo = equipoDe(c)
  let fila = await porClave(env, c.clave)
  if (fila.paypal && fila.estado !== 'cancelled') {
    // Un 422 de PayPal es casi siempre que ya estaba cancelada (desde la cuenta del cliente, o tras cobros rechazados):
    // basta con volver a leerla.
    const yaEstaba = (e: unknown) => {
      if (!(e instanceof Rechazo) || e.status !== 422) throw e
    }
    await paypal(env, 'POST', `/v1/billing/subscriptions/${encodeURIComponent(fila.paypal)}/cancel`, { reason: 'Cancelada desde Hermit' }).catch(yaEstaba)
    fila = await refrescar(env, fila)
    if (fila.estado !== 'cancelled') throw new Rechazo(502, 'PayPal no pudo cancelar la suscripción. Intenta otra vez en un momento.')
  }
  // El comprobante de la cancelación (Profeco pide dar un folio), una sola vez.
  if (fila.estado === 'cancelled' && !fila.folio) {
    fila = { ...fila, folio: `C-${letras(8)}`, cancelada: new Date().toISOString() }
    await env.DB.prepare('UPDATE licencias SET folio = ?, cancelada = ? WHERE id = ?').bind(fila.folio, fila.cancelada, fila.id).run()
    const hasta = fila.pagado_hasta && Date.parse(fila.pagado_hasta) > Date.now() ? ` Hermit sigue abierta hasta el ${fecha(fila.pagado_hasta)}, lo que ya pagaste.` : ''
    await correo(env, fila.email, `Cancelaste tu suscripción a Hermit · folio ${fila.folio}`, [
      'Hola:',
      `Cancelamos tu suscripción a Hermit. Tu folio de cancelación es ${fila.folio}. PayPal ya no te hará más cobros.${hasta}`,
      'Si no fuiste tú, responde a este correo.'
    ]).catch((e) => console.error('Correo de cancelación', e instanceof Error ? e.message : e))
  }
  return firmada(env, fila, equipo, Date.now())
}

/**
 * Adónde se va a pagar desde Hermit: con un año pagado de una vez, el pago del año siguiente. La tarjeta de la
 * suscripción mensual se cambia en la cuenta de PayPal del cliente.
 */
async function pago(env: Env, c: Record<string, unknown>): Promise<Response> {
  const equipo = equipoDe(c)
  const fila = await porClave(env, c.clave)
  if (!deUnaVez(fila) || fila.estado !== 'pagado') throw new Rechazo(400, 'Esta suscripción se paga con PayPal: cambia tu tarjeta desde tu cuenta de PayPal.')
  if (!(await recordarEquipo(env, fila.clave, equipo, Date.now())))
    throw new Rechazo(409, `Esta clave ya se usa en ${EQUIPOS} computadoras. Si cambiaste de computadora, escríbenos y la liberamos.`)
  return json({ enlace: await renovar(env, fila) })
}

/**
 * Un apoyo cobrado a mano —el QR de Bolivia, tras ver el comprobante en la banca— con la llave `PUBLICAR`
 * (`scripts/apoyo.mjs`). Queda como pagado de una vez (`pagado` hasta `pagado_hasta`, sin cobro solo); si el correo ya
 * tiene uno, se le suma el periodo. La clave sale por el correo de siempre y también en la respuesta, por si hay que
 * dársela a mano.
 */
async function apoyoManual(req: Request, env: Env): Promise<Response> {
  if (!env.PUBLICAR || !iguales(req.headers.get('authorization') ?? '', `Bearer ${env.PUBLICAR}`)) throw new Rechazo(401, 'No autorizado.')
  const c = await cuerpo(req)
  const email = String(c.email ?? '').trim().toLowerCase()
  if (!EMAIL.test(email) || email.length > 254) throw new Rechazo(400, 'Falta un correo válido.')
  if (c.plan !== 'mensual' && c.plan !== 'anual') throw new Rechazo(400, 'El plan es «mensual» o «anual».')
  const plan = c.plan as 'mensual' | 'anual'
  const meses = plan === 'anual' ? 12 : 1
  const suma = (base: Date) => {
    const d = new Date(base)
    d.setMonth(d.getMonth() + meses)
    return d.toISOString()
  }
  const ahora = new Date()
  const { results } = await env.DB.prepare('SELECT * FROM licencias WHERE email = ?').bind(email).all<Fila>()
  const pagado = results.find((f) => f.estado === 'pagado')
  const vivo = results.find((f) => f.estado === 'authorized')
  if (vivo && !pagado) throw new Rechazo(409, 'Ese correo ya tiene un apoyo de PayPal que se renueva solo: no se le suma otro pago a mano.')
  const terminos = TERMINOS.test(String(c.terminos ?? '')) ? String(c.terminos) : '2026-11-07'

  // Renovar el que ya tiene: el periodo se suma desde donde quedó (o desde hoy si ya venció).
  if (pagado) {
    const base = pagado.pagado_hasta && Date.parse(pagado.pagado_hasta) > ahora.getTime() ? new Date(pagado.pagado_hasta) : ahora
    const hasta = suma(base)
    const p = await precios(env)
    const fila = { ...pagado, plan, monto: plan === 'anual' ? p.anual : p.mensual, moneda: p.moneda, pagado_hasta: hasta, revisada: ahora.toISOString() }
    await env.DB.prepare("UPDATE licencias SET plan = ?, monto = ?, moneda = ?, pagado_hasta = ?, revisada = ? WHERE id = ?")
      .bind(plan, fila.monto, fila.moneda, hasta, fila.revisada, pagado.id)
      .run()
    const correoOk = await bienvenida(env, fila, 'manual').catch((e) => (console.error('Correo con la clave', e instanceof Error ? e.message : e), false))
    return json({ clave: fila.clave, email, plan, pagadaHasta: hasta, correo: correoOk })
  }

  await sinOtra(env, email, true)
  const p = await precios(env)
  const fila: Fila = {
    id: crypto.randomUUID(),
    clave: nuevaClave(),
    email,
    plan,
    monto: plan === 'anual' ? p.anual : p.mensual,
    moneda: p.moneda,
    fundador: p.quedan > 0 ? 1 : 0,
    enlace: null,
    estado: 'pagado',
    pagado_hasta: suma(ahora),
    autorizada: ahora.toISOString(),
    creada: ahora.toISOString(),
    revisada: ahora.toISOString(),
    acepto: ahora.toISOString(),
    terminos,
    folio: null,
    cancelada: null,
    avisado_para: null,
    modo: env.PAYPAL_MODO,
    paypal: null,
    orden: null
  }
  await env.DB.prepare(
    'INSERT INTO licencias (id, clave, email, plan, monto, moneda, fundador, estado, pagado_hasta, autorizada, creada, revisada, acepto, terminos, modo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
    .bind(fila.id, fila.clave, email, plan, fila.monto, fila.moneda, fila.fundador, fila.estado, fila.pagado_hasta, fila.autorizada, fila.creada, fila.revisada, fila.acepto, fila.terminos, fila.modo)
    .run()
  const correoOk = await bienvenida(env, fila, 'manual').catch((e) => (console.error('Correo con la clave', e instanceof Error ? e.message : e), false))
  return json({ clave: fila.clave, email, plan, pagadaHasta: fila.pagado_hasta, correo: correoOk })
}

/**
 * Un aviso de PayPal. Se comprueba con PayPal que es suyo, se contesta enseguida y luego se lee de su API lo que cambió:
 * la suscripción (sus cambios, y sus cobros con `billing_agreement_id`) o la orden del año (aprobada, que falta cobrar,
 * o su cobro, que trae la orden; uno sin ella, como un reembolso, vuelve a leer todas las de su fila).
 */
async function webhookPaypal(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const texto = await req.text()
  if (!(await firmaDePaypal(req.headers, texto, env).catch(() => false))) return new Response('Firma inválida', { status: 401 })
  const a = JSON.parse(texto) as AvisoPaypal
  ctx.waitUntil(avisoPaypal(env, a).catch((e) => console.error('Aviso de PayPal', a.event_type, e instanceof Error ? e.message : e)))
  return new Response('ok')
}

async function avisoPaypal(env: Env, a: AvisoPaypal) {
  const tipo = a.event_type ?? ''
  const r = a.resource ?? {}
  const suscripcion = tipo.startsWith('BILLING.SUBSCRIPTION.') ? r.id : r.billing_agreement_id
  if (suscripcion) {
    const fila = await env.DB.prepare('SELECT * FROM licencias WHERE paypal = ?').bind(suscripcion).first<Fila>()
    if (fila) await refrescar(env, fila)
    return
  }
  const referencia = r.custom_id ?? r.purchase_units?.[0]?.custom_id
  const fila = referencia ? await env.DB.prepare('SELECT * FROM licencias WHERE id = ?').bind(referencia).first<Fila>() : null
  if (!fila || !deUnaVez(fila)) return
  const orden = tipo.startsWith('CHECKOUT.ORDER.') ? r.id : r.supplementary_data?.related_ids?.order_id
  const ordenes = orden ? [orden] : (await env.DB.prepare('SELECT orden FROM paypal_pagos WHERE licencia = ?').bind(fila.id).all<{ orden: string }>()).results.map((p) => p.orden)
  await refrescar(env, fila, { ordenes })
}

/**
 * La firma de un aviso de PayPal la comprueba PayPal mismo, con el id del webhook. El aviso va tal cual llegó: vuelto a
 * escribir, cambiaría y no pasaría.
 */
async function firmaDePaypal(h: Headers, texto: string, env: Env): Promise<boolean> {
  if (!env.PAYPAL_WEBHOOK_ID) return false
  const datos = {
    auth_algo: h.get('paypal-auth-algo'),
    cert_url: h.get('paypal-cert-url'),
    transmission_id: h.get('paypal-transmission-id'),
    transmission_sig: h.get('paypal-transmission-sig'),
    transmission_time: h.get('paypal-transmission-time'),
    webhook_id: env.PAYPAL_WEBHOOK_ID
  }
  if (Object.values(datos).some((v) => !v)) return false
  const cuerpo = `${JSON.stringify(datos).slice(0, -1)},"webhook_event":${texto}}`
  return (await paypal<{ verification_status?: string }>(env, 'POST', '/v1/notifications/verify-webhook-signature', cuerpo)).verification_status === 'SUCCESS'
}

/**
 * Vuelve a leer la suscripción o los pagos del año pagado de una vez, y la guarda. `otros.ordenes`: las de PayPal que
 * trajo un aviso, por si no es la última orden de la fila.
 */
async function refrescar(env: Env, fila: Fila, otros: { ordenes?: string[] } = {}): Promise<Fila> {
  if (deUnaVez(fila)) return guardarEstado(env, fila, leerPagos(await pagosDelAño(env, fila, otros), fila))
  if (fila.paypal) return guardarEstado(env, fila, leerPaypal(await paypal<SuscripcionPaypal>(env, 'GET', `/v1/billing/subscriptions/${encodeURIComponent(fila.paypal)}`)))
  return fila
}

/** Una suscripción de PayPal, con los estados que entiende Hermit. */
export function leerPaypal(s: Pick<SuscripcionPaypal, 'status' | 'billing_info'>): Lectura {
  const estado: Estado =
    s.status === 'ACTIVE' ? 'authorized' : s.status === 'SUSPENDED' ? 'paused' : s.status === 'CANCELLED' || s.status === 'EXPIRED' ? 'cancelled' : 'pending'
  return { estado, hasta: estado === 'authorized' ? s.billing_info?.next_billing_time : undefined }
}

/** Los pagos de un año pagado de una vez: lo cobrado de sus órdenes de PayPal. `otros.ordenes`: las que trajo un aviso. */
async function pagosDelAño(env: Env, f: Fila, otros: { ordenes?: string[] }): Promise<Pick<Pago, 'status' | 'transaction_amount' | 'currency_id' | 'date_approved'>[]> {
  for (const orden of new Set([f.orden, ...(otros.ordenes ?? [])])) if (orden) await cobrarOrden(env, f, orden)
  const { results } = await env.DB.prepare('SELECT estado AS status, monto AS transaction_amount, moneda AS currency_id, aprobado AS date_approved FROM paypal_pagos WHERE licencia = ?')
    .bind(f.id)
    .all<Pick<Pago, 'status' | 'transaction_amount' | 'currency_id' | 'date_approved'>>()
  return results
}

/**
 * Lee una orden de PayPal de la fila, la cobra si el cliente ya la aprobó (sin eso, PayPal no cobra nada) y guarda
 * cómo va su cobro. Una orden de otra fila no se toca.
 */
async function cobrarOrden(env: Env, f: Fila, id: string) {
  const ruta = `/v2/checkout/orders/${encodeURIComponent(id)}`
  let o = await paypal<OrdenPaypal>(env, 'GET', ruta)
  if (o.purchase_units?.[0]?.custom_id !== f.id) return
  // Si `/gracias` y el aviso la cobran a la vez, la segunda recibe un 422: ya está cobrada, basta con leerla.
  if (o.status === 'APPROVED')
    o = await paypal<OrdenPaypal>(env, 'POST', `${ruta}/capture`, {}, { 'paypal-request-id': `cobro-${id}` }).catch((e) => {
      if (!(e instanceof Rechazo) || e.status !== 422) throw e
      return paypal<OrdenPaypal>(env, 'GET', ruta)
    })
  const c = o.purchase_units?.[0]?.payments?.captures?.[0]
  if (!c) return
  const estado = COBRO_PAYPAL[c.status] ?? c.status.toLowerCase()
  await env.DB.prepare(
    'INSERT INTO paypal_pagos (orden, licencia, estado, monto, moneda, aprobado) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (orden) DO UPDATE SET estado = excluded.estado, aprobado = excluded.aprobado'
  )
    .bind(id, f.id, estado, Number(c.amount.value), c.amount.currency_code, VALEN.has(estado) ? (c.create_time ?? new Date().toISOString()) : null)
    .run()
}

/**
 * Un año pagado de una vez, como lo guarda el cobro: cada pago que vale, en su moneda y de su monto, suma un año desde
 * que se aprobó, o desde que acaba lo ya pagado si se renovó antes. Sin ninguno que valga: reembolsado o con contracargo,
 * se acabó; si no, espera el pago.
 */
export function leerPagos(pagos: Pick<Pago, 'status' | 'transaction_amount' | 'currency_id' | 'date_approved'>[], f: Pick<Fila, 'monto' | 'moneda'>): Lectura {
  const aprobados = pagos
    .filter((p) => VALEN.has(p.status) && p.currency_id === f.moneda && p.transaction_amount >= f.monto && p.date_approved)
    .map((p) => Date.parse(p.date_approved!))
    .sort((a, b) => a - b)
  let fin = 0
  for (const aprobado of aprobados) {
    const d = new Date(Math.max(fin, aprobado))
    fin = d.setUTCFullYear(d.getUTCFullYear() + 1)
  }
  if (fin) return { estado: 'pagado', hasta: new Date(fin).toISOString() }
  return { estado: pagos.some((p) => p.status === 'refunded' || p.status === 'charged_back') ? 'cancelled' : 'pending' }
}

async function guardarEstado(env: Env, fila: Fila, l: Lectura): Promise<Fila> {
  const estado = l.estado
  const ahora = new Date().toISOString()
  const nueva: Fila = {
    ...fila,
    estado,
    // Lo pagado de una vez sale entero de sus pagos: uno reembolsado deja de contar.
    pagado_hasta: deUnaVez(fila) ? (l.hasta ?? null) : (l.hasta ?? fila.pagado_hasta),
    autorizada: fila.autorizada ?? (estado === 'authorized' || estado === 'pagado' ? ahora : null),
    revisada: ahora
  }
  // El primer pago: la clave por correo, una sola vez aunque el aviso y `/gracias` lleguen a la vez. Si el correo no
  // salió (Resend caído o sin llave), `autorizada` se suelta y el próximo chequeo la vuelve a intentar.
  if (!fila.autorizada && nueva.autorizada) {
    const r = await env.DB.prepare('UPDATE licencias SET autorizada = ? WHERE id = ? AND autorizada IS NULL').bind(ahora, fila.id).run()
    if (r.meta.changes) {
      const mandada = await bienvenida(env, nueva).catch((e) => (console.error('Correo con la clave', e instanceof Error ? e.message : e), false))
      if (!mandada) await env.DB.prepare('UPDATE licencias SET autorizada = NULL WHERE id = ?').bind(fila.id).run()
    }
  }
  await env.DB.prepare('UPDATE licencias SET estado = ?, pagado_hasta = ?, autorizada = COALESCE(autorizada, ?), revisada = ? WHERE id = ?')
    .bind(estado, nueva.pagado_hasta, nueva.autorizada, ahora, fila.id)
    .run()
  return nueva
}

/** La clave y cómo empezar, al confirmarse el primer pago. `manual`: cobrado a mano (QR), no por PayPal. */
function bienvenida(env: Env, f: Fila, medio: 'paypal' | 'manual' = 'paypal') {
  return correo(env, f.email, `Tu clave de Hermit: ${f.clave}`, [
    'Hola:',
    medio === 'paypal'
      ? 'PayPal confirmó tu pago: gracias por apoyar a Hermit. Guarda este correo, es donde queda tu clave.'
      : 'Confirmamos tu pago: gracias por apoyar a Hermit. Guarda este correo, es donde queda tu clave.',
    `Tu clave: ${f.clave}`,
    `Pégala en Hermit, en Opciones, y deja de salirte el recordatorio. Si aún no la tienes, descárgala en ${env.ORIGEN}/descargar (Mac: ${env.ORIGEN}/descargar?so=mac; Linux: ${env.ORIGEN}/descargar?so=linux). La clave sirve en dos computadoras a la vez.`,
    'Hermit trabaja con tu propia cuenta de IA (Claude, ChatGPT, Gemini, Devin y más), que pagas aparte a su proveedor. Si tienes dudas, responde a este correo.'
  ])
}

/**
 * Si abre Hermit y hasta cuándo, sin volver a preguntar. Autorizada, abre mientras PayPal la mantenga así
 * (reintentan los cobros que fallan y la cancela si no puede); cancelada, en pausa o pagada de una vez, hasta el fin de
 * lo pagado. Un lugar gratis abre siempre.
 */
export function vigencia(f: Pick<Fila, 'estado' | 'pagado_hasta'>, ahora: number): { activa: boolean; hasta: number } {
  const pagado = f.pagado_hasta ? Date.parse(f.pagado_hasta) : 0
  if (f.estado === 'authorized' || f.estado === 'gratis') return { activa: true, hasta: ahora + SIN_CONEXION }
  if (pagado > ahora) return { activa: true, hasta: Math.min(pagado, ahora + SIN_CONEXION) }
  return { activa: false, hasta: ahora }
}

/** Lo que guarda Hermit: `datos` tal cual se firmó (un JSON en texto) y su firma. */
async function firmada(env: Env, f: Fila, equipo: string, ahora: number): Promise<Response> {
  const { activa, hasta } = vigencia(f, ahora)
  // Fundador para siempre: un apoyo de su correo que entró entre los primeros y se llegó a pagar, o su lugar gratis de por vida.
  const fundador = !!(await env.DB.prepare(`SELECT 1 FROM licencias l WHERE l.email = ? AND ${esFundador('l')} LIMIT 1`).bind(f.email).first())
  const datos = JSON.stringify({
    clave: f.clave,
    equipo,
    email: f.email,
    plan: f.plan,
    monto: f.monto,
    estado: f.estado,
    activa,
    pagadaHasta: f.pagado_hasta ?? undefined,
    hasta: new Date(hasta).toISOString(),
    emitido: new Date(ahora).toISOString(),
    enlace: f.estado === 'pending' ? (f.enlace ?? undefined) : undefined,
    folio: f.folio ?? undefined,
    fundador: fundador || undefined
  })
  const llave = await crypto.subtle.importKey('pkcs8', base64(env.FIRMA), { name: 'Ed25519' }, false, ['sign'])
  const firma = await crypto.subtle.sign({ name: 'Ed25519' }, llave, new TextEncoder().encode(datos))
  return json({ datos, firma: btoa(String.fromCharCode(...new Uint8Array(firma))) })
}

/** Guarda que esta computadora usa la clave. `false` si ya la usan `EQUIPOS` otras. */
async function recordarEquipo(env: Env, clave: string, equipo: string, ahora: number): Promise<boolean> {
  const otros = await env.DB.prepare('SELECT COUNT(*) AS n FROM equipos WHERE clave = ? AND equipo != ? AND visto > ?')
    .bind(clave, equipo, new Date(ahora - VISTO).toISOString())
    .first<{ n: number }>()
  if ((otros?.n ?? 0) >= EQUIPOS) return false
  await env.DB.prepare('INSERT INTO equipos (clave, equipo, visto) VALUES (?, ?, ?) ON CONFLICT (clave, equipo) DO UPDATE SET visto = excluded.visto')
    .bind(clave, equipo, new Date(ahora).toISOString())
    .run()
  return true
}

async function porClave(env: Env, valor: unknown): Promise<Fila> {
  const clave = String(valor ?? '').replace(/\s+/g, '').toUpperCase()
  const fila = CLAVE.test(clave) ? await env.DB.prepare('SELECT * FROM licencias WHERE clave = ?').bind(clave).first<Fila>() : null
  if (!fila) throw new Rechazo(404, 'No encontramos esa clave. Revisa que esté bien escrita.')
  return fila
}

function equipoDe(c: Record<string, unknown>): string {
  const equipo = String(c.equipo ?? '')
  if (!EQUIPO.test(equipo)) throw new Rechazo(400, 'Falta el identificador de esta computadora.')
  return equipo
}

/** `HERMIT-XXXX-XXXX-XXXX-XXXX`: 80 bits al azar. */
function nuevaClave(): string {
  return `HERMIT-${letras(16).match(/.{4}/g)!.join('-')}`
}

/** `n` letras y números al azar de `ALFABETO` (5 bits cada uno). */
export function letras(n: number): string {
  return [...crypto.getRandomValues(new Uint8Array(n))].map((b) => ALFABETO[b % 32]).join('')
}

/**
 * Anota algo que `quien` hizo (`tipo`) si en el último día lleva menos de `max`: contar y anotar es un solo paso, así
 * que varias peticiones a la vez no se lo saltan, y borrar lo hecho no lo devuelve (migración 0012).
 */
export const CUPO = 'INSERT INTO cupos (quien, tipo, creado) SELECT ?1, ?2, ?3 WHERE (SELECT COUNT(*) FROM cupos WHERE quien = ?1 AND tipo = ?2 AND creado > ?4) < ?5'

export async function cupo(env: Env, quien: string, tipo: string, max: number): Promise<boolean> {
  const ahora = Date.now()
  const r = await env.DB.prepare(CUPO).bind(quien, tipo, new Date(ahora).toISOString(), new Date(ahora - DIA).toISOString(), max).run()
  return r.meta.changes > 0
}

/** La conexión de quien pide, resumida: para su cupo, sin guardar su IP. */
async function conexion(req: Request): Promise<string> {
  const ip = new TextEncoder().encode(`hermit:${req.headers.get('cf-connecting-ip') ?? ''}`)
  return `ip:${[...new Uint8Array(await crypto.subtle.digest('SHA-256', ip))].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')}`
}

/** Compara sin cortar en la primera diferencia: el tiempo no dice cuánto se acertó. */
export function iguales(a: string, b: string): boolean {
  let distinta = a.length ^ b.length
  for (let i = 0; i < a.length; i++) distinta |= a.charCodeAt(i) ^ (b.charCodeAt(i) || 0)
  return distinta === 0
}

/** El acceso a PayPal, que dura horas: se reusa mientras viva este Worker. */
let accesoPaypal: { token: string; vence: number; modo: string } | undefined

async function tokenPaypal(env: Env): Promise<string> {
  if (accesoPaypal?.modo === env.PAYPAL_MODO && Date.now() < accesoPaypal.vence) return accesoPaypal.token
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_SECRET) throw new Error(`Faltan las llaves de PayPal del modo ${env.PAYPAL_MODO}.`)
  const r = await fetch(`${PAYPAL[env.PAYPAL_MODO]}/v1/oauth2/token`, {
    method: 'POST',
    headers: { authorization: `Basic ${btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`)}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  })
  const j = (await r.json().catch(() => ({}))) as { access_token?: string; expires_in?: number }
  if (!r.ok || !j.access_token) throw new Error(`PayPal no dio acceso: ${r.status}`)
  accesoPaypal = { token: j.access_token, vence: Date.now() + ((j.expires_in ?? 600) - 60) * 1000, modo: env.PAYPAL_MODO }
  return j.access_token
}

/** Una llamada a PayPal. `cuerpo` en texto va tal cual (el aviso que se comprueba); si no, en JSON. */
async function paypal<T>(env: Env, metodo: string, ruta: string, cuerpo?: unknown, extra: Record<string, string> = {}): Promise<T> {
  const r = await fetch(`${PAYPAL[env.PAYPAL_MODO]}${ruta}`, {
    method: metodo,
    headers: { authorization: `Bearer ${await tokenPaypal(env)}`, 'content-type': 'application/json', ...extra },
    body: cuerpo === undefined ? undefined : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo)
  })
  // Cancelar contesta 204, sin cuerpo.
  const datos = (await r.json().catch(() => ({}))) as { name?: string; message?: string; details?: { issue?: string }[] }
  if (!r.ok) {
    // Solo el estado y el error: nada del cliente.
    console.error('PayPal', metodo, ruta.replace(/\/[\w-]{12,}(?=\/|$)/g, '/…'), r.status, datos.name ?? '', datos.details?.[0]?.issue ?? '')
    throw new Rechazo(r.status, datos.message ?? `PayPal respondió ${r.status}`)
  }
  return datos as T
}

export async function cuerpo(req: Request): Promise<Record<string, unknown>> {
  const c = await req.json().catch(() => null)
  if (!c || typeof c !== 'object') throw new Rechazo(400, 'Petición inválida.')
  return c as Record<string, unknown>
}

function base64(texto: string): Uint8Array {
  return Uint8Array.from(atob(texto), (c) => c.charCodeAt(0))
}

export function json(datos: unknown, status = 200, cabeceras: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(datos), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...cabeceras } })
}

/**
 * El aviso de cada cobro que viene (LFPC art. 76 Bis VIII: al menos 5 días naturales antes de cada renovación) y, de un
 * año pagado de una vez, de que se acaba, con el enlace para pagar el siguiente. Antes de avisar se vuelve a leer: si se
 * canceló, cambió la fecha o ya se renovó, no se avisa de algo que no va a pasar.
 */
export async function avisarCobros(env: Env, ahora = Date.now()) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM licencias WHERE estado IN ('authorized', 'pagado') AND pagado_hasta IS NOT NULL AND (avisado_para IS NULL OR avisado_para != pagado_hasta)"
  ).all<Fila>()
  for (const vieja of results) {
    if (!faltaAvisar(vieja, ahora)) continue
    const f = await refrescar(env, vieja).catch(() => null)
    if (!f || !faltaAvisar(f, ahora)) continue
    const cada = f.plan === 'anual' ? 'anual' : 'mensual'
    const enviado = await (f.estado === 'pagado'
      ? correo(env, f.email, `Tu año de Hermit se acaba el ${fecha(f.pagado_hasta!)}`, [
          'Hola:',
          `Tu año de apoyo a Hermit se acaba el ${fecha(f.pagado_hasta!)}. No se renueva solo: no te vamos a cobrar nada.`,
          `Si quieres seguir apoyando, paga el año siguiente (${f.monto.toLocaleString('es-MX')} ${f.moneda}, IVA incluido) con PayPal: ${env.ORIGEN}/renovar?s=${f.id}. Tu clave es la misma y el año nuevo empieza cuando se acabe este.`,
          'También lo renuevas desde Hermit: Opciones, Apoyo, «Renovar». Si tienes dudas, responde a este correo.'
        ])
      : correo(env, f.email, `Tu próximo cobro de Hermit: ${fecha(f.pagado_hasta!)}`, [
          'Hola:',
          `El ${fecha(f.pagado_hasta!)} PayPal te cobrará ${f.monto.toLocaleString('es-MX')} ${f.moneda} (IVA incluido) por tu suscripción ${cada} a Hermit.`,
          'Si no quieres que se renueve, cancélala antes de esa fecha en Hermit: Opciones, Suscripción, «Cancelar suscripción». También puedes responder a este correo o escribirnos por WhatsApp. Lo ya pagado sigue valiendo hasta su fecha.'
        ])
    ).catch((e) => (console.error('Aviso de cobro', e instanceof Error ? e.message : e), false))
    if (enviado) await env.DB.prepare('UPDATE licencias SET avisado_para = ? WHERE id = ?').bind(f.pagado_hasta, f.id).run()
  }
}

/** Si el próximo cobro de esta suscripción (o el fin del año pagado de una vez) ya está a `AVISO` o menos y aún no se le avisó. */
export function faltaAvisar(f: Pick<Fila, 'estado' | 'pagado_hasta' | 'avisado_para'>, ahora: number): boolean {
  if ((f.estado !== 'authorized' && f.estado !== 'pagado') || !f.pagado_hasta || f.avisado_para === f.pagado_hasta) return false
  const cobro = Date.parse(f.pagado_hasta)
  return cobro > ahora && cobro - ahora <= AVISO
}

/** Manda un correo con Resend. `false` si no hay llave todavía: se anota y no se marca como enviado. */
async function correo(env: Env, para: string, asunto: string, parrafos: string[]): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    console.log('Correo sin mandar (falta RESEND_API_KEY):', asunto)
    return false
  }
  const pie = `${PROVEEDOR} · ${env.CORREO_RESPUESTA}`
  const html = `<div style="font:15px/1.6 system-ui,sans-serif;color:#0f172a;max-width:560px">${parrafos.map((p) => `<p>${escapar(p)}</p>`).join('')}<p style="color:#64748b;font-size:12px">${escapar(pie)}</p></div>`
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    // Resend pide un User-Agent, y el fetch de un Worker no manda ninguno.
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json', 'user-agent': 'hermit-licencias' },
    body: JSON.stringify({ from: env.CORREO_DE, to: [para], reply_to: env.CORREO_RESPUESTA, subject: asunto, text: [...parrafos, '', pie].join('\n\n'), html })
  })
  if (!r.ok) throw new Error(`Resend respondió ${r.status}: ${(await r.text()).slice(0, 200)}`)
  return true
}

function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** «21 de noviembre de 2026», en la hora de la Ciudad de México. */
function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City' })
}

/**
 * Adonde vuelve el cliente tras pagar en PayPal, o al salir sin pagar (`?s=` es su suscripción, que solo conocen él y PayPal).
 * Mientras no se confirme el pago, se recarga sola y vuelve a preguntar; confirmado, enseña la clave y el instalador de
 * cada sistema. Sin `s` viene de la app de antes, que espera abierta y se desbloquea sola.
 */
async function gracias(env: Env, url: URL): Promise<Response> {
  const id = url.searchParams.get('s') ?? ''
  let fila = /^[\w-]{36}$/.test(id) ? await env.DB.prepare('SELECT * FROM licencias WHERE id = ?').bind(id).first<Fila>() : null
  if (fila?.estado === 'pending' && !(Date.now() - Date.parse(fila.revisada ?? '') < REVISAR_PENDIENTE)) {
    const vieja = fila
    fila = await refrescar(env, vieja).catch(() => vieja)
  }
  if (!fila)
    return pagina(
      '¡Listo!',
      `${correoAviso('tu correo')}<p>Tu clave te llega por correo en cuanto se confirme tu pago: pégala en Hermit, en Opciones.</p>`
    )
  if (vigencia(fila, Date.now()).activa)
    return pagina(
      '¡Gracias por apoyar a Hermit!',
      `<p>Esta es tu clave:</p>
<div class="clave"><code>${fila.clave}</code><button type="button" onclick="navigator.clipboard.writeText('${fila.clave}').then(()=>this.textContent='Copiada')">Copiar</button></div>
${correoAviso(escapar(fila.email))}
<a class="boton" href="/descargar">Descargar Hermit para Windows</a>
<p class="otros">También para <a href="/descargar?so=mac">Mac</a> y <a href="/descargar?so=linux">Linux</a>.</p>
<ol><li>Instálala. Si Windows dice «Windows protegió tu PC», da clic en <b>Más información</b> y luego en <b>Ejecutar de todas formas</b>.</li>
<li>Ábrela y pega tu clave en Opciones: deja de salirte el recordatorio. Sirve en dos computadoras a la vez.</li>
<li>Conecta tu cuenta de Claude, elige un estilo y escribe el tema.</li></ol>`
    )
  // Quien sale de PayPal sin pagar también vuelve aquí: puede volver al pago.
  if (fila.estado === 'pending')
    return pagina(
      'Esperando tu pago…',
      `<p>En cuanto PayPal lo confirme, aquí aparecen tu clave y el instalador. Suele tardar unos segundos.</p>${correoAviso(escapar(fila.email))}${fila.enlace ? `<p class="otros">¿Saliste sin pagar? <a href="${escapar(fila.enlace)}">Volver al pago</a></p>` : ''}`,
      5
    )
  return pagina(
    'PayPal no confirmó el pago',
    '<p>Vuelve a <a href="https://myhermit.vercel.app">myhermit.vercel.app</a> e inténtalo otra vez, o escríbenos desde ahí.</p>'
  )
}

/**
 * El enlace del correo de que se acaba el año (`?s=` es la fila, como en `/gracias`): abre el pago del año siguiente,
 * con la misma clave.
 */
async function renovacion(env: Env, url: URL): Promise<Response> {
  const id = url.searchParams.get('s') ?? ''
  const fila = /^[\w-]{36}$/.test(id) ? await env.DB.prepare('SELECT * FROM licencias WHERE id = ?').bind(id).first<Fila>() : null
  if (!fila || !deUnaVez(fila) || fila.estado !== 'pagado')
    return pagina('Este enlace ya no sirve', '<p>Para apoyar a Hermit, entra a <a href="https://myhermit.vercel.app">myhermit.vercel.app</a>, o responde al correo y te ayudamos.</p>')
  return Response.redirect(await renovar(env, fila), 303)
}

/**
 * Lo que se lee antes de bajar la de Mac: cuál de las dos, si están la de Apple Silicon (`arm`) y la de Intel
 * (`intel`), y cómo se abre la primera vez la que aún no lleva la firma de Apple (docs/adr/0006-mac-y-linux.md): sin
 * ella, macOS no la deja abrir a la primera ni se actualiza sola.
 */
function avisoMac(intel: Ultima | undefined, arm: Ultima | undefined): Response {
  const boton = (u: Ultima, so: Sistema, cual: string, principal: boolean) =>
    `<a class="${principal ? 'boton' : 'boton otro'}" href="/descargar?so=${so}&amp;visto">Descargar Hermit ${u.version} para ${cual}</a>`
  const elegir = intel && arm
  const sinFirma = [intel, arm].some((u) => u && !u.firmada)
  const pasos = sinFirma
    ? `<ol><li>Abre el archivo que se baja y arrastra <b>Hermit</b> a <b>Aplicaciones</b>.</li>
<li>Ábrela. macOS dirá que no puede comprobarla: cierra ese aviso, ve a <b>Configuración del Sistema → Privacidad y seguridad</b> y pulsa <b>«Abrir de todos modos»</b>. Solo la primera vez.</li>
<li>Cuando salga una versión nueva, Hermit te avisa y la bajas aquí otra vez, encima de la que tienes: tus videos y tus hilos se quedan.</li></ol>`
    : `<ol><li>Abre el archivo que se baja y arrastra <b>Hermit</b> a <b>Aplicaciones</b>.</li>
<li>Ábrela. Las versiones nuevas se ponen solas: Hermit te avisa y basta con «Actualizar».</li></ol>`
  return pagina(
    'Hermit para Mac',
    `${elegir ? '<p>Elige la de tu Mac: en el menú de Apple → <b>Acerca de esta Mac</b>, si dice <b>Chip Apple M1</b> o más nuevo, es Apple Silicon; si dice <b>Procesador Intel</b>, es Intel. Las dos piden macOS 13 o más nuevo.</p>' : '<p>Pide macOS 13 o más nuevo.</p>'}
${sinFirma ? `<p>${elegir && intel?.firmada ? 'La de Apple Silicon' : elegir && arm?.firmada ? 'La de Intel' : 'Hermit para Mac'} todavía no lleva la firma de Apple: macOS pide un paso más la primera vez.</p>` : ''}
${arm ? boton(arm, 'mac-arm64', elegir ? 'Mac con Apple Silicon (M1 o más nuevo)' : 'Mac', true) : ''}
${intel ? boton(intel, 'mac', elegir ? 'Mac con Intel (i5, i7 o i9)' : 'Mac', !arm) : ''}
${pasos}
${!elegir && intel ? '<p class="otros">Para Mac con Intel. En un Mac con M1 o más nuevo también abre: la primera vez, macOS pide instalar Rosetta.</p>' : ''}`
  )
}

/** Que la clave llega también por correo, bien a la vista: es lo que queda si se cierra la página. */
function correoAviso(para: string): string {
  return `<div class="correo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg><div><b>Tu clave también te llega a ${para}</b>, con el enlace para descargar Hermit. Puedes cerrar esta página: la tienes ahí. Si no la ves en unos minutos, revisa spam o promociones.</div></div>`
}

/** Una página suelta con los colores de Hermit. Con `recargar`, se recarga sola cada tantos segundos. */
function pagina(titulo: string, cuerpo: string, recargar?: number): Response {
  return new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">${recargar ? `<meta http-equiv="refresh" content="${recargar}">` : ''}<title>${titulo} · Hermit</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0e14;color:#e6edf7;font:16px/1.55 system-ui,sans-serif}
main{max-width:460px;padding:32px}h1{font-size:22px;margin:0 0 10px}p,li{color:#94a3b8}p{margin:0 0 16px}b{color:#e6edf7}a{color:#6ea8fe}ol{margin:20px 0 0;padding-left:20px}li{margin:6px 0}
.clave{display:flex;gap:10px;align-items:center;margin:0 0 16px;padding:12px 14px;border:1px solid #263244;border-radius:10px;background:#111722}
.clave code{flex:1;font:600 17px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.04em}
.clave button{padding:6px 12px;border:1px solid #263244;border-radius:8px;background:#18212f;color:#e6edf7;font:inherit;font-size:14px;cursor:pointer}
.correo{display:flex;gap:12px;align-items:flex-start;margin:0 0 16px;padding:14px 16px;border:1px solid rgba(79,140,255,.45);border-radius:10px;background:rgba(79,140,255,.13);color:#e6edf7;font-size:15px}
.correo svg{flex:none;width:22px;height:22px;margin-top:1px;color:#6ea8fe}.correo b{color:#6ea8fe}
.boton{display:block;padding:14px;border-radius:10px;background:#4f8cff;color:#07101f;font-weight:800;text-align:center;text-decoration:none}
.boton.otro{margin-top:10px;background:none;border:1px solid #4f8cff;color:#6ea8fe}
.otros{margin:10px 0 0;font-size:14px;text-align:center}</style></head>
<body><main><h1>${titulo}</h1>${cuerpo}</main></body></html>`,
    // Con la clave a la vista: que no se guarde en ninguna caché.
    { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' } }
  )
}
