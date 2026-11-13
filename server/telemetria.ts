import { readFileSync } from 'node:fs'
import type { Card, Etapa, SessionMeta } from '../shared/types.ts'
import { tiemposDe } from '../shared/etapas.ts'
import { guardar } from './disco.ts'
import { rutaEquipoJson } from './requisitos.ts'

/**
 * Cuánto tarda cada etapa de cada estilo de video, para Opciones → Tu equipo. No se instrumenta nada: sale de los
 * `hechaEn` que el panel de etapas ya calcula (el nacimiento del primer archivo de cada etapa) y del `createdAt` del
 * hilo, así que mide el tiempo de reloj de cada tramo —incluidas las esperas del usuario—, no solo el del agente.
 *
 * Cada video terminado aporta una muestra por etapa; `equipo.json` guarda la media móvil (`seg`, `n`, `fecha`), junto a
 * lo que ya miden la voz (`medidas.py`) y el render (`equipo.cjs`). Se anota una vez por estado del episodio: si el
 * `hechaEn` más nuevo no cambió, no se reescribe. Una etapa que se rehace cambia su `hechaEn` y vuelve a medirse.
 */

type Muestra = { seg: number; n: number; fecha: string }
type Datos = {
  etapas?: Record<string, { nombre: string; etapas: Record<string, Muestra> }>
  /** La marca (`hechaEn` más nuevo) ya anotada de cada carpeta de episodio: no se repite la misma medición. */
  etapas_hechos?: Record<string, number>
}

/** Carpetas recordadas en `etapas_hechos`; las más viejas se podan para que el JSON no crezca sin fin. */
const MAX_HECHOS = 500
/** Lo ya anotado en esta sesión, para no releer `equipo.json` en cada consulta del panel. */
const vistos = new Map<string, number>()

const leer = (ruta: string): Datos => {
  try {
    return JSON.parse(readFileSync(ruta, 'utf8'))
  } catch {
    return {}
  }
}

/**
 * Anota las etapas de un episodio de video ya terminado. La llama el panel de etapas (`server/etapas.ts`) cuando el
 * hilo tiene videos finales; el deduplicado por carpeta y marca hace que repetir la consulta no duplique muestras.
 */
export function anotar(
  card: Card,
  meta: SessionMeta,
  folder: string,
  etapas: (Etapa & { hecha: boolean; hechaEn?: number })[],
  ruta: string = rutaEquipoJson()
) {
  if (card.produce !== 'video' || !card.etapas?.length) return
  const marca = Math.max(0, ...etapas.filter((e) => e.hecha && e.hechaEn).map((e) => e.hechaEn!))
  if (!marca || vistos.get(folder) === marca) return
  const d = leer(ruta)
  if ((d.etapas_hechos ?? {})[folder] === marca) {
    vistos.set(folder, marca)
    return
  }
  const tiempos = tiemposDe(etapas, meta.createdAt)
  const estilo = ((d.etapas ??= {})[card.id] ??= { nombre: card.title, etapas: {} })
  const fecha = new Date().toISOString().slice(0, 10)
  etapas.forEach((e, i) => {
    const t = tiempos[i]
    if (t === undefined) return
    const m = (estilo.etapas[e.nombre] ??= { seg: 0, n: 0, fecha })
    m.seg = Math.round(((m.seg * m.n + t) / (m.n + 1)) * 10) / 10
    m.n++
    m.fecha = fecha
  })
  vistos.set(folder, marca)
  const hechos = (d.etapas_hechos ??= {})
  hechos[folder] = marca
  const claves = Object.keys(hechos)
  if (claves.length > MAX_HECHOS) for (const k of claves.slice(0, claves.length - MAX_HECHOS)) delete hechos[k]
  guardar(ruta, JSON.stringify(d, null, 1))
}
