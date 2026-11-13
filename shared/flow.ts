/**
 * Lo que comparten el servidor de Flow (`server/flow/`), el compositor y sus pruebas: los modelos que ofrece, lo más que
 * gasta un pedido sin permiso, cómo se leen el costo y lo que baja, las líneas `Imágenes:` y `Clips:` del primer mensaje
 * y el reparto de los pedidos entre las cuentas de Google.
 */

export const MODELOS_IMAGEN = ['Nano Banana 2.1', 'Nano Banana Pro', 'Nano Banana 2 Lite']
/** Flow avisa que Fast, Quality y Omni 1.1 dejan de estar el 5 de diciembre de 2026 (visto el 6 de noviembre). */
export const MODELOS_VIDEO = ['Veo 3.1 - Lite', 'Veo 3.1 - Fast', 'Veo 3.1 - Quality', 'Omni 1.2 Flash', 'Omni 1.1 Flash']

/** Las proporciones de cada tipo, con el icono de su botón en Flow (el texto cambia con el idioma; el icono, no). */
export const FORMATOS_VIDEO: Record<string, string> = { '9:16': 'crop_9_16', '16:9': 'crop_16_9' }
export const FORMATOS_IMAGEN: Record<string, string> = { ...FORMATOS_VIDEO, '1:1': 'crop_square', '4:3': 'crop_landscape', '3:4': 'crop_portrait' }

/** En el menú «Imágenes», ChatGPT (el `image_gen` de Codex). Lo demás que se elige ahí es un modelo de Flow. */
export const IMAGEN_CHATGPT = 'chatgpt'

/**
 * Con qué se generan las imágenes: lo elegido si se puede usar y, si no, ChatGPT o Flow, lo que esté conectado. Vacío si
 * no hay ninguno.
 */
export function imagenPosible(elegida: string, hay: { chatgpt: boolean; google: boolean }): string {
  if (elegida === IMAGEN_CHATGPT ? hay.chatgpt : MODELOS_IMAGEN.includes(elegida) && hay.google) return elegida
  return hay.chatgpt ? IMAGEN_CHATGPT : hay.google ? MODELOS_IMAGEN[0] : ''
}

/** La línea del primer mensaje con lo elegido en el menú «Imágenes», que siguen las skills (`video-base/FLOW.md`). */
export function lineaImagenes(imagen: string): string {
  if (!imagen) return ''
  if (imagen === IMAGEN_CHATGPT) return 'Imágenes: con ChatGPT (Codex), no con Google Flow (video-base/FLOW.md).'
  return `Imágenes: genéralas en Google Flow con ${imagen}, no con ChatGPT (cómo, en video-base/FLOW.md).`
}

/** Los modelos de video en que Flow deja elegir la resolución: Veo sale siempre en 720p. */
export const MODELOS_OMNI = ['Omni 1.2 Flash', 'Omni 1.1 Flash']
export const esOmni = (modelo: string) => MODELOS_OMNI.includes(modelo)
/** Las de Omni, la primera por defecto. Flow pone 360p si no se elige, y se ve borroso al lado de Veo. */
export const RESOLUCIONES_OMNI = ['720p', '360p']

/**
 * Lo que se elige en el menú «Clips» (los estilos con clips) y lo que cuesta un clip de 8 s, del panel de Flow
 * (comprobado el 6 de noviembre de 2026, en una cuenta gratis).
 */
export const OPCIONES_CLIPS: Record<string, { modelo: string; resolucion?: string; creditos: number }> = {
  'Veo 3.1 - Lite': { modelo: 'Veo 3.1 - Lite', creditos: 10 },
  'Veo 3.1 - Fast': { modelo: 'Veo 3.1 - Fast', creditos: 20 },
  'Veo 3.1 - Quality': { modelo: 'Veo 3.1 - Quality', creditos: 100 },
  'Omni 1.2 Flash · 720p': { modelo: 'Omni 1.2 Flash', resolucion: '720p', creditos: 24 },
  'Omni 1.2 Flash · 360p': { modelo: 'Omni 1.2 Flash', resolucion: '360p', creditos: 8 },
  'Omni 1.1 Flash · 720p': { modelo: 'Omni 1.1 Flash', resolucion: '720p', creditos: 12 },
  'Omni 1.1 Flash · 360p': { modelo: 'Omni 1.1 Flash', resolucion: '360p', creditos: 6 }
}

/**
 * La línea del primer mensaje con lo elegido en el menú «Clips». Lo eligió el usuario, así que el tope es lo que cuesta.
 * Sin elección, la skill usa el suyo.
 */
export function lineaClips(opcion: string): string {
  const o = OPCIONES_CLIPS[opcion]
  if (!o) return ''
  const res = o.resolucion ? ` en ${o.resolucion}` : ''
  const params = `modelo "${o.modelo}"${o.resolucion ? `, resolucion "${o.resolucion}"` : ''} y tope ${o.creditos}`
  return `Clips: genéralos en Google Flow con ${o.modelo}${res}, ${o.creditos} créditos cada uno (en generar_video, ${params}; video-base/FLOW.md).`
}

/** Lo más que gasta un pedido si no se dice otro tope: alcanza para Lite y Fast, no para Quality (100). */
export const TOPE_CREDITOS = 20

/** Lo que cuesta un video de cada modelo, para avisarlo antes de que el usuario autorice el gasto (Omni, en 720p). */
export const COSTO_VIDEO: Record<string, number> = { 'Omni 1.1 Flash': 12, 'Omni 1.2 Flash': 24, 'Veo 3.1 - Lite': 10, 'Veo 3.1 - Fast': 20, 'Veo 3.1 - Quality': 100 }

/** Lo que dura el permiso para todos los clips de un hilo, y lo que puede gastar en total. */
export const PERMISO_CREDITOS = 200
export const PERMISO_MS = 30 * 60_000

/**
 * Cómo llama Flow a sus créditos en el panel, según el idioma de la cuenta: «créditos», o «puntos» en el español de
 * España («La generación consumirá 10 puntos», visto el 3 de noviembre de 2026).
 */
export const PALABRA_CREDITOS = /cr[eé]dit|puntos?\b|points?\b/i

/**
 * Los créditos que costará lo elegido, del panel de Flow («La generación usará 10 créditos», en el idioma de la cuenta).
 * `null` si no lo dice: sin saber el costo no se genera.
 */
export function creditosDe(texto: string): number | null {
  const renglon = texto.split('\n').filter((r) => /\d/.test(r) && PALABRA_CREDITOS.test(r)).at(-1)
  const n = renglon?.match(/\d+/)?.[0]
  return n === undefined ? null : Number(n)
}

/** Lo que le queda a una cuenta, del menú de su cuenta en Flow: sus créditos y, si se renuevan cada día, cuándo (ms). */
export interface Saldo {
  creditos: number
  renueva?: number
}

/** Lo que puede separar la hora que dice Flow de la de ahora en una cuenta sin gastar (redondeo de minutos). */
const HOLGURA = 5 * 60_000

/**
 * El saldo, del texto del menú de la cuenta (visto el 3 de noviembre de 2026): «20 créditos de Google Flow» y «Los
 * créditos se actualizan todos los días a la(s) 12:02 p.m.», o en el español de España «50 puntos de Google Flow» y «…a
 * diario a las 17:11». La hora es la del equipo, como la de Edge: `renueva` es la próxima vez que llega. Una cuenta que
 * aún no gastó dice la hora de ahora (se leyó dos veces, y la hora cambió con el reloj): entonces no hay `renueva`.
 * `null` si no dice cuántos quedan.
 */
export function saldoDe(texto: string, ahora: number): Saldo | null {
  const renglones = texto.split('\n')
  const i = renglones.findIndex((r) => /^\s*\d[\d.,]*\s+(cr[eé]ditos?|puntos?|credits?|points?)\b/i.test(r))
  if (i < 0) return null
  const creditos = Number(renglones[i].match(/\d[\d.,]*/)![0].replace(/[.,]/g, ''))
  const diario = renglones.slice(i + 1, i + 3).find((r) => /d[ií]a|diari|daily|day/i.test(r))
  const h = diario?.match(/(\d{1,2}):(\d{2})\s*(?:([ap])\.?\s*m\.?)?/i)
  if (!h) return { creditos }
  const hora = h[3] ? (Number(h[1]) % 12) + (h[3].toLowerCase() === 'p' ? 12 : 0) : Number(h[1])
  const d = new Date(ahora)
  d.setHours(hora, Number(h[2]), 0, 0)
  if (d.getTime() <= ahora) d.setDate(d.getDate() + 1)
  const falta = d.getTime() - ahora
  return falta < HOLGURA || falta > 24 * 60 * 60_000 - HOLGURA ? { creditos } : { creditos, renueva: d.getTime() }
}

/** Lo menos que cuesta un video (Omni 1.1 Flash en 360p): con menos, la cuenta no hace ninguno hasta que se renueve. */
export const VIDEO_MAS_BARATO = 6

/**
 * Lo que le queda a una cuenta ahora, de su último saldo leído. El número vale hasta su renovación (`renueva`): pasada
 * esa hora Flow ya la repuso y, como repone y no acumula, no puede quedar por debajo de lo más que se le vio (`maximo`).
 * Ese es `piso`, el mínimo probado, mientras llega su relectura; nunca es una suposición. Sin saldo, `null`.
 */
export function saldoVigente(s: { creditos: number; renueva?: number; maximo?: number } | undefined, ahora: number): { creditos: number; piso: boolean } | null {
  if (!s) return null
  if (!s.renueva || s.renueva > ahora) return { creditos: s.creditos, piso: false }
  return { creditos: Math.max(s.maximo ?? 0, s.creditos), piso: true }
}

/**
 * Lo que gastó un video que Flow rechazó, comparando el saldo de antes de pedirlo con el de después. `null` si no se pudo
 * leer alguno o si subió (se renovó en medio): entonces no se sabe.
 */
export function gastoDeRechazo(antes: Saldo | null, despues: Saldo | null): number | null {
  if (!antes || !despues || despues.creditos > antes.creditos) return null
  return antes.creditos - despues.creditos
}

/**
 * Cuántas cuentas de Google puede tener Flow en Hermit, y cuántas generan a la vez (cada una abre su Edge). Eran tres, y el
 * 4 de noviembre de 2026 Flow rechazó tres clips de un lote por «actividad inusual»: todas salen de la misma conexión.
 */
export const MAX_CUENTAS = 50
export const A_LA_VEZ = 2

/**
 * El ritmo, para no pedir como una máquina: entre dos pedidos que empiezan, de `ENTRE_PEDIDOS` a su doble (al azar), y una
 * cuenta que acaba descansa `PAUSA_CUENTA` antes del siguiente. Tras una frenada, durante `CALMA` va uno a la vez y con
 * cuatro veces más espacio entre pedidos.
 */
export const ENTRE_PEDIDOS = 15_000
export const PAUSA_CUENTA = 30_000
export const CALMA = 60 * 60_000

/** Lo que espera el siguiente pedido para empezar, en ms. `azar` va de 0 a 1. */
export const espacioEntrePedidos = (calma: boolean, azar: number) => (calma ? 4 : 1) * ENTRE_PEDIDOS * (1 + azar)

/**
 * Por qué descansa una cuenta:
 * - `creditos`: sin créditos para el tipo pedido.
 * - `frenada`: Flow no empezó el pedido (lo bloqueó por actividad inusual, etc.).
 * - `sesion`: Flow ya no tiene la sesión de Google.
 * - `navegador`: fallo de Playwright (timeout, Protocol error) **antes** de que Flow gastara créditos.
 *   Descansa solo la cuenta afectada unos minutos, sin afectar al resto ni activar la calma global.
 */
export type Motivo = 'creditos' | 'frenada' | 'sesion' | 'navegador'

/** Lo que descansa cada motivo. Volver a probar no gasta (Flow no empezó), solo tarda: por eso no se espera más. */
export const DESCANSO: Record<Motivo, number> = { creditos: 3 * 60 * 60_000, frenada: 30 * 60_000, sesion: 10 * 60_000, navegador: 5 * 60_000 }

/** Lo más que descansa una cuenta frenada otra vez, y cuánto después de su descanso cuenta como «otra vez». */
const FRENADA_MAXIMA = 8 * 60 * 60_000
const RECUERDA_FRENADA = 6 * 60 * 60_000

/**
 * Un descanso: hasta cuándo (ms), por qué y, si la frenaron, cuántas veces seguidas. `dicho` es lo que dijo Flow en ese
 * intento (o el error medido): no decide el motivo —eso sale de lo medido, no de sus palabras— pero se guarda para que la
 * interfaz pueda enseñarlo en vez de afirmar «Flow la frenó» sin nada detrás.
 */
export interface Descanso {
  hasta: number
  motivo: Motivo
  veces?: number
  dicho?: string
}

/**
 * El descanso que toca. Sin créditos, hasta que se renueven si se sabe cuándo. Frenada otra vez al poco de su descanso,
 * descansa el doble cada vez, hasta 8 h: si Google la sigue viendo rara, probar seguido lo empeora.
 * Fallos de navegador (`'navegador'`) siempre descansan el tiempo fijo sin escalado: son internos de Playwright.
 */
export function descansoNuevo(motivo: Motivo, ahora: number, previo?: Descanso, renueva?: number, dicho?: string): Descanso {
  const otraVez = motivo === 'frenada' && previo?.motivo === 'frenada' && ahora - previo.hasta < RECUERDA_FRENADA
  const veces = motivo === 'frenada' ? (otraVez ? (previo.veces ?? 1) + 1 : 1) : undefined
  const largo = motivo === 'frenada' ? Math.min(FRENADA_MAXIMA, DESCANSO.frenada * 2 ** (veces! - 1)) : DESCANSO[motivo]
  const hasta = motivo === 'creditos' && renueva && renueva > ahora ? renueva : ahora + largo
  return { hasta, motivo, ...(veces ? { veces } : {}), ...(dicho ? { dicho: dicho.slice(0, 300) } : {}) }
}

/** Lo que dice Flow cuando frena una cuenta: que pide mucho o que vio «actividad inusual» / «uso inusual» (en el idioma de la cuenta). */
export const AVISO_FRENADA = /demasiad|too many|m[aá]s tarde|try again later|inusual|unusual|throttl|quickly|rate\s*limit|frecuencia/i

/**
 * Lo que dice Playwright cuando la página de Flow no respondió: un clic que otro panel tapa, un timeout, una pestaña que se
 * cerró o una navegación que falló. Eso no es una frenada de Google: se descansa solo esa cuenta unos minutos
 * (`navegador`) y el pedido pasa a otra, sin activar la calma global.
 */
export const FALLO_NAVEGADOR = /locator[.(]|Timeout\b|TimeoutError|Timed out|Target page|Protocol error|net::ERR_|has been closed|Navigation failed|Execution context was destroyed|waiting for locator/i

/** Si el error es de la página (Playwright), no una respuesta de Flow. */
export const esFalloDeNavegador = (mensaje: string) => FALLO_NAVEGADOR.test(mensaje)

/**
 * Por qué descansa una cuenta a la que Flow no le empezó el pedido, de lo que Hermit ya midió y nunca de las palabras del
 * aviso (cambian con el idioma y con cada prueba de Google; adivinar por ellas mandó cuentas con créditos a esperar su
 * recarga del día):
 * - `sesion` si la página acabó en la de entrar con Google, que se ve en su dirección;
 * - `creditos` si su saldo ya se leyó y no le llega para el video más barato;
 * - y `frenada` en todo lo demás, que descansa 30 min: volver a probar cuesta unos 45 s y no gasta nada, y al reintentar
 *   se vuelve a leer su saldo, así que si de verdad no le queda entra sola por `creditos`.
 * Un `piso` es una estimación («al menos esto»), no una lectura: no alcanza para decir que no le quedan.
 */
export function motivoDeDescanso(tipo: 'imagen' | 'video', sesion: boolean, saldo: { creditos: number; piso: boolean } | null): Motivo {
  if (sesion) return 'sesion'
  if (tipo === 'video' && saldo && !saldo.piso && saldo.creditos < VIDEO_MAS_BARATO) return 'creditos'
  return 'frenada'
}

/**
 * Si Flow rechazó un pedido por lo que se le pidió (derechos, política de contenido) y no por una frenada de Google: no
 * gastó créditos. Eso no es cosa de la cuenta —cae igual en todas— así que no se pasa a otra: se cambia el pedido y, si
 * vuelve a caer, se intenta una versión libre de derechos, y solo a la tercera la escena queda fuera (ver
 * `RECHAZOS_PARA_BLOQUEAR`). Es lo que evita el bucle de reintentos con lo que Flow no va a aceptar nunca, como los
 * personajes de una película, sin dejar un hueco por un prompt mal escrito.
 */
export const esRechazoDeContenido = (frenada: boolean, gasto: number | null) => !frenada && gasto === 0

/**
 * Fallos técnicos de la generación en Flow —no pudo producir el audio o el vídeo—, que no son ni un rechazo por
 * contenido ni una frenada de la cuenta: no gastan créditos y la escena no pierde vidas; se reintenta con el mismo
 * pedido o más corto. Los de la política de Google hablan de políticas o contenido, no de «no se pudo generar».
 */
export const FALLO_TECNICO = /no se pudo generar|couldn'?t generate|failed to generate|something went wrong|error (al|durante) gener/i
export const PALABRAS_POLITICA = /pol[ií]tica|policy|contenido|derechos|inapropiad|prohibid|violat|guideline/i
export const esFalloTecnico = (mensaje: string) => FALLO_TECNICO.test(mensaje) && !PALABRAS_POLITICA.test(mensaje)

/**
 * El pedido cuesta más que su `tope` de créditos («Cuesta 100 créditos y el tope es 20»): es cosa del pedido, no de la
 * cuenta — todas fallarían igual—, así que no se marca ninguna como frenada ni se pasa a otra: se devuelve el error.
 */
export const PASA_TOPE = /cuesta\s+\d[\d.,]*\s*cr[eé]ditos?\s+y\s+el\s+tope\s+es/i
export const esPasaTope = (mensaje: string) => PASA_TOPE.test(mensaje)

/**
 * Cuántas veces Flow puede rechazar por contenido la misma escena antes de que Hermit la deje por perdida. Son tres
 * vidas: el pedido original, el cambio de verdad y la versión 100 % original (sin personajes, marcas ni personas con
 * derechos). Los rechazos no gastan créditos: solo cuestan el minuto de cada intento.
 */
export const RECHAZOS_PARA_BLOQUEAR = 3

/** Lo que se recuerda un rechazo por contenido: pasado eso, la escena se puede volver a pedir (quizá ya cambió el pedido). */
export const RECUERDA_RECHAZO = 6 * 60 * 60_000

/** Una cuenta para el reparto: si está generando, cuándo generó por última vez y si descansa (hasta cuándo, en ms). */
export interface UsoCuenta {
  correo: string
  ocupada: boolean
  usada: number
  descansa?: Descanso
}

/** Si la cuenta puede hacer ese tipo ahora: sin créditos, las imágenes sí, que no gastan. */
export const puede = (c: UsoCuenta, tipo: 'imagen' | 'video', ahora: number) => !c.descansa || c.descansa.hasta <= ahora || (c.descansa.motivo === 'creditos' && tipo === 'imagen')

/**
 * A qué cuenta va un pedido: si hay una preferida (o prioritaria) disponible y libre que no haya fallado, va a ella.
 * Si no, entre las libres que pueden y que aún no lo probaron, la que lleva más sin generar, para que
 * los créditos se gasten parejo. `esperar` si solo están ocupadas las que podrían; `ninguna` si ninguna puede.
 */
export function elegirCuenta(
  cuentas: UsoCuenta[],
  tipo: 'imagen' | 'video',
  ahora: number,
  probadas: string[] = [],
  preferida?: string
): string | 'esperar' | 'ninguna' {
  const sirven = cuentas.filter((c) => puede(c, tipo, ahora) && !probadas.includes(c.correo))
  if (preferida && !probadas.includes(preferida)) {
    const pref = cuentas.find((c) => c.correo === preferida)
    if (pref && puede(pref, tipo, ahora)) {
      return pref.ocupada ? 'esperar' : pref.correo
    }
  }
  const libre = sirven.filter((c) => !c.ocupada).sort((a, b) => a.usada - b.usada)[0]
  return libre ? libre.correo : sirven.length ? 'esperar' : 'ninguna'
}

/** Lo que es un archivo bajado de Flow, por sus primeros bytes: una sesión vencida baja una página, no el medio. */
export function tipoDeArchivo(b: Uint8Array): 'imagen' | 'video' | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'imagen'
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'imagen'
  if (String.fromCharCode(...b.subarray(4, 8)) === 'ftyp') return 'video'
  return null
}

/** Las herramientas del MCP `flow` (`server/flow/mcp.mjs`), como salen en los hilos de cualquier agente. */
export const HERRAMIENTA_FLOW = /^mcp__flow__(generar_video|generar_imagen|estado_flow)$/

/** Un pedido ya hecho, leído de lo que respondió el MCP (`contar`): para el chat, que no pregunta al servidor. */
export interface HechoFlow {
  archivo: string
  modelo: string
  creditos: number
  cuenta?: string
  /** El id del pedido: el mismo pedido puede salir dos veces (un `estado_flow` de más), y se cuenta una. */
  pedido?: string
  quedan?: number
}

/**
 * Lo hecho, de la salida de una herramienta de Flow: «Lista: <archivo> (<modelo>, 10 créditos gastados, con <cuenta>,
 * pedido <id>). Les quedan 60 créditos a las cuentas.». Codex la da como el JSON del MCP (`{"content":[…]}`), y Claude
 * como su texto. `null` si no es un pedido hecho.
 */
export function hechoDeFlow(salida: string): HechoFlow | null {
  let texto = salida.trim()
  if (texto.startsWith('{')) {
    try {
      texto = (JSON.parse(texto) as { content?: { text?: string }[] }).content?.map((c) => c.text ?? '').join('\n') ?? ''
    } catch {
      return null
    }
  }
  const m = /^Lista: (.+?) \(([^,()]+), (\d+) créditos gastados(?:, con ([^,()]+?))?(?:, pedido (\w+))?\)\.(?: Les quedan (\d+) créditos)?/.exec(texto)
  if (!m) return null
  return { archivo: m[1], modelo: m[2], creditos: Number(m[3]), ...(m[4] ? { cuenta: m[4] } : {}), ...(m[5] ? { pedido: m[5] } : {}), ...(m[6] ? { quedan: Number(m[6]) } : {}) }
}
